import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from schemas import ResumeData, EnhancedResumeData, PersonalInfo, Education, Experience, Skill, Project

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are an expert AI Resume Builder. Your mission is to take partial resume data and transform it into a complete, professional, and high-impact resume.

Rules for Completion:
1. If any section is missing or incomplete, infer the best content based on other provided details (e.g., infer summary from experience, infer skills from projects).
2. For PROFESSIONAL SUMMARY: Generate a powerful 3-4 sentence summary that highlights the user's career trajectory and value proposition.
3. For EXPERIENCE: For each role, ensure there are 3-5 high-impact bullet points using strong action verbs. If the user provided no bullet points, GENERATE them based on the job title and industry standards.
4. For SKILLS: If no skills are provided, suggest a relevant list of technical and soft skills based on the rest of the resume.
5. For PROJECTS: Enhance descriptions to be technical and outcome-oriented.
6. QUANTIFY achievements extensively (e.g., "[X]%", "$[Y]M", "[Z] hours saved"). If metrics aren't provided, use placeholders like [X]% to prompt the user to fill them in, but make the context realistic.
7. Maintain the truth of provided facts (dates, titles, names) while professionalizing the phrasing.
8. OPTIMAL LAYOUT: YOU MUST also generate a `layout_settings` object based on the content density:
   - If very little content exists (e.g., just one job or school): Suggest wider margins (28-32mm), larger font (11.5-12pt), and higher section gaps (35-45px).
   - If average content exists: Standard set (24mm margins, 11pt font, 24px section gaps).
   - If content is very dense (lots of projects/experience): Suggest tighter margins (18-20mm), smaller font (10-10.5pt), lower line height (1.4), and smaller gaps (15-18px) to keep it one page.
9. RETURN EXACT JSON with keys: "enhanced_data" (matching input resume structure) and "layout_settings" (keys: margin, fontSize, lineHeight, sectionGap, columnGap). No markdown, no conversational text.
"""


async def enhance_resume(data: ResumeData) -> dict:
    """Use Gemini AI to enhance resume content."""
    
    resume_dict = data.model_dump()
    del resume_dict["template_id"]

    prompt = f"""Enhance the following resume data. Improve descriptions, bullet points, and summary to be more professional and ATS-optimized. 
    ALSO, determine the best `layout_settings` based on how much content is present.

    Resume Data:
    {json.dumps(resume_dict, indent=2)}

    Return ONLY valid JSON with keys "enhanced_data" and "layout_settings". Do not wrap in markdown code blocks."""

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT
        )
        
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.7,
            ),
        )

        enhanced = json.loads(response.text)
        return enhanced

    except Exception as e:
        print(f"AI Enhancement failed: {e}")
        # Fallback: return original data without enhancement
        return resume_dict


async def check_ats_score(resume_text: str) -> dict:
    """Analyze resume text and return an ATS score, keyword feedback, and improvements."""
    sys_prompt = "You are an expert ATS (Applicant Tracking System) parser and evaluator. Analyze the given resume text, identify the likely target industry or role, and provide an ATS score out of 100 based on formatting, action verbs, quantification, and standard sections. Also list keyword matches, missing keywords (general industry standards for what this resume seems to target), improvements, and a brief summary."
    
    prompt = f"""Evaluate this Resume:
{resume_text}

Return the analysis strictly as valid JSON with these keys: 
- "score": integer (0-100)
- "keyword_matches": list of strings (strong keywords found)
- "missing_keywords": list of strings (important keywords missing for the implied role)
- "improvements": list of strings (3-5 actionable tips to boost ATS readability)
- "summary": string (a short 2-sentence summary of the resume's ATS performance)"""

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=sys_prompt
        )
        
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )

        return json.loads(response.text)
    except Exception as e:
        print(f"ATS Check failed: {e}")
        return {
            "score": 0,
            "keyword_matches": [],
            "missing_keywords": [],
            "improvements": ["Failed to analyze resume using AI service.", str(e)],
            "summary": "Error analyzing resume."
        }
