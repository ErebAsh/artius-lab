import os

from typing import List, Dict, Any

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "resume_templates")

RESUME_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "AL-001",
        "name": "ATS Standard Pro",
        "description": "A high-scoring ATS-optimized template focusing on clarity and single-column structure. Ideal for technical and corporate roles.",
        "accent_color": "#000000",
        "features": ["Single-column layout", "Maximum ATS readability", "Clean structure", "Professional typography"],
        "category": "Technical",
        "has_latex": True
    },
    {
        "id": "AL-002",
        "name": "Modern Timeline Sidebar",
        "description": "A stylish two-column resume with a side panel for personal details and expertise, featuring a clean timeline for work history.",
        "accent_color": "#666666",
        "features": ["Sidebar Layout", "Experience Timeline", "Modern Typography", "Premium Design"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-003",
        "name": "Minimalist Serif",
        "description": "A sophisticated right-sidebar layout with high-end serif typography and a clean professional aesthetic.",
        "accent_color": "#4b5463",
        "features": ["Right Sidebar", "Serif Typography", "Professional Layout", "Minimalist Style"],
        "category": "Minimalist"
    },
    {
         "id": "AL-004",
        "name": "Navy Gold Corporate",
        "description": "A sophisticated two-column template perfect for experienced professionals. Features a sharp navy header with gold typography, and clean multi-column sections.",
        "accent_color": "#1e2538",
        "features": ["Two-column layout", "ATS-friendly", "Projects & Certifications", "Expertise Section"],
        "category": "Professional"
    },
    {
        "id": "AL-005",
        "name": "Creative Slate Sidebar",
        "description": "A modern two-column template with a dark sidebar featuring a circular profile photo. Ideal for creative and marketing professionals.",
        "accent_color": "#3d4555",
        "features": ["Profile Photo", "Dark Sidebar", "Timeline Layout", "Creative Design"],
        "category": "Creative"
    },
    {
        "id": "AL-006",
        "name": "Executive Pure White",
        "description": "A clean, minimalist template with a crisp white sidebar and sophisticated typography. Perfect for corporate and executive roles.",
        "accent_color": "#000000",
        "features": ["White Sidebar", "Clean Divider", "Executive Typography", "Professional Layout"],
        "category": "Executive"
    },
    {
        "id": "AL-007",
        "name": "Bold High Contrast",
        "description": "A bold contrast template with a dark sidebar and elegant header. Features high-impact layout for marketing and consultant positions.",
        "accent_color": "#333333",
        "features": ["Dark Sidebar", "Contrast Header", "Modern Skills Bar", "High Impact"],
        "category": "Creative"
    },
    {
        "id": "AL-008",
        "name": "Management Classic",
        "description": "A classic sidebar template with sophisticated section dividers and a clean professional aesthetic. Perfect for management and client-facing roles.",
        "accent_color": "#555555",
        "features": ["Light Sidebar", "Section Dividers", "Modern Typography", "Professional Layout"],
        "category": "Professional"
    },
    {
        "id": "AL-009",
        "name": "Beige Architectural",
        "description": "A sophisticated palette of beige and charcoal with a bold header. Features a unique circular photo placement and structured expertise sections.",
        "accent_color": "#5a5a5a",
        "features": ["Dual-tone Header", "Circular Photo", "Beige Sidebar", "Structured Content"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-010",
        "name": "Designer Soft Pink",
        "description": "A clean, modern layout with soft pink accents and a strong focus on skills visualization. Ideal for designers and fashion industry professionals.",
        "accent_color": "#f3e1e1",
        "features": ["Soft Pink Sidebar", "Skill Progress Bars", "Modular Grid Header", "Elegant Layout"],
        "category": "Creative"
    },
    {
        "id": "AL-011",
        "name": "Technical Navy Focus",
        "description": "A powerful high-contrast design with a deep navy sidebar and timeline-based experience tracking. Perfect for technical leaders and engineers.",
        "accent_color": "#002d44",
        "features": ["Navy Sidebar", "Timeline Experience", "Language Proficiency Bars", "Technical Focus"],
        "category": "Technical"
    },
    {
        "id": "AL-012",
        "name": "Vibrant Blue Accent",
        "description": "A vibrant blue template with modern diagonal accents and Pill-shaped section headers. Features a clean timeline for education and experience.",
        "accent_color": "#00adef",
        "features": ["Blue Accents", "Pill Headers", "Timeline Layout", "Modern Icons"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-013",
        "name": "Angular High Contrast",
        "description": "A bold, angular design with high-contrast yellow and black themes. Perfect for creative directors and forward-thinking professionals.",
        "accent_color": "#ffc107",
        "features": ["Angular Design", "High Contrast", "Yellow Sidebar", "Modern Typography"],
        "category": "Creative",
        "has_latex": False
    },
    {
        "id": "AL-014",
        "name": "Grayscale Structural",
        "description": "A sophisticated grayscale layout with a strong structural sidebar and integrated expertise sections. Great for designers and UI/UX specialists.",
        "accent_color": "#444444",
        "features": ["Grayscale Theme", "Structural Sidebar", "Skill Progress Bars", "Integrated Expertise"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-015",
        "name": "Black Banner Executive",
        "description": "A high-impact black-banner design with a clean right sidebar and elegant serif typography. Ideal for managers and creative directors.",
        "accent_color": "#212121",
        "features": ["Black Header Banner", "Right Sidebar", "Serif Typography", "Horizontal Skill Bars"],
        "category": "Executive",
        "has_latex": False
    },
    {
        "id": "AL-016",
        "name": "Hyper-Clean Minimalist",
        "description": "A minimalist, hyper-clean template with generous whitespace and subtle dividers. Perfect for modern, sleek professional profiles.",
        "accent_color": "#666666",
        "features": ["Minimalist Design", "Clean Typography", "Subtle Dividers", "Whitespace Focused"],
        "category": "Minimalist",
        "has_latex": False
    },
    {
        "id": "AL-017",
        "name": "Purple Capsule Sidebar",
        "description": "A striking dual-column design with a deep purple theme and capsule-shaped white sidebar. Features a bold and modern layout for freshes and professionals.",
        "accent_color": "#4b2c5e",
        "features": ["Deep Purple Theme", "Capsule Sidebar", "High Contrast", "Modern Icons"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-018",
        "name": "Blue Logic Blocks",
        "description": "A clean, contemporary layout with professional blue accent blocks and a strong emphasis on profile and skills. Ideal for tech and design roles.",
        "accent_color": "#283593",
        "features": ["Blue Accent Blocks", "Bold Header", "Two-column Layout", "Modern Typography"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-019",
        "name": "Forest Green Angular",
        "description": "A forest green design with beige accents and sharp angular section dividers. Excellent for candidates looking for a unique, nature-inspired professional look.",
        "accent_color": "#1b431c",
        "features": ["Forest Green Theme", "Beige Accents", "Angular Dividers", "Structured Profile"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-020",
        "name": "Earth Tone Rounded",
        "description": "A warm, sophisticated template with earthy brown tones and rounded card layouts. Perfect for artisanal and service-oriented professionals.",
        "accent_color": "#9b846b",
        "features": ["Earth Tones", "Rounded Layout", "Star Skill Ratings", "Elegant Cards"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-021",
        "name": "Graphic Hex Red",
        "description": "A high-impact design for creatives featuring a unique hexagon photo frame, bold red accents, and a rounded contrast sidebar.",
        "accent_color": "#e74c3c",
        "features": ["Hexagon Photo Frame", "Red Accents", "Rounded Sidebar", "High Contrast"],
        "category": "Creative",
        "has_latex": False
    },
    {
        "id": "AL-022",
        "name": "Curved Header Modern",
        "description": "A high-impact professional design with a dark sidebar, curved header, and vertical section navigation. Ideal for analysts and corporate roles.",
        "accent_color": "#B35C1E",
        "features": ["Dark Sidebar", "Curved Header", "Vertical Section Headers", "Photo Support"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-023",
        "name": "Refined Typography Minimal",
        "description": "A minimalist, elegant layout with a focus on typography and whitespace. Perfect for creative and corporate professionals seeking a refined look.",
        "accent_color": "#1a1a1a",
        "features": ["Minimalist Style", "Clean Typography", "Sidebar Layout", "Letter-spaced Headings"],
        "category": "Minimalist",
        "has_latex": False
    },
    {
        "id": "AL-024",
        "name": "Initials Badge Centered",
        "description": "A modern centered design with a unique initials badge and a clean two-column structure. Ideal for designers and marketing professionals.",
        "accent_color": "#000000",
        "features": ["Centered Header", "Initials Badge", "Two-column Layout", "Circular Icons"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-025",
        "name": "Script Font Elegant",
        "description": "An elegant high-contrast template with horizontal bands and a stunning script font. Features a unique header layout and a clean split profile.",
        "accent_color": "#EAE3D9",
        "features": ["Horizontal Bands", "Script Typography", "Circular Photo", "Contrast Layout"],
        "category": "Creative",
        "has_latex": False
    },
    {
        "id": "AL-026",
        "name": "Navy Header Modern",
        "description": "A professional two-column template with a dark navy header, initials badge, and a light gray sidebar. Features circular photo and skills visualization.",
        "accent_color": "#2c3e50",
        "features": ["Initials Badge", "Navy Header", "Circular Photo", "Skill Progress Dots"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-027",
        "name": "Overlapping Block Layout",
        "description": "A sophisticated cream and slate design with a unique overlapping square photo and strong architectural block structure.",
        "accent_color": "#625f68",
        "features": ["Overlapping Photo", "Cream Sidebar", "Slate Header Block", "Expertise Bullets"],
        "category": "Creative",
        "has_latex": False
    },
    {
        "id": "AL-028",
        "name": "Charcoal Beige Dual-tone",
        "description": "A premium dual-tone design with a unique charcoal header block and initials badge. Features a structured beige sidebar and modern progress bars.",
        "accent_color": "#3d3d3d",
        "features": ["Initials Badge", "Dual-tone Header", "Beige Sidebar", "Skill Progress Bars"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-029",
        "name": "Yellow Frame Contemporary",
        "description": "A bold contemporary layout with large typography and a unique yellow photo frame. Perfect for creative and modern professional profiles.",
        "accent_color": "#f7b42c",
        "features": ["Yellow Photo Frame", "Large Typography", "Vertical Accent Bar", "Clean Footer"],
        "category": "Creative",
        "has_latex": False
    },
    {
        "id": "AL-030",
        "name": "Navy Gold Architectural",
        "description": "A premium two-column template with a dark navy sidebar and elegant gold accents. Features a clean architectural layout for high-level professionals.",
        "accent_color": "#b49e85",
        "features": ["Dark Sidebar", "Gold Accents", "Architectural Layout", "Professional Typography"],
        "category": "Executive",
        "has_latex": False
    },
    {
        "id": "AL-031",
        "name": "Black Gold Serif",
        "description": "A sophisticated high-contrast template with a black sidebar and stunning gold serif typography. Features a circular profile photo and structured profile summary.",
        "accent_color": "#c59d5f",
        "features": ["Black Sidebar", "Gold Name Branding", "Circular Photo", "Elegant Serif Typography"],
        "category": "Executive",
        "has_latex": False
    },
    {
        "id": "AL-032",
        "name": "Beige Minimalist Slash",
        "description": "A warm, modern template with a light beige sidebar and sharp minimalist typography. Features unique prefix-based headings and a clean structured layout.",
        "accent_color": "#e6d5c8",
        "features": ["Beige Sidebar", "Minimalist Typography", "Slash Headings", "Circular Photo"],
        "category": "Minimalist",
        "has_latex": False
    },
    {
        "id": "AL-033",
        "name": "Dual-tone Modern Manager",
        "description": "An elegant template with a dual-tone header, beige accent line, and structured two-column content. Perfect for marketing and management roles.",
        "accent_color": "#c3b091",
        "features": ["Dual-tone Header", "Beige Accent line", "Light Gray Sidebar", "Clean Grid Layout"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-034",
        "name": "Cream Tan Sidebar",
        "description": "A sophisticated dual-tone template with a cream sidebar and elegant background-bar headers. Features a large circular photo and structured expertise sections.",
        "accent_color": "#c1a182",
        "features": ["Cream Sidebar", "Background-bar Headers", "Circular Photo", "Structured Expertise"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-035",
        "name": "Deep Red Border Classic",
        "description": "A classic professional template with deep red top and bottom borders, featuring a clean two-column layout and elegant serif typography. Perfect for corporate and executive roles.",
        "accent_color": "#8B0000",
        "features": ["Deep Red Borders", "Serif Typography", "Two-column Layout", "Professional Design"],
        "category": "Professional",
        "has_latex": False
    },
    {
        "id": "AL-036",
        "name": "Lavender Bar Modern",
        "description": "A modern, sophisticated template with a unique lavender horizontal bar header and a clean structured layout. Ideal for administrative and management professionals.",
        "accent_color": "#E8EAF6",
        "features": ["Lavender Header Bar", "Structured Side Panel", "Clean Layout", "Modern Typography"],
        "category": "Modern",
        "has_latex": False
    },
    {
        "id": "AL-037",
        "name": "Neutral Grey Icon-Bar",
        "description": "A minimalist, hyper-clean template with a neutral grey theme and integrated contact icon bar. Features a structured multi-section layout for experienced professionals.",
        "accent_color": "#666666",
        "features": ["Minimalist Grey Theme", "Contact Icon Bar", "Multi-section Sidebar", "Clean Architecture"],
        "category": "Minimalist",
        "has_latex": False
    },
    {
        "id": "AL-038",
        "name": "Horizontal Sidebar Bars",
        "description": "A sophisticated two-column template with a circular profile photo and thick horizontal sidebar bars. Designed for clear professional history tracking and skills breakdown.",
        "accent_color": "#ececec",
        "features": ["Circular Profile Photo", "Horizontal Sidebar Bars", "Prefix-based Headings", "Dual-column Skills"],
        "category": "Modern",
        "has_latex": False
    },
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
