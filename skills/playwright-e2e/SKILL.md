---
name: playwright-e2e
description: Use when running, triaging, or adding Playwright browser end-to-end tests, especially for UI regressions, acceptance flows, and artifact-based debugging
---

# Playwright E2E

## Overview

Browser end-to-end validation needs repeatability, scope control, and evidence.

**Core principle:** Prefer the project's existing Playwright setup and the smallest useful reproduction before expanding scope.

If you report a browser issue without exact commands, failing tests, or artifacts, you have not finished the job.

## When to Use

Use this skill when:
- The user asks to run E2E tests
- The user asks to add Playwright E2E to a frontend project
- A browser bug needs reproduction
- A UI acceptance flow needs validation
- A Playwright suite is failing and needs triage
- Screenshots, traces, videos, or HTML reports would materially help

Do not use this skill for:
- Pure API or backend-only validation
- Unit-test-only changes
- Browser automation with no intention to keep or reuse the result

## The Rules

1. **Discover before changing**
   - Check for `playwright.config.*`, package scripts, existing `tests/e2e/`, auth fixtures, and report directories.
   - Prefer reusing existing scripts and config.

2. **Choose the narrowest scope first**
   - Prefer a single spec, project, or grep filter before a full-suite run.
   - Escalate scope only when the narrower run is insufficient.

3. **Separate setup from product behavior**
   - Missing dependencies, browsers, ports, or servers are setup issues.
   - Assertion mismatches, broken selectors caused by UI change, and incorrect page behavior are product or test issues.
   - Do not blur these categories in your report.

4. **Evidence is mandatory**
   - Record the exact command you ran.
   - Record pass/fail and exit code.
   - Surface artifact paths for traces, screenshots, videos, and HTML reports.

5. **Do not scaffold unless asked**
   - If the user asked to run or triage tests, do not silently add Playwright infrastructure.
   - If the user explicitly asked to add Playwright, scaffold the minimum viable baseline.

## Default Strategy

### A. If Playwright already exists

1. Find the preferred script:
   - `npm run e2e`
   - `pnpm e2e`
   - `yarn e2e`
   - fallback: `npx playwright test`

2. Run the smallest command that answers the question.

3. If it fails:
   - identify the first meaningful failure
   - inspect screenshots, traces, and videos
   - classify the failure type
   - report likely next action

4. If it passes:
   - say what was covered
   - say what was not covered
   - point to the report location if one exists

### B. If the user explicitly wants Playwright added

Default to a frontend-local JavaScript/TypeScript Playwright setup when:
- the project already has a Node-based frontend
- `package.json` already exists
- the target is browser UI behavior

The minimum viable baseline should usually include:
- `playwright.config.ts`
- `tests/e2e/`
- one auth or setup flow when login is required
- one or more smoke tests for stable user journeys
- package scripts such as `e2e`, `e2e:headed`, `e2e:report`
- report output under `tests/e2e/reports/`

Prefer a mock-backed or local dev server flow first if it produces a more stable baseline.

Do not default to a separate Python Playwright harness unless:
- the team already standardizes on Python
- the browser tests need heavy data orchestration best handled in Python
- or the user explicitly asks for the Python path

## Failure Classification

Use these buckets:

- **Product regression**
  - The application behavior is wrong under a valid test.

- **Test issue**
  - The selector, assertion, fixture, or expectation is stale or incorrect.

- **Flaky test**
  - Timing, async rendering, unstable network, or race conditions produce intermittent failures.

- **Environment issue**
  - Missing dependency, browser binary, wrong port, startup failure, or permission problem.

When uncertain, say what is observed and what is inferred.

## Output Format

Use this structure:

```md
Status: PASS | FAIL | BLOCKED

Command:
- `...`

Scope:
- What tests or flows were exercised

Evidence:
- exit code
- failing test name(s)
- artifact paths

Assessment:
- product regression | test issue | flaky test | environment issue
- note any inference explicitly

Next action:
- rerun narrower/wider
- fix app
- fix test
- repair environment
```

## Agent-Aware Note

If your platform supports named agents from `agents/`, you may dispatch `superpowers:e2e-runner` after inputs are clear and the task is well-scoped.

If your platform is skill-only, follow this skill directly.
