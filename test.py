"""
Artius Lab - Unified Master Test Runner
=======================================
Orchestrates test suites across:
  - HTML Templates (tests/test_html_templates.py)
  - LaTeX Templates (tests/test_latex_templates.py)
  - Centralized Mock Data (tests/mock_data.py)

Usage:
  python test.py                    # Run full universal audit (HTML dual-photo & LaTeX)
  python test.py --html             # Audit HTML templates only
  python test.py --latex            # Audit LaTeX templates only
  python test.py --pdf              # Include WeasyPrint PDF compilation test
  python test.py --pics-only        # Test only with pictures
  python test.py --no-pics-only     # Test only without pictures
  python test.py AL-001 AL-005      # Audit specific templates
  python test.py --preview AL-005   # Open browser side-by-side comparison
  python test.py --markdown         # Export Markdown audit summary
  python test.py --json             # Export JSON report
"""

import os
import sys
import json
import argparse
from jinja2 import Environment, FileSystemLoader

# Fix Windows console cp1252 encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
TESTS_DIR = os.path.join(PROJECT_ROOT, "tests")
TEMPLATE_DIR = os.path.join(BACKEND_DIR, "resume_templates")
LATEX_TEMPLATE_DIR = os.path.join(BACKEND_DIR, "latex_templates")

for p in [PROJECT_ROOT, BACKEND_DIR, TESTS_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from tests.mock_data import build_payload, MOCK_RESUME_DATA
from tests.test_html_templates import audit_html_template, print_html_dashboard, open_preview
from tests.test_latex_templates import audit_latex_template, print_latex_dashboard

try:
    from templates import RESUME_TEMPLATES, get_template_by_id
except ImportError:
    RESUME_TEMPLATES = []
    def get_template_by_id(tid): return None


class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def print_unified_dashboard(results: list, test_pdf: bool, test_latex: bool):
    print("\n" + "=" * 94)
    print(f"{Colors.BOLD}  ARTIUS LAB — UNIVERSAL RESUME AUDIT DASHBOARD{Colors.RESET}")
    print("=" * 94)

    pdf_hdr = f"{'PDF':<7}" if test_pdf else ""
    latex_hdr = f"{'LaTeX':<7}" if test_latex else ""
    print(f"{Colors.BOLD}{'ID':<8} {'Template Name':<28} {'Photo Capable':<15} {'With Pic':<10} {'No Pic':<10} {'HTML':<8} {pdf_hdr}{latex_hdr}{'Status':<8}{Colors.RESET}")
    print("-" * 94)

    for r in results:
        tid = r["template_id"]
        tname = (r["name"][:25] + "..") if len(r["name"]) > 27 else r["name"]
        photo_cap = f"{Colors.CYAN}YES (Photo){Colors.RESET}" if r["is_photo_supported"] else f"{Colors.DIM}NO (Text-Only){Colors.RESET}"

        pic_str = f"{Colors.GREEN}PASS{Colors.RESET}" if r["render_pic_ok"] else (f"{Colors.RED}FAIL{Colors.RESET}" if r["render_pic_ok"] is False else f"{Colors.DIM}SKIP{Colors.RESET}")
        nopic_str = f"{Colors.GREEN}PASS{Colors.RESET}" if r["render_nopic_ok"] else (f"{Colors.RED}FAIL{Colors.RESET}" if r["render_nopic_ok"] is False else f"{Colors.DIM}SKIP{Colors.RESET}")
        html_str = f"{Colors.GREEN}VALID{Colors.RESET}" if r["html_balanced"] else (f"{Colors.YELLOW}MISMATCH{Colors.RESET}" if r["html_balanced"] is False else f"{Colors.DIM}N/A{Colors.RESET}")

        pdf_str = ""
        if test_pdf:
            pdf_str = f"{Colors.GREEN}PASS{Colors.RESET}   " if r["pdf_ok"] else f"{Colors.RED}FAIL{Colors.RESET}   "

        latex_str = ""
        if test_latex:
            if not r.get("has_latex"):
                latex_str = f"{Colors.DIM}N/A{Colors.RESET}    "
            elif r.get("latex_ok") is True:
                latex_str = f"{Colors.GREEN}PASS{Colors.RESET}   "
            else:
                latex_str = f"{Colors.RED}FAIL{Colors.RESET}   "

        if r["status"] == "PASSED":
            status_str = f"{Colors.GREEN}[WORKING]{Colors.RESET}"
        elif r["status"] == "WARNING":
            status_str = f"{Colors.YELLOW}[WARNING]{Colors.RESET}"
        else:
            status_str = f"{Colors.RED}[BROKEN]{Colors.RESET}"

        print(f"{tid:<8} {tname:<28} {photo_cap:<24} {pic_str:<19} {nopic_str:<19} {html_str:<17} {pdf_str}{latex_str}{status_str}")

    print("-" * 94)
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASSED")
    warned = sum(1 for r in results if r["status"] == "WARNING")
    failed = sum(1 for r in results if r["status"] == "FAILED")
    photo_count = sum(1 for r in results if r["is_photo_supported"])

    print(f"{Colors.BOLD}Summary: {total} Templates Audited{Colors.RESET}")
    print(f"  • {Colors.GREEN}{passed} Fully Working{Colors.RESET} (100% Passed)")
    print(f"  • {Colors.YELLOW}{warned} Working with Warnings{Colors.RESET}")
    print(f"  • {Colors.RED}{failed} Broken / Critical Failure{Colors.RESET}")
    print(f"  • Layout Breakdown: {photo_count} Photo-Enabled | {total - photo_count} Text-Only (ATS/Standard)\n")


def export_markdown(results: list, path: str = "template_test_report.md"):
    passed = sum(1 for r in results if r["status"] == "PASSED")
    lines = [
        "# Resume Template Audit Report",
        "",
        f"**Audited:** {len(results)} | **Passed:** {passed} | **Failed:** {len(results) - passed}",
        "",
        "| ID | Template Name | Category | Photo Capable | With Pic | No Pic | HTML Balance | Status |",
        "|---|---|---|---|---|---|---|---|"
    ]
    for r in results:
        status_icon = "✅ PASSED" if r["status"] == "PASSED" else ("⚠️ WARNING" if r["status"] == "WARNING" else "❌ FAILED")
        photo_str = "Yes (Photo)" if r["is_photo_supported"] else "No (Text-Only)"
        lines.append(f"| **{r['template_id']}** | {r['name']} | {r['category']} | {photo_str} | {'✅ Pass' if r['render_pic_ok'] else '❌ Fail'} | {'✅ Pass' if r['render_nopic_ok'] else '❌ Fail'} | {'✅ Valid' if r['html_balanced'] else '⚠️ Mismatch'} | {status_icon} |")

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"-> Markdown report saved to {path}")


def main():
    parser = argparse.ArgumentParser(description="Artius Lab Master Test Runner")
    parser.add_argument("templates", nargs="*", help="Specific template IDs to audit")
    parser.add_argument("--html", action="store_true", help="Run only HTML template tests")
    parser.add_argument("--latex", action="store_true", help="Run only LaTeX template tests")
    parser.add_argument("--pdf", action="store_true", help="Include WeasyPrint PDF compilation test")
    parser.add_argument("--pics-only", action="store_true", help="Only audit with pictures")
    parser.add_argument("--no-pics-only", action="store_true", help="Only audit without pictures")
    parser.add_argument("--preview", metavar="TEMPLATE_ID", help="Open browser preview for template")
    parser.add_argument("--markdown", action="store_true", help="Save markdown audit report")
    parser.add_argument("--json", action="store_true", help="Output JSON results")

    args = parser.parse_args()
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

    # Fast delegation if user requested only LaTeX
    if args.latex and not args.html:
        latex_targets = [f"{t}.tex" if not t.endswith(".tex") else t for t in args.templates] if args.templates else sorted([f for f in os.listdir(LATEX_TEMPLATE_DIR) if f.endswith(".tex")])
        print(f"\n🔍 Auditing {len(latex_targets)} LaTeX Templates...")
        latex_results = [audit_latex_template(t) for t in latex_targets]
        print_latex_dashboard(latex_results)
        failed = sum(1 for r in latex_results if r["status"] == "FAILED")
        sys.exit(1 if failed > 0 else 0)

    # Preview handler
    if args.preview:
        tname = args.preview if args.preview.endswith(".html") else f"{args.preview}.html"
        open_preview(env, tname)
        return

    # Master / HTML targets
    all_html = sorted([f for f in os.listdir(TEMPLATE_DIR) if f.endswith(".html")])
    if args.templates:
        req = [t if t.endswith(".html") else f"{t}.html" for t in args.templates]
        targets = [t for t in req if t in all_html]
    else:
        targets = all_html

    print(f"\n🔍 Auditing {len(targets)} Resume Templates...")
    results = []
    include_latex = not args.html

    for t_file in targets:
        tid = t_file.replace(".html", "")
        h_res = audit_html_template(env, t_file, test_pdf=args.pdf, pics_only=args.pics_only, no_pics_only=args.no_pics_only)

        # Check corresponding LaTeX template if exists
        tex_path = os.path.join(LATEX_TEMPLATE_DIR, f"{tid}.tex")
        h_res["has_latex"] = os.path.exists(tex_path)
        if include_latex and h_res["has_latex"]:
            l_res = audit_latex_template(f"{tid}.tex")
            h_res["latex_ok"] = l_res["passed"]
            if not l_res["passed"]:
                h_res["errors"].extend(l_res["errors"])
                h_res["passed"] = False
                h_res["status"] = "FAILED"

        results.append(h_res)

    if args.json:
        print(json.dumps(results, indent=2))
        return

    print_unified_dashboard(results, test_pdf=args.pdf, test_latex=include_latex)

    if args.markdown:
        export_markdown(results)

    failed = sum(1 for r in results if r["status"] == "FAILED")
    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
