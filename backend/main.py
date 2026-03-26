from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from contextlib import asynccontextmanager
import io
import json
import PyPDF2
from schemas import ResumeData, HTMLData, UserRegister, UserLogin
from templates import RESUME_TEMPLATES, get_template_by_id, get_all_templates
from ai_service import enhance_resume, check_ats_score, parse_resume_text, modify_resume_with_ai
from pdf_service import generate_pdf, generate_html, generate_pdf_from_html
from auth import hash_password, verify_password, create_access_token, get_current_user, get_optional_user
from database import (
    init_db,
    save_resume,
    update_resume,
    get_resume,
    list_resumes,
    delete_resume,
    save_ats_check,
    list_ats_checks,
    save_enhancement_log,
    create_user,
    get_user_by_email,
    get_user_by_id,
)


# ── App Lifecycle ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the DB on startup."""
    await init_db()
    yield


app = FastAPI(
    title="Artius Lab API",
    description="AI-Powered Resume Builder and ATS Checker",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════
#  AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@app.post("/api/auth/register")
async def register(data: UserRegister):
    """Register a new user account."""
    # Validate
    if not data.email or not data.email.strip():
        raise HTTPException(status_code=400, detail="Email is required.")
    if not data.password or len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # Check duplicate
    existing = await get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    # Create user
    hashed = hash_password(data.password)
    user_id = await create_user(
        email=data.email,
        password_hash=hashed,
        full_name=data.full_name or "",
    )

    # Return token immediately (auto-login after register)
    token = create_access_token(user_id, data.email.lower().strip())
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": data.email.lower().strip(),
            "full_name": (data.full_name or "").strip(),
        },
    }


@app.post("/api/auth/login")
async def login(data: UserLogin):
    """Log in with email and password. Returns a JWT token."""
    user = await get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
        },
    }


@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    user = await get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "created_at": user["created_at"],
    }

@app.get("/api/templates")
def list_templates():
    """Return all available resume templates with has_photo auto-detection."""
    return {"templates": get_all_templates()}


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




# ===================== AI ENDPOINTS =====================

@app.post("/api/ai/enhance")
async def ai_enhance(data: ResumeData):
    """
    Accept basic resume data, use AI to generate summaries and professional details.
    Returns the complete enhanced resume as JSON.
    """
    result = await enhance_resume(data)

    # Log the enhancement to the database
    resume_dict = data.model_dump()
    del resume_dict["template_id"]
    await save_enhancement_log(original_data=resume_dict, enhanced_data=result)

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

        # Save to database
        score = ats_result.get("score", 0)
        await save_ats_check(score=score, result_data=ats_result)

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


# ===================== RESUME MODIFIER ENDPOINTS =====================

@app.post("/api/resume/parse")
async def parse_resume(file: UploadFile = File(...)):
    """
    Accept a PDF resume, parse text, and use AI to structure it into editable JSON.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    contents = await file.read()
    
    # File size limit (5MB)
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB).")
    
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in the PDF.")
        
        # Use AI to parse into structured data
        parsed_data = await parse_resume_text(text)
        
        return {
            "parsed_data": parsed_data,
            "raw_text": text.strip(),
            "page_count": len(pdf_reader.pages)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@app.post("/api/resume/modify")
async def modify_resume(instruction: str = Form(...), resume_data: str = Form(...)):
    """
    Accept structured resume data + a natural language instruction,
    and return the AI-modified resume data.
    """
    try:
        data = json.loads(resume_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid resume data JSON.")
    
    if not instruction.strip():
        raise HTTPException(status_code=400, detail="Instruction cannot be empty.")
    
    try:
        result = await modify_resume_with_ai(data, instruction)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Modification failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════════
#  SAVED RESUMES — CRUD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/resumes")
async def api_list_resumes(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """List the authenticated user's saved resumes, newest first."""
    resumes = await list_resumes(limit=limit, offset=offset, user_id=current_user["user_id"])
    return {"resumes": resumes, "count": len(resumes)}


@app.get("/api/resumes/{resume_id}")
async def api_get_resume(resume_id: int):
    """Get a single saved resume by ID."""
    resume = await get_resume(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@app.post("/api/resumes")
async def api_save_resume(
    title: str = Form("Untitled Resume"),
    template_id: str = Form("classic"),
    resume_data: str = Form(...),
    layout_settings: str = Form(None),
    preview_html: str = Form(None),
    current_user: dict = Depends(get_current_user),
):
    """Save a new resume draft to the database (requires login)."""
    try:
        data = json.loads(resume_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid resume data JSON.")

    layout = None
    if layout_settings:
        try:
            layout = json.loads(layout_settings)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid layout settings JSON.")

    new_id = await save_resume(
        title=title,
        template_id=template_id,
        resume_data=data,
        layout_settings=layout,
        preview_html=preview_html,
        user_id=current_user["user_id"],
    )

    return {"id": new_id, "message": "Resume saved successfully."}


@app.put("/api/resumes/{resume_id}")
async def api_update_resume(
    resume_id: int,
    title: str = Form(None),
    template_id: str = Form(None),
    resume_data: str = Form(None),
    layout_settings: str = Form(None),
    preview_html: str = Form(None),
):
    """Update an existing saved resume."""
    data = None
    if resume_data:
        try:
            data = json.loads(resume_data)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid resume data JSON.")

    layout = None
    if layout_settings:
        try:
            layout = json.loads(layout_settings)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid layout settings JSON.")

    updated = await update_resume(
        resume_id=resume_id,
        title=title,
        template_id=template_id,
        resume_data=data,
        layout_settings=layout,
        preview_html=preview_html,
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Resume not found or nothing to update.")

    return {"message": "Resume updated successfully."}


@app.delete("/api/resumes/{resume_id}")
async def api_delete_resume(resume_id: int):
    """Delete a saved resume."""
    deleted = await delete_resume(resume_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return {"message": "Resume deleted successfully."}


# ═══════════════════════════════════════════════════════════════════
#  ATS CHECK HISTORY
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/ats/history")
async def api_ats_history(limit: int = Query(20, ge=1, le=100)):
    """Get recent ATS check history."""
    checks = await list_ats_checks(limit=limit)
    return {"checks": checks, "count": len(checks)}