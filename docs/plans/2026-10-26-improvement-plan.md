# Quimera improvement plan

**Goal:** Make Quimera a dependable, portable development standard whose installation, verification and workflow claims are backed by reproducible evidence.
**Depth:** Risky implementation; this deliverable is analysis and planning only.
**Spec:** Repository assessment and definitive improvement plan requested in conversation on 2026-10-26.
**Baseline:** `0.3.0`, commit `13106c4`; 71 repository files and 15 skills before this report.
**Branch:** `docs/improvement-plan`.
**Status:** Proposed implementation backlog. No implementation tasks below are completed or approved merely by inclusion.
**Approach:** Repair trust and correctness boundaries first, consolidate the process second, and demonstrate differentiation through measured adoption last. Preserve Markdown portability and a small, dependency-free runtime.

## Assessment

Quimera has a coherent method and useful working conventions, but its executable guarantees are less mature than its documentation. The next release should prioritize safe file management, truthful verification and valid skill loading. Adding more skills before those foundations would increase the surface that can drift.

The strongest product direction is **a locally controlled development standard that preserves decisions across tools and produces inspectable evidence of completion**. This is a positioning recommendation, not a measured market advantage. Planning, review, memory and multi-tool support alone are already present in upstream projects.

### Strengths to preserve

- Tool-neutral actions and separate adapters; minimal skill metadata.
- Four task depths and risk escalation instead of one mandatory long workflow.
- Project-owned memory, append-only decisions and selective standards loading.
- Review findings require locations, triggers, consequences and verification.
- Installer hashes distinguish untouched files from local edits; tested edits were preserved and new upstream content was offered separately.
- Specialist routing and implementation ownership rules make review and parallel work more explicit.
- Economic/full profiles recognize resource constraints, although their savings have not been measured.
- All 15 skills end with Provenance, and the repository maintains upstream attribution in `NOTICE.md`.
- No runtime dependency list, package lifecycle scripts, automatic server setup or background service is present in `package.json`.

### Scope and limits

Reviewed the standard, README pair, installer, all executable scripts, adapters, skill workflows and relevant templates. Ran 15 targeted behavioral scenarios in disposable Git repositories, parsed the frontmatter of all 15 skills, and syntax-checked the five JavaScript entry points and shell hook. Compared upstream positioning and selected adapter claims against primary documentation.

This is not an exhaustive security assessment, a live test of every agent application, a Windows/macOS certification, or a benchmark of model quality. No paid model evaluations were run. Security reproductions used only disposable sentinel files and harmless marker writes under `/tmp`; they do not establish exploitation of any real user installation.

Observed test environment: Linux, Node `v24.18.0`, Git `2.56.0`. Two subprocess checks initially encountered sandbox `EPERM`; they were repeated outside that sandbox against the same disposable repositories. The corrected observations are recorded below. Those environment errors are not counted as product defects.

## Findings and priority

Priority means implementation order: **P0** blocks the next reliability release; **P1** is required for a dependable supported release; **P2** improves adoption and differentiation. A P0 item is not automatically a remotely exploitable critical vulnerability.

| ID | Priority | Evidence and consequence | Recommended outcome |
|---|---|---|---|
| F01 | P0 | `skills/parallel-agents/SKILL.md:3`, `skills/study-round/SKILL.md:3`, `skills/vision-review/SKILL.md:3`: unquoted `: ` inside descriptions causes YAML parser errors. Three of 15 skills fail parsing. | Quote descriptions and add actual YAML/schema validation; verify loading in supported tools. |
| F02 | P0 | `bin/quimera.mjs:175`: update trusts manifest keys as filesystem paths. A crafted `../disposable-sentinel` entry with its matching hash caused deletion outside the repository. `:167` also writes through symlinked destination directories. | Validate the entire manifest and every operation before mutation; constrain logical paths and resolved parents, including offers and deletions. |
| F03 | P0 | `bin/quimera.mjs:136` preserves pre-existing scripts, then `:216` executes the installed hook helper. A harmless pre-existing helper ran during `init --mode=discreet`. `doctor` similarly executes its installed preflight at `:248`. | Invoke trusted bundled helpers or direct internal functions; never execute a skipped or locally replaced project helper implicitly. |
| F04 | P0 | `scripts/verify.mjs:121` and final result aggregation: `push --all` returns `Result: ok` and exit 0 when all checks are skipped. A deletion older than the last commit also skipped an existing deliberately failing test script. | Distinguish passed, failed, not applicable and unverified. Cover branch deletions and require evidence for a push readiness claim. |
| F05 | P1 | `bin/quimera.mjs:216`: child status/error is ignored. A conflicting existing hook correctly rejected installation, but `init` still returned 0 and announced success. | Propagate failures and report partial installation explicitly. |
| F06 | P1 | `bin/quimera.mjs:243`: doctor checks only manifest-listed existence and preflight. It returned ready with a pending `.quimera-new`, divergent mirrors and a clean Git tree. | Report missing, modified, conflicted, skipped and orphaned files separately, plus runtime hook/config state. |
| F07 | P1 | `scripts/local-only.mjs:10`: broad directory exclusions hide unrelated untracked files. `docs/standards/business.md` was hidden even though Quimera did not create it. | Track ownership and exclude exact managed files and registered memory outputs; retain warnings for already tracked files. |
| F08 | P1 | `bin/quimera.mjs:31`, `:215`, `:262`: invalid mode and unknown command return success. Tools lack the same missing-value validation as models. | Strict per-command argument validation, meaningful error codes and no writes for invalid input. |
| F09 | P1 | Manifest at `bin/quimera.mjs:199` stores tools/models but not mode/local-only or conflict status. Updates ignore tool-selection changes and do not refresh the installed Git hook. | Separate desired configuration, installed state and operational integration state; make changes explicit and migration-safe. |
| F10 | P1 | No tracked tests, CI workflow or package test/check scripts were found. Existing `verify` cannot meaningfully validate the kit itself. | Add deterministic contract tests, content checks and manually invoked CI/release verification. |
| F11 | P1 | `QUIMERA.md:130` says to stop and involve the user after a third failure; `skills/parallel-agents/SKILL.md:60` allows parking findings and continuing. The inline fallback also differs from `code-review` on independent review. | One authoritative failure/review policy, with explicit terminal states and no bypass for unresolved blocking findings. |
| F12 | P1 | `project-kickoff` supports alternate memory paths and an immutable existing `AGENTS.md`; subsequent workflows largely hard-code `docs/STATE.md`, `docs/MAP.md` and related paths. Local-only setup can lack a persistent instruction entry point on existing projects. | Resolve memory locations consistently and document an explicit per-tool bootstrap for existing immutable instruction files. |
| F13 | P1 | `scripts/git-preflight.mjs:58` fetches by default, while kickoff calls it read-only. Its parser accepts malformed identity/mode fields and reports ready. | Offline default, explicit authorized fetch, validated profile and truthful diagnostics. |
| F14 | P1 | `bin/quimera.mjs:72` copies skills but omits root `NOTICE.md` and `LICENSE` from the installed kit; README installs from unpinned GitHub HEAD. | Ship attribution with copied content, provide immutable release instructions and verify packaged/installed artifacts. |
| F15 | P1 | `writing-skills` requires baseline and pressure evaluation, but no retained scenario/evaluation corpus exists. Markdown changes are broadly treated as documentation-only. | Evaluate behavioral Markdown as product logic; keep ordinary prose changes cheap. |
| F16 | P2 | `adapters/models.md` relies largely on secondary reporting and some future model substitutions; `adapters/other-tools.md` says Gemini CLI has no skills folder, contradicted by its official docs. | Capability/version matrix with primary sources, dates, tested/degraded labels and explicit fallback. |
| F17 | P2 | `scripts/verify.mjs` requires root `package.json`, favors root ESLint/Jest/Vitest and identifies only pnpm workspaces as monorepos. Documentation presents a broader method. | Explicit support boundary, user-supplied command arrays and gradual stack support backed by fixtures. |
| F18 | P2 | Several defaults encode one person's preferences: Portuguese, motion-heavy design, one-question-at-a-time coaching and repeated approvals. No measured onboarding/cost baselines exist. | Preserve project overrides; provide concise and coaching interaction profiles, onboarding examples and measurable pilot outcomes. |

### Security preconditions

F02 requires a crafted or corrupted local manifest, or a symlinked installation path, followed by the user invoking install/update. The manifest-driven deletion additionally needs a matching content hash. F03 requires a pre-existing or modified helper in the target repository and an invocation that runs it. These are local repository trust-boundary failures; no unauthenticated remote entry point was demonstrated.

The fix should cover normal corruption and accidental symlinks as well as hostile repositories. Do not describe prompts, hashes or the discreet hook as security isolation. Do not promise that removing attribution makes use of AI undetectable or overrides an organization's policies.

## Reproduction evidence

| Scenario | Observed result |
|---|---|
| Initialize all six accepted tool values | Exit 0; 169 files recorded. This tests file installation, not native discovery in six tools. |
| Edit an installed skill, update without upstream changes | Edit preserved; no overwrite. |
| Change the same skill in the temporary source kit and update | Local edit preserved; `.quimera-new` created; untouched mirrors updated. |
| Doctor after committing the fixture while a conflict offer remains | Exit 0 and ready; conflict offer still exists. |
| Initialize discreet mode with a different existing hook | Helper exits 1; parent installer exits 0. Rechecked outside sandbox. |
| Initialize with `--mode=banana` | Accepted, exit 0. |
| Invoke unknown command `updat` | Help printed, exit 0. |
| Verify a project with no check scripts using `push --all` | All four steps skipped; exit 0 and `Result: ok`. |
| Delete a JS source, commit, then commit a README edit | Changed verification skipped an available test command that would exit 19. |
| Apply local-only and create unrelated `docs/standards/business.md` | `git check-ignore -v` identifies Quimera's directory exclusion. Rechecked outside sandbox. |
| Preflight with identity `TBD` and mode `banana` | Exit 0 and ready. |
| Insert a relative outside-root sentinel into manifest with its hash | `update` deleted the disposable outside-root sentinel. |
| Symlink `.agents` to a sibling temporary directory | `init` wrote skills into that sibling directory. |
| Pre-create a harmless hook installation helper | `init --mode=discreet` preserved and executed it. |
| Dry-run with discreet/local-only options | No manifest or hook created. |

Frontmatter validation: PyYAML accepted 12 skills and rejected the three in F01. All 15 have only the intended metadata keys by textual inspection and end with Provenance; those conventions alone do not prove valid YAML. JavaScript and shell syntax checks passed.

For repeatable regression tests, construct fresh repositories with local fixture identity and isolated Git configuration; never use a developer's real Git hooks, remote or home configuration. Recreate the exact state transitions above rather than asserting implementation details. The temporary exploratory files are not a permanent test suite.

## Comparison and differentiation

The following is a bounded comparison of documented capabilities, not a comprehensive feature or performance benchmark. Upstream names identify credited sources, not Quimera components.

| Credited source | Documented strength | Implication for Quimera |
|---|---|---|
| [Superpowers](https://github.com/obra/superpowers) | Structured development, systematic debugging, review, TDD and integrations across several agents. | Multi-tool skills and evidence-based review are shared foundations. Preserve Quimera's proportional process and explicit local control; prove their usability. |
| [Spec Kit](https://github.com/github/spec-kit) | Specifications carried through planning and convergence, with integrations and composable processes. | Avoid building a competing general workflow engine. Make Quimera's smaller operational contract easier to adopt and inspect. |
| [Agent OS](https://github.com/buildermethods/agent-os) | Discovering, deploying and indexing codebase standards, plus spec shaping. | Keep selective standards loading and credit its source; measure whether it reduces repeated corrections. |
| [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD), credited upstream | Right-sized delivery, durable context and specialized perspectives. | Risk routing, memory and specialists are not exclusive. Focus on the quality and simplicity of Quimera's combination. |

Recommended differentiators, subject to validation:

1. **Local control with verifiable boundaries:** no implicit network use, exact ownership, safe updates and inspectable commands.
2. **Continuity across tools:** a second tool can resume a task from repository memory and identify the next step without repeating settled questions.
3. **Honest evidence:** passed means checks actually ran; unsupported and incomplete states stay visible.
4. **Proportional cost:** measured routing to minimal workflows and review tiers, with quality floors preserved.
5. **Practical onboarding:** an existing project can adopt the kit without replacing its instructions, memory or hooks.

Replace unsupported absolute marketing claims such as “what none of them covers” with scoped, demonstrated benefits. Do not claim token savings, superior quality or unique features without a baseline.

## Global constraints

- Repository files stay English; `README.pt-BR.md` remains the Portuguese exception. User-facing discussion stays Brazilian Portuguese.
- Skill frontmatter remains limited to `name` and `description`, and every skill ends with Provenance.
- Tool names and concrete model selection belong in adapters. Keep skill actions portable.
- Preserve upstream credit and trademark restrictions. Copy notices together with distributed adaptations.
- Do not install dependencies, start servers, contact remote services or execute code merely by loading a skill or initializing a session. Keep the explicitly enabled commit-msg hook as the sole automatic runtime exception.
- Local verification and repository CI must be explicitly invoked. Initially use `workflow_dispatch`; do not add automatic lifecycle hooks or PR-triggered execution without a separately agreed change to the kit policy.
- No telemetry, external database, background daemon or paid API is needed for the core.
- Never overwrite unknown files, silently follow outside-root paths or delete user-modified artifacts.
- Existing project rules and explicit user decisions win. Approval should not be requested again for work already authorized within the same scope.
- Respect user push consent on every push. Implementation work gets focused branches and version bumps when changes must reach installed projects.
- Before committing installer changes: scratch `init` → local edit → `update` → `doctor`, including error cases and the packaged artifact.

## Target design

Keep the CLI small. Extract only boundaries that need independent tests: argument parsing, manifest/path validation and operation planning. Avoid a plugin framework or rewrite of the installer into a large application.

Proposed contracts:

- `validateManifest(raw, root) -> ValidatedManifest | diagnostic[]`: reject unsupported schemas, invalid field types, malformed digests, duplicate normalized paths and disallowed destinations before mutation.
- `planOperations(source, installed, desired) -> Operation[]`: each operation includes path, ownership, expected old digest, new digest and reason. Dry-run and execution consume the same plan.
- `VerificationReport`: status `passed | failed | unverified | not-applicable`, selected scope, actual commands, executed/skipped counts and the revision/diff identity. Missing evidence never becomes passed.
- Versioned installation metadata records desired tools/model profile/mode/local-only, last installed digests and unresolved conflicts. Project-specific content remains user-owned.
- Memory location overrides are resolved once and shared by workflows. Do not introduce a second editable copy of every Markdown profile field; use installer metadata for installation state and project instructions for project decisions, with doctor reporting disagreements.

Security invariants must include symlinked parents, alternate path separators and Git metadata paths. Do not rely only on a string `startsWith(root)` check. Define a conservative policy for concurrent writes and interrupted updates; atomic manifest replacement alone does not make a multi-file update atomic.

## Review focus

1. Missing/corrupt manifest and a partially written update must not destroy files or report a healthy installation.
2. Outside-root paths, symlinked parents and pre-existing executable helpers must not cross trust boundaries.
3. A clean Git tree is neither proof of completed update reconciliation nor proof of verification.
4. No check selected, only deletions, MDX changes and missing tooling must not become an unsupported success claim.
5. Existing instructions, unrelated skills, human commit attribution and externally managed hooks must survive adoption and updates.

## Phase 1: Reliability release

- [ ] T001 Establish the deterministic contract-test harness.

  **Files:** create `tests/helpers/repository.mjs`, `tests/installer.test.mjs`, `tests/verification.test.mjs`, `tests/preflight.test.mjs`; modify `package.json`.
  **Interfaces:** fixture creation isolates Git configuration and returns a disposable root; command results expose status/stdout/stderr. Use Node's built-in test runner and standard library for runtime tests.
  **Steps:** capture the positive controls and observed failures in the reproduction table. Add a passing baseline harness first; introduce each failing regression alongside its corrective task and demonstrate red/green locally.
  **Verify:** `node --test tests/*.test.mjs`; fixtures cannot contact a remote or touch the real home directory. No permanently failing tests in the default branch.
  **Commit:** `test: add isolated repository contract fixtures`.

- [ ] T002 Repair skill loading and enforce content contracts. Resolves F01 and part of F10/F15.

  **Files:** modify the three F01 skills and `package.json`; create `scripts/check-content.mjs`, `tests/content.test.mjs`.
  **Interfaces:** content validation returns diagnostics with path, line and rule; use a real YAML parser available in the development environment or a reviewed development-only dependency, not a colon-counting approximation.
  **Steps:** quote invalid descriptions; validate name/directory match, allowed fields, Provenance, referenced local assets and required template fields. Separate format failure from advisory style feedback. Review workflow-heavy descriptions against the kit's trigger-only convention.
  **Verify:** the original three files fail the parser; corrected 15/15 pass; a malformed fixture is rejected. Run a native skill discovery smoke test before advertising support.
  **Commit:** `fix: make skill metadata valid and verifiable`.

- [ ] T003 Constrain installer paths and helper execution. Resolves F02/F03.

  **Files:** modify `bin/quimera.mjs`; create `bin/lib/managed-files.mjs`, `tests/installer-safety.test.mjs`.
  **Interfaces:** validated operations cannot reference arbitrary manifest destinations; helpers come from the trusted running kit. Validate before any write/delete, including `.quimera-new` cleanup.
  **Steps:** add manifest schema/path allowlists, containment checks and symlink policy. Reject unsafe input with no partial changes. Avoid executing code from the destination installation during init/update/doctor.
  **Verify:** crafted `../`, absolute paths, symlink parents, malformed hashes, unknown ownership and replaced helpers are rejected; outside sentinels and user files remain byte-identical. Valid init/update still work.
  **Commit:** `fix: contain managed file operations and trust bundled helpers`.

- [ ] T004 Make CLI and preflight outcomes truthful. Resolves F05/F08/F13.

  **Files:** modify `bin/quimera.mjs`, `scripts/git-preflight.mjs`, `tests/installer.test.mjs`, `tests/preflight.test.mjs`.
  **Interfaces:** exit 0 only for the documented successful outcome; invalid usage and operational failure have documented distinct codes. Diagnostic text identifies the failed operation.
  **Steps:** validate all command/flag/value combinations before writing; propagate child status, spawn errors and signals. Make fetch explicit, use the configured remote/upstream and validate profile fields. Treat unavailable state as unknown, not clean.
  **Verify:** hook conflict makes init nonzero; `--mode=banana`, missing tools value and unknown commands create no files; malformed profile is not ready; a mocked Git runner proves default preflight never fetches.
  **Commit:** `fix: report setup failures and require explicit remote checks`.

- [ ] T005 Make verification evidence-aware. Resolves F04 and part of F17.

  **Files:** modify `scripts/verify.mjs`, `skills/verification/SKILL.md`, `tests/verification.test.mjs`; create `docs/verification-contract.md`.
  **Interfaces:** `VerificationReport` as defined above; add `--json` while retaining readable output. `push` refuses readiness when required checks are unverified; not-applicable requires an explicit reason.
  **Steps:** count executed and skipped checks; validate base references; retain branch-wide deletions/config impact until verified; distinguish plain prose from MDX or executable skill behavior. Keep `--files` scoped, but identify omitted coordinator checks. Respect project lint/test commands and do not silently accept no related tests as proof of coverage.
  **Verify:** zero-check fixture is unverified; old deletion executes the failing test and produces failure; renamed/deleted files, root custom commands, empty repositories, invalid bases and explicit documentation-only scopes have defined results.
  **Commit:** `fix: distinguish verification success from missing evidence`.

- [ ] T006 Make updates recoverable and doctor diagnostic. Resolves F06/F09.

  **Files:** modify `bin/quimera.mjs`; create `bin/lib/manifest.mjs`, `tests/update.test.mjs`, `tests/doctor.test.mjs`, `docs/update-recovery.md`.
  **Interfaces:** versioned manifest with desired/installed/conflict state; old 0.3.0 manifests migrate without losing digest baselines. `doctor --json` reports installation health separately from Git work readiness.
  **Steps:** build a complete operation plan, protect against concurrent updates and stage writes; retain recoverable state on failure. Track offers/skips/orphans, mirrored divergence and hook version. Define a documented conflict-resolution/adoption flow. Never overwrite an edited offer without preserving it.
  **Verify:** idempotent repeated update; local edit preservation; conflict adoption; removed-upstream files; simulated interruption; malformed manifest; concurrent invocation; pending offers detected after a clean commit. Doctor does not modify files.
  **Commit:** `feat: track update conflicts and recover interrupted installs`.

- [ ] T007 Preserve ownership in local-only mode and hook lifecycle. Resolves F07 and integration parts of F09.

  **Files:** modify `scripts/local-only.mjs`, `scripts/install-hooks.mjs`, `scripts/commit-msg`, `skills/project-kickoff/SKILL.md`; create `tests/local-only.test.mjs`, `tests/hooks.test.mjs`.
  **Interfaces:** exclusions derive from installed ownership plus explicitly registered memory outputs. Hook metadata records the actual target, digest and ownership; externally shared hook locations require explicit handling.
  **Steps:** avoid whole unrelated directories; report tracked files without untracking. Preserve other hooks and local edits, detect non-executable hooks, update only owned unchanged guards, provide safe disable instructions. Replace ambiguous error suppression in the hook with safe temporary-file handling and error propagation.
  **Verify:** unrelated untracked standards/skills remain visible; repeated application is idempotent; custom `core.hooksPath`, worktrees, CRLF, human coauthors and failed filter commands preserve valid data. All targets stay in disposable fixtures.
  **Commit:** `fix: preserve project files and managed hook state`.

- [ ] T008 Close distribution and release-evidence gaps. Resolves F14 and release portions of F10.

  **Files:** modify `bin/quimera.mjs`, `package.json`, both README files; create `CHANGELOG.md`, `tests/package.test.mjs`.
  **Interfaces:** installed `.quimera/NOTICE.md` and `.quimera/LICENSE`; a documented immutable release identifier and package inventory.
  **Steps:** ship notices, pin install/update examples to an actual published tag or commit once available, document offline local-source use and retain the source revision. Bump the release version only after the release gate passes; `0.3.1` is a proposed patch target, not an existing release claim.
  **Verify:** explicitly create a local package without lifecycle scripts; unpack in scratch and exercise init/edit/update/doctor from that package. Assert notices and every runtime module are present and scratch/private files are absent.
  **Commit:** `fix: preserve attribution and make releases reproducible`.

**Phase 1 gate:** F01–F08 and F13/F14 regressions closed; operational F09 issues resolved; no unexplained false-success states; scratch and packaged lifecycle tests pass. Review security-sensitive fixes independently before release. Publish nothing automatically.

## Phase 2: One consistent method

- [ ] T009 Consolidate workflow, approval and memory contracts. Resolves F11/F12 and part of F18.

  **Files:** modify `QUIMERA.md`, task-start, project-kickoff, parallel-agents, code-review, close-task and writing-plans skills; modify `templates/AGENTS.md`, `templates/PROFILE.md`; create `docs/workflow-contract.md`.
  **Interfaces:** one routing table for task depth, entry/exit conditions, blocking states and approval reuse; one memory-location resolution convention.
  **Steps:** after the third unresolved attempt, block dependent work and surface it to the user; parking must not mark blocking work complete. Label self-review honestly. Separate read-only analysis from implementation/commit flows. Allow existing memory paths and persistent local bootstrap. Read exact current authorization before asking again; keep meaningful product and irreversible-action gates.
  **Verify:** scenario checks cover read-only review, typo, permission change, third failed fix, unavailable independent reviewer, existing branch authorization, immutable AGENTS and alternate memory layout. There must be one unambiguous next action per scenario.
  **Commit:** `refactor: unify workflow gates and memory resolution`.

- [ ] T010 Publish supported capabilities and decouple model configuration. Resolves F16 and remaining F09.

  **Files:** modify `adapters/*.md`, installer configuration handling and Claude role templates; create `docs/compatibility.md`, `tests/model-profile.test.mjs`.
  **Interfaces:** each adapter records minimum/tested version, instruction/skill locations, subagent/review capability, primary source, verification date and degraded fallback. Profile changes do not silently upgrade the kit.
  **Steps:** correct Gemini CLI discovery guidance; qualify Claude AGENTS behavior by version/context; verify remaining adapters before marking tested. Resolve requested tiers against actually available models and effort levels; never silently substitute a costlier or unavailable model. Keep user model overrides authoritative and report profile drift.
  **Verify:** full/economic round trips preserve customized agent bodies; model-only changes do not contact the network or upgrade unrelated files; unavailable-model scenarios follow the documented fallback. Native smoke tests are recorded per tool, not inferred from folder creation.
  **Commit:** `feat: make adapter capabilities and model profiles explicit`.

- [ ] T011 Document and extend verification through explicit project commands. Resolves remaining F17.

  **Files:** modify `scripts/verify.mjs`, `templates/AGENTS.md`, `docs/verification-contract.md`, `tests/verification.test.mjs`.
  **Interfaces:** project check definitions use executable-plus-argument arrays, working directory and applicability; no shell `eval` or network tool download fallback.
  **Steps:** make Node single-package support reliable first; add tested pnpm workspace behavior next. Non-Node stacks can supply commands already installed locally. Implement more stack-specific selection only after representative fixtures exist.
  **Verify:** custom linter, Node built-in tests, pnpm affected packages, untracked changes and a non-Node fixture with explicit commands. Unsupported stacks are visibly unverified with a next step.
  **Commit:** `feat: support explicit project verification contracts`.

**Phase 2 gate:** no contradictory routing/approval rules in the scenario matrix; every supported adapter has evidence or an explicit experimental label; profile changes and ordinary checks need no implicit network use.

## Phase 3: Prove usability and differentiation

- [ ] T012 Add a retained evaluation corpus. Resolves F15 and validates F18.

  **Files:** create `evals/README.md`, `evals/scenarios/*.md`, `evals/rubric.md`, `evals/results/.gitkeep`; extend content checks for scenario references.
  **Interfaces:** an evaluation records source commit, tool/model/profile, scenario, expected decision, observed artifacts, verification evidence, cost availability and reviewer verdict. Scrub secrets and personal data.
  **Steps:** start with deterministic routing/format scenarios; add explicitly authorized live-agent trials for the highest-risk workflows. Compare baseline and changed skill using fresh contexts. Include no-guidance controls when testing wording. Keep safety violations distinct from quality scores.
  **Verify:** three invalid-YAML cases, interrupted update, no-test verification, hidden unrelated files, unauthorized network/push, injected source instructions, third failure, handoff across tools and economical-review escalation all have scenarios. No paid/API evaluation runs automatically.
  **Commit:** `test: add workflow and handoff evaluation scenarios`.

- [ ] T013 Make onboarding demonstrable and preferences configurable. Resolves F18 and adoption aspects of F12.

  **Files:** modify both README files and relevant kickoff/design templates; create `docs/quickstart.md`, `docs/troubleshooting.md`, `examples/new-project/README.md`, `examples/existing-project/README.md`, `examples/handoff/README.md`.
  **Interfaces:** short examples cover installation, discovery, kickoff, one small change, verification, update conflict and handoff. Examples are walkthrough data, never automatically executed setup.
  **Steps:** provide new/existing/local-only entry paths; distinguish copying the kit from completing kickoff; show concise and coaching preferences. Move personal design and study-weight preferences to explicit defaults/overrides. Explain supported versus manually adapted tools.
  **Verify:** run the walkthroughs in fresh fixtures and pilot at least one existing project; a reader can recover from each documented error without guessing. Review English/Portuguese parity.
  **Commit:** `docs: demonstrate onboarding recovery and cross-tool handoff`.

## Phase 4: Maintain the guarantees

- [ ] T014 Add maintenance and release governance.

  **Files:** create `CONTRIBUTING.md`, `SECURITY.md`, `docs/STATE.md`, `docs/MAP.md`, `docs/DECISIONS.md`, `.github/workflows/validate.yml`; update `AGENTS.md` with actual kit commands and release policy.
  **Interfaces:** an explicitly dispatched validation workflow runs deterministic tests/content checks on supported Node/OS combinations. A release checklist ties tag, version, tests, notices and compatibility evidence to one commit.
  **Steps:** document vulnerability reporting, review expectations, upstream review procedure and deprecation/migration policy. Use the kit's memory pattern for maintaining the kit without installing a second nested copy of itself. Record proposed choices as proposals until adopted.
  **Verify:** run the manual workflow when authorized; test the minimum declared Node version and selected current versions; mark Windows/macOS unsupported or experimental until their matrix passes. No release, dependency installation in user projects or remote publication happens implicitly.
  **Commit:** `chore: document maintenance and release validation`.

## Dependencies and execution order

```mermaid
flowchart LR
  A[Contract fixtures] --> B[Skill format and installer safety]
  B --> C[Truthful CLI and verification]
  C --> D[Updates, local ownership and packaging]
  D --> E[Consistent workflows and adapters]
  E --> F[Evaluation and onboarding pilots]
  F --> G[Maintained release gates]
```

Execute T001–T008 as a series of narrow fixes, each with its regression. Do not batch all installer changes into one rewrite. T009 follows the corrected executable contracts; T010 and T011 can be planned independently but share files with earlier work. T012/T013 validate the consolidated behavior. Start governance documentation early, but claim support only after evidence exists.

No task is marked `[P]`: several tasks share the installer, package metadata, workflows or README files. Within a future implementation plan, split file ownership before authorizing parallel agent work.

## Release milestones and completion criteria

| Milestone | Scope | Exit evidence |
|---|---|---|
| Reliability patch, proposed `0.3.1` | T001–T008 | 15/15 skills parse; safety regressions pass; no zero-check success; all six installer tool values tested; scratch/package lifecycle documented. |
| Consistent method, proposed `0.4.0` | T009–T011 | Scenario matrix has unambiguous gates; overrides work; compatibility/support boundaries published. |
| Validated adoption, proposed `0.5.0` | T012–T014 | New-project, existing-project and cross-tool handoff pilots recorded; manual release matrix and maintenance instructions usable. |
| Stable contract, proposed `1.0.0` | Evidence-driven, not date-driven | No unresolved P0/P1 in supported scope; documented migration path; stable CLI/report/schema contracts; repeatable quality gates across declared environments. |

Version labels are suggestions. Choose actual release numbers based on compatibility impact and the repository's adopted versioning policy. Do not postpone a small safety patch until all strategic work is finished; split the reliability milestone when its release gate remains meaningful.

## Measurement plan

Targets below are proposed acceptance thresholds, not results already achieved.

| Metric | Current evidence | Proposed gate |
|---|---|---|
| Parseable skill frontmatter | 12/15 | 15/15, plus every distributed mirror. |
| Contained managed-file operations | Outside-root write/delete reproduced | Zero outside-root changes in the adversarial fixture suite. |
| Honest verification | False-green scenarios reproduced | Every fixture with no applicable evidence is unverified/not-applicable; failed commands cannot produce passed. |
| Non-destructive adoption | Local edits preserved; unrelated exclusions reproduced | Managed edits preserved and unrelated project files remain visible/unchanged across lifecycle tests. |
| Native adapter compatibility | Folder installation tested; live apps untested | Every “tested” entry has a dated discovery/hand-off run; otherwise experimental/manual. |
| Cross-tool continuation | Not measured | A fresh second tool identifies current goal, decisions, pending checks and next step without re-asking settled profile questions in each pilot. |
| Onboarding friction | Not measured | Record elapsed time, unresolved prompts and manual repairs across the three example journeys before setting a numeric target. |
| Full/economic cost and quality | Not measured | Report tokens/elapsed time when available alongside acceptance and rework; no savings claim if quality regresses or cost is unavailable. |

## Deliberately deferred

- Marketplace/plugin packaging until the portable installer and native discovery tests are stable.
- More specialists, stacks and providers until an observed failure or user need justifies each addition.
- A daemon, cloud backend, remote telemetry, autonomous scheduler or generic orchestration engine; none is required for the current value proposition.
- Automatic merge, push, dependency installation or server startup; these would alter the control model.
- Automatic uninstallation/rollback that deletes user data. First ship inspection/recovery; any future removal must respect ownership and edited files.
- Claims of universal tool support, guaranteed privacy, percentage token savings or superior model choices without evidence.

## Sources and confidence

Local observations are pinned to the baseline commit above. High confidence: reproduced CLI/file outcomes, YAML parser failures, missing tracked test/CI artifacts, directly conflicting workflow text. Medium confidence: adoption friction and proposed positioning. Unmeasured: production exploit prevalence, time savings, model quality and total ownership cost.

Primary sources consulted on 2026-10-26:

- [Superpowers repository and workflow](https://github.com/obra/superpowers).
- [Spec Kit processes and capabilities](https://github.com/github/spec-kit).
- [Agent OS standards workflow](https://github.com/buildermethods/agent-os).
- [BMAD-METHOD, credited source](https://github.com/bmad-code-org/BMAD-METHOD).
- [Agent Skills specification](https://agentskills.io/specification): frontmatter is YAML; Quimera can retain its stricter two-field convention.
- [Gemini CLI skill discovery](https://geminicli.com/docs/cli/skills/): supports `.gemini/skills/` and the `.agents/skills/` alias.
- [Claude Code memory documentation](https://code.claude.com/docs/en/memory): native AGENTS support has version/context conditions; `@AGENTS.md` remains a valid compatibility route.

No product code, skill, script, package version or published release was changed while preparing this plan. The next implementation action is T001, followed by the small F01 fix and the installer trust-boundary corrections; implementation remains a separate action from this analysis deliverable.
