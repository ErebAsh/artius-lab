import os
import sys
from jinja2 import Environment, FileSystemLoader, exceptions, StrictUndefined
from html.parser import HTMLParser

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(PROJECT_ROOT, "backend", "resume_templates")
TEMPLATE_PY_PATH = os.path.join(PROJECT_ROOT, "backend", "templates.py")

# Mock data for rendering tests
MOCK_DATA = {
    "personal_info": {
        "full_name": "Jonathan D. Smith",
        "email": "jsmith.dev@example.com",
        "phone": "+1 (555) 012-3456",
        "location": "San Francisco, CA",
        "linkedin": "linkedin.com/in/johnsmith-dev",
        "portfolio": "www.johnsmith.dev",
        "summary": "Senior Software Engineer with 8+ years of experience in building scalable web applications and leading cross-functional teams. Expert in Python, React, and cloud-native architectures.",
        "title": "Senior Full-Stack Engineer",
        "photo": "https://i.pravatar.cc/300?u=jsmith",
    },
    "education": [
        {
            "degree": "MS in Artificial Intelligence",
            "field_of_study": "AI & ML",
            "institution": "Stanford University",
            "start_date": "2014",
            "end_date": "2016",
            "achievements": "Top 5% of class.",
            "description": "Thesis on Real-time Object Detection."
        }
    ],
    "experience": [
        {
            "company": "Innovation Labs AI",
            "location": "Palo Alto, CA",
            "title": "Senior Software Architect",
            "start_date": "Aug 2020",
            "end_date": "Present",
            "description": "Architecture lead for a ML infrastructure supporting 10M+ users.",
            "highlights": [
                "Led migration to a distributed microservices architecture using Go/Kubernetes.",
                "Reduced AWS infrastructure costs by 35% via serverless scaling.",
                "Mentored a team of 12 engineers and improved CI/CD efficiency."
            ]
        },
        {
            "company": "Global Connect Corp",
            "location": "San Francisco, CA",
            "title": "Full-Stack Developer",
            "start_date": "June 2016",
            "end_date": "July 2020",
            "description": "Developed fintech applications and secure payment integrations.",
            "highlights": [
                "Built a high-rated React Native mobile app with 1M+ downloads.",
                "Optimized state management, improving performance by 40%."
            ]
        }
    ],
    "skills": [
        {"name": "Python"}, {"name": "React/Next.js"}, {"name": "TypeScript"},
        {"name": "Go"}, {"name": "AWS (Lambda, S3)"}, {"name": "Docker/K8s"}
    ],
    "projects": [
        {
            "name": "Archi-Viz Platform",
            "link": "archi-viz.demo",
            "description": "A real estate portal with 3D walkthroughs and AI-generated floor plans."
        }
    ],
    "expertise": {
        "technical": ["System Design", "Cloud Architecture", "API Dev"],
        "professional": ["Leadership", "Project management", "Mentoring"],
        "labels": ["Technical", "Professional"]
    },
    "certifications": [
        {
            "name": "AWS Solutions Architect - Pro",
            "issuer": "Amazon Web Services",
            "year": "2023",
            "date": "Oct 2023" 
        }
    ],
    "has_photo": True,
    "photo_data": "https://i.pravatar.cc/300?u=jsmith"
}

class HTMLStructureChecker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []
        # https://developer.mozilla.org/en-US/docs/Glossary/Void_element
        self.self_closing_tags = {
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
            'link', 'meta', 'param', 'source', 'track', 'wbr'
        }

    def handle_starttag(self, tag, attrs):
        if tag not in self.self_closing_tags:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in self.self_closing_tags:
            return
        if not self.stack:
            self.errors.append(f"Unexpected end tag: </{tag}> (possibly missing start tag)")
        elif self.stack[-1] == tag:
            self.stack.pop()
        else:
            # Check if this tag is in the stack at all
            if tag in self.stack:
                # Close all tags until we find the match
                while self.stack and self.stack[-1] != tag:
                    unclosed = self.stack.pop()
                    self.errors.append(f"Tag mismatch: <{unclosed}> was not closed before </{tag}>")
                if self.stack:
                    self.stack.pop()
            else:
                self.errors.append(f"Unexpected end tag: </{tag}> (no matching start tag found)")

    def check_final(self):
        if self.stack:
            # Filter out common false positives or just report them
            self.errors.append(f"Unclosed tags at end of file: {', '.join([f'<{t}>' for t in reversed(self.stack)])}")
        return self.errors

def check_template(env, template_name):
    """Checks a single template for syntax, rendering, and structural issues."""
    print(f"Checking {template_name:20} ...", end=" ", flush=True)
    try:
        template = env.get_template(template_name)
        
        # Test 1: Rendering
        # This will catch TemplateSyntaxError and (if StrictUndefined) missing variables
        html_content = template.render(
            personal=MOCK_DATA["personal_info"],
            education=MOCK_DATA["education"],
            experience=MOCK_DATA["experience"],
            skills=MOCK_DATA["skills"],
            projects=MOCK_DATA["projects"],
            expertise=MOCK_DATA["expertise"],
            certifications=MOCK_DATA["certifications"],
            has_photo=MOCK_DATA["has_photo"],
            photo_data=MOCK_DATA["photo_data"],
            # Some templates might use these directly
            personal_info=MOCK_DATA["personal_info"]
        )
        
        errors = []
        
        # Test 2: Basic Tag existence
        content_lower = html_content.lower()
        if "<html" not in content_lower:
            errors.append("Missing <html tag")
        if "<body" not in content_lower:
            errors.append("Missing <body tag")
        if "</body>" not in content_lower:
            errors.append("Missing </body> tag")
        if "</html>" not in content_lower:
            errors.append("Missing </html> tag")
            
        # Test 3: HTML Structure (Tag balancing)
        checker = HTMLStructureChecker()
        checker.feed(html_content)
        structure_errors = checker.check_final()
        errors.extend(structure_errors)
            
        if errors:
            print("[\033[91mFAILED\033[0m]")
            # Group errors by type to keep it clean
            for error in errors[:5]: # Show first 5 errors
                print(f"  - {error}")
            if len(errors) > 5:
                print(f"  - ... and {len(errors) - 5} more errors")
            return False
        else:
            print("[\033[92mPASSED\033[0m]")
            return True

    except exceptions.TemplateSyntaxError as e:
        print("[\033[91mSYNTAX\033[0m]")
        print(f"  - Line {e.lineno}: {e.message}")
        return False
    except exceptions.UndefinedError as e:
        print("[\033[91mUNDEFINED\033[0m]")
        print(f"  - {e.message}")
        return False
    except Exception as e:
        print("[\033[31mERROR\033[0m]")
        import traceback
        traceback.print_exc()
        # print(f"  - {type(e).__name__}: {str(e)}")
        return False

def main():
    if not os.path.exists(TEMPLATE_DIR):
        print(f"Error: Template directory not found at {TEMPLATE_DIR}")
        sys.exit(1)

    # Use StrictUndefined to catch typos in templates
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR), undefined=StrictUndefined)
    
    all_files = sorted([f for f in os.listdir(TEMPLATE_DIR) if f.endswith(".html")])
    
    # Parse arguments
    args = sys.argv[1:]
    preview = False
    if "--preview" in args:
        preview = True
        args.remove("--preview")
        
    if args:
        templates_to_check = [arg for arg in args if arg in all_files]
        if not templates_to_check:
            print(f"Error: None of the specified templates found in {TEMPLATE_DIR}")
            sys.exit(1)
    else:
        templates_to_check = all_files
        
    print(f"Checking {len(templates_to_check)} templates in {TEMPLATE_DIR}")
    if preview:
        print("Note: Preview mode is ON. Templates will be opened in your browser.")
    print("-" * 65)
    
    passed_count = 0
    failed_count = 0
    failed_templates = []
    
    for template_name in templates_to_check:
        success = check_template(env, template_name)
        if success:
            passed_count += 1
        else:
            failed_count += 1
            failed_templates.append(template_name)
            
        # Preview if requested
        if preview:
            try:
                template = env.get_template(template_name)
                html_content = template.render(
                    personal=MOCK_DATA["personal_info"],
                    education=MOCK_DATA["education"],
                    experience=MOCK_DATA["experience"],
                    skills=MOCK_DATA["skills"],
                    projects=MOCK_DATA["projects"],
                    expertise=MOCK_DATA["expertise"],
                    certifications=MOCK_DATA["certifications"],
                    has_photo=MOCK_DATA["has_photo"],
                    photo_data=MOCK_DATA["photo_data"],
                    personal_info=MOCK_DATA["personal_info"]
                )
                
                # Inject "PDF-like" styles for browser preview
                preview_styles = """
                <style id="preview-styling">
                    body {
                        background-color: #f0f2f5 !important;
                        display: flex !important;
                        justify-content: center !important;
                        padding: 40px !important;
                        margin: 0 !important;
                    }
                    .container {
                        background-color: white !important;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 auto !important;
                    }
                </style>
                """
                if "</head>" in html_content:
                    html_content = html_content.replace("</head>", f"{preview_styles}</head>")
                else:
                    html_content = f"{preview_styles}{html_content}"

                import webbrowser
                import tempfile
                
                fd, temp_path = tempfile.mkstemp(suffix=".html", prefix=f"preview_{template_name}_")
                with os.fdopen(fd, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                
                print(f"  -> Opening browser preview (PDF layout): {temp_path}")
                webbrowser.open(f"file://{os.path.abspath(temp_path)}")
                
            except Exception as pe:
                print(f"  -> Preview failed: {str(pe)}")
            
    print("-" * 65)
    print(f"Total: {len(templates_to_check)} | Passed: {passed_count} | Failed: {failed_count}")
    
    if failed_templates:
        print("\nFailed templates:")
        for ft in failed_templates:
            print(f"  - {ft}")
            
    if failed_count > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
