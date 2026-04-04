# Iteration 01 — Display a Standard Elliptic Curve over Real Numbers

> Generated on 2026-04-04
> Source: docs/bdd/prioritized-scenarios.md, Scenario #1
> Bounded Context: Curve Visualization
> Feature: Display Elliptic Curve over Real Numbers
> Priority: P1
> Est. TDD cycles: 7

## Scenario

```gherkin
Feature: Display Elliptic Curve over Real Numbers
  As a Learner
  I want to see an elliptic curve plotted on a Cartesian plane
  So that I can build geometric intuition before working with finite fields

  Scenario: Display a standard elliptic curve
    Given the Learner has opened the real number visualization mode
    And the parameters are set to a = -1 and b = 1
    When the curve is rendered
    Then the curve y² = x³ - x + 1 is displayed on the Cartesian plane
    And the curve is smooth and continuous
    And the x-axis and y-axis are visible with labeled graduations
```

## Domain Concepts

| Concept | Type | New/Existing | File |
|---------|------|-------------|------|
| EllipticCurve | Value Object | New | to create |
| CurvePoint | Value Object | New | to create |

> Note: Visual rendering (Cartesian plane, axes, labels) is an infrastructure adapter concern.
> This iteration focuses on the **pure domain model** that provides plottable data.
> The rendering adapter will be implemented separately.

## TPP Analysis Summary

| # | Transformation | Contradiction | Est. Lines |
|---|---------------|---------------|------------|
| 1 | (2) nil → constant | — (first test) | ~2 |
| 2 | (3) constant → variable | Constant object has no parameter values | ~3 |
| 3 | (2) nil → constant (new method) | No evaluation capability exists | ~1 |
| 4 | (6) value → mutated value | Hardcoded return value fails for different x | ~1 |
| 5 | (4) unconditional → conditional | Polynomial value alone is not a y-coordinate | ~3 |
| 6 | (4) conditional strengthened | Unconditional sqrt fails on negative values | ~1 |
| 7 | (5) scalar → collection | Single-point evaluation cannot produce a curve | ~5 |
| **Total** | | | **~16** |

---

## Test Sequence

### Test 1 — nil → constant

**Intent**: An elliptic curve can be created from parameters
**Transformation**: (2) nil → constant
**Contradiction**: — (first test, establishes the baseline)
**Why this order**: The most fundamental thing — before any behavior, the object must exist

- [x] RED: Creating an elliptic curve with a = -1 and b = 1 produces a valid curve object
- [x] GREEN: Constructor returns a new object
- [x] REFACTOR: N/A

---

### Test 2 — constant → variable

**Intent**: A curve retains the parameters it was created with
**Transformation**: (3) constant → variable
**Contradiction**: The constant object from Test 1 carries no specific parameter values — accessing a and b is impossible or returns wrong values
**Why this order**: Before computing anything with a and b, the curve must know their values

- [x] RED: A curve created with a = -1 and b = 1 reports a = -1 and b = 1
- [x] GREEN: Store a and b in the constructor, expose them as readonly properties
- [x] REFACTOR: N/A

---

### Test 3 — nil → constant (new method)

**Intent**: A curve evaluates the right-hand side of its equation for a given x
**Transformation**: (2) nil → constant (introducing a new behavior)
**Contradiction**: The curve stores parameters but has no computation capability — no method to evaluate the equation
**Why this order**: Evaluation of f(x) = x³ + ax + b is the prerequisite for computing any point on the curve

- [x] RED: For curve(a = -1, b = 1), evaluating the right-hand side at x = 0 returns 1
- [x] GREEN: Return 1 (the simplest passing implementation)
- [x] REFACTOR: N/A

---

### Test 4 — value → mutated value

**Intent**: The equation evaluation correctly computes x³ + ax + b for any x value
**Transformation**: (6) value → mutated value
**Contradiction**: The hardcoded "return 1" from Test 3 does not work for x = 2, where the expected result is 7 (since 8 - 2 + 1 = 7)
**Why this order**: After establishing that evaluation exists (Test 3), we force it to actually compute the polynomial

- [x] RED: For curve(a = -1, b = 1), evaluating the right-hand side at x = 2 returns 7
- [x] GREEN: Replace constant with x * x * x + a * x + b
- [x] REFACTOR: Skipped (expression is clear). Mutation: 100% (5/5 killed)

---

### Test 5 — unconditional → conditional

**Intent**: A curve computes the y-coordinates when the right-hand side is non-negative
**Transformation**: (4) unconditional → conditional
**Contradiction**: The evaluateAt method returns a scalar (the polynomial value), but the scenario requires actual (x, y) points — this demands a new method that derives y = ±√(f(x)), which only works when f(x) ≥ 0
**Why this order**: Now that f(x) is correctly computed (Test 4), we can derive y-coordinates from it

- [x] RED: For curve(a = -1, b = 1), computing y values at x = 0 returns [1, -1] (since √1 = 1)
- [x] GREEN: Compute f(x), take square root, return [+√f(x), -√f(x)]
- [x] REFACTOR: CurvePoint VO deferred — only numbers needed at this stage

---

### Test 6 — conditional strengthened

**Intent**: No y-coordinates exist when the right-hand side is negative
**Transformation**: (4) conditional strengthened
**Contradiction**: Test 5's unconditional sqrt would produce NaN for x = -2, where f(-2) = -8 + 2 + 1 = -5 < 0
**Why this order**: The happy path (f(x) ≥ 0) is established; now we guard against the impossible case (f(x) < 0)

- [x] RED: For curve(a = -1, b = 1), computing y values at x = -2 returns an empty collection
- [x] GREEN: Add guard: if f(x) < 0, return empty array before computing sqrt
- [x] REFACTOR: N/A. Mutation: 1 survivor (fx<0 → fx<=0) killed with boundary test f(x)=0

---

### Test 7 — scalar → collection

**Intent**: A curve produces a set of plottable points across an x-range
**Transformation**: (5) scalar → collection
**Contradiction**: The yValuesAt method handles one x at a time, but the scenario requires displaying an entire curve — a collection of points across a continuous range
**Why this order**: All single-point computation is proven correct (Tests 3-6); now we compose it into a renderable series

- [x] RED: For curve(a = -1, b = 1), generating points from x = -2 to x = 2 with step 1 returns 8 points: (-1, ±1), (0, ±1), (1, ±1), (2, ±√7) — and excludes x = -2 where f(x) < 0
- [x] GREEN: Iterate from xMin to xMax with step, call yValuesAt(x) for each, collect all (x, y) pairs into a list
- [x] REFACTOR: Extracted CurvePoint to own file. Mutation: 17/17 (100%)

---

## Completion Criteria

- [x] All tests pass (8 tests, 0 failures)
- [x] Full BDD scenario is satisfied (domain portion: curve data generation from parameters)
- [x] Mutation testing: 100% mutants killed (17/17)
- [x] Code reviewed for SOLID compliance
- [x] Domain purity verified (no infrastructure in domain layer)
- [ ] Committed with conventional message
