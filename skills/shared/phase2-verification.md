# Phase 2: Verification

Shared verification process used by both `subagent-driven-development` and `executing-plans`.

**Entry condition:** All implementation tasks in all page plans are marked `已完成`.

**Prompt templates** (located in `subagent-driven-development/`):
- `spec-reviewer-prompt.md` — Spec compliance reviewer
- `code-quality-reviewer-prompt.md` — Code quality reviewer

**Phase 2 has 7 gates.** Gate 6 and Gate 7 are tail gates controlled by `AskUserQuestion`: they may be skipped only via the tool, and once the user chooses `不跳过` / `执行`, the controller must complete the corresponding skill before Phase 2 can finish.

---

## Gate Progress Tracker（强制门控追踪）

**每个 Gate 开始前**，必须输出 Gate Entry 块；**每个 Gate 完成后**，必须输出 Gate Exit 块。缺少任一块 = 流程违规。

### Gate Entry 块（每个 Gate 开始前必须输出）

```markdown
═══════════════════════════════════════
PHASE 2 GATE PROGRESS: [N/7]
Entering Gate N: <Gate Name>
Previous gates: Gate 1 ✅, Gate 2 ✅, ... Gate N-1 ✅
═══════════════════════════════════════
```

### Gate Exit 块（每个 Gate 完成后必须输出）

```markdown
───────────────────────────────────────
Gate N: <Gate Name> → ✅ Passed / ⏭️ Skipped / ❌ Failed (fixing...)
Next: Gate N+1: <Next Gate Name>
Remaining gates: [N+1, N+2, ..., 7]
───────────────────────────────────────
```

### 反跳跃规则（Anti-Skip Rules）

1. **禁止从 Gate 2 直接跳到 Final Gate Evidence** — Gate 2 的 Exit 块必须显示 `Next: Gate 3`，不得显示 `Next: Final Gate Evidence` 或 `Next: finishing`
2. **禁止从任何 Gate N 跳到 Gate N+2 或更后** — Exit 块的 `Next` 必须是 N+1
3. **编译通过（Gate 1/2）后必须立即输出 Gate 3 Entry 块** — 如果 Gate 2 Exit 后的下一个输出不是 Gate 3 Entry，则流程违规
4. **Final Gate Evidence 只能在 Gate 7 Exit 块之后输出** — 如果 Gate 7 Exit 块不存在，Final Gate Evidence 无效
5. **Gate 3/4 的 `AskUserQuestion` 是 Gate 的一部分**，不是可选前置步骤 — 进入 Gate 3 后，第一个动作必须是 `AskUserQuestion`
6. **Gate 5 不可跳过** — 没有 `AskUserQuestion` 跳过选项，必须执行
7. **Gate 5 完成后必须进入 Gate 6** — Gate 5 Exit 块必须显示 `Next: Gate 6`，不得跳到 Final Gate Evidence 或 finishing
8. **Gate 6 必须使用 `AskUserQuestion`** — 进入 Gate 6 后，第一个动作必须是 `AskUserQuestion` 询问是否跳过；禁止自行决定跳过或默认跳过
9. **Gate 6 完成后必须进入 Gate 7** — Gate 6 Exit 块（无论 ✅ 还是 ⏭️）必须显示 `Next: Gate 7`，不得跳到 Final Gate Evidence
10. **Gate 7 必须使用 `AskUserQuestion`** — 进入 Gate 7 后，第一个动作必须是 `AskUserQuestion` 询问是否跳过；禁止自行决定跳过或默认跳过
11. **Gate 7 是最后一个 Gate** — Gate 7 Exit 块必须显示 `Next: Final Gate Evidence`，这是唯一允许出现 `Next: Final Gate Evidence` 的位置

### 违规自检

如果你发现自己在 Gate 2 完成后准备输出 Final Gate Evidence 或准备调用 `finishing-a-development-branch`，**立即停止**，回退到 Gate 3 Entry 块继续。这是最常见的违规模式。

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
- Controller must pass `SOURCE_ROOT`, `WORKSPACE_ROOT`, and `VERSION_DIR`; reviewer reads design docs + `diff.md` from `VERSION_DIR`, and coding standards from `[WORKSPACE_ROOT]/spec/CODING_STANDARDS.md`
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
- Controller must pass `SOURCE_ROOT`, `WORKSPACE_ROOT`, and `VERSION_DIR`; reviewer reads design docs + `diff.md` from `VERSION_DIR`, and coding standards from `[WORKSPACE_ROOT]/spec/CODING_STANDARDS.md`
- Failure → dispatch fix subagent → re-dispatch quality reviewer → loop until pass
- Controller must not patch source files directly to satisfy this gate; fixes must be delegated to a fix subagent, then re-reviewed
- 跳过时：Final Gate Evidence 中标记为 ⏭️ Skipped

## Gate 5: Coding Standards Feedback

After Gate 4 passes or is skipped, Gate 5 must run first, then continue Gate 6 and Gate 7 in order. Review all issues found during Gates 3-4 (if executed) and check if any relate to coding conventions/patterns that should be captured in the coding standards docs.

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

Would you like to update the coding standards doc (`spec/CODING_STANDARDS.md`，位于 WORKSPACE_ROOT/CWD) with these conventions?
```

4. Wait for user confirmation
5. If approved, update `spec/CODING_STANDARDS.md`（CWD 下）
6. If the user declines, record that decision and continue
7. If no convention-related issues found, explicitly record `no conventions to add` for Gate 5

## Gate 6: PRD Test Cases Generation (可选，是否跳过必须用 AskUserQuestion 决定)

- **必须使用 `AskUserQuestion` 工具**询问用户，禁止仅发普通文本后自行继续
- 问题：`是否跳过 PRD 测试用例生成（superpowers:prd-test-cases）？`
- 选项至少包含：`不跳过，立即执行` / `跳过`
- 用户明确选择 `跳过` / `skip` / `不执行` 才可跳过；否则视为不跳过
- 如果用户选择不跳过，controller 需先判断上下文中是否已有 `diff.md`（检查 `VERSION_DIR` 下是否存在 `diff.md` 或 `diff_<commitid>.md`）：
  - **有 `diff.md`**：直接调用 `Skill(“superpowers:prd-test-cases”)`，将已有的 diff 路径作为输入
  - **没有 `diff.md`**：使用 `AskUserQuestion` 询问用户如何获取 diff 文档，选项包含：
    1. `提供 diff.md 路径` — 用户手动指定已有的 diff 文档路径
    2. `执行 prd-diff-scan 生成` — 调用 `Skill(“superpowers:prd-diff-scan”)` 生成 diff.md，完成后再调用 `prd-test-cases`
    3. `直接从 PRD 生成测试用例` — 跳过 diff.md，直接调用 `Skill(“superpowers:prd-test-cases”)`，由该 skill 自行处理无 diff 的情况
- 手工编写测试用例 JSON 或 Excel 不能替代该 Gate；必须走 `prd-test-cases` skill 的完整流程
- Gate 完成条件：`prd-test-cases` 正常完成，`test-cases.json` 和 `test-cases.xlsx` 已实际生成到磁盘
- 失败 → 解决阻塞后重新执行该 skill；在 Gate 6 完成前不得继续 Gate 7，也不得进入 finishing skill
- 跳过时：Final Gate Evidence 中标记为 ⏭️ Skipped

## Gate 7: API JMeter Artifact Generation (可选，是否跳过必须用 AskUserQuestion 决定)

- **必须使用 `AskUserQuestion` 工具**询问用户，禁止仅发普通文本后自行继续
- 问题：`是否跳过 API 测试产物生成（superpowers:api-jmeter-generator）？`
- 选项至少包含：`不跳过，立即执行` / `跳过`
- 用户明确选择 `跳过` / `skip` / `不执行` 才可跳过；否则视为不跳过
- 如果用户选择不跳过，controller **MUST** 立即调用 `Skill("superpowers:api-jmeter-generator")`
- 手工拼写 `api.json` / `postman.json` / `jmeter-test-plan.jmx` 模板内容，不能替代该 Gate；必须走该 skill 的完整流程
- 按该 skill 的要求继续确认 `backend-detail-design.md`、`baseUrl`、认证方式、输出目录等输入
- 如果当前范围没有后端接口详细设计，推荐用户跳过；但只要用户选择不跳过，就必须先补齐前置输入再执行
- Gate 完成条件：`api.json`、`postman.json`、`jmeter-test-plan.jmx` 三个文件都已实际生成到磁盘
- 失败 → 补齐输入或修复问题后重新执行该 skill；在 Gate 7 完成前不得进入 finishing skill
- 跳过时：Final Gate Evidence 中标记为 ⏭️ Skipped

**Hard rule:** Do not declare Phase 2 complete after Gate 4 or Gate 5. Gates 5-7 must all be processed explicitly, even when the result is `no conventions to add` or `Skipped`.

## Final Gate Evidence Block (Mandatory)

**Pre-check（输出 Final Gate Evidence 前的强制自检）：**

在输出 Final Gate Evidence 表格之前，必须先输出以下自检块。如果任何一项为 ❌，**禁止输出 Final Gate Evidence**，必须回退执行缺失的 Gate。

```markdown
### Final Gate Pre-Check
- [ ] Gate 1 Exit 块已输出？ [✅/❌]
- [ ] Gate 2 Exit 块已输出？ [✅/❌]
- [ ] Gate 3 Entry 块已输出？ [✅/❌] ← 最常遗漏的 Gate
- [ ] Gate 3 Exit 块已输出？ [✅/❌]
- [ ] Gate 4 Entry 块已输出？ [✅/❌]
- [ ] Gate 4 Exit 块已输出？ [✅/❌]
- [ ] Gate 5 Exit 块已输出？ [✅/❌]
- [ ] Gate 6 Exit 块已输出？ [✅/❌]
- [ ] Gate 7 Exit 块已输出？ [✅/❌]
Any ❌ above → STOP, go back and execute the missing gate.
```

After all seven gates are complete (or explicitly skipped where allowed), output this block once:

```
### Final Gate Evidence
| Gate | Status | Evidence |
|------|--------|----------|
| Backend Compilation | ✅/❌ | command: `mvn compile`, exit code: [0/non-zero] |
| Frontend Compilation | ✅/❌ | command: `npm run build`, exit code: [0/non-zero] |
| Spec Review | ✅/❌/⏭️ | subagent dispatched: yes/skipped, verdict: [pass/fail/skipped] |
| Code Quality | ✅/❌/⏭️ | subagent dispatched: yes/skipped, verdict: [pass/fail/skipped] |
| Coding Standards Feedback | ✅/⏭️ | [N conventions proposed / no conventions to add / skipped] |
| PRD Test Cases | ✅/❌/⏭️ | skill invoked: yes/skipped, diff.md: [found/user-provided/generated/skipped], outputs: [test-cases.json + test-cases.xlsx/skipped], verdict: [completed/failed/skipped] |
| API JMeter Generation | ✅/❌/⏭️ | skill invoked: yes/skipped, outputs: [api.json + postman.json + jmx/skipped], verdict: [completed/failed/skipped] |

All gates ✅ → Implementation COMPLETE
Any gate ❌ → Fix and re-verify
```

Do not enter `finishing-a-development-branch`, declare implementation complete, or summarize Phase 2 as passed until:

1. Gates 5-7 have been processed
2. Final Gate Evidence has been emitted
