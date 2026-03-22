from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import io
import PyPDF2
from schemas import ResumeData, HTMLData
from templates import RESUME_TEMPLATES, get_template_by_id
from ai_service import enhance_resume, check_ats_score
from pdf_service import generate_pdf, generate_html, generate_pdf_from_html

app = FastAPI(
    title="Artius Lab API",
    description="AI-Powered Resume Builder and ATS Checker",
    version="1.0.0",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/templates")
def list_templates():
    """Return all available resume templates."""
    return {"templates": RESUME_TEMPLATES}


@app.get("/api/templates/{template_id}")
def get_template(template_id: str):
    """Return a single template by ID."""
    template = get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@app.get("/api/templates/{template_id}/preview")
def preview_template(template_id: str):
    """Return an HTML preview of the template loaded with dummy data."""
    template = get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    dummy_data = {
        "personal_info": {
            "full_name": "EMMA WATSON",
            "title": "SOFTWARE ENGINEER",
            "email": "emma.watson@gmail.com",
            "phone": "+1 123-456-7890",
            "location": "New York, USA",
            "linkedin": "linkedin.com/in/emmawatson",
            "summary": "Results-driven software engineer with 3+ years of experience building scalable web applications. Skilled in Python, React, and cloud technologies with a strong focus on performance and user experience."
        },

        "experience": [
            {
                "company": "Tech Solutions Inc.",
                "title": "Software Engineer",
                "location": "New York, USA",
                "start_date": "Jan 2022",
                "end_date": "Present",
                "description": "Developing scalable web applications and improving backend performance.",
                "highlights": [
                    "Built full-stack applications using React and FastAPI.",
                    "Improved system performance by 30% through optimization.",
                    "Collaborated with designers and product teams."
                ]
            },
            {
                "company": "Innovate Labs",
                "title": "Junior Developer",
                "location": "Boston, USA",
                "start_date": "Jun 2020",
                "end_date": "Dec 2021",
                "description": "Worked on backend systems and API integrations.",
                "highlights": [
                    "Developed REST APIs using Python and Flask.",
                    "Integrated third-party services and APIs.",
                    "Maintained code quality with unit testing."
                ]
            }
        ],

        "education": [
            {
                "institution": "Stanford University",
                "degree": "Bachelor of Science",
                "field_of_study": "Computer Science",
                "start_date": "2016",
                "end_date": "2020"
            }
        ],

        "skills": [
            {"name": "Python"},
            {"name": "JavaScript"},
            {"name": "React"},
            {"name": "FastAPI"},
            {"name": "Docker"},
            {"name": "Git"}
        ],

        "expertise": {
            "professional": [
                "Leadership",
                "Team Collaboration",
                "Problem Solving",
                "Agile Development"
            ],
            "technical": [
                "Web Development",
                "API Design",
                "Database Management",
                "Cloud Deployment"
            ]
        },

        "certifications": [
            {
                "name": "AWS Certified Developer",
                "issuer": "Amazon",
                "year": "2023"
            },
            {
                "name": "Full Stack Web Development",
                "issuer": "Coursera",
                "year": "2022"
            }
        ],
        "projects": [
            {
                "name": "AI Resume Builder",
                "description": "An AI-powered platform using FastAPI and Next.js to generate optimized resumes and analyze ATS compatibility.",
                "link": "github.com/emmawatson/resumebuilder"
            },
            {
                "name": "E-commerce Microservices",
                "description": "Designed a scalable e-commerce architecture using Docker and Kubernetes, resulting in 40% faster deployment cycles.",
                "link": "github.com/emmawatson/ecommerce"
            }
        ]
    }
    
    try:
        from pdf_service import generate_html
        html_content = generate_html(dummy_data, template_id)
        return Response(content=html_content, media_type="text/html")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





@app.post("/api/ai/enhance")
async def ai_enhance(data: ResumeData):
    """
    Accept basic resume data, use AI to generate summaries and professional details.
    Returns the complete enhanced resume as JSON.
    """
    result = await enhance_resume(data)
    return result


@app.post("/api/generate")
async def generate_resume_legacy(data: ResumeData):
    """
    Legacy generation endpoint (direct to PDF).
    """
    # Validate template exists
    template = get_template_by_id(data.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # AI-powered resume building/completion
    ai_result = await enhance_resume(data)
    enhanced_data = ai_result.get("enhanced_data", ai_result)
    layout_settings = ai_result.get("layout_settings", {})

    # PDF generation
    try:
        pdf_bytes = generate_pdf(enhanced_data, data.template_id, layout_settings)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    name_slug = data.personal_info.full_name.strip().replace(" ", "_") if data.personal_info.full_name else "Candidate"
    filename = f"{name_slug}_Resume.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@app.post("/api/ats/upload")
async def ats_upload(file: UploadFile = File(...)):
    """
    Accept a PDF resume, parse text, and evaluate for ATS compatibility.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(await file.read()))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in the PDF.")
        
        # Call AI service for ATS score
        ats_result = await check_ats_score(text)
        return ats_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")



@app.post("/api/generate/html")
async def generate_resume_html(data: ResumeData):
    """
    Accept resume data, enhance with AI, and generate HTML string.
    Returns the HTML content for preview.
    """
    template = get_template_by_id(data.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # AI-powered resume building/completion
    ai_result = await enhance_resume(data)
    enhanced_data = ai_result.get("enhanced_data", ai_result)
    layout_settings = ai_result.get("layout_settings", {})

    try:
        html_content = generate_html(enhanced_data, data.template_id)
        return {
            "html": html_content,
            "layout_settings": layout_settings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HTML generation failed: {str(e)}")


@app.post("/api/generate/pdf")
async def generate_resume_pdf(data: HTMLData):
    """
    Accept raw HTML string and convert to PDF.
    Returns the final downloadable file.
    """
    try:
        pdf_bytes = generate_pdf_from_html(data.html)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    filename = data.filename.replace(" ", "_") if data.filename else "Resume.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )