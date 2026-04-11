import os
import json
import asyncio
import google.generativeai as genai
from openai import AsyncOpenAI
from dotenv import load_dotenv
from schemas import ResumeData, EnhancedResumeData, PersonalInfo, Education, Experience, Skill, Project, Certification, Language

load_dotenv()

# ── Ollama (Qwen) client ─────────────────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
QWEN_MODEL = os.getenv("QWEN_MODEL", "qwen2.5:7b")


async def _call_ai(
    system_prompt: str,
    user_prompt: str,
    api_key: str | None = None,
    temperature: float = 0.7,
) -> dict:
    """
    Unified AI caller with Gemini → Qwen auto-fallback.
    
    1. If api_key is provided → Try Gemini first
    2. If Gemini hits 429/quota → Auto-fallback to Qwen
    3. If no api_key → Use Qwen directly via Ollama
    """

    # ── Step 1: Try Gemini if user has a key ──────────────────────
    if api_key:
        max_retries = 3
        base_delay = 2

        for attempt in range(max_retries):
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(
                    model_name="gemini-2.5-flash",
                    system_instruction=system_prompt
                )
                response = await model.generate_content_async(
                    user_prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=temperature,
                    ),
                )
                return json.loads(response.text)  # ✅ Gemini succeeded

            except Exception as e:
                error_str = str(e)
                is_rate_limit = (
                    "429" in error_str
                    or "ResourceExhausted" in error_str
                    or "quota" in error_str.lower()
                )

                if is_rate_limit:
                    if attempt < max_retries - 1:
                        wait_time = base_delay * (2 ** attempt)
                        print(f"⚠️  Gemini rate limit hit. Retry {attempt + 1}/{max_retries} in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        print("⚠️  Gemini quota exceeded after retries, falling back to Qwen...")
                        break  # Fall through to Qwen
                else:
                    print(f"❌ Gemini error (non-quota): {e}, falling back to Qwen...")
                    break  # Fall through to Qwen for any error

    # ── Step 2: Use Qwen via Ollama (fallback or default) ─────────
    try:
        ollama_client = AsyncOpenAI(
            base_url=OLLAMA_BASE_URL,
            api_key="ollama",
        )
        response = await ollama_client.chat.completions.create(
            model=QWEN_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=temperature,
        )
        result_text = response.choices[0].message.content
        return json.loads(result_text)
    except Exception as e:
        print(f"❌ Qwen/Ollama also failed: {e}")
        raise


# ═══════════════════════════════════════════════════════════════════
#  SYSTEM PROMPTS
# ═══════════════════════════════════════════════════════════════════

ENHANCE_SYSTEM_PROMPT = """You are an expert AI Resume Builder. Your mission is to take partial resume data and transform it into a complete, professional, and high-impact resume.

Rules for Completion:
1. If any section is missing or incomplete, infer the best content based on other provided details (e.g., infer summary from experience, infer skills from projects).
2. For PERSONAL INFO: Ensure the `title` field is populated with a professional designation (e.g., "Full Stack Developer", "Data Scientist", "Marketing Specialist") based on the work history.
3. For PROFESSIONAL SUMMARY: Generate a powerful 3-4 sentence summary that highlights the user's career trajectory and value proposition.
4. For EXPERIENCE: For each role, ensure there are 3-5 high-impact bullet points using strong action verbs. If the user provided no bullet points, GENERATE them based on the job title and industry standards. Avoid using generic placeholders like [X]% or [Y]; use realistic industry benchmarks or qualitative achievements if no specific figures are available.
5. For SKILLS: If no skills are provided, suggest at least 3-5 relevant skills. If some are provided, retain all provided skills; if fewer than 3 are provided, add enough to represent a well-rounded skill set.
6. For EXPERTISE: For both "technical" and "professional", if the user provides items, RETAIN THEM ALL. If fewer than 3 are provided or none, suggest enough items to reach at least 3 for each sub-section.
7. For PROJECTS: Enhance descriptions to be technical and outcome-oriented.
8. For CERTIFICATIONS: Ensure the `name` and `issuer` are professionally formatted.
9. Maintain the truth of provided facts (dates, titles, names) while professionalizing the phrasing.
10. OPTIMAL LAYOUT: YOU MUST also generate a `layout_settings` object based on the content density:
    - If very little content exists: Moderate margins (20-22mm), larger font (11pt), moderate section gaps (25-30px).
    - If average content exists: Standard set (18mm margins, 10.5pt font, 18px section gaps).
    - If content is very dense: Tighter margins (12-15mm), smaller font (9.5-10pt), lower line height (1.3), and smaller gaps (10-12px).
11. For LANGUAGES: If no languages are provided and the template supports it, suggest the user's primary language (e.g., "English") and any others based on the profile context.
12. RETURN EXACT JSON with keys: "enhanced_data" (matching input resume structure) and "layout_settings" (keys: margin, fontSize, lineHeight, sectionGap, columnGap). No markdown, no conversational text.
"""

ATS_SYSTEM_PROMPT = "You are an expert ATS (Applicant Tracking System) parser and evaluator. Analyze the given resume text, identify the likely target industry or role, and provide an ATS score out of 100 based on formatting, action verbs, quantification, and standard sections. Also list keyword matches, missing keywords (general industry standards for what this resume seems to target), improvements, and a brief summary."

PARSE_SYSTEM_PROMPT = """You are an expert resume parser. Given raw text extracted from a PDF resume, 
parse and structure it into a clean JSON object. Be precise — extract EXACTLY what's written, 
don't embellish or add content that isn't present in the original text.

Return JSON with these keys:
- "personal_info": { "full_name", "title", "email", "phone", "location", "linkedin", "portfolio", "summary" }
- "education": [{ "institution", "degree", "field_of_study", "start_date", "end_date", "gpa", "achievements" }]
- "experience": [{ "company", "title", "location", "start_date", "end_date", "description", "highlights": [] }]
- "skills": [{ "name", "level" }]
- "projects": [{ "name", "description", "technologies": [], "link" }]
- "expertise": { "technical": [], "professional": [] }
- "certifications": [{ "name", "issuer", "year" }]
- "languages": [{ "name", "proficiency" }]

Rules:
1. Extract ALL information faithfully from the text
2. If a field can't be found, use empty string "" or empty array []
3. For skills level, infer from context: "Expert", "Advanced", "Intermediate", or "Beginner"
4. Parse bullet points as highlights arrays
5. Separate technical expertise (hard skills, domains) from professional expertise (soft skills)
6. Return ONLY valid JSON, no markdown, no conversational text
"""

MODIFY_SYSTEM_PROMPT = """You are an expert resume editor. Given structured resume data and a user instruction,
apply the requested changes and return the COMPLETE modified resume data.

Rules:
1. Apply ONLY the changes the user requested
2. Keep all other data exactly as is  
3. Maintain the same JSON structure
4. If the user asks to improve/enhance text, make it more professional and impactful
5. If the user asks to add something, add it to the appropriate section
6. If the user asks to remove something, remove only that specific item
7. Return the COMPLETE resume data with modifications applied
8. Return ONLY valid JSON, no markdown, no conversational text
9. Also return a "changes_summary" key with a brief description of what was changed
"""


# ═══════════════════════════════════════════════════════════════════
#  PUBLIC API FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

async def enhance_resume(data: ResumeData, api_key: str | None = None) -> dict:
    """Use AI to enhance resume content. Gemini if key provided, else Qwen."""

    resume_dict = data.model_dump()
    del resume_dict["template_id"]

    prompt = f"""Enhance the following resume data. Improve descriptions, bullet points, and summary to be more professional and ATS-optimized. 
    ALSO, determine the best `layout_settings` based on how much content is present.

    Resume Data:
    {json.dumps(resume_dict, indent=2)}

    Return ONLY valid JSON with keys "enhanced_data" and "layout_settings". Do not wrap in markdown code blocks."""

    try:
        return await _call_ai(ENHANCE_SYSTEM_PROMPT, prompt, api_key=api_key, temperature=0.7)
    except Exception as e:
        print(f"AI Enhancement failed completely: {e}")
        return resume_dict


async def check_ats_score(resume_text: str, api_key: str | None = None) -> dict:
    """Analyze resume text and return an ATS score, keyword feedback, and improvements."""

    prompt = f"""Evaluate this Resume:
{resume_text}

Return the analysis strictly as valid JSON with these keys: 
- "score": integer (0-100)
- "keyword_matches": list of strings (strong keywords found)
- "missing_keywords": list of strings (important keywords missing for the implied role)
- "improvements": list of strings (3-5 actionable tips to boost ATS readability)
- "summary": string (a short 2-sentence summary of the resume's ATS performance)"""

    try:
        return await _call_ai(ATS_SYSTEM_PROMPT, prompt, api_key=api_key, temperature=0.3)
    except Exception as e:
        print(f"ATS Check failed: {e}")
        return {
            "score": 0,
            "keyword_matches": [],
            "missing_keywords": [],
            "improvements": ["Failed to analyze resume using AI service.", str(e)],
            "summary": "Error analyzing resume."
        }


async def parse_resume_text(resume_text: str, api_key: str | None = None) -> dict:
    """Parse raw resume text into structured JSON matching ResumeData schema."""

    prompt = f"""Parse the following resume text into structured JSON:

{resume_text}

Return ONLY valid JSON matching the schema described. Do not wrap in markdown code blocks."""

    try:
        return await _call_ai(PARSE_SYSTEM_PROMPT, prompt, api_key=api_key, temperature=0.2)
    except Exception as e:
        print(f"Resume parsing failed: {e}")
        return {
            "personal_info": {"full_name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "", "portfolio": "", "summary": ""},
            "education": [],
            "experience": [],
            "skills": [],
            "projects": [],
            "expertise": {"technical": [], "professional": []},
            "certifications": [],
            "languages": [],
            "error": f"Failed to parse resume: {str(e)}"
        }


async def modify_resume_with_ai(resume_data: dict, instruction: str, api_key: str | None = None) -> dict:
    """Apply natural language modifications to structured resume data."""

    prompt = f"""Current resume data:
{json.dumps(resume_data, indent=2)}

User instruction: {instruction}

Apply the requested changes and return the complete modified resume data as JSON with keys "modified_data" and "changes_summary"."""

    try:
        return await _call_ai(MODIFY_SYSTEM_PROMPT, prompt, api_key=api_key, temperature=0.4)
    except Exception as e:
        print(f"Resume modification failed: {e}")
        return {
            "modified_data": resume_data,
            "changes_summary": f"Modification failed. The AI service is currently unavailable."
        }
