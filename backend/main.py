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


@app.post("/api/ai/enhance")
async def ai_enhance(data: ResumeData):
    """
    Accept basic resume data, use AI to generate summaries and professional details.
    Returns the complete enhanced resume as JSON.
    """
    enhanced_data = await enhance_resume(data)
    return {"enhanced_data": enhanced_data}


@app.post("/api/generate")
async def generate_resume_legacy(data: ResumeData):
    """
    Legacy generation endpoint (direct to PDF).
    """
    # Validate template exists
    template = get_template_by_id(data.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # AI enhancement
    enhanced_data = await enhance_resume(data)

    # PDF generation
    try:
        pdf_bytes = generate_pdf(enhanced_data, data.template_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    filename = data.personal_info.full_name.replace(" ", "_") + "_Resume.pdf"

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

    enhanced_data = await enhance_resume(data)

    try:
        html_content = generate_html(enhanced_data, data.template_id)
        return {"html": html_content}
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