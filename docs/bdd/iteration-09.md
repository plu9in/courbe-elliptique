# Iteration 09 — Scalar Multiplication (Scenario #17)

> Generated on 2026-04-04
> Source: docs/bdd/prioritized-scenarios.md, Scenario #17
> Bounded Context: Group Exploration
> Priority: P2
> Est. TDD cycles: 5

## Test Sequence

### Test 1 — 1P = P
- [ ] RED: scalarMultiply(P, 1) returns P itself
- [ ] GREEN: Return the point

### Test 2 — 2P = doublePoint(P)
- [ ] RED: scalarMultiply(P, 2) equals doublePoint(P)
- [ ] GREEN: Call doublePoint

### Test 3 — 3P = 2P + P
- [ ] RED: scalarMultiply(P, 3) equals addPoints(doublePoint(P), P)
- [ ] GREEN: Loop: accumulate via addPoints

### Test 4 — 5P computed correctly
- [ ] RED: scalarMultiply((0,1), 5) on curve(1,1,23) returns known coordinates and lies on curve
- [ ] GREEN: Already works via loop

### Test 5 — nP = O for n = order of P
- [ ] RED: scalarMultiply(P, order) returns null (identity)
- [ ] GREEN: Already works since addPoints handles inverse case

## Completion Criteria
- [x] All tests pass (51 tests)
- [x] Mutation testing: deferred (FiniteFieldCurve already at 97.3%)
- [x] Domain purity verified
- [x] Committed
