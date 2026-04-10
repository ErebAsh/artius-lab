import os
from typing import Optional
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "resume_templates")
LATEX_TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "latex_templates")

# ── HTML Jinja2 Environment (standard {{ }} delimiters) ──
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

# ── LaTeX Jinja2 Environment (((( ))), ((* *)) delimiters) ──
latex_env = Environment(
    loader=FileSystemLoader(LATEX_TEMPLATE_DIR),
    block_start_string="((*",
    block_end_string="*))",
    variable_start_string="(((",
    variable_end_string=")))",
    comment_start_string="((#",
    comment_end_string="#))",
    autoescape=False,
)


def _escape_latex(text: str) -> str:
    """Escape special LaTeX characters in user-provided strings."""
    if not isinstance(text, str):
        return text
    replacements = {
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    for char, escape in replacements.items():
        text = text.replace(char, escape)
    return text


def _escape_data_recursive(data):
    """Recursively escape all string values in a nested dict/list structure."""
    if isinstance(data, str):
        return _escape_latex(data)
    elif isinstance(data, dict):
        return {k: _escape_data_recursive(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [_escape_data_recursive(item) for item in data]
    return data


def generate_html(enhanced_data: dict, template_id: str, layout_settings: Optional[dict] = None) -> str:
    """Render resume data into a styled HTML using Jinja2."""
    template_file = f"{template_id}.html"
    template = env.get_template(template_file)

    html_content = template.render(
        personal=enhanced_data.get("personal_info", {}),
        education=enhanced_data.get("education", []),
        experience=enhanced_data.get("experience", []),
        skills=enhanced_data.get("skills", []),
        projects=enhanced_data.get("projects", []),
        expertise=enhanced_data.get("expertise", {}),
        certifications=enhanced_data.get("certifications", []),
        hobbies=enhanced_data.get("hobbies", []),
    )

    if layout_settings:
        # Inject layout settings into the HTML head
        layout_style = f"""
        <style>
            body {{ 
                font-size: {layout_settings.get('fontSize', 11)}pt !important; 
                line-height: {layout_settings.get('lineHeight', 1.5)} !important; 
            }}
            .container {{ 
                padding-top: {layout_settings.get('margin', 24)}mm !important; 
                padding-bottom: {layout_settings.get('margin', 24)}mm !important;
                padding-left: {layout_settings.get('margin', 24)}mm !important;
                padding-right: {layout_settings.get('margin', 24)}mm !important;
            }}
            .section, .main-section {{ 
                margin-bottom: {layout_settings.get('sectionGap', 24)}px !important; 
            }}
            .exp-item, .edu-item, .project-item {{
                margin-bottom: {float(layout_settings.get('sectionGap', 24)) * 0.7}px !important;
            }}
            .exp-highlights, .skill-list {{
                margin-top: 4px !important;
                margin-bottom: 4px !important;
            }}
            .exp-highlights li, .edu-meta, .project-tech {{
                margin-bottom: 2px !important;
            }}
            .right-column, .sidebar {{
                padding-left: {layout_settings.get('columnGap', 30)}px !important;
            }}
        </style>
        """
        if "</head>" in html_content:
            html_content = html_content.replace("</head>", f"{layout_style}</head>")
        else:
            html_content = f"{layout_style}{html_content}"

    return html_content


def generate_latex(enhanced_data: dict, template_id: str) -> str:
    """Render resume data into a LaTeX source string using Jinja2.

    Uses custom delimiters ((( ))) and ((* *)) to avoid conflicts
    with LaTeX's use of { } and %.
    All user-provided strings are escaped for LaTeX safety.
    """
    template_file = f"{template_id}.tex"
    template = latex_env.get_template(template_file)

    # Escape all user data for LaTeX safety
    safe_data = _escape_data_recursive({
        "personal_info": enhanced_data.get("personal_info", {}),
        "education": enhanced_data.get("education", []),
        "experience": enhanced_data.get("experience", []),
        "skills": enhanced_data.get("skills", []),
        "projects": enhanced_data.get("projects", []),
        "expertise": enhanced_data.get("expertise", {}),
        "certifications": enhanced_data.get("certifications", []),
        "hobbies": enhanced_data.get("hobbies", []),
    })

    latex_source = template.render(
        personal=safe_data.get("personal_info", {}),
        education=safe_data.get("education", []),
        experience=safe_data.get("experience", []),
        skills=safe_data.get("skills", []),
        projects=safe_data.get("projects", []),
        expertise=safe_data.get("expertise", {}),
        certifications=safe_data.get("certifications", []),
        hobbies=safe_data.get("hobbies", []),
    )

    return latex_source


def has_latex_template(template_id: str) -> bool:
    """Check if a LaTeX template file exists for the given ID."""
    return os.path.isfile(os.path.join(LATEX_TEMPLATE_DIR, f"{template_id}.tex"))


def generate_pdf_from_html(html_content: str) -> bytes:
    """Generate PDF bytes from HTML string using WeasyPrint."""
    return HTML(string=html_content).write_pdf()


def generate_pdf(enhanced_data: dict, template_id: str, layout_settings: Optional[dict] = None) -> bytes:
    """Render resume data into a styled PDF using Jinja2 + WeasyPrint."""
    html_content = generate_html(enhanced_data, template_id, layout_settings)
    return generate_pdf_from_html(html_content)
