# Iteration 08 — Point Doubling, Inverse, Identity (Scenarios #11-#16)

> Generated on 2026-04-04
> Source: docs/bdd/prioritized-scenarios.md, Scenarios #11, #12, #13, #14, #15, #16
> Bounded Context: Point Arithmetic
> Priority: P2
> Est. TDD cycles: 8

## Test Sequence

### Test 1 — Double a point over ℝ
- [ ] RED: curve(-7,10).doublePoint(1,2) returns (-1, -4)
- [ ] GREEN: s=(3x²+a)/(2y), x3=s²-2x, y3=s(x-x3)-y
- [ ] REFACTOR: N/A

### Test 2 — Doubling result lies on the ℝ curve
- [ ] RED: result of doubling satisfies y²=x³+ax+b
- [ ] GREEN: Already works (confirmation)
- [ ] REFACTOR: N/A

### Test 3 — Double a point over 𝔽ₚ
- [ ] RED: curve(1,1,23).doublePoint(0,1) returns (6, 19)
- [ ] GREEN: s=(3x²+a)·(2y)⁻¹ mod p, then modular x3, y3
- [ ] REFACTOR: N/A

### Test 4 — Doubling result lies on the 𝔽ₚ curve
- [ ] RED: isPointOnCurve(result) is true
- [ ] GREEN: Already works
- [ ] REFACTOR: N/A

### Test 5 — Inverse over ℝ: negate y
- [ ] RED: curve(-1,1).inversePoint(3, 5) returns (3, -5)
- [ ] GREEN: Return {x, y: -y}
- [ ] REFACTOR: N/A

### Test 6 — Inverse over 𝔽ₚ: compute p - y
- [ ] RED: curve(1,1,23).inversePoint(3, 5) returns (3, 18)
- [ ] GREEN: Return {x, y: p - y}
- [ ] REFACTOR: N/A

### Test 7 — Adding identity P+O returns P (use null for O)
- [ ] RED: curve(1,1,23).addPoints(P, null) returns P
- [ ] GREEN: Guard: if either point is null, return the other
- [ ] REFACTOR: N/A

### Test 8 — Adding a point to its inverse yields null (identity O)
- [ ] RED: curve(1,1,23).addPoints((0,1), (0,22)) returns null
- [ ] GREEN: Guard: if x1===x2 and y1+y2===p, return null
- [ ] REFACTOR: N/A

## Completion Criteria
- [x] All tests pass (46 tests)
- [x] Mutation testing: 97.3% (3 equivalent mutants annotated)
- [x] Domain purity verified
- [x] Committed
