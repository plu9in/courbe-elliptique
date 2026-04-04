# Iteration 07 — Configure Curve Parameters (Sliders)

> Generated on 2026-04-04
> Source: docs/bdd/prioritized-scenarios.md, Scenario #10
> Bounded Context: Curve Visualization
> Feature: Configure Curve Parameters
> Priority: P1
> Est. TDD cycles: 0 (domain already supports this)

## Scenario

```gherkin
Scenario: Use sliders to modify parameters
  Given the curve y² = x³ + ax + b is displayed
  When the Learner drags the slider for parameter a from -1 to 2
  Then the curve updates continuously as the slider moves
  And the displayed equation reflects the current value of a
```

## Analysis

This scenario is **purely an infrastructure/UI concern**:
- Creating a new `EllipticCurve(a, b)` or `FiniteFieldCurve(a, b, p)` with different parameters is already supported
- Re-computing points via `computePoints()` or `computeAllPoints()` is already implemented
- Slider binding, continuous re-rendering, and equation display are rendering adapter concerns

No new domain code is needed. The domain model is already parameterized and stateless —
creating a new curve with new parameters is the "update".

## Completion Criteria

- [x] Domain already supports parameterized curve creation
- [x] Point computation methods exist for both ℝ and 𝔽ₚ
- [x] No new domain tests needed
- [x] Infrastructure adapter (sliders + rendering) will be implemented when the UI layer is built
