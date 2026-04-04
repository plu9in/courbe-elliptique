# Iteration 11 — Orbit, Point Order, Generator (#24, #25, #37)

> Source: Scenarios #24, #25, #37
> Bounded Context: Group Exploration
> Priority: P3
> Est. TDD cycles: 6

## Test Sequence

### Test 1 — Orbit returns all multiples until identity
- [ ] RED: computeOrbit(P) returns [P, 2P, 3P, ..., (n-1)P] where nP=O
- [ ] GREEN: Loop scalarMultiply, collect until null

### Test 2 — Orbit includes correct intermediate points
- [ ] RED: orbit of (0,1) on curve(1,1,23) contains known points and correct length
- [ ] GREEN: Already works

### Test 3 — Point order is the length of the orbit + 1
- [ ] RED: pointOrder(P) returns n where nP=O
- [ ] GREEN: Return orbit.length + 1

### Test 4 — Group order is the total number of points + 1 (including O)
- [ ] RED: groupOrder() on curve(1,1,23) returns 28
- [ ] GREEN: Return computeAllPoints().length + 1

### Test 5 — A point is a generator when its order equals the group order
- [ ] RED: isGenerator(P) returns true when pointOrder(P) === groupOrder()
- [ ] GREEN: Compare orders

### Test 6 — A non-generator point is correctly identified
- [ ] RED: isGenerator(P) returns false for a point whose order < group order
- [ ] GREEN: Already works

## Completion Criteria
- [ ] All tests pass
- [ ] Committed
