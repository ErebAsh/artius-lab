#!/usr/bin/env python3
"""
Artius Lab - Unified Build & Test Runner
========================================
Runs full CI/CD quality assurance pipeline:
  1. Ruff Linting          (ruff check .)
  2. Ruff Formatting       (ruff format --check .)
  3. Python Compile        (compileall backend tests test.py)
  4. Template & Unit Tests (unittest discover -s tests)
  5. Next.js Frontend      (npm run build in frontend/ if node_modules present)

Usage:
  python build_test.py                 # Run all checks (backend + templates + frontend if ready)
  python build_test.py --fix           # Auto-fix lint and formatting before testing
  python build_test.py --skip-frontend # Run only Python backend & template tests
  python build_test.py --frontend-only # Run only Next.js frontend build & lint
"""

import argparse
import os
import shutil
import subprocess
import sys
import time

# Windows console UTF-8 safety
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")


class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def run_step(
    name: str, cmd: list[str], cwd: str = PROJECT_ROOT, env: dict | None = None
) -> tuple[bool, str, float]:
    """Runs a subprocess command and measures execution duration."""
    t0 = time.time()
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            env=env or os.environ.copy(),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        duration = time.time() - t0
        passed = proc.returncode == 0
        return passed, proc.stdout.strip(), duration
    except FileNotFoundError as e:
        duration = time.time() - t0
        return False, f"Command not found: {cmd[0]} ({e})", duration
    except Exception as e:
        duration = time.time() - t0
        return False, str(e), duration


def main(argv: list[str] | None = None):
    parser = argparse.ArgumentParser(description="Artius Lab Master Build & Test Runner")
    parser.add_argument(
        "--fix", action="store_true", help="Auto-fix Ruff lint and format errors first"
    )
    parser.add_argument("--skip-frontend", action="store_true", help="Skip frontend build test")
    parser.add_argument("--frontend-only", action="store_true", help="Only run frontend build test")
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Display full step logs even if passed"
    )
    args = parser.parse_args(argv)

    print("\n" + "=" * 80)
    print(f"{Colors.BOLD}  ARTIUS LAB — MASTER BUILD & TEST RUNNER{Colors.RESET}")
    print("=" * 80)

    # Optional auto-fix
    if args.fix:
        print(f"\n{Colors.CYAN}🔧 Applying automatic Ruff fixes & formatting...{Colors.RESET}")
        subprocess.run([sys.executable, "-m", "ruff", "check", ".", "--fix"], cwd=PROJECT_ROOT)
        subprocess.run([sys.executable, "-m", "ruff", "format", "."], cwd=PROJECT_ROOT)

    steps = []

    if not args.frontend_only:
        # Step 1: Ruff Linting
        steps.append(
            {
                "name": "Ruff Linting",
                "cmd": [sys.executable, "-m", "ruff", "check", "."],
                "cwd": PROJECT_ROOT,
                "critical": True,
            }
        )

        # Step 2: Ruff Formatting
        steps.append(
            {
                "name": "Ruff Format Check",
                "cmd": [sys.executable, "-m", "ruff", "format", "--check", "."],
                "cwd": PROJECT_ROOT,
                "critical": True,
            }
        )

        # Step 3: Python Bytecode Compilation
        steps.append(
            {
                "name": "Python Compilation (Syntax Check)",
                "cmd": [sys.executable, "-m", "compileall", "-q", "backend", "tests", "test.py"],
                "cwd": PROJECT_ROOT,
                "critical": True,
            }
        )

        # Step 4: Unit & Template Tests
        steps.append(
            {
                "name": "Resume Template Tests (HTML & LaTeX)",
                "cmd": [sys.executable, "-m", "unittest", "discover", "-s", "tests"],
                "cwd": PROJECT_ROOT,
                "critical": True,
            }
        )

    # Frontend Check
    if not args.skip_frontend:
        node_modules = os.path.join(FRONTEND_DIR, "node_modules")
        npm_bin = shutil.which("npm") or shutil.which("npm.cmd")

        if os.path.exists(node_modules) and npm_bin:
            steps.append(
                {
                    "name": "Frontend Next.js Build",
                    "cmd": [npm_bin, "run", "build"],
                    "cwd": FRONTEND_DIR,
                    "critical": True,
                }
            )
        elif not os.path.exists(node_modules) and args.frontend_only:
            print(
                f"{Colors.RED}❌ frontend/node_modules not found. Run 'npm install' in frontend/ first.{Colors.RESET}"
            )
            sys.exit(1)
        else:
            print(
                f"{Colors.YELLOW}[INFO] Skipping Next.js build (frontend/node_modules not installed locally).{Colors.RESET}"
            )

    total_t0 = time.time()
    results = []
    overall_passed = True

    print(f"\n{Colors.BOLD}{'STEP':<40} {'DURATION':<12} {'RESULT':<12}{Colors.RESET}")
    print("-" * 80)

    for step in steps:
        step_name = step["name"]
        print(f"⏳ Running: {step_name}...", end="\r", flush=True)

        passed, output, duration = run_step(step_name, step["cmd"], cwd=step["cwd"])
        results.append(
            {
                "name": step_name,
                "passed": passed,
                "duration": duration,
                "output": output,
                "critical": step.get("critical", True),
            }
        )

        if passed:
            res_str = f"{Colors.GREEN}PASSED{Colors.RESET}"
        else:
            res_str = f"{Colors.RED}FAILED{Colors.RESET}"
            if step.get("critical", True):
                overall_passed = False

        dur_str = f"{duration:.2f}s"
        print(f"  {step_name:<38} {dur_str:<12} {res_str}")

        if not passed or args.verbose:
            if output:
                indent_out = "\n".join("    " + line for line in output.splitlines()[:25])
                print(f"{Colors.DIM}{indent_out}{Colors.RESET}")
                if len(output.splitlines()) > 25:
                    print(f"    ... [truncated {len(output.splitlines()) - 25} lines]")

    total_duration = time.time() - total_t0
    print("-" * 80)

    if overall_passed:
        print(
            f"{Colors.GREEN}{Colors.BOLD}🎉 ALL BUILD TESTS PASSED! ({total_duration:.2f}s){Colors.RESET}\n"
        )
        sys.exit(0)
    else:
        print(
            f"{Colors.RED}{Colors.BOLD}❌ BUILD TEST FAILED! ({total_duration:.2f}s){Colors.RESET}"
        )
        print("  Run with --verbose for full output or --fix to auto-resolve format/lint issues.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
