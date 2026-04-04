# Iteration 06 — Point Addition over ℝ and 𝔽ₚ

> Generated on 2026-04-04
> Source: docs/bdd/prioritized-scenarios.md, Scenarios #8 and #9
> Bounded Context: Point Arithmetic
> Feature: Point Addition
> Priority: P1
> Est. TDD cycles: 8

## Scenarios

```gherkin
Scenario: Add two distinct points over real numbers
  Given curve y² = x³ - 7x + 10, P = (1, 2), Q = (3, 4)
  When P + Q is computed
  Then R = (-3, 2) with slope s = 1

Scenario: Add two distinct points over a finite field
  Given curve y² ≡ x³ + x + 1 (mod 23), P = (0, 1), Q = (6, 4)
  When P + Q is computed
  Then R = (0, 22) with slope s = 12
```

## Domain Concepts

| Concept | Type | New/Existing | File |
|---------|------|-------------|------|
| EllipticCurve.addPoints | Method | New | EllipticCurve.ts |
| FiniteFieldCurve.addPoints | Method | New | FiniteFieldCurve.ts |
| FiniteFieldCurve.modInverse | Method | New | FiniteFieldCurve.ts |

## Test Sequence

### Test 1 — value → mutated value

**Intent**: Adding two distinct points on a real curve computes the correct slope

- [x] RED: For curve(-7, 10) with P=(1,2) and Q=(3,4), the slope is 1
- [x] GREEN: Compute s = (y2-y1)/(x2-x1)
- [x] REFACTOR: N/A

---

### Test 2 — value → mutated value

**Intent**: Adding two distinct points on a real curve produces the correct result

- [x] RED: For curve(-7, 10) with P=(1,2) and Q=(3,4), result is (-3, 2)
- [x] GREEN: Compute x3 = s²-x1-x2, y3 = s(x1-x3)-y1
- [x] REFACTOR: N/A

---

### Test 3 — value → mutated value (different inputs)

**Intent**: Addition works for different point pairs

- [x] RED: For curve(-7, 10) with P=(1,-2) and Q=(3,4), result is correct
- [x] GREEN: Already works (confirms generalization)
- [x] REFACTOR: N/A

---

### Test 4 — nil → constant (new class)

**Intent**: Modular inverse can be computed over 𝔽ₚ

- [x] RED: The modular inverse of 6 mod 23 is 4 (since 6·4 = 24 ≡ 1 mod 23)
- [x] GREEN: Implement extended Euclidean algorithm or brute-force search
- [x] REFACTOR: N/A

---

### Test 5 — value → mutated value

**Intent**: Adding two distinct points on a finite field curve computes the correct slope

- [x] RED: For curve(1,1,23) with P=(0,1) and Q=(6,4), slope is 12
- [x] GREEN: Compute s = (y2-y1)·(x2-x1)⁻¹ mod p
- [x] REFACTOR: N/A

---

### Test 6 — value → mutated value

**Intent**: Adding two distinct points on a finite field curve produces the correct result

- [x] RED: For curve(1,1,23) with P=(0,1) and Q=(6,4), result is (0, 22)
- [x] GREEN: Compute x3 = (s²-x1-x2) mod p, y3 = (s(x1-x3)-y1) mod p
- [x] REFACTOR: N/A

---

### Test 7 — value → mutated value (verification)

**Intent**: The result of addition lies on the curve

- [x] RED: For curve(1,1,23), P+Q result satisfies y² ≡ x³+ax+b mod p
- [x] GREEN: Already works (confirmation test)
- [x] REFACTOR: N/A

---

### Test 8 — value → mutated value (second pair)

**Intent**: Addition works for different point pairs on 𝔽ₚ

- [x] RED: For curve(1,1,23) with P=(1,7) and Q=(3,10), result is on the curve
- [x] GREEN: Already generalized
- [x] REFACTOR: Verify invariant holds

---

## Completion Criteria

- [x] All tests pass (36 tests)
- [x] Full BDD scenario is satisfied (point addition over ℝ and 𝔽ₚ)
- [x] Mutation testing: 98.2% (1 equivalent mutant: i<m → i<=m in modInverse loop)
- [x] Code reviewed for SOLID compliance
- [x] Domain purity verified
- [x] Committed with conventional message
