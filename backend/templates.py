RESUME_TEMPLATES = [
    {
        "id": "classic",
        "name": "Classic Elegance",
        "description": "A sophisticated two-column template perfect for experienced professionals. Features a sharp navy header with gold typography, and clean multi-column sections.",
        "accent_color": "#1e2538",
        "features": ["Two-column layout", "ATS-friendly", "Projects & Certifications", "Expertise Section"],
        "category": "Professional"
    }
]

def get_template_by_id(template_id: str):
    for t in RESUME_TEMPLATES:
        if t["id"] == template_id:
            return t
    return None
