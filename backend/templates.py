import os

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "resume_templates")

RESUME_TEMPLATES = [
    {
        "id": "ats_pro",
        "name": "ATS Professional",
        "description": "A high-scoring ATS-optimized template focusing on clarity and single-column structure. Ideal for technical and corporate roles.",
        "accent_color": "#000000",
        "features": ["Single-column layout", "Maximum ATS readability", "Clean structure", "Professional typography"],
        "category": "Technical"
    },
    {
        "id": "elegant_sidebar",
        "name": "Elegant Sidebar",
        "description": "A stylish two-column resume with a side panel for personal details and expertise, featuring a clean timeline for work history.",
        "accent_color": "#666666",
        "features": ["Sidebar Layout", "Experience Timeline", "Modern Typography", "Premium Design"],
        "category": "Creative"
    },
    {
        "id": "modern_minimalist",
        "name": "Modern Minimalist",
        "description": "A sophisticated right-sidebar layout with high-end serif typography and a clean professional aesthetic.",
        "accent_color": "#4b5463",
        "features": ["Right Sidebar", "Serif Typography", "Professional Layout", "Minimalist Style"],
        "category": "Professional"
    },
    {
         "id": "classic",
        "name": "Classic Elegance",
        "description": "A sophisticated two-column template perfect for experienced professionals. Features a sharp navy header with gold typography, and clean multi-column sections.",
        "accent_color": "#1e2538",
        "features": ["Two-column layout", "ATS-friendly", "Projects & Certifications", "Expertise Section"],
        "category": "Professional"
    },
    {
        "id": "creative_photo",
        "name": "Creative Photo",
        "description": "A modern two-column template with a dark sidebar featuring a circular profile photo. Ideal for creative and marketing professionals.",
        "accent_color": "#3d4555",
        "features": ["Profile Photo", "Dark Sidebar", "Timeline Layout", "Creative Design"],
        "category": "Creative"
    }
]


def _detect_has_photo(template_id: str) -> bool:
    """Auto-detect whether a template HTML contains the <!-- has_photo --> marker."""
    template_path = os.path.join(TEMPLATE_DIR, f"{template_id}.html")
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
        return "<!-- has_photo -->" in content
    except FileNotFoundError:
        return False


def get_template_by_id(template_id: str):
    for t in RESUME_TEMPLATES:
        if t["id"] == template_id:
            return {**t, "has_photo": _detect_has_photo(t["id"])}
    return None


def get_all_templates():
    """Return all templates with has_photo flag auto-detected."""
    return [{**t, "has_photo": _detect_has_photo(t["id"])} for t in RESUME_TEMPLATES]
