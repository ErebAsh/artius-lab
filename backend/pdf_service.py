import os
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "resume_templates")

env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))


def generate_html(enhanced_data: dict, template_id: str) -> str:
    """Render resume data into a styled HTML using Jinja2."""
    template_file = f"{template_id}.html"
    template = env.get_template(template_file)

    return template.render(
        personal=enhanced_data.get("personal_info", {}),
        education=enhanced_data.get("education", []),
        experience=enhanced_data.get("experience", []),
        skills=enhanced_data.get("skills", []),
        projects=enhanced_data.get("projects", []),
    )


def generate_pdf_from_html(html_content: str) -> bytes:
    """Generate PDF bytes from HTML string using WeasyPrint."""
    return HTML(string=html_content).write_pdf()


def generate_pdf(enhanced_data: dict, template_id: str) -> bytes:
    """Render resume data into a styled PDF using Jinja2 + WeasyPrint."""
    html_content = generate_html(enhanced_data, template_id)
    return generate_pdf_from_html(html_content)
