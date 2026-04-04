# Iteration 02 — Display Curve Points over a Small Prime Field

> Generated on 2026-04-04
> Source: docs/bdd/prioritized-scenarios.md, Scenario #2
> Bounded Context: Curve Visualization
> Feature: Display Elliptic Curve over a Finite Field
> Priority: P1
> Est. TDD cycles: 7

## Scenario

```gherkin
Scenario: Display curve points over a small prime field
  Given the Learner has opened the finite field visualization mode
  And the prime is set to p = 23
  And the parameters are set to a = 1 and b = 1
  When the curve is rendered
  Then a 23 × 23 grid is displayed
  And each point (x, y) satisfying y² ≡ x³ + x + 1 (mod 23) is highlighted
  And the total number of points is displayed (excluding the point at infinity)
  And the point at infinity O is shown as a dedicated symbol outside the grid
```

## Domain Concepts

| Concept | Type | New/Existing | File |
|---------|------|-------------|------|
| FiniteFieldCurve | Value Object | New | to create |
| CurvePoint | Value Object | Existing | CurvePoint.ts |

## TPP Analysis Summary

| # | Transformation | Contradiction | Est. Lines |
|---|---------------|---------------|------------|
| 1 | (2) nil → constant | — (first test) | ~2 |
| 2 | (3) constant → variable | No parameters exposed | ~4 |
| 3 | (2) nil → constant (new method) | No modular evaluation exists | ~1 |
| 4 | (6) value → mutated value | Hardcoded value fails for different x | ~1 |
| 5 | (4) unconditional → conditional | Need y values, not just polynomial result | ~5 |
| 6 | (4) conditional strengthened | Not all x have solutions mod p | ~1 |
| 7 | (5) scalar → collection | Single x cannot enumerate full curve | ~7 |
| **Total** | | | **~21** |

---

## Test Sequence

### Test 1 — nil → constant

**Intent**: A finite field curve can be created from parameters and a prime
**Transformation**: (2) nil → constant
**Contradiction**: — (first test)

- [x] RED: Creating a finite field curve with a = 1, b = 1, p = 23 produces a valid object
- [x] GREEN: Constructor returns a new object
- [x] REFACTOR: N/A

---

### Test 2 — constant → variable

**Intent**: A finite field curve retains its parameters and prime
**Transformation**: (3) constant → variable
**Contradiction**: Constant object exposes no values

- [x] RED: A curve created with a = 1, b = 1, p = 23 reports those values
- [x] GREEN: Store a, b, p as readonly properties
- [x] REFACTOR: N/A

---

### Test 3 — nil → constant (new method)

**Intent**: A finite field curve evaluates x³ + ax + b mod p for a given x
**Transformation**: (2) nil → constant
**Contradiction**: No modular evaluation method exists

- [x] RED: For curve(1, 1, 23), evaluating at x = 0 returns 1
- [x] GREEN: Return 1
- [x] REFACTOR: N/A

---

### Test 4 — value → mutated value

**Intent**: The modular evaluation correctly computes x³ + ax + b mod p
**Transformation**: (6) value → mutated value
**Contradiction**: Hardcoded 1 fails for x = 3 where f(3) = 27+3+1 = 31 ≡ 8 mod 23

- [x] RED: For curve(1, 1, 23), evaluating at x = 3 returns 8
- [x] GREEN: Compute (x³ + a*x + b) mod p with correct modular arithmetic
- [x] REFACTOR: Extract mod helper if needed

---

### Test 5 — unconditional → conditional

**Intent**: A curve finds the y-coordinates when a quadratic residue exists mod p
**Transformation**: (4) unconditional → conditional
**Contradiction**: Polynomial value alone is not a point — need y where y² ≡ f(x) mod p

- [x] RED: For curve(1, 1, 23), y values at x = 0 returns [1, 22] (since 1² ≡ 1 mod 23)
- [x] GREEN: Search y in [0, p-1] where y² mod p equals f(x), return sorted pair
- [x] REFACTOR: N/A

---

### Test 6 — conditional strengthened

**Intent**: No y-coordinates when f(x) is not a quadratic residue mod p
**Transformation**: (4) conditional strengthened
**Contradiction**: Not every f(x) value has a square root mod p

- [x] RED: For curve(1, 1, 23), y values at x = 2 returns [] (f(2) = 11, not a QR mod 23)
- [x] GREEN: Return empty when no y satisfies y² ≡ f(x) mod p
- [x] REFACTOR: N/A

---

### Test 7 — scalar → collection

**Intent**: A curve enumerates all points satisfying y² ≡ x³ + ax + b mod p
**Transformation**: (5) scalar → collection
**Contradiction**: Single-x evaluation cannot enumerate the full curve

- [x] RED: For curve(1, 1, 23), computing all points returns a known set including (0,1), (0,22), (1,7), (1,16) and the correct total count
- [x] GREEN: Iterate x from 0 to p-1, collect all (x, y) pairs
- [x] REFACTOR: Verify point count matches known value for this curve

---

## Completion Criteria

- [x] All tests pass (15 tests, 0 failures)
- [x] Full BDD scenario is satisfied (domain: modular point enumeration)
- [x] Mutation testing: 100% (25/25 killed)
- [x] Code reviewed for SOLID compliance
- [x] Domain purity verified (no infrastructure in domain layer)
- [ ] Committed with conventional message
