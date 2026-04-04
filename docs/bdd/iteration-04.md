# Iteration 04 — Step-by-Step Animation Control

> Generated on 2026-04-04
> Source: docs/bdd/prioritized-scenarios.md, Scenarios #5 and #6
> Bounded Context: Learning Path
> Feature: Step-by-Step Animation Control
> Priority: P1
> Est. TDD cycles: 6

## Scenarios

```gherkin
Scenario: Advance to the next step
  Given a step-by-step animation is playing
  And the animation is paused at step 2 of 5
  When the Learner clicks the "next step" button
  Then step 3 is animated
  And the step counter shows "3 / 5"
  And the contextual explanation updates for step 3

Scenario: Go back to a previous step
  Given a step-by-step animation is playing
  And the animation is at step 4 of 5
  When the Learner clicks the "previous step" button
  Then the visualization reverts to the state at step 3
  And the step counter shows "3 / 5"
  And the explanation updates for step 3
```

## Domain Concepts

| Concept | Type | New/Existing | File |
|---------|------|-------------|------|
| AnimationStep | Value Object | New | to create |
| StepSequence | Entity | New | to create |

## Test Sequence

### Test 1 — nil → constant

**Intent**: A step sequence can be created from a list of steps
**Transformation**: (2) nil → constant

- [x] RED: Creating a step sequence with 5 steps produces a valid object starting at step 1
- [x] GREEN: Constructor returns object with currentIndex = 0
- [x] REFACTOR: N/A

---

### Test 2 — constant → variable

**Intent**: A step sequence reports its current position and total
**Transformation**: (3) constant → variable

- [x] RED: A sequence of 5 steps at position 1 reports current = 1 and total = 5
- [x] GREEN: Expose currentStep and totalSteps from stored data
- [x] REFACTOR: N/A

---

### Test 3 — value → mutated value

**Intent**: Advancing moves to the next step
**Transformation**: (6) value → mutated value

- [x] RED: After advancing from step 2, the current step is 3
- [x] GREEN: Increment current index, return new StepSequence
- [x] REFACTOR: N/A

---

### Test 4 — unconditional → conditional

**Intent**: Cannot advance past the last step
**Transformation**: (4) unconditional → conditional

- [x] RED: Advancing from step 5 of 5 stays at step 5
- [x] GREEN: Guard: if at last step, return self unchanged
- [x] REFACTOR: N/A

---

### Test 5 — value → mutated value

**Intent**: Going back moves to the previous step
**Transformation**: (6) value → mutated value

- [x] RED: After going back from step 4, the current step is 3
- [x] GREEN: Decrement current index, return new StepSequence
- [x] REFACTOR: N/A

---

### Test 6 — unconditional → conditional

**Intent**: Cannot go back before the first step
**Transformation**: (4) unconditional → conditional

- [x] RED: Going back from step 1 stays at step 1
- [x] GREEN: Guard: if at first step, return self unchanged
- [x] REFACTOR: N/A

---

## Completion Criteria

- [x] All tests pass (26 tests, 0 failures)
- [x] Full BDD scenario is satisfied (next/previous with boundary guards)
- [x] Mutation testing: 100% (12/12 killed)
- [x] Code reviewed for SOLID compliance
- [x] Domain purity verified (immutable value object, no infrastructure)
- [x] Committed with conventional message
