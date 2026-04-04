# Iteration 03 — Point Selection (ℝ and 𝔽ₚ domain support)

> Generated on 2026-04-04
> Source: docs/bdd/prioritized-scenarios.md, Scenarios #3 and #4
> Bounded Context: Point Arithmetic
> Feature: Point Selection
> Priority: P1
> Est. TDD cycles: 5

## Scenarios

```gherkin
Scenario: Select a point on the curve over real numbers
  Given the Learner is in real number mode
  And an elliptic curve is displayed
  When the Learner clicks near the point (1, 2) on the curve
  Then the nearest point on the curve is selected
  And the selected point is visually highlighted
  And its exact coordinates are displayed

Scenario: Select a point on the grid over a finite field
  Given the Learner is in finite field mode with p = 23
  And an elliptic curve is displayed
  When the Learner clicks on the grid point (6, 4)
  And (6, 4) is a valid point on the curve
  Then the point (6, 4) is selected and highlighted
  And its coordinates are displayed
```

## Domain Concepts

| Concept | Type | New/Existing | File |
|---------|------|-------------|------|
| EllipticCurve | Value Object | Existing | EllipticCurve.ts |
| FiniteFieldCurve | Value Object | Existing | FiniteFieldCurve.ts |
| CurvePoint | Value Object | Existing | CurvePoint.ts |

> Note: "clicking", "highlighting", and "displaying coordinates" are infrastructure concerns.
> The domain contribution is: (1) snap-to-nearest-point for ℝ curves, (2) point validation for 𝔽ₚ.

## Test Sequence

### Test 1 — nil → constant

**Intent**: An elliptic curve finds the nearest point on the curve given approximate coordinates
**Transformation**: (2) nil → constant

- [x] RED: For curve(a=-1, b=1), finding the nearest point to (1, 2) returns a point on the curve
- [x] GREEN: Return a fixed CurvePoint
- [x] REFACTOR: N/A

---

### Test 2 — value → mutated value

**Intent**: The nearest point has the correct y-coordinate for the given x
**Transformation**: (6) value → mutated value
**Contradiction**: Fixed point is wrong for different input coordinates

- [x] RED: For curve(a=-1, b=1), nearest point to (1.0, 1.5) returns (1.0, 1.0) since f(1)=1, y=±1, and 1.0 is closer to 1.5 than -1.0
- [x] GREEN: Evaluate f(x), compute ±√f(x), return the y closest to input y
- [x] REFACTOR: N/A

---

### Test 3 — unconditional → conditional

**Intent**: The nearest point search returns nothing when no real point exists at that x
**Transformation**: (4) unconditional → conditional
**Contradiction**: Unconditional sqrt fails when f(x) < 0

- [x] RED: For curve(a=-1, b=1), nearest point to (-2, 0) returns null (f(-2) < 0)
- [x] GREEN: Check f(x) >= 0 before computing
- [x] REFACTOR: N/A

---

### Test 4 — nil → constant (new class behavior)

**Intent**: A finite field curve validates whether a point lies on the curve
**Transformation**: (2) nil → constant

- [x] RED: For curve(1, 1, 23), point (0, 1) is on the curve
- [x] GREEN: Return true
- [x] REFACTOR: N/A

---

### Test 5 — unconditional → conditional

**Intent**: A point not on the curve is correctly rejected
**Transformation**: (4) unconditional → conditional
**Contradiction**: Returning true for all points is wrong

- [x] RED: For curve(1, 1, 23), point (0, 5) is NOT on the curve (5² = 25 ≡ 2 ≠ 1 mod 23)
- [x] GREEN: Check y² mod p === evaluateAt(x)
- [x] REFACTOR: N/A

---

## Completion Criteria

- [x] All tests pass (20 tests, 0 failures)
- [x] Full BDD scenario is satisfied (domain: nearestPoint for ℝ, isPointOnCurve for 𝔽ₚ)
- [x] Mutation testing: 100% (30/30 killed)
- [x] Code reviewed for SOLID compliance
- [x] Domain purity verified
- [x] Committed with conventional message
