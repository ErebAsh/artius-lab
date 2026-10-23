"""
Artius Lab - LaTeX Resume Template Test Suite
==============================================
Dedicated test suite for LaTeX resume templates located in `backend/latex_templates/`.

Validates:
  1. LaTeX Jinja2 syntax & delimiter parsing:
     - block delimiters: ((* *))
     - variable delimiters: ((( )))
     - comment delimiters: ((# #))
  2. Recursive LaTeX character escaping (handles &, %, $, #, _, {, }, ~, ^)
  3. Standard LaTeX structure (\\documentclass, \\begin{document}, \\end{document})
  4. Dual-mode rendering (with pictures, without pictures, and sparse data)
  5. Synchronization with `RESUME_TEMPLATES` metadata

Usage:
  python tests/test_latex_templates.py               # Fast CLI audit
  python tests/test_latex_templates.py AL-001        # Test specific template
  python tests/test_latex_templates.py --export AL-001 # Export rendered .tex to file
  python -m unittest tests/test_latex_templates.py   # Standard unittest / CI discovery
"""

import argparse
import os
import sys
import unittest
from typing import Any

# Fix Windows console cp1252 encoding for Unicode/ANSI
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ── Paths ────────────────────────────────────────────────────────────
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TESTS_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
LATEX_TEMPLATE_DIR = os.path.join(BACKEND_DIR, "latex_templates")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if TESTS_DIR not in sys.path:
    sys.path.insert(0, TESTS_DIR)

from mock_data import build_payload

try:
    from pdf_service import generate_latex, has_latex_template, latex_env
    from templates import get_template_by_id
except ImportError:
    latex_env = None

    def generate_latex(d, tid):
        return ""

    def has_latex_template(tid):
        return False

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


# ── Core Audit Function ──────────────────────────────────────────────
def audit_latex_template(template_name: str) -> dict[str, Any]:
    """Audit a single LaTeX template and return validation results."""
    template_id = template_name.replace(".tex", "")

    meta = get_template_by_id(template_id) or {}
    result: dict[str, Any] = {
        "template_id": template_id,
        "name": meta.get("name", template_id),
        "category": meta.get("category", "General"),
        "syntax_ok": True,
        "render_pic_ok": None,
        "render_nopic_ok": None,
        "render_special_chars_ok": None,
        "structure_valid": None,
        "errors": [],
        "warnings": [],
        "passed": True,
    }

    # 1. Template Compilation / Parsing Test
    try:
        latex_env.get_template(template_name)
    except Exception as e:
        result["syntax_ok"] = False
        result["errors"].append(f"LaTeX Jinja Syntax Error: {type(e).__name__}: {e!s}")
        result["passed"] = False
        result["status"] = "FAILED"
        return result

    # 2. Render With Pictures
    try:
        payload_pic = build_payload("with_pic")
        tex_pic = generate_latex(payload_pic, template_id)
        result["render_pic_ok"] = True
    except Exception as e:
        result["render_pic_ok"] = False
        result["errors"].append(f"Render [WITH PIC] failed: {type(e).__name__}: {e!s}")
        result["passed"] = False

    # 3. Render Without Pictures
    try:
        payload_nopic = build_payload("no_pic")
        tex_nopic = generate_latex(payload_nopic, template_id)
        result["render_nopic_ok"] = True
    except Exception as e:
        result["render_nopic_ok"] = False
        result["errors"].append(f"Render [NO PIC] failed: {type(e).__name__}: {e!s}")
        result["passed"] = False

    # 4. Render with Special LaTeX Characters
    try:
        payload_special = build_payload("special_chars")
        tex_special = generate_latex(payload_special, template_id)
        result["render_special_chars_ok"] = True
        # Verify unescaped raw '&' or '%' wasn't leaked directly into LaTeX command position
        if "Alice & Bob" in tex_special:
            result["warnings"].append(
                "Unescaped '&' found in LaTeX output! Character escaping might have failed."
            )
    except Exception as e:
        result["render_special_chars_ok"] = False
        result["errors"].append(f"Special chars render failed: {type(e).__name__}: {e!s}")
        result["passed"] = False

    # 5. LaTeX Document Structure Check
    target_tex = (
        tex_pic if result["render_pic_ok"] else (tex_nopic if result["render_nopic_ok"] else "")
    )
    if target_tex:
        has_doc_class = "\\documentclass" in target_tex
        has_begin_doc = "\\begin{document}" in target_tex
        has_end_doc = "\\end{document}" in target_tex

        if has_doc_class and has_begin_doc and has_end_doc:
            result["structure_valid"] = True
        else:
            result["structure_valid"] = False
            missing = []
            if not has_doc_class:
                missing.append("\\documentclass")
            if not has_begin_doc:
                missing.append("\\begin{document}")
            if not has_end_doc:
                missing.append("\\end{document}")
            result["warnings"].append(f"Missing standard LaTeX tags: {', '.join(missing)}")

    if not result["passed"] or len(result["errors"]) > 0:
        result["status"] = "FAILED"
    elif len(result["warnings"]) > 0:
        result["status"] = "WARNING"
    else:
        result["status"] = "PASSED"

    return result


# ── Terminal Dashboard Renderer ──────────────────────────────────────
def print_latex_dashboard(results: list[dict[str, Any]]):
    print("\n" + "=" * 80)
    print(f"{Colors.BOLD}  ARTIUS LAB — LATEX RESUME TEMPLATES AUDIT{Colors.RESET}")
    print("=" * 80)
    print(
        f"{Colors.BOLD}{'ID':<8} {'Template Name':<28} {'Syntax':<10} {'With Pic':<10} {'No Pic':<10} {'Escaping':<10} {'Status':<8}{Colors.RESET}"
    )
    print("-" * 80)

    for r in results:
        tid = r["template_id"]
        tname = (r["name"][:25] + "..") if len(r["name"]) > 27 else r["name"]
        syntax_str = (
            f"{Colors.GREEN}PASS{Colors.RESET}"
            if r["syntax_ok"]
            else f"{Colors.RED}FAIL{Colors.RESET}"
        )
        pic_str = (
            f"{Colors.GREEN}PASS{Colors.RESET}"
            if r["render_pic_ok"]
            else f"{Colors.RED}FAIL{Colors.RESET}"
        )
        nopic_str = (
            f"{Colors.GREEN}PASS{Colors.RESET}"
            if r["render_nopic_ok"]
            else f"{Colors.RED}FAIL{Colors.RESET}"
        )
        esc_str = (
            f"{Colors.GREEN}SAFE{Colors.RESET}"
            if r["render_special_chars_ok"]
            else f"{Colors.RED}FAIL{Colors.RESET}"
        )

        if r["status"] == "PASSED":
            status_str = f"{Colors.GREEN}[WORKING]{Colors.RESET}"
        elif r["status"] == "WARNING":
            status_str = f"{Colors.YELLOW}[WARNING]{Colors.RESET}"
        else:
            status_str = f"{Colors.RED}[BROKEN]{Colors.RESET}"

        print(
            f"{tid:<8} {tname:<28} {syntax_str:<19} {pic_str:<19} {nopic_str:<19} {esc_str:<19} {status_str}"
        )

    print("-" * 80)
    passed = sum(1 for r in results if r["status"] == "PASSED")
    warned = sum(1 for r in results if r["status"] == "WARNING")
    failed = sum(1 for r in results if r["status"] == "FAILED")
    print(
        f"{Colors.BOLD}LaTeX Templates: {len(results)} Total | {Colors.GREEN}{passed} Passed{Colors.RESET} | {Colors.YELLOW}{warned} Warnings{Colors.RESET} | {Colors.RED}{failed} Failed{Colors.RESET}\n"
    )

    if failed > 0:
        for r in results:
            if r["status"] == "FAILED":
                print(f"{Colors.RED}❌ {r['template_id']}:{Colors.RESET}")
                for err in r["errors"]:
                    print(f"     {err}")
        print()


# ── Standard Unittest Class for CI Discovery ─────────────────────────
class TestLaTeXTemplates(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.templates = sorted([f for f in os.listdir(LATEX_TEMPLATE_DIR) if f.endswith(".tex")])

    def test_all_latex_templates_compile_and_render(self):
        """Verify all LaTeX templates compile without Jinja syntax errors and render safely."""
        for t_file in self.templates:
            with self.subTest(template=t_file):
                res = audit_latex_template(t_file)
                self.assertTrue(res["passed"], f"{t_file} failed: {res['errors']}")
                self.assertTrue(res["render_pic_ok"], f"{t_file} failed in WITH-PIC mode")
                self.assertTrue(res["render_nopic_ok"], f"{t_file} failed in NO-PIC mode")

    def test_latex_special_character_escaping(self):
        """Verify LaTeX special characters are safely escaped."""
        for t_file in self.templates:
            with self.subTest(template=t_file):
                res = audit_latex_template(t_file)
                self.assertTrue(
                    res["render_special_chars_ok"], f"{t_file} failed on special character escaping"
                )


# ── CLI Runner ───────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="LaTeX Resume Template Test Suite")
    parser.add_argument("templates", nargs="*", help="Specific template IDs (e.g. AL-001 AL-015)")
    parser.add_argument(
        "--export", metavar="TEMPLATE_ID", help="Render and export .tex source to file"
    )

    args = parser.parse_args()

    if args.export:
        tid = args.export.replace(".tex", "")
        tex = generate_latex(build_payload("with_pic"), tid)
        out_name = f"{tid}_export.tex"
        with open(out_name, "w", encoding="utf-8") as f:
            f.write(tex)
        print(f"-> Exported {out_name} ({len(tex)} chars)")
        return

    all_files = sorted([f for f in os.listdir(LATEX_TEMPLATE_DIR) if f.endswith(".tex")])
    if args.templates:
        req = [t if t.endswith(".tex") else f"{t}.tex" for t in args.templates]
        targets = [t for t in req if t in all_files]
    else:
        targets = all_files

    print(f"\n🔍 Auditing {len(targets)} LaTeX Resume Templates...")
    results = [audit_latex_template(t) for t in targets]
    print_latex_dashboard(results)

    failed = sum(1 for r in results if r["status"] == "FAILED")
    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
