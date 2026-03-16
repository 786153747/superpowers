#!/usr/bin/env python3
"""
LLM Code Pre-Generation Script

Uses a fast LLM (e.g., Sonnet) to generate initial code drafts,
which are then refined by the implementer subagent (Opus).

Usage:
    python scripts/llm-generate.py --task-file /tmp/task.json --output-dir /path/to/project

Environment variables:
    LLM_API_KEY   - API key for the LLM service (required)
    LLM_BASE_URL  - API base URL (default: http://localhost:10000/v1)
    LLM_MODEL     - Model to use (default: anthropic/claude-sonnet-4.6)
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("Error: openai package not installed. Run: pip install openai", file=sys.stderr)
    sys.exit(1)


SYSTEM_PROMPT = """\
You are a senior Java/Vue developer generating production-quality code for a RuoYi-based project.

Rules:
- Follow the exact patterns shown in the reference code
- Generate complete, compilable files with all necessary imports
- Match naming conventions, package structure, and code style exactly
- Do NOT add extra features, validations, or error handling beyond what the task specifies
- Do NOT add comments explaining what the code does (the code should be self-explanatory)

Output format - wrap each file in XML tags:

<file path="relative/path/to/File.java">
complete file content here
</file>

Generate ALL required files. Each file must be complete and ready to compile.\
"""


def create_client():
    """Create OpenAI-compatible client from environment variables."""
    api_key = os.environ.get("LLM_API_KEY")
    base_url = os.environ.get("LLM_BASE_URL", "http://localhost:10000/v1")

    if not api_key:
        print("Error: LLM_API_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)

    return OpenAI(api_key=api_key, base_url=base_url)


def build_user_prompt(task_data):
    """Build the user prompt from task data."""
    parts = []

    # Task description
    parts.append("## Task\n")
    parts.append(task_data["task_description"])

    # Design document
    if task_data.get("design_doc"):
        parts.append("\n\n## Design Document\n")
        parts.append(task_data["design_doc"])

    # Reference code files
    if task_data.get("reference_files"):
        parts.append("\n\n## Reference Code (follow these patterns exactly)\n")
        for path, content in task_data["reference_files"].items():
            parts.append(f"\n### {path}\n```\n{content}\n```")

    # Target files hint
    if task_data.get("target_files"):
        parts.append("\n\n## Files to Generate\n")
        for f in task_data["target_files"]:
            parts.append(f"- `{f}`")

    parts.append("\n\nGenerate all files now.")
    return "\n".join(parts)


def parse_response(response_text):
    """Parse LLM response to extract file contents from <file> tags."""
    files = {}

    # Match <file path="...">content</file>
    pattern = r'<file\s+path="([^"]+)">\n?(.*?)</file>'
    matches = re.findall(pattern, response_text, re.DOTALL)

    for filepath, content in matches:
        filepath = filepath.strip()
        # Strip leading/trailing whitespace but preserve internal structure
        content = content.strip()
        files[filepath] = content

    # Fallback: try ```filepath: format if no <file> tags found
    if not files:
        pattern = r'```(?:\w+)?\s*\n?filepath:\s*(.+?)\n(.*?)```'
        matches = re.findall(pattern, response_text, re.DOTALL)
        for filepath, content in matches:
            filepath = filepath.strip()
            content = content.strip()
            files[filepath] = content

    return files


def generate_code(client, model, task_data):
    """Call the LLM API to generate code."""
    user_prompt = build_user_prompt(task_data)

    start = time.time()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=16000,
    )
    elapsed = time.time() - start

    content = response.choices[0].message.content
    usage = response.usage

    return {
        "content": content,
        "elapsed_seconds": round(elapsed, 1),
        "tokens": {
            "prompt": usage.prompt_tokens if usage else None,
            "completion": usage.completion_tokens if usage else None,
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Generate code using LLM")
    parser.add_argument(
        "--task-file",
        required=True,
        help="JSON file with task description and context",
    )
    parser.add_argument(
        "--output-dir", required=True, help="Base directory to write generated files"
    )
    parser.add_argument("--model", default=None, help="Model override")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print parsed files without writing to disk",
    )
    args = parser.parse_args()

    # Read task file
    with open(args.task_file, "r", encoding="utf-8") as f:
        task_data = json.load(f)

    if not task_data.get("task_description"):
        print("Error: task_description is required in task file", file=sys.stderr)
        sys.exit(1)

    # Create client and generate
    client = create_client()
    model = args.model or os.environ.get("LLM_MODEL", "anthropic/claude-sonnet-4.6")

    print(f"[llm-generate] Model: {model}", file=sys.stderr)
    print(f"[llm-generate] Generating code...", file=sys.stderr)

    try:
        result = generate_code(client, model, task_data)
    except Exception as e:
        error_type = type(e).__name__
        print(f"[llm-generate] ERROR: {error_type}: {e}", file=sys.stderr)
        print(
            json.dumps(
                {"success": False, "error": f"{error_type}: {e}"},
                indent=2,
            )
        )
        sys.exit(1)

    response_text = result["content"]

    print(
        f"[llm-generate] Done in {result['elapsed_seconds']}s "
        f"(prompt: {result['tokens']['prompt']}, "
        f"completion: {result['tokens']['completion']})",
        file=sys.stderr,
    )

    # Parse response
    files = parse_response(response_text)

    if not files:
        print(
            "[llm-generate] WARNING: No files parsed from response.", file=sys.stderr
        )
        # Save raw response for debugging
        raw_path = os.path.join(args.output_dir, "_llm_raw_response.md")
        os.makedirs(os.path.dirname(raw_path), exist_ok=True)
        with open(raw_path, "w", encoding="utf-8") as f:
            f.write(response_text)
        print(f"[llm-generate] Raw response saved to: {raw_path}", file=sys.stderr)

        # Output failure result
        print(
            json.dumps(
                {
                    "success": False,
                    "error": "No files parsed from response",
                    "raw_response_path": raw_path,
                    "elapsed_seconds": result["elapsed_seconds"],
                    "tokens": result["tokens"],
                },
                indent=2,
            )
        )
        sys.exit(1)

    # Write or preview files
    output = {
        "success": True,
        "model": model,
        "files_generated": [],
        "elapsed_seconds": result["elapsed_seconds"],
        "tokens": result["tokens"],
    }

    for filepath, content in files.items():
        full_path = os.path.join(args.output_dir, filepath)

        if args.dry_run:
            preview = content[:300] + ("..." if len(content) > 300 else "")
            print(f"\n--- {filepath} ({len(content)} chars) ---", file=sys.stderr)
            print(preview, file=sys.stderr)
        else:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"[llm-generate] Written: {filepath}", file=sys.stderr)

        output["files_generated"].append(filepath)

    # Output result as JSON to stdout
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
