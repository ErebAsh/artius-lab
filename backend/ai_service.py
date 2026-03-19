import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from schemas import ResumeData, EnhancedResumeData, PersonalInfo, Education, Experience, Skill, Project

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are a professional resume writer and career coach. Your job is to build a complete, professional, and ATS-optimized resume.

Rules:
1. If a professional summary is missing or too short, GENERATE a compelling summary based on the provided experience and skills.
2. If work experience highlights or descriptions are missing or minimal, GENERATE 3-5 high-impact, professional bullet points for each role based on the job title and company.
3. Improve all existing bullet points with strong action verbs (Led, Engineered, Optimized, Spearheaded, etc.)
4. Quantify achievements where possible (e.g., "Increased sales by 30%"), even if placeholders are needed for the user to fill in (like [X]%).
5. Ensure summaries are between 3-4 sentences long and focused on professional identity and key achievements.
6. Keep all provided factual information (dates, company names, titles) accurate.
7. Return the data in the EXACT JSON structure provided.

You MUST return valid JSON only, no markdown formatting."""


async def enhance_resume(data: ResumeData) -> dict:
    """Use Gemini AI to enhance resume content."""
    
    resume_dict = data.model_dump()
    del resume_dict["template_id"]

    prompt = f"""Enhance the following resume data. Improve descriptions, bullet points, and summary to be more professional and ATS-optimized. Return the enhanced data in the EXACT same JSON structure.

Resume Data:
{json.dumps(resume_dict, indent=2)}

Return ONLY valid JSON with the same structure. Do not wrap in markdown code blocks."""

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
