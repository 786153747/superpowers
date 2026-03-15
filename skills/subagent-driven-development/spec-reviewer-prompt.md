# Spec Compliance Reviewer Prompt Template

Use this template when dispatching a spec compliance reviewer subagent.

**Purpose:** Verify implementer built what was requested (nothing more, nothing less), cross-layer consistency is correct, UI behavior matches design, error paths are covered, permissions are aligned end-to-end, and no cross-module side effects are introduced.

```
Agent tool:
  model: "sonnet"        # REQUIRED: pass as Agent tool `model` parameter
  subagent_type: "general-purpose"
  description: "Review spec compliance for Task N"
  prompt: |
    You are reviewing whether an implementation matches its specification.

    ## What Was Requested

    [FULL TEXT of task requirements]

    ## Detail Design Documents

    [Provide paths to frontend-detail-design.md, backend-detail-design.md
     for the relevant page]

    ## What Implementer Claims They Built

    [From implementer's report]

    ## CRITICAL: Do Not Trust the Report

    The implementer finished suspiciously quickly. Their report may be incomplete,
    inaccurate, or optimistic. You MUST verify everything independently.

    **DO NOT:**
    - Take their word for what they implemented
    - Trust their claims about completeness
    - Accept their interpretation of requirements

    **DO:**
    - Read the actual code they wrote
    - Read the detail design documents
    - Compare actual implementation to requirements line by line
    - Check for missing pieces they claimed to implement
    - Look for extra features they didn't mention

    ## Your Job

    Read the implementation code and verify all dimensions below.

    ### Dimension 1: Missing / Extra / Misunderstood Requirements

    **Missing requirements:**
    - Did they implement everything that was requested?
    - Are there requirements they skipped or missed?
    - Did they claim something works but didn't actually implement it?

    **Extra/unneeded work:**
    - Did they build things that weren't requested?
    - Did they over-engineer or add unnecessary features?
    - Did they add "nice to haves" that weren't in spec?

    **Misunderstandings:**
    - Did they interpret requirements differently than intended?
    - Did they solve the wrong problem?
    - Did they implement the right feature but wrong way?

    ### Dimension 2: Business Logic vs Detail Design

    Read the detail design documents and compare against actual implementation:

    - Does the business logic in code match what the detail design describes?
    - Are validation rules implemented as designed (field constraints, required/optional, value ranges)?
    - Are status flows / state transitions implemented as designed?
    - Are permission / authority checks implemented as designed?
    - Are calculation formulas / business rules implemented as designed?
    - Any business logic that was improvised (not in design) or contradicts the design?

    ### Dimension 3: Backend Parameters vs Frontend Usage

    Cross-check backend API parameters against frontend code that calls them:

    - Do request parameter names in backend match what frontend sends?
    - Do response field names in backend match what frontend reads/displays?
    - Are parameter types consistent (e.g., backend expects Long but frontend sends String)?
    - Are required/optional parameters consistent between frontend and backend?
    - Are enum values / dict codes consistent between frontend and backend?
    - Dict data full-chain consistency: SQL (`sys_dict_data` entries) → backend constants/enums → frontend dict rendering (`<el-dict-tag>` / `<el-select>` with dict options) — all three layers must use the same `dict_type` and value set
    - Any parameter that backend defines but frontend never uses, or vice versa?

    ### Dimension 4: SQL Fields vs Backend Entity

    Cross-check SQL schema files (DDL / mapper XML) against backend entity/DTO classes:

    - Do column names in SQL match field mappings in entity class?
    - Are column types consistent with Java field types (e.g., varchar→String, bigint→Long, datetime→Date)?
    - Are NOT NULL constraints in SQL reflected as @NotNull or validation in backend?
    - Are default values in SQL consistent with backend initialization logic?
    - Any column in SQL that has no corresponding entity field, or vice versa?
    - Do MyBatis mapper XML column lists match the actual SQL table definition?

    ### Dimension 5: Frontend UI Behavior vs Detail Design

    Read the frontend detail design document and compare against actual frontend code:

    - Does the form layout match the design (field order, grid/column arrangement, grouping)?
    - Are required-field markers (`*`) and validation rules consistent with design (required/optional, length limits, format regex)?
    - Are validation error messages displayed as designed?
    - Do conditional show/hide rules work as designed (e.g., "hide button X when status = Y")?
    - Do table columns match the design (column order, header text, formatting — date/currency/dict-tag rendering)?
    - Are empty states, loading states, and disabled states handled as designed?

    ### Dimension 6: Error Paths and Exception Handling

    Verify error/exception scenarios are handled as designed, not just the happy path:

    - Does the frontend show proper error messages when API returns errors?
    - Does the backend return error codes/messages as specified in the design?
    - Are boundary conditions handled (empty list, max-length input, concurrent operations)?
    - Are delete/update operations on referenced data properly guarded (e.g., foreign key constraints, "in use" checks)?
    - Are there edge cases the design explicitly mentions that the implementation missed?

    ### Dimension 7: Route / Menu / Permission Full-Chain Consistency

    For RuoYi projects, permissions span three layers that must be aligned:

    - Menu SQL `perms` value → backend `@PreAuthorize("@ss.hasPermi('xxx')")` annotation → frontend `v-hasPermi="['xxx']"` directive — all three must use the exact same permission string
    - Frontend route path → menu SQL `path` / `component` fields — must match
    - Every button-level permission in the frontend must have a corresponding menu SQL record (type = button)
    - New menus must have correct `parent_id`, `order_num`, `menu_type` in the SQL insert

    ### Dimension 8: Cross-Module Side Effects

    Check whether the implementation affects existing functionality outside the current task scope:

    - If shared components/utils were modified, are other callers still working correctly?
    - Do new routes/menus conflict with existing ones (duplicate paths, overlapping permission strings)?
    - Do database schema changes (column add/rename/drop) break other modules' queries or mapper XML?
    - Are shared resources (dict types, config keys, i18n keys) introduced without conflicting with existing ones?

    **Verify by reading code, not by trusting report.**

    Report:
    - ✅ Spec compliant (if all 8 dimensions pass after code inspection)
    - ❌ Issues found: [list specifically per dimension, with file:line references]
      - D1 (Requirements): ...
      - D2 (Business Logic): ...
      - D3 (Backend↔Frontend): ...
      - D4 (SQL↔Backend): ...
      - D5 (Frontend UI): ...
      - D6 (Error Paths): ...
      - D7 (Permission Chain): ...
      - D8 (Side Effects): ...
```
