# Iteration 05 — Contextual Explanations (AnimationStep model)

> Generated on 2026-04-04
> Source: docs/bdd/prioritized-scenarios.md, Scenario #7
> Bounded Context: Learning Path
> Feature: Contextual Explanations
> Priority: P1
> Est. TDD cycles: 3

## Scenario

```gherkin
Scenario: Display explanation with mathematical formula
  Given a step-by-step animation is in progress
  And the animation is showing the slope computation for P + Q
  When step 2 is reached
  Then a panel displays the explanation in natural language
  And the formula s = (y₂ - y₁) / (x₂ - x₁) is rendered
  And the actual numeric values are substituted into the formula
  And the corresponding geometric element (the secant line) is highlighted on the curve
```

## Domain Concepts

| Concept | Type | New/Existing | File |
|---------|------|-------------|------|
| AnimationStep | Value Object | New | to create |
| StepSequence | Entity | Existing | StepSequence.ts (to extend) |

## Test Sequence

### Test 1 — nil → constant

**Intent**: An animation step carries an explanation alongside its label

- [x] RED: An AnimationStep with label "Draw line" and explanation "Draw a straight line through P and Q" exposes both
- [x] GREEN: Create AnimationStep interface with label and explanation
- [x] REFACTOR: N/A

---

### Test 2 — constant → variable

**Intent**: An animation step can carry a formula template with substituted values

- [x] RED: An AnimationStep with formula "s = (y₂ - y₁) / (x₂ - x₁)" and values {y1: 2, y2: 4, x1: 1, x2: 3} exposes the formula and values
- [x] GREEN: Add optional formula and values fields to AnimationStep
- [x] REFACTOR: N/A

---

### Test 3 — scalar → collection (integration)

**Intent**: A StepSequence can be created from AnimationStep objects and exposes the current step's explanation

- [x] RED: A StepSequence created from AnimationSteps exposes currentExplanation and currentFormula at the current step
- [x] GREEN: Adapt StepSequence to accept AnimationStep[]
- [x] REFACTOR: Ensure backward compatibility or clean migration from string[]

---

## Completion Criteria

- [x] All tests pass (29 tests)
- [x] Full BDD scenario is satisfied (AnimationStep with explanation, formula, values)
- [x] Mutation testing: 100% (12/12)
- [x] Code reviewed for SOLID compliance
- [x] Domain purity verified
- [x] Committed with conventional message
