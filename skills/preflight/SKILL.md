---
name: preflight
description: Run an explicit, proportional risk-and-evidence workflow before and after meaningful implementation. Use only when the user says "preflight," asks for a risk gate, or explicitly requests this workflow. Never auto-invoke it; for risky work without an explicit request, suggest it briefly and wait for the user to choose.
license: MIT
---

# Preflight

Preflight is a repository-agnostic workflow for producing the smallest correct
change with evidence proportional to risk. Repository instructions define the
actual commands, platforms, delivery rules, and required checks.

The flow is:

**reproduce → risk challenge → contract → lock → implement → prove → contract verify + regression review → align → simplify → regression recheck → final-check**

The contract is the stable center. Implementation and evidence may evolve.
Required behavior, scope, and protected invariants require user approval to
change.

## Activation and ownership

Use this skill only when the top-level user explicitly requests preflight or a
risk gate. Never invoke it from a delegated child. If risk is meaningful but
preflight was not requested, suggest it once and wait.

For a preview or design discussion, explain the proposed tier, hats, contract,
and evidence without editing files, spawning children, or implementing.

The main agent owns investigation, scope decisions, the contract,
implementation, integration, and user communication. Children challenge,
verify, review, or simplify; they never take over orchestration.

Prefix every child assignment with:

> You are a bounded preflight child. Do not invoke preflight, delegate work, or
> spawn agents. Complete only the assigned analysis and return it to the parent.

## Scope authority

Each phase has bounded authority:

- Investigation establishes facts; it cannot create requirements.
- Challengers produce candidates; they cannot lock scope.
- The main agent applies the scope gates and writes the contract.
- Implementation and review cannot silently expand the contract.
- Verification proves the contract, not an idealized whole system.
- Optional hardening remains a follow-up unless the user approves it.

A candidate is required only when concrete evidence passes at least one gate:

1. The user explicitly requested it.
2. Omitting it would preserve the observed failure or fail the acceptance signal.
3. Omitting it would regress an existing invariant demonstrated by tests,
   documented behavior, or a directly observed current path.
4. The requested change itself creates a concrete correctness, security,
   data-loss, or resource-safety failure without it.

Plausibility, adjacency, defensive value, or “this could happen” is not enough.
The main agent owns this classification. Do not add another child merely to
decide scope.

## Subagent hats

Each assignment carries one hat. Do not mix hats within one prompt or review
pass. A tier may reuse the same child in a later assignment under another
explicitly named hat; keep the outputs separate.

### Risk challenger

Runs before contract lock. Looks hard for unforeseen consequences, critical
regressions, wrong owners, unsafe ordering, and existing behavior the change
could break.

Returns only:

- `required candidate`: scope gate, evidence, owner, and causal failure path;
- `optional hardening`: useful but explicitly non-blocking;
- `unknown`: investigation needed before trusting the contract.

It does not write the contract, prescribe a broad implementation, or promote
every adjacent edge case.

### Evidence challenger

Critical tier only. Attacks signal fidelity: whether the reproduction reaches
the real owner, whether fail-before distinguishes the bug from a fixture
artifact, and whether the minimum proof can falsify the contract. It does not
review implementation quality.

### Contract verifier

Runs after implementation. Maps every requirement ID and forbidden side effect
to fail-before/pass-after evidence and checks final quiescent state.

It blocks only for missing or contradictory proof or an untested required
boundary. It does not request hardening, redesign code, or review style.

### Regression reviewer

Runs on the green implementation and rechecks meaningful post-simplification
changes. Looks beyond the issue’s success path for regressions introduced by
the patch: incorrect state lifetime, ordering changes, swallowed input,
resource or security failures, platform breakage, compatibility loss, and
similar concrete consequences.

Every blocker must include severity, exact code path, existing behavior at
risk, and a causal failure scenario. “Could be more robust” is not a blocker.
Reuse the same reviewer for the final recheck; another agent is unnecessary.

### Simplifier

Runs after correctness alignment. Wears only the overengineering hat. Compares
the diff with the requirement ledger, mechanism accounting, and smallest viable
counterfactual. Finds implementation-created state, phases, recovery branches,
abstractions, API surface, duplicated proof, and tests protecting removable
machinery. It may challenge mappings, but cannot weaken or expand required
behavior.

## Tiers

Announce the tier and one-sentence reason. Let the user override it.

| Tier | Use when | Children | Default maximum |
| --- | --- | --- | --- |
| Lightweight | Localized, understood, directly provable, and no meaningful state, protocol, platform, persistence, input, performance, or release risk | One risk challenger; one child in separate verifier and reviewer assignments; simplifier only if structure was added | 2 |
| Standard | Ordinary non-trivial work or localized sensitive behavior with known owner and causal chain | Risk challenger, contract verifier, regression reviewer, simplifier | 4 |
| Critical | Broad refactor, release blocker, unclear or multiple owners, concurrency, persistence, protocol compatibility, security, platform APIs, hot paths, vendor code, or scale assumptions | Risk challenger, evidence challenger, contract verifier, regression reviewer, simplifier | 5 |

A sensitive surface alone does not force Critical when Standard has a localized,
deterministic proof. Add children only for distinct unanswered questions. Get
user agreement before exceeding the tier maximum.

## Flow map

| Phase | Owner or hat | Required output | Boundary |
| --- | --- | --- | --- |
| Reproduce | Main | Classified signal | Facts only |
| Challenge | Risk; evidence for Critical | Gated candidates, optional hardening, unknowns | Cannot lock scope |
| Contract | Main | Ledger, outcomes, invariants, proof, counterfactual | Required items only |
| Lock | User | Explicit approval | Scope becomes stable |
| Implement | Main | Smallest satisfying change | No opportunistic hardening |
| Prove | Main | Fail-before/pass-after and mechanism accounting | Minimum proof |
| Verify | Contract verifier | Requirement-to-evidence audit | Exact contract only |
| Review | Regression reviewer | Causal P1/P2 regressions | Existing behavior at risk |
| Align | Main | Resolved findings and green checks | Relock scope changes |
| Simplify | Simplifier | Removable complexity and proof | Preserve requirements |
| Recheck | Same reviewer when meaningful code or tests changed | Final regression audit | Resulting diff only |
| Final-check | Main | Checks, delivery state, uncertainty | No unsupported completion claim |

## 1. Establish a falsifiable signal

Investigate before planning. Read repository instructions and relevant code.
Prefer bug evidence in this order:

1. Real user path through UI, CLI, API, socket, platform integration, or another
   direct boundary.
2. Existing integration harness, smoke test, deterministic replay, trace, or
   captured transition.
3. Failing owning-layer test. If writing it requires edits, make it the first
   implementation step after contract lock.
4. If none is faithful, mark the bug unverified and ask whether to continue
   investigating or implement against the stated hypothesis.

For features, define a falsifiable acceptance signal. Distinguish observed,
trusted external, and modeled evidence. Never call inference a reproduction.

For stateful behavior, trace decoding, filtering, mutation, authority, dispatch,
deferred work, and final quiescence. Rejected work must not mutate state or
shared behavior before rejection.

## 2. Challenge and write the contract

Give each challenger its hat, raw request, signal, repository instructions, and
relevant code paths. Do not include the main agent’s implementation plan.

For Standard and Critical work, store the contract in the repository’s local
planning location. If none exists, use `.local/preflight/<slug>.md` only after
confirming `.local/` is ignored. Lightweight contracts may stay in chat.

The main agent records:

- Request and tier.
- Signal and evidence classification.
- Requirement ledger: stable ID, scope-gate provenance, evidence, owner, and
  omission failure for every required item. List optional hardening separately.
- Behavior contract: observable or owning-layer outcomes, not preferred timers,
  retries, state fields, helper types, or phases unless those mechanics are an
  established compatibility requirement.
- Required invariant map, temporal trace, and final quiescent state.
- Concrete forbidden side effects.
- In scope and out of scope.
- Smallest viable counterfactual: the least-state, least-surface design, plus the
  required failure prevented by every proposed mechanism beyond it.
- Evidence map, minimum proof set, required repository checks, and residual
  uncertainty.
- New-test justification: the unique required failure each test detects and why
  existing evidence cannot detect it. Tests protecting only optional behavior
  or removable branches are out of scope.

Audit the ledger before presenting it. Required items without concrete gate
evidence must equal `0`. Ask the user to lock the contract. Do not implement or
edit project files before approval.

## 3. Implement and account for complexity

Implement the smallest change satisfying the ledger. Keep ownership centralized
unless boundaries are genuinely independent.

Stop and reconcile when evidence reveals a wrong owner, wrong cause, impossible
invariant, required behavior expansion, protocol or API expansion, or any other
contract contradiction. Relock behavior, scope, risk, or protected-invariant
changes. Do not relock ordinary implementation choices or stronger equivalent
evidence.

Before broad proof, count new:

- mutable state fields;
- temporal phases or timers;
- fallback or recovery modes;
- public or protocol surface;
- independent test harnesses.

Map each mechanism to a requirement ID and distinct required failure. Enforce:

- unmapped production mechanisms: `0`;
- unapproved optional-hardening mechanisms: `0`;
- same-layer tests without distinct required failures: `0`;
- duplicate harnesses proving the same transformation: `0`.

Compare with the smallest counterfactual. Extra complexity is valid only when
each unit prevents a different required failure. If new state creates recovery
branches needing more tests, first try removing the state instead of expanding
the matrix. These counts are diagnostics, not line or test limits.

## 4. Prove, verify, review, and align

Capture fail-before and pass-after when practical. Give each invariant one
primary owning-layer proof. Reuse existing integration, platform, and adapter
coverage. Add another test only for a distinct required transformation,
ordering boundary, scheduler, protocol, platform, or lifecycle path.

Before broad review, remove duplicate harnesses, repeated fixtures, unmapped
machinery, and tests protecting removed machinery. Run targeted evidence, then
repository-required broad checks.

Give the contract verifier and regression reviewer the raw request, contract,
ledger, final diff, evidence, mechanism accounting, and check results—not the
main agent’s implementation narrative.

A blocking finding must cite a requirement ID, existing protected invariant, or
signal contradiction. Optional hardening is a follow-up. When implementation-
created machinery causes a gap, prefer removing it over promoting its recovery
branches into requirements.

The main agent fixes valid findings, reruns affected evidence, and asks the same
child to recheck material fixes. Relock only when required behavior or scope
changes. Correctness is aligned when every requirement has credible evidence,
checks are green, and no blocking finding remains.

## 5. Simplify, recheck, and finish

Give the simplifier the contract, ledger, mechanism accounting, final diff, and
evidence. Remove machinery and tests without required mappings.

If accepted simplifications change production behavior, control flow, state
transitions, or test meaning, send the resulting diff to the same regression
reviewer for a final adversarial recheck. Rerun the contract verifier only when
required behavior or its evidence changed. Mechanical cleanup needs only
relevant checks.

Run final repository checks after simplification. Confirm working and delivery
state. Report concisely:

- tier and hats used;
- contract changes or contradictions;
- fail-before/pass-after evidence;
- checks and live validation;
- simplifications;
- residual risk or unavailable validation.

## Missing orchestration

Prefer native fresh-context children. If unavailable, use another isolated
session or process supported by the harness. If independent review is
unavailable, tell the user and ask before substituting same-context passes.
Never describe same-context review as independent.
