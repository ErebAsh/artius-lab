"""
Artius Lab - HTML Resume Template Test Suite
=============================================
Dedicated test suite for HTML resume templates located in `backend/resume_templates/`.

Validates:
  1. Dual-photo rendering:
     - Scenario A: WITH pictures (photo provided)
     - Scenario B: WITHOUT pictures (photo None / omitted)
  2. Degradation & no broken image tags (<img src="None">)
  3. Sparse/minimal user data handling
  4. HTML tag balance & nesting integrity
  5. WeasyPrint PDF compilation (optional, with --pdf)

Usage:
  python tests/test_html_templates.py               # Fast CLI audit (Jinja2, Dual-photo, HTML tags)
  python tests/test_html_templates.py --pdf         # Include WeasyPrint PDF generation
  python tests/test_html_templates.py --preview AL-005 # Open browser side-by-side comparison
  python -m unittest tests/test_html_templates.py   # Standard unittest / CI discovery
"""

import argparse
import os
import sys
import tempfile
import unittest
import webbrowser
from html.parser import HTMLParser
from typing import Any

from jinja2 import Environment, FileSystemLoader, exceptions

# Fix Windows console cp1252 encoding for Unicode/ANSI
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

os.environ.setdefault("GIO_USE_VOLUME_MONITOR", "dummy")

# ── Paths ────────────────────────────────────────────────────────────
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
TEMPLATE_DIR = os.path.join(BACKEND_DIR, "resume_templates")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if TESTS_DIR not in sys.path:
    sys.path.insert(0, TESTS_DIR)

from mock_data import build_payload

try:
    from backend.templates import get_template_by_id
except ImportError:
    try:
        from templates import get_template_by_id
    except ImportError:

        def get_template_by_id(tid):
            return None


# ── Color Output Helpers ─────────────────────────────────────────────
class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


# ── Strict HTML Tag Balance Checker ──────────────────────────────────
class HTMLStructureChecker(HTMLParser):
    """Verifies that all opened HTML tags are properly balanced and closed."""

    def __init__(self):
        super().__init__()
        self.stack: list[str] = []
        self.errors: list[str] = []
        self.void_elements = {
            "area",
            "base",
            "br",
            "col",
            "embed",
            "hr",
            "img",
            "input",
            "link",
            "meta",
            "param",
            "source",
            "track",
            "wbr",
        }
        self.tracked_tags = {
            "div",
            "span",
            "section",
            "article",
            "aside",
            "main",
            "header",
            "footer",
            "nav",
            "ul",
            "ol",
            "li",
            "table",
            "tr",
            "td",
            "th",
            "p",
            "html",
            "head",
            "body",
        }

    def handle_starttag(self, tag: str, attrs):
        t = tag.lower()
        if t not in self.void_elements and t in self.tracked_tags:
            self.stack.append(t)

    def handle_endtag(self, tag: str):
        t = tag.lower()
        if t in self.void_elements or t not in self.tracked_tags:
            return

        if not self.stack:
            self.errors.append(f"Unexpected closing tag </{t}> (no start tag)")
        elif self.stack[-1] == t:
            self.stack.pop()
        else:
            if t in self.stack:
                unclosed = []
                while self.stack and self.stack[-1] != t:
                    unclosed.append(f"<{self.stack.pop()}>")
                if self.stack:
                    self.stack.pop()
                self.errors.append(f"Unclosed tag(s) {', '.join(unclosed)} before </{t}>")
            else:
                self.errors.append(f"Unexpected closing tag </{t}> (not in active scope)")

    def check_final(self) -> list[str]:
        if self.stack:
            unclosed_str = ", ".join([f"<{t}>" for t in reversed(self.stack)])
            self.errors.append(f"Unclosed tag(s) remaining at end of file: {unclosed_str}")
        return self.errors


# ── WeasyPrint Offline URL Fetcher ───────────────────────────────────
def offline_weasyprint_fetcher(url: str, timeout: int = 2, ssl_context=None):
    if url.startswith("data:"):
        import weasyprint

        return weasyprint.default_url_fetcher(url, timeout=timeout, ssl_context=ssl_context)
    return {
        "string": b"/* offline mock font */",
        "mime_type": "text/css",
        "encoding": "utf-8",
        "redirected_url": url,
    }


# ── Core Evaluation Function ─────────────────────────────────────────
def audit_html_template(
    env: Environment,
    template_name: str,
    test_pdf: bool = False,
    pics_only: bool = False,
    no_pics_only: bool = False,
) -> dict[str, Any]:
    """Audit a single HTML template and return structured results."""
    template_id = template_name.replace(".html", "")
    template_path = os.path.join(TEMPLATE_DIR, template_name)

    try:
        with open(template_path, encoding="utf-8") as f:
            raw_content = f.read()
    except Exception as e:
        return {
            "template_id": template_id,
            "status": "FAILED",
            "errors": [f"Cannot read file: {e}"],
            "passed": False,
        }

    meta = get_template_by_id(template_id) or {}
    has_photo_marker = "<!-- has_photo -->" in raw_content
    has_img_tag = "<img" in raw_content.lower()
    references_photo = (
        "personal.photo" in raw_content
        or "personal.photo_url" in raw_content
        or "photo_data" in raw_content
    )
    is_photo_supported = has_photo_marker or has_img_tag or references_photo

    result: dict[str, Any] = {
        "template_id": template_id,
        "name": meta.get("name", template_id),
        "category": meta.get("category", "General"),
        "is_photo_supported": is_photo_supported,
        "render_pic_ok": None,
        "render_nopic_ok": None,
        "render_minimal_ok": None,
        "html_balanced": None,
        "pdf_ok": None,
        "errors": [],
        "warnings": [],
        "passed": True,
    }

    try:
        template = env.get_template(template_name)
    except exceptions.TemplateSyntaxError as se:
        result["errors"].append(f"TemplateSyntaxError line {se.lineno}: {se.message}")
        result["passed"] = False
        result["status"] = "FAILED"
        return result
    except Exception as e:
        result["errors"].append(f"LoadError: {e!s}")
        result["passed"] = False
        result["status"] = "FAILED"
        return result

    html_pic = ""
    html_nopic = ""

    # Test With Pictures
    if not no_pics_only:
        try:
            payload_pic = build_payload("with_pic")
            html_pic = template.render(**payload_pic)
            result["render_pic_ok"] = True
            if is_photo_supported and "<img" not in html_pic:
                result["warnings"].append(
                    "Template marked for photo support, but no <img> found in rendered output."
                )
        except Exception as e:
            result["render_pic_ok"] = False
            result["errors"].append(f"Render [WITH PIC] failed: {type(e).__name__}: {e!s}")
            result["passed"] = False

    # Test Without Pictures
    if not pics_only:
        try:
            payload_nopic = build_payload("no_pic")
            html_nopic = template.render(**payload_nopic)
            result["render_nopic_ok"] = True
            if '<img src="None"' in html_nopic or '<img src=""' in html_nopic:
                result["errors"].append(
                    "Render [NO PIC] outputs broken image (<img src='None' or empty src)."
                )
                result["passed"] = False
        except Exception as e:
            result["render_nopic_ok"] = False
            result["errors"].append(f"Render [NO PIC] failed: {type(e).__name__}: {e!s}")
            result["passed"] = False

    # Test Minimal/Sparse Data
    try:
        payload_min = build_payload("minimal_nopic" if no_pics_only else "minimal_pic")
        _ = template.render(**payload_min)
        result["render_minimal_ok"] = True
    except Exception as e:
        result["render_minimal_ok"] = False
        result["warnings"].append(f"Sparse data render failed: {type(e).__name__}: {e!s}")

    # HTML Tag Balancing Check
    target_html = html_pic if html_pic else html_nopic
    if target_html:
        checker = HTMLStructureChecker()
        checker.feed(target_html)
        tag_errors = checker.check_final()
        if tag_errors:
            result["html_balanced"] = False
            for te in tag_errors:
                result["warnings"].append(f"HTML Tag Mismatch: {te}")
        else:
            result["html_balanced"] = True

    # PDF Generation Test
    if test_pdf and target_html and result["passed"]:
        try:
            from weasyprint import HTML

            pdf_bytes = HTML(string=target_html, url_fetcher=offline_weasyprint_fetcher).write_pdf()
            if pdf_bytes and pdf_bytes.startswith(b"%PDF-"):
                result["pdf_ok"] = True
            else:
                result["pdf_ok"] = False
                result["errors"].append("WeasyPrint produced invalid PDF bytes header.")
                result["passed"] = False
        except Exception as pe:
            result["pdf_ok"] = False
            result["errors"].append(f"WeasyPrint PDF failed: {type(pe).__name__}: {pe!s}")
            result["passed"] = False

    if not result["passed"] or len(result["errors"]) > 0:
        result["status"] = "FAILED"
    elif len(result["warnings"]) > 0:
        result["status"] = "WARNING"
    else:
        result["status"] = "PASSED"

    return result


# ── CLI Table Printer ────────────────────────────────────────────────
def print_html_dashboard(results: list[dict[str, Any]], test_pdf: bool):
    print("\n" + "=" * 88)
    print(f"{Colors.BOLD}  ARTIUS LAB — HTML RESUME TEMPLATES AUDIT{Colors.RESET}")
    print("=" * 88)

    pdf_hdr = f"{'PDF':<7}" if test_pdf else ""
    print(
        f"{Colors.BOLD}{'ID':<8} {'Template Name':<28} {'Photo Capable':<15} {'With Pic':<10} {'No Pic':<10} {'HTML':<8} {pdf_hdr}{'Status':<8}{Colors.RESET}"
    )
    print("-" * 88)

    for r in results:
        tid = r["template_id"]
        tname = (r["name"][:25] + "..") if len(r["name"]) > 27 else r["name"]
        photo_cap = (
            f"{Colors.CYAN}YES (Photo){Colors.RESET}"
            if r["is_photo_supported"]
            else f"{Colors.DIM}NO (Text-Only){Colors.RESET}"
        )

        pic_str = (
            f"{Colors.GREEN}PASS{Colors.RESET}"
            if r["render_pic_ok"]
            else (
                f"{Colors.RED}FAIL{Colors.RESET}"
                if r["render_pic_ok"] is False
                else f"{Colors.DIM}SKIP{Colors.RESET}"
            )
        )
        nopic_str = (
            f"{Colors.GREEN}PASS{Colors.RESET}"
            if r["render_nopic_ok"]
            else (
                f"{Colors.RED}FAIL{Colors.RESET}"
                if r["render_nopic_ok"] is False
                else f"{Colors.DIM}SKIP{Colors.RESET}"
            )
        )
        html_str = (
            f"{Colors.GREEN}VALID{Colors.RESET}"
            if r["html_balanced"]
            else (
                f"{Colors.YELLOW}MISMATCH{Colors.RESET}"
                if r["html_balanced"] is False
                else f"{Colors.DIM}N/A{Colors.RESET}"
            )
        )

        pdf_str = ""
        if test_pdf:
            pdf_str = (
                f"{Colors.GREEN}PASS{Colors.RESET}   "
                if r["pdf_ok"]
                else f"{Colors.RED}FAIL{Colors.RESET}   "
            )

        if r["status"] == "PASSED":
            status_str = f"{Colors.GREEN}[WORKING]{Colors.RESET}"
        elif r["status"] == "WARNING":
            status_str = f"{Colors.YELLOW}[WARNING]{Colors.RESET}"
        else:
            status_str = f"{Colors.RED}[BROKEN]{Colors.RESET}"

        print(
            f"{tid:<8} {tname:<28} {photo_cap:<24} {pic_str:<19} {nopic_str:<19} {html_str:<17} {pdf_str}{status_str}"
        )

    print("-" * 88)
    passed = sum(1 for r in results if r["status"] == "PASSED")
    warned = sum(1 for r in results if r["status"] == "WARNING")
    failed = sum(1 for r in results if r["status"] == "FAILED")
    print(
        f"{Colors.BOLD}HTML Templates: {len(results)} Total | {Colors.GREEN}{passed} Passed{Colors.RESET} | {Colors.YELLOW}{warned} Warnings{Colors.RESET} | {Colors.RED}{failed} Failed{Colors.RESET}\n"
    )


# ── Interactive Browser Preview ──────────────────────────────────────
def open_preview(env: Environment, template_name: str):
    template_id = template_name.replace(".html", "")
    tmpl = env.get_template(template_name)
    html_pic = tmpl.render(**build_payload("with_pic"))
    html_nopic = tmpl.render(**build_payload("no_pic"))

    composite = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Preview: {template_id}</title>
    <style>
        body {{ background: #0f172a; color: #f8fafc; font-family: sans-serif; margin: 0; padding: 24px; }}
        h1 {{ text-align: center; color: #38bdf8; margin-bottom: 20px; }}
        .wrap {{ display: flex; gap: 32px; justify-content: center; }}
        .badge {{ background: #1e293b; padding: 8px 16px; border-radius: 20px; text-align: center; font-weight: bold; margin-bottom: 8px; border: 1px solid #334155; }}
        .box {{ width: 210mm; height: 297mm; background: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        iframe {{ width: 100%; height: 100%; border: none; }}
    </style>
</head>
<body>
    <h1>Template Preview: {template_id}</h1>
    <div class="wrap">
        <div>
            <div class="badge" style="color: #38bdf8;">📸 With Picture</div>
            <div class="box"><iframe srcdoc="{html_pic.replace('"', "&quot;")}"></iframe></div>
        </div>
        <div>
            <div class="badge" style="color: #c084fc;">📄 Without Picture</div>
            <div class="box"><iframe srcdoc="{html_nopic.replace('"', "&quot;")}"></iframe></div>
        </div>
    </div>
</body>
</html>"""
    fd, path = tempfile.mkstemp(suffix=".html", prefix=f"preview_{template_id}_")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(composite)
    print(f"-> Opened browser preview: {path}")
    webbrowser.open(f"file://{os.path.abspath(path)}")


# ── Standard Unittest Class for CI Discovery ─────────────────────────
class TestHTMLTemplates(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
        cls.templates = sorted([f for f in os.listdir(TEMPLATE_DIR) if f.endswith(".html")])

    def test_all_html_templates_render_dual_mode(self):
        """Verify every HTML template compiles and renders both with-pic and no-pic without crashing."""
        for t_file in self.templates:
            with self.subTest(template=t_file):
                res = audit_html_template(self.env, t_file)
                self.assertTrue(res["passed"], f"{t_file} failed: {res['errors']}")
                self.assertTrue(res["render_pic_ok"], f"{t_file} failed in WITH-PIC mode")
                self.assertTrue(res["render_nopic_ok"], f"{t_file} failed in NO-PIC mode")

    def test_all_html_templates_tag_balance(self):
        """Verify HTML tags are properly balanced in all templates."""
        for t_file in self.templates:
            with self.subTest(template=t_file):
                res = audit_html_template(self.env, t_file)
                self.assertTrue(
                    res["html_balanced"], f"{t_file} has unbalanced tags: {res['warnings']}"
                )


# ── CLI Runner ───────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="HTML Resume Template Test Suite")
    parser.add_argument("templates", nargs="*", help="Specific template IDs (e.g. AL-001 AL-005)")
    parser.add_argument(
        "--pdf", action="store_true", help="Include WeasyPrint PDF compilation test"
    )
    parser.add_argument("--pics-only", action="store_true", help="Only test with pictures")
    parser.add_argument("--no-pics-only", action="store_true", help="Only test without pictures")
    parser.add_argument(
        "--preview", metavar="TEMPLATE_ID", help="Open browser side-by-side preview"
    )

    args = parser.parse_args()
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

    if args.preview:
        tname = args.preview if args.preview.endswith(".html") else f"{args.preview}.html"
        open_preview(env, tname)
        return

    all_files = sorted([f for f in os.listdir(TEMPLATE_DIR) if f.endswith(".html")])
    if args.templates:
        req = [t if t.endswith(".html") else f"{t}.html" for t in args.templates]
        targets = [t for t in req if t in all_files]
    else:
        targets = all_files

    print(f"\n🔍 Auditing {len(targets)} HTML Resume Templates...")
    results = [
        audit_html_template(
            env, t, test_pdf=args.pdf, pics_only=args.pics_only, no_pics_only=args.no_pics_only
        )
        for t in targets
    ]
    print_html_dashboard(results, test_pdf=args.pdf)

    failed = sum(1 for r in results if r["status"] == "FAILED")
    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
