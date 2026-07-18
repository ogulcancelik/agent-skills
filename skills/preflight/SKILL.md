---
name: preflight
description: Use fresh-context specialists to challenge regression risk before implementation, then verify the smallest correct change. Use only when the user says "preflight," asks for a risk gate, or explicitly requests this workflow. Never auto-invoke it.
license: MIT
---

# Preflight

Preflight reduces implementation bias. The implementing agent becomes attached
to its diagnosis and design. A fresh specialist that sees the problem and code,
but not the proposed solution, can find regressions before the design is locked.

The flow is:

**investigate → risk challenge → concise contract → approve → implement → verify → simplify → finish**

## Rules

Use this skill only when the top-level user explicitly requests preflight or a
risk gate. Never invoke it from a delegated child. If preflight was not
requested, suggest it once and wait.

The main agent owns investigation, scope, implementation, and communication.
Children only challenge, verify, review, or simplify. Give each child one job.
Reuse it only to recheck its own findings.

Prefix every child assignment with:

> You are a bounded preflight child. Do not invoke preflight, delegate work, or
> spawn agents. Complete only the assigned analysis and return it to the parent.

Always run the pre-implementation risk challenge. For meaningful code changes,
also run a contract verifier and regression reviewer after implementation. Run
a simplifier when the patch adds meaningful structure. Add an evidence
challenger only when the reproduction is uncertain or the change is unusually
risky. Do not create agents merely to fill a process.

## 1. Investigate

Read repository instructions and trace the real execution path before planning.
For bugs, prefer a real user-path reproduction, then an existing integration
signal, then an owning-layer test. If none is available, label the diagnosis as
a hypothesis. For features, define one observable acceptance signal.

Separate facts from assumptions. Investigation cannot expand the request.

## 2. Run the independent risk challenge

Give a fresh agent the raw request, evidence, repository instructions, relevant
code, and existing tests. Do not give it the main agent's diagnosis,
implementation plan, architecture, or proposed patch.

Use this prompt:

> Find concrete regressions this requested change could cause. For each finding,
> cite the existing behavior, exact code path, evidence, and causal failure
> chain. Do not suggest implementation designs, general improvements, defensive
> hardening, or hypothetical risks without evidence. Report unknowns separately.

The child returns only concrete risks, blocking unknowns, or no findings.

A finding is not automatically new scope. The main agent classifies it:

- **Required:** needed to satisfy the request, fix the observed failure, protect
  demonstrated existing behavior, or prevent a concrete correctness, security,
  data-loss, or resource-safety failure created by the patch.
- **Watch:** worth checking against the finished patch, but not supported well
  enough to add behavior or machinery.
- **Discard:** speculative, adjacent, defensive, or unrelated.

Required risks enter the contract. Watches enter the review checklist but create
no code, abstraction, branch, or test. Discarded findings disappear. Investigate
a blocking unknown instead of guessing.

## 3. Present the contract

Give the user one short, plain-language brief:

**Problem:** what is changing and the evidence.

**Contract:** required observable behavior.

**Protected behavior:** existing behavior that must not regress.

**Non-goals:** adjacent work that will not be implemented.

**Risk challenge:** required risks, meaningful watches, and blocking unknowns.

**Proof:** fail-before/pass-after signal and repository checks.

Keep it to one screen when practical. Do not show internal ledgers, mechanism
counts, orchestration details, or specialist transcripts. Use requirement IDs
only when they prevent real ambiguity.

Ask the user to approve the contract before editing project files. Ask again
only if later evidence changes required behavior, scope, or a protected
invariant—not for ordinary implementation choices.

## 4. Implement the smallest contract

Implement only approved behavior. Never implement watches or optional
hardening.

Prefer the least new state, control flow, API surface, and test machinery. Every
new mechanism must prevent a distinct required failure. If a mechanism creates
recovery branches or more tests, first try removing it.

Capture fail-before and pass-after evidence when practical. Add tests for
required behavior or distinct regression boundaries, not speculative paths or
implementation details. Reuse existing harnesses. Run targeted checks, then
repository-required checks.

## 5. Verify with specialists

Give post-implementation specialists the raw request, approved brief, diff,
evidence, and check results. Keep the jobs separate.

**Contract verifier:** Check that the patch and evidence satisfy the approved
contract. Report only missing, contradictory, or unreliable proof. Do not ask
for redesign or hardening.

**Regression reviewer:** Find regressions introduced by the patch. Every blocker
must cite severity, exact code path, existing behavior at risk, and a causal
failure scenario. Check earlier watches against the actual diff. “Could be more
robust” is not a blocker.

**Evidence challenger:** Use only when the signal is uncertain or risk is high.
Check whether the reproduction reaches the real owner and whether the proof can
falsify the contract. Do not review code style.

The main agent validates each finding. Fix concrete contract or regression
failures, rerun affected checks, and ask the same specialist to recheck its
resolved findings. Do not turn suggestions into scope.

## 6. Simplify

If the patch adds state, phases, recovery branches, abstractions, API surface,
or substantial tests, ask a simplifier what can be removed while preserving the
contract. It cannot weaken or expand required behavior.

Apply useful removals and rerun checks. If production behavior or control flow
changed, ask the regression reviewer to check the final diff again.

## 7. Finish

Run final repository checks. Report only:

**Changed:** implemented behavior.

**Evidence:** fail-before/pass-after and checks.

**Independent review:** concrete risks found and resolved.

**Simplified:** meaningful complexity removed, when applicable.

**Remaining uncertainty:** unavailable validation or residual risk.

Omit empty sections. Do not narrate the process unless the user asks.

## If fresh-context agents are unavailable

Use another isolated session supported by the harness. If independent review is
unavailable, tell the user and ask before using same-context review. Never call
same-context review independent.
