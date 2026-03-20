import os
from typing import Optional
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "resume_templates")

env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))


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
                gap: {layout_settings.get('columnGap', 30)}px !important;
            }}
            .section {{ 
                margin-bottom: {layout_settings.get('sectionGap', 24)}px !important; 
            }}
            .right-column {{
                padding-left: {layout_settings.get('columnGap', 30)}px !important;
            }}
        </style>
        """
        if "</head>" in html_content:
            html_content = html_content.replace("</head>", f"{layout_style}</head>")
        else:
            html_content = f"{layout_style}{html_content}"

    return html_content


def generate_pdf_from_html(html_content: str) -> bytes:
    """Generate PDF bytes from HTML string using WeasyPrint."""
    return HTML(string=html_content).write_pdf()


def generate_pdf(enhanced_data: dict, template_id: str, layout_settings: Optional[dict] = None) -> bytes:
    """Render resume data into a styled PDF using Jinja2 + WeasyPrint."""
    html_content = generate_html(enhanced_data, template_id, layout_settings)
    return generate_pdf_from_html(html_content)
