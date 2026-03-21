# Phase 2: Verification

Shared verification process used by both `subagent-driven-development` and `executing-plans`.

**Entry condition:** All implementation tasks in all page plans are marked `已完成`.

**Prompt templates** (located in `subagent-driven-development/`):
- `spec-reviewer-prompt.md` — Spec compliance reviewer
- `code-quality-reviewer-prompt.md` — Code quality reviewer

---

## Gate 1: Backend Compilation

- Controller runs `mvn compile` in `SOURCE_ROOT` directory (no subagent)
- MUST see actual build output with exit 0
- Failure → dispatch fix subagent → re-compile → loop until pass

## Gate 2: Frontend Compilation

- Controller runs `npm run build` in `SOURCE_ROOT` frontend directory
- MUST see actual build output with exit 0
- Failure → dispatch fix subagent → re-build → loop until pass

## Gate 3: Spec Compliance (可选，默认执行)

- 编译通过后，**询问用户**：「是否执行 Spec Compliance 审查？（默认执行，输入"跳过"则跳过）」
- 用户明确说"跳过"/"不执行"/"skip" 才跳过，其他任何回复（包括无回复、回车、"好"、"执行"等）均视为执行
- 执行时：dispatch spec-reviewer subagent via Agent tool
- Reviewer covers the **entire implementation** (all tasks, all pages), not just one task
- Controller reviewing code itself does NOT satisfy this gate
- Use `subagent-driven-development/spec-reviewer-prompt.md` template
- Failure → dispatch fix subagent → re-dispatch spec reviewer → loop until pass
- Controller must not patch source files directly to satisfy this gate; fixes must be delegated to a fix subagent, then re-reviewed
- 跳过时：Final Gate Evidence 中标记为 ⏭️ Skipped

## Gate 4: Code Quality (可选，默认执行)

- Gate 3 完成或跳过后，**询问用户**：「是否执行 Code Quality 审查？（默认执行，输入"跳过"则跳过）」
- 用户明确说"跳过"/"不执行"/"skip" 才跳过，其他任何回复均视为执行
- 执行时：dispatch code-quality-reviewer subagent via Agent tool
- Reviewer covers the **entire implementation**
- Controller reviewing code itself does NOT satisfy this gate
- Use `subagent-driven-development/code-quality-reviewer-prompt.md` template
- Failure → dispatch fix subagent → re-dispatch quality reviewer → loop until pass
- Controller must not patch source files directly to satisfy this gate; fixes must be delegated to a fix subagent, then re-reviewed
- 跳过时：Final Gate Evidence 中标记为 ⏭️ Skipped

## Gate 5: Coding Standards Feedback

After Gate 4 passes or is skipped, Gate 5 is the **required terminal gate**. Review all issues found during Gates 3-4 (if executed) and check if any relate to coding conventions/patterns that should be captured in the coding standards docs.

**Controller does this directly (no subagent):**

1. Collect all issues found by spec reviewer (Gate 3) and code quality reviewer (Gate 4), including fixed ones
2. Filter for issues that represent **recurring patterns or conventions** (not one-off bugs), for example:
   - Naming inconsistencies (e.g., method should be `selectXxxList` not `getXxxList`)
   - Missing standard annotations or patterns
   - Code structure deviations from project conventions
   - Frontend/backend API calling pattern issues
3. If such issues exist, present them to the user:

```
### Coding Standards Feedback

The following issues from code review may indicate missing or unclear coding standards:

1. [Issue description] — suggested addition to [backend/frontend] coding standards
2. ...

Would you like to update the coding standards doc (`spec/CODING_STANDARDS.md`，位于 DOC_ROOT/CWD) with these conventions?
```

4. Wait for user confirmation
5. If approved, update `spec/CODING_STANDARDS.md`（CWD 下）
6. If the user declines, record that decision and continue
7. If no convention-related issues found, explicitly record `no conventions to add` for Gate 5

**Hard rule:** Do not declare Phase 2 complete after Gate 4. Gate 5 must be processed explicitly, even when the result is a no-op.

## Final Gate Evidence Block (Mandatory)

After all five gates are complete (or explicitly skipped where allowed), output this block once:

```
### Final Gate Evidence
| Gate | Status | Evidence |
|------|--------|----------|
| Backend Compilation | ✅/❌ | command: `mvn compile`, exit code: [0/non-zero] |
| Frontend Compilation | ✅/❌ | command: `npm run build`, exit code: [0/non-zero] |
| Spec Review | ✅/❌/⏭️ | subagent dispatched: yes/skipped, verdict: [pass/fail/skipped] |
| Code Quality | ✅/❌/⏭️ | subagent dispatched: yes/skipped, verdict: [pass/fail/skipped] |
| Coding Standards Feedback | ✅/⏭️ | [N conventions proposed / no conventions to add / skipped] |

All gates ✅ → Implementation COMPLETE
Any gate ❌ → Fix and re-verify
```

Do not enter `finishing-a-development-branch`, declare implementation complete, or summarize Phase 2 as passed until:

1. Gate 5 has been processed
2. Final Gate Evidence has been emitted
