# Iteration 10 — Curve Validation: Discriminant and Primality (Scenarios #18-#23)

> Generated on 2026-04-04
> Source: docs/bdd/prioritized-scenarios.md, Scenarios #18-#23
> Bounded Context: Curve Visualization
> Priority: P2
> Est. TDD cycles: 4

## Scenarios requiring domain code

- #19: Singular curve (discriminant = 0) is rejected with explanation
- #20: Non-prime p is rejected with explanation

## Scenarios already satisfied

- #18: Explanation adapts to field type — covered by AnimationStep model
- #21: Change prime field — create new FiniteFieldCurve(a, b, newP)
- #22: Adjust parameter — create new EllipticCurve(newA, b)
- #23: No points selected — UI validation (infrastructure)

## Test Sequence

### Test 1 — Discriminant computation over ℝ
- [ ] RED: EllipticCurve(-1, 1).discriminant() returns a non-zero value
- [ ] GREEN: Compute -16(4a³ + 27b²)

### Test 2 — Singular curve detection over ℝ
- [ ] RED: EllipticCurve(-3, 2).isSingular() returns true when 4(-27)+27(4)=0
- [ ] GREEN: Return discriminant === 0

### Test 3 — Non-singular curve
- [ ] RED: EllipticCurve(-1, 1).isSingular() returns false
- [ ] GREEN: Already works

### Test 4 — Primality check
- [ ] RED: FiniteFieldCurve.isPrime(23) returns true, isPrime(15) returns false
- [ ] GREEN: Trial division

## Completion Criteria
- [x] All tests pass (56 tests)
- [x] Domain purity verified
- [x] Committed
