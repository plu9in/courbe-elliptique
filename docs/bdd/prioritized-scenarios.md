# Prioritized BDD Scenarios — Elliptic Curve Group Theory Explorer

> Prioritized on 2026-04-04
> Source: docs/bdd/scenarios.md (90 scenarios → 83 after simplification)

## Priority Summary

| Priority | Count | Est. TDD Cycles | Cumulative Cycles | Value Delivered        |
|----------|-------|-----------------|-------------------|------------------------|
| P1       | 10    | ~26             | ~26               | Core rendering + interaction |
| P2       | 13    | ~18             | ~44               | Full arithmetic + errors     |
| **MVP**  | **23**| **~44**         | **~44**           | **~70% of total value**      |
| P3       | 14    | ~30             | ~74               | Group theory + crypto bridge |
| P4       | 24    | ~36             | ~110              | ECDSA + polish + edge cases  |
| P5       | 22    | ~27             | ~137              | Remaining edge/error cases   |
| **Total**| **83**| **~137**        | **~137**          | **100%**                     |

> **P1+P2 deliver ~70% of business value for ~32% of the effort.**

## Simplification Log

| Action | Original Scenarios | Result | Reason |
|--------|--------------------|--------|--------|
| MERGE  | S03 (two components) + S04 (single component) | Scenario Outline: "Curve topology depends on parameters" | Two sides of the same business rule |
| MERGE  | S06 (node singularity) + S07 (cusp singularity) | Scenario Outline: "Singular curve parameters are explained" | Same validation rule, different inputs |
| MERGE  | S10 (small prime grid) + S11 (large prime grid) | Scenario Outline: "Grid adapts to prime field size" | Same responsive behavior |
| MERGE  | S28 (y=0 doubling ℝ) + S29 (y=0 doubling 𝔽ₚ) | Scenario Outline: "Doubling point with y=0 yields identity" | Same rule across fields |
| MERGE  | S33 (x-axis inverse) + S34 (infinity inverse) | Scenario Outline: "Self-inverse points" | Same self-inverse concept |
| MERGE  | S45 (n=1) + S46 (n=0) | Scenario Outline: "Scalar multiplication boundary values" | Boundary cases of same operation |
| MERGE  | S82 (back at step 1) + S83 (forward at last step) | Scenario Outline: "Animation boundary navigation" | Same boundary guard behavior |

**Net result: 90 → 83 scenarios (7 merges)**

## Dependency Graph

```
LAYER 0 — Infrastructure (no dependencies)
  #1 Display curve ℝ
  #2 Display curve 𝔽ₚ
  #5 Animation: next step
  #6 Animation: previous step
  #7 Explanation panel with formula

LAYER 1 — Interaction (depends on Layer 0)
  #3 Select point ℝ ──────────────────► depends on #1
  #4 Select point 𝔽ₚ ─────────────────► depends on #2
  #10 Sliders to modify parameters ───► depends on #1, #2

LAYER 2 — Core Arithmetic (depends on Layer 1)
  #8 Add two points ℝ ────────────────► depends on #3, #5, #7
  #9 Add two points 𝔽ₚ ───────────────► depends on #4, #5, #7
  #14 Double point ℝ ─────────────────► depends on #3, #5, #7
  #15 Double point 𝔽ₚ ────────────────► depends on #4, #5, #7
  #16 Inverse ℝ ──────────────────────► depends on #3
  #17 Inverse 𝔽ₚ ─────────────────────► depends on #4

LAYER 3 — Composed Operations (depends on Layer 2)
  #20 Scalar multiplication ──────────► depends on #9, #15
  #21 Adding identity P+O=P ──────────► depends on #9
  #22 Adding inverse P+(-P)=O ────────► depends on #9, #17

LAYER 4 — Group Structure (depends on Layer 3)
  #27 Orbit visualization ────────────► depends on #20
  #28 Point order ────────────────────► depends on #20
  #29-#32 Group properties ───────────► depends on #9, #15

LAYER 5 — Cryptographic Applications (depends on Layer 4)
  #33 Forward DLP (easy) ─────────────► depends on #20
  #34 Reverse DLP (hard) ─────────────► depends on #20
  #36 ECDH key exchange ──────────────► depends on #20
  #43 ECDSA sign ─────────────────────► depends on #20
  #44 ECDSA verify ───────────────────► depends on #43
```

---

## P1 — Core Foundation (Do First)

> Without these 10 scenarios, the application cannot exist. They establish:
> curve rendering, point selection, the group operation, step-by-step control, and explanations.

---

### Scenario #1 — [P1] Display a standard elliptic curve over real numbers

**Feature**: Display Elliptic Curve over Real Numbers
**Bounded Context**: Curve Visualization
**Value**: CRITICAL — pedagogical entry point; real-number curves build the geometric intuition that makes finite fields comprehensible
**Cost**: MEDIUM — requires curve equation evaluation, 2D rendering engine, axis labeling
**Dependencies**: none
**Est. TDD cycles**: 3

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

---

### Scenario #2 — [P1] Display curve points over a small prime field

**Feature**: Display Elliptic Curve over a Finite Field
**Bounded Context**: Curve Visualization
**Value**: CRITICAL — primary visualization mode for the entire application; finite fields are the target domain for crypto and future ZK Proofs
**Cost**: MEDIUM — requires modular arithmetic point computation, p×p grid rendering, point counting
**Dependencies**: none
**Est. TDD cycles**: 3

```gherkin
Feature: Display Elliptic Curve over a Finite Field
  As a Learner
  I want to see the points of an elliptic curve over a prime field 𝔽ₚ
  So that I can understand how elliptic curves work in cryptographic settings

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

---

### Scenario #3 — [P1] Select a point on the curve over real numbers

**Feature**: Point Selection
**Bounded Context**: Point Arithmetic
**Value**: CRITICAL — every arithmetic operation requires point selection; without it, nothing is interactive
**Cost**: LOW — click event handler, snap-to-curve calculation, highlight rendering
**Dependencies**: #1
**Est. TDD cycles**: 2

```gherkin
Feature: Point Selection
  As a Learner
  I want to select points on the curve by clicking
  So that I can use them for arithmetic operations

  Scenario: Select a point on the curve over real numbers
    Given the Learner is in real number mode
    And an elliptic curve is displayed
    When the Learner clicks near the point (1, 2) on the curve
    Then the nearest point on the curve is selected
    And the selected point is visually highlighted
    And its exact coordinates are displayed
```

---

### Scenario #4 — [P1] Select a point on the grid over a finite field

**Feature**: Point Selection
**Bounded Context**: Point Arithmetic
**Value**: CRITICAL — all finite field operations require point selection on the grid
**Cost**: LOW — click handler on grid, coordinate mapping, highlight
**Dependencies**: #2
**Est. TDD cycles**: 2

```gherkin
  Scenario: Select a point on the grid over a finite field
    Given the Learner is in finite field mode with p = 23
    And an elliptic curve is displayed
    When the Learner clicks on the grid point (6, 4)
    And (6, 4) is a valid point on the curve
    Then the point (6, 4) is selected and highlighted
    And its coordinates are displayed
```

---

### Scenario #5 — [P1] Advance to the next step

**Feature**: Step-by-Step Animation Control
**Bounded Context**: Learning Path
**Value**: CRITICAL — the user explicitly requested step-by-step animations; this is the primary navigation mechanism for all operations
**Cost**: LOW — step state machine with index, re-render per step
**Dependencies**: none (infrastructure)
**Est. TDD cycles**: 2

```gherkin
Feature: Step-by-Step Animation Control
  As a Learner
  I want to control the pace of each geometric construction
  So that I can understand each sub-operation before moving to the next

  Scenario: Advance to the next step
    Given a step-by-step animation is playing
    And the animation is paused at step 2 of 5
    When the Learner clicks the "next step" button
    Then step 3 is animated
    And the step counter shows "3 / 5"
    And the contextual explanation updates for step 3
```

---

### Scenario #6 — [P1] Go back to a previous step

**Feature**: Step-by-Step Animation Control
**Bounded Context**: Learning Path
**Value**: CRITICAL — bidirectional navigation is essential for understanding; learners need to revisit steps
**Cost**: LOW — extends step state machine with backward index
**Dependencies**: #5
**Est. TDD cycles**: 1

```gherkin
  Scenario: Go back to a previous step
    Given a step-by-step animation is playing
    And the animation is at step 4 of 5
    When the Learner clicks the "previous step" button
    Then the visualization reverts to the state at step 3
    And the step counter shows "3 / 5"
    And the explanation updates for step 3
```

---

### Scenario #7 — [P1] Display explanation with mathematical formula

**Feature**: Contextual Explanations
**Bounded Context**: Learning Path
**Value**: CRITICAL — connects geometry to algebra; without explanations, the app is a visualizer, not a teaching tool
**Cost**: MEDIUM — math formula rendering (LaTeX/KaTeX), value substitution, synchronized highlighting
**Dependencies**: #5
**Est. TDD cycles**: 3

```gherkin
Feature: Contextual Explanations
  As a Learner
  I want to see mathematical explanations alongside each visual step
  So that I can connect the geometry to the algebra

  Scenario: Display explanation with mathematical formula
    Given a step-by-step animation is in progress
    And the animation is showing the slope computation for P + Q
    When step 2 is reached
    Then a panel displays the explanation in natural language
    And the formula s = (y₂ - y₁) / (x₂ - x₁) is rendered
    And the actual numeric values are substituted into the formula
    And the corresponding geometric element (the secant line) is highlighted on the curve
```

---

### Scenario #8 — [P1] Add two distinct points over real numbers

**Feature**: Point Addition
**Bounded Context**: Point Arithmetic
**Value**: CRITICAL — the group operation IS the product; geometric construction over ℝ is the primary intuition builder
**Cost**: MEDIUM — line-curve intersection computation, reflection, 3-step animation with rendering
**Dependencies**: #3, #5, #7
**Est. TDD cycles**: 4

```gherkin
Feature: Point Addition
  As a Learner
  I want to add two points on an elliptic curve step by step
  So that I can understand the geometric construction behind the group operation

  Scenario: Add two distinct points over real numbers
    Given the Learner is in real number mode with curve y² = x³ - 7x + 10
    And the Learner has selected point P = (1, 2)
    And the Learner has selected point Q = (3, 4)
    When the Learner requests the addition P + Q
    Then step 1 shows a line drawn through P and Q
    And step 2 highlights the third intersection point R' of the line with the curve
    And step 3 reflects R' over the x-axis to obtain R
    And the result R = P + Q is displayed with its coordinates
    And the formula used for the slope is shown
```

---

### Scenario #9 — [P1] Add two distinct points over a finite field

**Feature**: Point Addition
**Bounded Context**: Point Arithmetic
**Value**: CRITICAL — core group operation on the target domain (𝔽ₚ); foundation for scalar multiplication and all crypto
**Cost**: MEDIUM — modular arithmetic engine, modular inverse, step-by-step display with arithmetic sidebar
**Dependencies**: #4, #5, #7
**Est. TDD cycles**: 4

```gherkin
  Scenario: Add two distinct points over a finite field
    Given the Learner is in finite field mode with p = 23, a = 1, b = 1
    And the Learner has selected point P = (0, 1)
    And the Learner has selected point Q = (6, 4)
    When the Learner requests the addition P + Q
    Then step 1 shows the secant line through P and Q with modular wrapping
    And step 2 computes the slope s = (y₂ - y₁) · (x₂ - x₁)⁻¹ mod 23
    And step 3 shows the modular inverse computation
    And step 4 displays the result R with its coordinates on the grid
    And the arithmetic is shown alongside each step
```

---

### Scenario #10 — [P1] Use sliders to modify parameters

**Feature**: Configure Curve Parameters
**Bounded Context**: Curve Visualization
**Value**: CRITICAL — interactivity is the core promise; static curves would be a textbook, not an app
**Cost**: LOW — UI slider components bound to parameter state, re-render on change
**Dependencies**: #1, #2
**Est. TDD cycles**: 2

```gherkin
Feature: Configure Curve Parameters
  As a Learner
  I want to adjust the curve equation parameters interactively
  So that I can explore how different curves behave

  Scenario: Use sliders to modify parameters
    Given the Learner is on the curve visualization page
    And the curve y² = x³ + ax + b is displayed
    When the Learner drags the slider for parameter a from -1 to 2
    Then the curve updates continuously as the slider moves
    And the displayed equation reflects the current value of a
```

---

## P2 — Essential Arithmetic & Feedback (Complete MVP)

> These 13 scenarios complete the arithmetic toolkit (doubling, inverse, scalar multiplication)
> and provide essential error feedback. Together with P1, they form a usable educational product.

---

### Scenario #11 — [P2] Double a point over a finite field

**Feature**: Point Doubling
**Bounded Context**: Point Arithmetic
**Value**: IMPORTANT — doubling is half of scalar multiplication; needed for double-and-add
**Cost**: LOW — reuses addition engine with tangent slope formula instead of secant
**Dependencies**: #4, #5, #7
**Est. TDD cycles**: 2

```gherkin
Feature: Point Doubling
  As a Learner
  I want to double a point on the curve step by step
  So that I can understand the tangent construction for P + P

  Scenario: Double a point over a finite field
    Given the Learner is in finite field mode with p = 23, a = 1, b = 1
    And the Learner has selected point P = (0, 1)
    When the Learner requests the doubling of P
    Then step 1 computes the tangent slope s = (3x² + a) · (2y)⁻¹ mod 23
    And step 2 shows the modular inverse of 2y
    And step 3 computes the result coordinates
    And the result 2P is displayed on the grid
```

---

### Scenario #12 — [P2] Double a point over real numbers

**Feature**: Point Doubling
**Bounded Context**: Point Arithmetic
**Value**: IMPORTANT — tangent construction gives geometric intuition for doubling
**Cost**: LOW — extends addition with tangent slope and derivative formula
**Dependencies**: #3, #5, #7
**Est. TDD cycles**: 2

```gherkin
  Scenario: Double a point over real numbers
    Given the Learner is in real number mode with curve y² = x³ - 7x + 10
    And the Learner has selected point P = (1, 2)
    When the Learner requests the doubling of P
    Then step 1 draws the tangent line to the curve at P
    And step 2 highlights the second intersection point R' of the tangent with the curve
    And step 3 reflects R' over the x-axis to obtain R = 2P
    And the result R is displayed with its coordinates
    And the derivative formula for the slope is shown
```

---

### Scenario #13 — [P2] Show inverse over a finite field

**Feature**: Point Inverse
**Bounded Context**: Point Arithmetic
**Value**: IMPORTANT — inverse is a core group axiom; modular negation teaches 𝔽ₚ arithmetic
**Cost**: LOW — compute p - y, highlight both points, show computation
**Dependencies**: #4
**Est. TDD cycles**: 1

```gherkin
Feature: Point Inverse
  As a Learner
  I want to see the inverse of a point on the curve
  So that I can understand the symmetry property of the group

  Scenario: Show inverse over a finite field
    Given the Learner is in finite field mode with p = 23
    And the Learner has selected point P = (3, 5)
    When the Learner requests the inverse of P
    Then the point -P = (3, 18) is highlighted on the grid
    And the computation -5 mod 23 = 18 is shown
    And a visual link connects P and -P
```

---

### Scenario #14 — [P2] Show inverse over real numbers

**Feature**: Point Inverse
**Bounded Context**: Point Arithmetic
**Value**: IMPORTANT — y-axis reflection is the simplest visualization of group inverse
**Cost**: LOW — reflect y coordinate, draw vertical line
**Dependencies**: #3
**Est. TDD cycles**: 1

```gherkin
  Scenario: Show inverse over real numbers
    Given the Learner is in real number mode
    And the Learner has selected point P = (3, 5)
    When the Learner requests the inverse of P
    Then the point -P = (3, -5) is highlighted on the curve
    And a vertical line connecting P and -P is drawn
    And an explanation states that the inverse reflects over the x-axis
```

---

### Scenario #15 — [P2] Adding a point to the identity returns the same point

**Feature**: Point Addition
**Bounded Context**: Point Arithmetic
**Value**: IMPORTANT — identity axiom is one of the four group axioms; must be demonstrable
**Cost**: LOW — special case in addition logic, no geometric construction needed
**Dependencies**: #9
**Est. TDD cycles**: 1

```gherkin
  Scenario: Adding a point to the identity returns the same point
    Given an elliptic curve is displayed
    And the Learner has selected point P = (1, 2)
    When the Learner requests the addition P + O
    Then the app explains that O is the identity element
    And the result is P = (1, 2)
    And no geometric construction is needed
```

---

### Scenario #16 — [P2] Adding a point to its inverse yields the identity

**Feature**: Point Addition
**Bounded Context**: Point Arithmetic
**Value**: IMPORTANT — inverse axiom; the vertical line case is a key conceptual moment
**Cost**: LOW — detect vertical line, display special animation to point at infinity
**Dependencies**: #9, #13
**Est. TDD cycles**: 1

```gherkin
  Scenario: Adding a point to its inverse yields the identity
    Given an elliptic curve is displayed
    And the Learner has selected point P = (1, 2)
    And the Learner has selected point -P = (1, -2)
    When the Learner requests the addition P + (-P)
    Then step 1 shows a vertical line through P and -P
    And step 2 explains that a vertical line does not intersect the curve a third time
    And the result is the point at infinity O
```

---

### Scenario #17 — [P2] Scalar multiplication step by step

**Feature**: Scalar Multiplication
**Bounded Context**: Group Exploration
**Value**: IMPORTANT — bridge between point addition and cryptographic protocols; nP is the core of ECDH/ECDSA
**Cost**: MEDIUM — repeated addition orchestration, intermediate point tracking, multi-step animation
**Dependencies**: #9, #11
**Est. TDD cycles**: 3

```gherkin
Feature: Scalar Multiplication
  As a Learner
  I want to compute nP step by step for a given point P and scalar n
  So that I can understand how repeated addition works and leads to orbits

  Scenario: Compute scalar multiplication step by step
    Given an elliptic curve is displayed over a finite field
    And the Learner has selected point P = (0, 1) on curve over 𝔽₂₃ with a = 1, b = 1
    And the Learner enters the scalar n = 5
    When the Learner requests the computation of 5P
    Then step 1 shows 2P = P + P (doubling)
    And step 2 shows 3P = 2P + P (addition)
    And step 3 shows 4P = 3P + P (addition)
    And step 4 shows 5P = 4P + P (addition)
    And each intermediate result is plotted on the grid
    And the final result 5P is highlighted
```

---

### Scenario #18 — [P2] Explanation adapts to the field type

**Feature**: Contextual Explanations
**Bounded Context**: Learning Path
**Value**: IMPORTANT — ensures explanations are correct for both ℝ and 𝔽ₚ modes; wrong formulas would confuse learners
**Cost**: LOW — conditional text and formula selection based on current mode
**Dependencies**: #7
**Est. TDD cycles**: 1

```gherkin
  Scenario: Explanation adapts to the field type
    Given a step-by-step animation is in progress
    And the Learner is in finite field mode
    When the slope computation step is reached
    Then the explanation mentions modular arithmetic
    And the formula includes "mod p"
    And the modular inverse computation is detailed
```

---

### Scenario #19 — [P2] Singular curve parameters are explained (MERGED S06+S07)

**Feature**: Display Elliptic Curve over Real Numbers
**Bounded Context**: Curve Visualization
**Value**: IMPORTANT — invalid parameters are a learning opportunity in a didactic app; the discriminant condition is a key mathematical concept
**Cost**: LOW — discriminant computation + explanatory message
**Dependencies**: #1
**Est. TDD cycles**: 2

```gherkin
  Scenario Outline: Singular curve parameters are explained
    Given the Learner has opened the real number visualization mode
    And the Learner sets parameters a = <a> and b = <b>
    When the curve is rendered
    Then the app displays an explanation that the curve is singular
    And the explanation describes the <singularity_type> at the singular point
    And the condition 4a³ + 27b² ≠ 0 is shown
    And no curve is plotted

    Examples:
      | a  | b | singularity_type |
      | -3 | 2 | node             |
      | 0  | 0 | cusp             |
```

---

### Scenario #20 — [P2] Non-prime number is rejected with explanation

**Feature**: Display Elliptic Curve over a Finite Field
**Bounded Context**: Curve Visualization
**Value**: IMPORTANT — teaches that elliptic curve crypto requires prime fields; common misconception
**Cost**: LOW — primality test + educational message with nearest primes
**Dependencies**: #2
**Est. TDD cycles**: 1

```gherkin
  Scenario: Non-prime number is rejected with explanation
    Given the Learner has opened the finite field visualization mode
    And the Learner enters p = 15
    When the curve attempts to render
    Then the app explains that p must be a prime number
    And it suggests the nearest primes: 13 and 17
```

---

### Scenario #21 — [P2] Change the prime field

**Feature**: Display Elliptic Curve over a Finite Field
**Bounded Context**: Curve Visualization
**Value**: IMPORTANT — exploring different primes shows how group structure varies; essential for understanding security parameters
**Cost**: LOW — recompute point set on new field, resize grid
**Dependencies**: #2
**Est. TDD cycles**: 1

```gherkin
  Scenario: Change the prime field
    Given the curve over 𝔽₂₃ is displayed with a = 1 and b = 1
    When the Learner changes the prime to p = 31
    Then the grid resizes to 31 × 31
    And the points are recalculated for the new field
    And the point count updates
```

---

### Scenario #22 — [P2] Adjust parameter and see curve update

**Feature**: Display Elliptic Curve over Real Numbers
**Bounded Context**: Curve Visualization
**Value**: IMPORTANT — real-time parameter feedback is core to interactive exploration
**Cost**: LOW — re-render on slider change (infrastructure from #10)
**Dependencies**: #1, #10
**Est. TDD cycles**: 1

```gherkin
  Scenario: Adjust parameter a and see the curve update
    Given the Learner has opened the real number visualization mode
    And the curve y² = x³ - x + 1 is displayed
    When the Learner changes parameter a to -3
    Then the curve updates in real time to y² = x³ - 3x + 1
    And the shape of the curve visibly changes
```

---

### Scenario #23 — [P2] No points selected / insufficient selection

**Feature**: Point Addition
**Bounded Context**: Point Arithmetic
**Value**: IMPORTANT — prevents confusion when user tries operations without selecting points
**Cost**: LOW — selection count validation + prompt message
**Dependencies**: #3 or #4
**Est. TDD cycles**: 1

```gherkin
  Scenario: No points selected for operation
    Given an elliptic curve is displayed
    And the Learner has not selected any point
    When the Learner requests an addition
    Then the app prompts the Learner to select two points first

  Scenario: Only one point selected for addition
    Given an elliptic curve is displayed
    And the Learner has selected only point P = (1, 2)
    When the Learner requests an addition
    Then the app prompts the Learner to select a second point
```

---

## --- MVP CUT LINE ---

> Everything above (P1 + P2 = 23 scenarios, ~44 TDD cycles) constitutes a **minimum viable
> educational product**: the learner can visualize curves on ℝ and 𝔽ₚ, select points, perform
> addition/doubling/inverse with step-by-step animations, compute scalar multiplication,
> and receive contextual mathematical explanations. Error cases guide rather than block.

---

## P3 — Group Structure & Crypto Bridge (High Value, Post-MVP)

> These 14 scenarios add group exploration (orbit, order, axioms) and the first
> cryptographic demonstrations (discrete log, ECDH). They transform the MVP from
> an arithmetic tool into a complete group theory + crypto educator.

---

### Scenario #24 — [P3] Visualize the orbit of a point

**Feature**: Scalar Multiplication
**Bounded Context**: Group Exploration
**Value**: IMPORTANT — the orbit is the visual "aha moment" for cyclic groups; seeing points cycle back to O is deeply educational
**Cost**: MEDIUM — sequential animation of all multiples, trail rendering, order detection
**Dependencies**: #17
**Est. TDD cycles**: 3

```gherkin
  Scenario: Visualize the orbit of a point
    Given an elliptic curve is displayed over a finite field
    And the Learner has selected point P on the curve
    When the Learner requests the full orbit of P
    Then all points P, 2P, 3P, ..., nP = O are computed sequentially
    And each point appears on the grid one by one in animation
    And a trail connects successive points
    And the order of P is displayed when O is reached
```

---

### Scenario #25 — [P3] Compute and display the order of a point

**Feature**: Point Order and Subgroup Visualization
**Bounded Context**: Group Exploration
**Value**: IMPORTANT — point order is the bridge to understanding subgroup structure and generator selection for crypto
**Cost**: MEDIUM — iterative computation until O, subgroup highlighting on grid
**Dependencies**: #17
**Est. TDD cycles**: 3

```gherkin
Feature: Point Order and Subgroup Visualization
  As a Learner
  I want to see the order of a point and the subgroup it generates
  So that I can understand the cyclic structure of elliptic curve groups

  Scenario: Compute and display the order of a point
    Given an elliptic curve is displayed over a finite field
    And the Learner has selected point P = (0, 1) on curve over 𝔽₂₃
    When the Learner requests the order of P
    Then the app computes P, 2P, 3P, ..., until nP = O
    And the order n is displayed
    And all points in the subgroup are highlighted on the grid
```

---

### Scenario #26 — [P3] Demonstrate commutativity

**Feature**: Group Properties Demonstration
**Bounded Context**: Group Exploration
**Value**: IMPORTANT — commutativity (abelian group) is the most intuitive axiom to verify visually and the most satisfying to see confirmed
**Cost**: MEDIUM — dual computation P+Q and Q+P, side-by-side display, result comparison
**Dependencies**: #9
**Est. TDD cycles**: 3

```gherkin
Feature: Group Properties Demonstration
  As a Learner
  I want to verify the group axioms visually
  So that I can convince myself that elliptic curve points form a group

  Scenario: Demonstrate commutativity
    Given an elliptic curve is displayed
    And the Learner has selected points P = (0, 1) and Q = (6, 4)
    When the Learner requests commutativity verification
    Then the app computes P + Q step by step
    And then computes Q + P step by step
    And both results are displayed side by side
    And the app confirms that P + Q = Q + P
```

---

### Scenario #27 — [P3] Demonstrate associativity

**Feature**: Group Properties Demonstration
**Bounded Context**: Group Exploration
**Value**: IMPORTANT — associativity is the hardest group axiom to intuit geometrically; proving it visually is a unique educational contribution
**Cost**: MEDIUM — triple computation with two groupings, side-by-side comparison, 3 point selection
**Dependencies**: #9
**Est. TDD cycles**: 3

```gherkin
  Scenario: Demonstrate associativity
    Given an elliptic curve is displayed
    And the Learner has selected points P, Q, and R on the curve
    When the Learner requests associativity verification
    Then the app computes (P + Q) + R step by step
    And then computes P + (Q + R) step by step
    And both results are displayed side by side
    And the app confirms that (P + Q) + R = P + (Q + R)
```

---

### Scenario #28 — [P3] Demonstrate identity element

**Feature**: Group Properties Demonstration
**Bounded Context**: Group Exploration
**Value**: IMPORTANT — completes the group axiom quartet
**Cost**: LOW — simple P+O computation, reuses existing addition with identity
**Dependencies**: #15
**Est. TDD cycles**: 1

```gherkin
  Scenario: Demonstrate identity element
    Given an elliptic curve is displayed
    And the Learner has selected point P = (3, 5)
    When the Learner requests identity verification
    Then the app computes P + O
    And the result is P = (3, 5)
    And the app confirms that O is the identity element
```

---

### Scenario #29 — [P3] Demonstrate closure

**Feature**: Group Properties Demonstration
**Bounded Context**: Group Exploration
**Value**: IMPORTANT — closure proves the set + operation forms an algebraic structure
**Cost**: LOW — compute P+Q, verify result satisfies curve equation, display confirmation
**Dependencies**: #9
**Est. TDD cycles**: 1

```gherkin
  Scenario: Demonstrate closure
    Given an elliptic curve is displayed
    And the Learner has selected points P and Q on the curve
    When the Learner requests closure verification
    Then the app computes P + Q = R
    And verifies that R satisfies the curve equation
    And the app confirms that the group is closed under addition
```

---

### Scenario #30 — [P3] Forward computation is easy (DLP)

**Feature**: Discrete Logarithm Problem
**Bounded Context**: Cryptographic Protocol
**Value**: IMPORTANT — the asymmetry easy-forward/hard-reverse is THE security foundation of all EC crypto
**Cost**: MEDIUM — double-and-add computation with step counting, performance display
**Dependencies**: #17
**Est. TDD cycles**: 3

```gherkin
Feature: Discrete Logarithm Problem
  As a Learner
  I want to understand why the discrete logarithm problem is hard on elliptic curves
  So that I can grasp the security foundation of elliptic curve cryptography

  Scenario: Forward computation is easy
    Given the Learner is in the cryptographic protocol section
    And a curve over 𝔽ₚ is configured with a base point G
    And the base point G and scalar n = 17
    When the Learner requests the computation of Q = 17G
    Then the app computes Q step by step using double-and-add
    And displays the result Q on the grid
    And shows the computation took a small number of steps
    And explains that computing nG is efficient (polynomial time)
```

---

### Scenario #31 — [P3] Reverse computation is hard (DLP)

**Feature**: Discrete Logarithm Problem
**Bounded Context**: Cryptographic Protocol
**Value**: IMPORTANT — experiencing the brute-force search viscerally demonstrates why EC crypto works
**Cost**: MEDIUM — brute-force animation with growing counter, explanation of exponential difficulty
**Dependencies**: #17
**Est. TDD cycles**: 3

```gherkin
  Scenario: Reverse computation is hard
    Given the Learner is in the cryptographic protocol section
    And a curve over 𝔽ₚ is configured with a base point G
    And the base point G and a target point Q = 17G
    When the Learner requests to find n such that Q = nG
    Then the app begins a brute-force search: G, 2G, 3G, ...
    And each attempt is shown on the grid
    And the growing number of attempts is displayed
    And the app explains that no shortcut is known (exponential time)
```

---

### Scenario #32 — [P3] ECDH complete key exchange

**Feature**: ECDH Key Exchange
**Bounded Context**: Cryptographic Protocol
**Value**: IMPORTANT — ECDH is the most intuitive crypto protocol and directly demonstrates why the group structure matters for key exchange
**Cost**: HIGH — multi-party protocol with 5 steps, dual scalar multiplications, shared secret verification, rich animation
**Dependencies**: #17
**Est. TDD cycles**: 5

```gherkin
Feature: ECDH Key Exchange
  As a Learner
  I want to simulate an Elliptic Curve Diffie-Hellman key exchange
  So that I can understand how two parties agree on a shared secret

  Scenario: Complete key exchange step by step
    Given the Learner is in the ECDH demonstration section
    And a curve over 𝔽ₚ is configured with a base point G of known order
    And Alice chooses her private key a = 7
    And Bob chooses his private key b = 11
    When the Learner starts the ECDH demonstration
    Then step 1 shows Alice computing her public key A = 7G on the grid
    And step 2 shows Bob computing his public key B = 11G on the grid
    And step 3 shows Alice and Bob exchanging public keys
    And step 4 shows Alice computing the shared secret S = 7B = 7 · 11G
    And step 5 shows Bob computing the shared secret S = 11A = 11 · 7G
    And both computations are shown to produce the same point S
    And the app highlights that a · bG = b · aG by commutativity of scalar multiplication
```

---

### Scenario #33 — [P3] Switch between ℝ and 𝔽ₚ preserves parameters

**Feature**: Configure Curve Parameters
**Bounded Context**: Curve Visualization
**Value**: IMPORTANT — seamless mode switching enables the pedagogical ℝ→𝔽ₚ progression
**Cost**: LOW — state preservation across mode change, prime prompt on switch to 𝔽ₚ
**Dependencies**: #1, #2
**Est. TDD cycles**: 1

```gherkin
  Scenario: Switch between real and finite field mode preserves parameters
    Given the Learner is on the curve visualization page
    And the Learner is viewing the curve with a = 1 and b = 1 over real numbers
    When the Learner switches to finite field mode
    Then the parameters a = 1 and b = 1 are preserved
    And the Learner is prompted to choose a prime p
```

---

### Scenario #34 — [P3] Snap to nearest point on finite field

**Feature**: Point Selection
**Bounded Context**: Point Arithmetic
**Value**: IMPORTANT — on a discrete grid, precise clicking is frustrating; snap-to-nearest is essential UX
**Cost**: LOW — Euclidean distance to nearest valid point
**Dependencies**: #4
**Est. TDD cycles**: 1

```gherkin
  Scenario: Click near but not exactly on a valid point over a finite field
    Given an elliptic curve is displayed
    And the Learner is in finite field mode
    When the Learner clicks between grid points, closest to (6, 4)
    Then the point (6, 4) is snapped to and selected
```

---

### Scenario #35 — [P3] Same point selected twice triggers doubling

**Feature**: Point Addition
**Bounded Context**: Point Arithmetic
**Value**: IMPORTANT — prevents user confusion when P=Q; correctly delegates to doubling
**Cost**: LOW — equality check on selected points, delegate to doubling animation
**Dependencies**: #9, #11
**Est. TDD cycles**: 1

```gherkin
  Scenario: Two selected points are the same triggers doubling
    Given an elliptic curve is displayed
    And the Learner has selected point P = (1, 2)
    And the Learner selects the same point P = (1, 2) as the second operand
    When the Learner requests the addition
    Then the app informs that P + P will use the doubling construction
    And the doubling step-by-step animation plays
```

---

### Scenario #36 — [P3] Singular curve over finite field

**Feature**: Display Elliptic Curve over a Finite Field
**Bounded Context**: Curve Visualization
**Value**: IMPORTANT — consistency with ℝ singular curve handling; discriminant mod p is a distinct concept
**Cost**: LOW — discriminant mod p check, educational message
**Dependencies**: #2
**Est. TDD cycles**: 1

```gherkin
  Scenario: Singular curve over finite field
    Given the Learner has opened the finite field visualization mode
    And the prime is set to p = 23
    And the parameters produce a discriminant of zero modulo 23
    When the curve attempts to render
    Then the app explains that the curve is singular over 𝔽₂₃
    And no points are plotted
```

---

### Scenario #37 — [P3] Highlight a generator of the full group

**Feature**: Point Order and Subgroup Visualization
**Bounded Context**: Group Exploration
**Value**: IMPORTANT — generators are the base points used in crypto; understanding them bridges group theory to key generation
**Cost**: LOW — compare point order to group order, special message and full highlight
**Dependencies**: #25
**Est. TDD cycles**: 1

```gherkin
  Scenario: Highlight a generator of the full group
    Given an elliptic curve is displayed over a finite field
    And the Learner has selected a point G whose order equals the group order
    When the order computation completes
    Then the app indicates that G is a generator of the entire group
    And all points on the curve are highlighted as part of the subgroup
```

---

## P4 — ECDSA, Polish & Educational Edge Cases (Comfort)

> These 24 scenarios add ECDSA, algorithm visualizations, and important edge cases
> that deepen understanding. They enrich the experience but are not blocking.

---

### Scenario #38 — [P4] ECDSA: Sign a message step by step

**Feature**: ECDSA Digital Signature
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — ECDSA is in scope but complex; the signing process involves hash, nonce, and multi-step computation
**Cost**: HIGH — hash abstraction, nonce generation, 5-step protocol, formula rendering
**Dependencies**: #17
**Est. TDD cycles**: 5

```gherkin
Feature: ECDSA Digital Signature
  As a Learner
  I want to simulate an ECDSA signature and verification
  So that I can understand how digital signatures work on elliptic curves

  Scenario: Sign a message step by step
    Given the Learner is in the ECDSA demonstration section
    And a curve over 𝔽ₚ is configured with base point G of order n
    And a signer has private key d and public key Q = dG
    And the signer's private key is d = 7
    And the message to sign is "Hello"
    When the Learner starts the signing demonstration
    Then step 1 shows the hash of "Hello" being computed as integer e
    And step 2 shows a random nonce k being chosen
    And step 3 computes the point R = kG on the grid
    And step 4 extracts r = R.x mod n
    And step 5 computes s = k⁻¹(e + r·d) mod n
    And the signature (r, s) is displayed
```

---

### Scenario #39 — [P4] ECDSA: Verify a valid signature step by step

**Feature**: ECDSA Digital Signature
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — completes the signing story; verification is the payoff of the signing demo
**Cost**: HIGH — modular inverse, dual scalar multiplication, coordinate verification
**Dependencies**: #38
**Est. TDD cycles**: 4

```gherkin
  Scenario: Verify a valid signature step by step
    Given the Learner is in the ECDSA demonstration section
    And a curve over 𝔽ₚ is configured with base point G of order n
    And a signer has private key d and public key Q = dG
    And a message "Hello" with signature (r, s)
    And the signer's public key Q is known
    When the Learner starts the verification demonstration
    Then step 1 computes the hash e of "Hello"
    And step 2 computes w = s⁻¹ mod n
    And step 3 computes u₁ = e·w mod n and u₂ = r·w mod n
    And step 4 computes the verification point V = u₁G + u₂Q on the grid
    And step 5 checks that V.x mod n equals r
    And the verification succeeds
    And the app explains why the math guarantees correctness
```

---

### Scenario #40 — [P4] Double-and-add visualization

**Feature**: Scalar Multiplication
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — shows the efficient algorithm used in real crypto implementations
**Cost**: MEDIUM — binary representation, alternating double/add steps
**Dependencies**: #17
**Est. TDD cycles**: 3

```gherkin
  Scenario: Large scalar uses double-and-add visualization
    Given an elliptic curve is displayed over a finite field
    And the Learner enters a scalar n = 42
    When the Learner requests the computation
    Then the app offers to show the double-and-add method
    And each doubling and addition step is shown
    And the binary representation of 42 is displayed alongside
```

---

### Scenario #41 — [P4] Custom private keys for ECDH

**Feature**: ECDH Key Exchange
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — personalization lets learners experiment with different key values
**Cost**: LOW — input binding to protocol parameters
**Dependencies**: #32
**Est. TDD cycles**: 1

```gherkin
  Scenario: Learner inputs custom private keys
    Given the Learner is in the ECDH demonstration section
    And a curve over 𝔽ₚ is configured with a base point G of known order
    And the Learner enters private key a = 3 for Alice
    And the Learner enters private key b = 5 for Bob
    When the exchange is performed
    Then all steps are computed with these custom values
    And the shared secret is verified to match
```

---

### Scenario #42 — [P4] Curve topology depends on parameters (MERGED S03+S04)

**Feature**: Display Elliptic Curve over Real Numbers
**Bounded Context**: Curve Visualization
**Value**: NICE-TO-HAVE — shows the mathematical relationship between discriminant sign and curve topology
**Cost**: LOW — already rendered by core curve display
**Dependencies**: #1
**Est. TDD cycles**: 1

```gherkin
  Scenario Outline: Curve topology depends on parameters
    Given the Learner has opened the real number visualization mode
    And the parameters are set to a = <a> and b = <b>
    When the curve is rendered
    Then the curve displays <component_count> connected component(s)
    And the components are clearly visible

    Examples:
      | a  | b | component_count |
      | -3 | 2 | two             |
      | -1 | 1 | one             |
```

---

### Scenario #43 — [P4] Grid adapts to prime field size (MERGED S10+S11)

**Feature**: Display Elliptic Curve over a Finite Field
**Bounded Context**: Curve Visualization
**Value**: NICE-TO-HAVE — ensures readability across different prime sizes
**Cost**: LOW — responsive grid spacing
**Dependencies**: #2
**Est. TDD cycles**: 1

```gherkin
  Scenario Outline: Grid adapts to prime field size
    Given the Learner has opened the finite field visualization mode
    And the prime is set to p = <prime>
    And the parameters are set to a = 1 and b = 1
    When the curve is rendered
    Then a <prime> × <prime> grid is displayed
    And <labeling_behavior>

    Examples:
      | prime | labeling_behavior                                  |
      | 5     | each point is individually labeled with coordinates |
      | 97    | points remain distinguishable with adapted spacing  |
```

---

### Scenario #44 — [P4] Doubling point with y=0 yields identity (MERGED S28+S29)

**Feature**: Point Doubling
**Bounded Context**: Point Arithmetic
**Value**: NICE-TO-HAVE — teaches that points with y=0 have order 2; links to subgroup structure
**Cost**: LOW — tangent slope check for y=0 case
**Dependencies**: #11, #12
**Est. TDD cycles**: 1

```gherkin
  Scenario Outline: Doubling a point with y=0 yields the identity
    Given the Learner is in <field_mode> mode
    And the Learner has selected a point P with y = 0
    When the Learner requests the doubling of P
    Then the app explains that <reason>
    And the result is the point at infinity O
    And the app explains this means P has order 2

    Examples:
      | field_mode   | reason                                          |
      | real number  | the tangent is vertical and does not intersect the curve again |
      | finite field | 2y = 0 has no modular inverse                   |
```

---

### Scenario #45 — [P4] Self-inverse points (MERGED S33+S34)

**Feature**: Point Inverse
**Bounded Context**: Point Arithmetic
**Value**: NICE-TO-HAVE — mathematical insight about self-inverse elements
**Cost**: LOW — display self-inverse property
**Dependencies**: #13
**Est. TDD cycles**: 1

```gherkin
  Scenario Outline: Self-inverse points
    Given an elliptic curve is displayed
    When the Learner requests the inverse of <point_description>
    Then the app shows that <inverse_result>
    And an explanation states that <reason>

    Examples:
      | point_description         | inverse_result | reason                                    |
      | a point P = (x, 0)       | -P = P         | points on the x-axis are their own inverse |
      | the point at infinity O   | -O = O         | the identity is its own inverse            |
```

---

### Scenario #46 — [P4] Scalar multiplication boundary values (MERGED S45+S46)

**Feature**: Scalar Multiplication
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — boundary cases deepen understanding of scalar multiplication
**Cost**: LOW — special cases for n=0 and n=1
**Dependencies**: #17
**Est. TDD cycles**: 1

```gherkin
  Scenario Outline: Scalar multiplication boundary values
    Given an elliptic curve is displayed over a finite field
    And the Learner has selected a point P
    And the Learner enters the scalar n = <n>
    When the computation is performed
    Then the result is <result>
    And the app explains that <explanation>

    Examples:
      | n | result                      | explanation                              |
      | 0 | 0P = O (point at infinity)  | multiplying by zero yields the identity  |
      | 1 | 1P = P                      | multiplying by 1 returns the point itself |
```

---

### Scenario #47 — [P4] Select the point at infinity

**Feature**: Point Selection
**Bounded Context**: Point Arithmetic
**Value**: NICE-TO-HAVE — completeness; allows using O as an explicit operand
**Cost**: LOW — click handler on O symbol
**Dependencies**: #4
**Est. TDD cycles**: 1

```gherkin
  Scenario: Select the point at infinity
    Given an elliptic curve is displayed
    And the app displays the point at infinity symbol O
    When the Learner clicks on the O symbol
    Then the point at infinity is selected as an operand
```

---

### Scenario #48 — [P4] Deselect a point

**Feature**: Point Selection
**Bounded Context**: Point Arithmetic
**Value**: NICE-TO-HAVE — UX convenience for correcting mistakes
**Cost**: LOW — toggle selection on re-click
**Dependencies**: #3 or #4
**Est. TDD cycles**: 1

```gherkin
  Scenario: Deselect a point
    Given an elliptic curve is displayed
    And point P = (1, 2) is currently selected
    When the Learner clicks on P again
    Then P is deselected
    And the highlight is removed
```

---

### Scenario #49 — [P4] Skip to the final result

**Feature**: Step-by-Step Animation Control
**Bounded Context**: Learning Path
**Value**: NICE-TO-HAVE — convenience for re-running familiar operations
**Cost**: LOW — apply all remaining steps instantly
**Dependencies**: #5
**Est. TDD cycles**: 1

```gherkin
  Scenario: Skip to the final result
    Given a step-by-step animation is playing
    And the animation is at step 1 of 5
    When the Learner clicks the "skip to end" button
    Then all remaining steps are applied instantly
    And the final result is displayed
    And all construction lines remain visible
```

---

### Scenario #50 — [P4] Animation boundary navigation (MERGED S82+S83)

**Feature**: Step-by-Step Animation Control
**Bounded Context**: Learning Path
**Value**: NICE-TO-HAVE — prevents confusion at animation boundaries
**Cost**: LOW — disable button when at boundary
**Dependencies**: #5, #6
**Est. TDD cycles**: 1

```gherkin
  Scenario Outline: Animation boundary navigation
    Given a step-by-step animation is playing
    And the animation is at step <current> of 5
    When the Learner clicks the "<button>" button
    Then nothing happens
    And the button appears disabled

    Examples:
      | current | button        |
      | 1       | previous step |
      | 5       | next step     |
```

---

### Scenario #51 — [P4] Scalar multiplication reaches the identity

**Feature**: Scalar Multiplication
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — connects scalar multiplication to point order and cyclic subgroups
**Cost**: LOW — special message when result is O and n equals order
**Dependencies**: #17
**Est. TDD cycles**: 1

```gherkin
  Scenario: Scalar multiplication reaches the identity
    Given an elliptic curve is displayed over a finite field
    And the order of point P is 7
    And the Learner enters the scalar n = 7
    When the computation completes
    Then the result is 7P = O
    And the app highlights that n equals the order of P
    And an explanation about cyclic subgroups is displayed
```

---

### Scenario #52 — [P4] Small group trivializes DLP

**Feature**: Discrete Logarithm Problem
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — demonstrates why key size matters for security
**Cost**: MEDIUM — parameterize with small group, fast brute-force
**Dependencies**: #31
**Est. TDD cycles**: 2

```gherkin
  Scenario: Small group makes the problem trivially solvable
    Given the Learner is in the cryptographic protocol section
    And a curve over 𝔽ₚ is configured with a base point G
    And the curve has a group of order 7
    And Q = 5G
    When the brute-force search is performed
    Then the answer n = 5 is found after 5 steps
    And the app explains that small groups provide no security
```

---

### Scenario #53 — [P4] Larger prime demonstrates DLP difficulty

**Feature**: Discrete Logarithm Problem
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — bridges from toy examples to real-world security parameters
**Cost**: MEDIUM — timing display, extrapolation text for 256-bit primes
**Dependencies**: #31
**Est. TDD cycles**: 2

```gherkin
  Scenario: Larger prime demonstrates computational difficulty
    Given the Learner is in the cryptographic protocol section
    And a curve over 𝔽ₚ is configured with a base point G
    And p = 97 and the group order is large
    When the Learner requests the reverse computation
    Then the brute-force search visibly slows down
    And the app extrapolates the difficulty for cryptographic-size primes (256 bits)
```

---

### Scenario #54 — [P4] Explanation for degenerate cases

**Feature**: Contextual Explanations
**Bounded Context**: Learning Path
**Value**: NICE-TO-HAVE — the vertical line / point at infinity explanation is a key conceptual link
**Cost**: LOW — special-case text for degenerate operations
**Dependencies**: #7
**Est. TDD cycles**: 1

```gherkin
  Scenario: Explanation for a degenerate case
    Given a step-by-step animation is in progress
    And the Learner is adding P + (-P)
    When the vertical line step is reached
    Then the explanation describes why the vertical line yields no third intersection
    And introduces the concept of the point at infinity as a necessary completion
    And links to the group identity axiom
```

---

### Scenario #55 — [P4] All group properties summarized

**Feature**: Group Properties Demonstration
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — provides a session-wide summary dashboard for axiom verification
**Cost**: MEDIUM — session tracking of verified axioms, summary view
**Dependencies**: #26, #27, #28, #29
**Est. TDD cycles**: 2

```gherkin
  Scenario: All properties summarized
    Given an elliptic curve is displayed
    When the Learner requests a full group axiom summary
    Then the app lists all four axioms: closure, associativity, identity, inverse
    And indicates which have been verified in this session
    And offers to verify any remaining axiom
```

---

### Scenario #56 — [P4] Associativity with the point at infinity

**Feature**: Group Properties Demonstration
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — edge verification with identity element
**Cost**: LOW — O as operand in associativity check
**Dependencies**: #27
**Est. TDD cycles**: 1

```gherkin
  Scenario: Associativity with the point at infinity
    Given an elliptic curve is displayed
    And the Learner selects P, Q = O, and R
    When associativity is verified
    Then both (P + O) + R and P + (O + R) equal P + R
    And the app confirms associativity holds even with the identity
```

---

### Scenario #57 — [P4] Animation interrupted by parameter change

**Feature**: Step-by-Step Animation Control
**Bounded Context**: Learning Path
**Value**: NICE-TO-HAVE — prevents inconsistent state when parameters change mid-animation
**Cost**: MEDIUM — cancel logic, reset, invalidation message
**Dependencies**: #5, #10
**Est. TDD cycles**: 2

```gherkin
  Scenario: Animation interrupted by parameter change
    Given a step-by-step animation is playing
    And the animation is at step 3 of 5
    When the Learner changes a curve parameter
    Then the animation is cancelled
    And the visualization resets with the new parameters
    And a message explains that the previous operation was invalidated
```

---

### Scenario #58 — [P4] Non-number parameter rejected

**Feature**: Configure Curve Parameters
**Bounded Context**: Curve Visualization
**Value**: NICE-TO-HAVE — basic input validation
**Cost**: LOW — type check on input
**Dependencies**: #10
**Est. TDD cycles**: 1

```gherkin
  Scenario: Manually entered parameter is not a number
    Given the Learner is on the curve visualization page
    And the Learner types "abc" into the parameter a input field
    Then the input is rejected
    And a message indicates that a must be a number
```

---

### Scenario #59 — [P4] Discriminant warning indicator

**Feature**: Configure Curve Parameters
**Bounded Context**: Curve Visualization
**Value**: NICE-TO-HAVE — proactive UX that warns before reaching singularity
**Cost**: MEDIUM — live discriminant computation, color-coded indicator
**Dependencies**: #10
**Est. TDD cycles**: 2

```gherkin
  Scenario: Discriminant indicator warns before reaching singularity
    Given the Learner is on the curve visualization page
    And the Learner is adjusting parameter b with a slider
    When the discriminant approaches zero
    Then a visual indicator shows the discriminant value decreasing
    And the indicator turns to a warning color near zero
```

---

### Scenario #60 — [P4] Doubling the point at infinity

**Feature**: Point Doubling
**Bounded Context**: Point Arithmetic
**Value**: NICE-TO-HAVE — mathematical completeness
**Cost**: LOW — O+O=O special case message
**Dependencies**: #11
**Est. TDD cycles**: 1

```gherkin
  Scenario: Doubling the point at infinity
    Given an elliptic curve is displayed
    And the Learner attempts to double the point at infinity O
    When the doubling is requested
    Then the app explains that O + O = O
    And the result is O
```

---

### Scenario #61 — [P4] Negative scalar

**Feature**: Scalar Multiplication
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — mathematical correctness for negative inputs
**Cost**: LOW — compute |n|P then take inverse
**Dependencies**: #17, #13
**Est. TDD cycles**: 1

```gherkin
  Scenario: Negative scalar
    Given an elliptic curve is displayed over a finite field
    And the Learner enters the scalar n = -3
    When the computation is performed
    Then the app computes 3P first, then takes its inverse
    And explains that -nP = n(-P) = -(nP)
```

---

## P5 — Remaining Edge Cases & Error Handling (Optional, Defer)

> These 22 scenarios cover rare edge cases, ECDSA security demonstrations,
> niche error handling, and UI polish. They can safely be deferred to a later iteration.

---

### Scenario #62 — [P5] ECDSA: Nonce reuse vulnerability

**Feature**: ECDSA Digital Signature
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — security lesson about nonce reuse (famous PlayStation 3 hack)
**Cost**: HIGH — dual signing with same nonce, key recovery demonstration
**Dependencies**: #38
**Est. TDD cycles**: 4

```gherkin
  Scenario: Nonce reuse demonstrates vulnerability
    Given the Learner is in the ECDSA demonstration section
    And a curve over 𝔽ₚ is configured with base point G of order n
    And a signer has private key d and public key Q = dG
    And the signer signs two different messages with the same nonce k
    When both signatures are displayed
    Then the app shows that the private key can be recovered from the two signatures
    And explains why nonce reuse breaks ECDSA security
```

---

### Scenario #63 — [P5] Tampered message fails ECDSA verification

**Feature**: ECDSA Digital Signature
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — demonstrates integrity property of digital signatures
**Cost**: MEDIUM — modify message, re-run verification, show failure
**Dependencies**: #39
**Est. TDD cycles**: 2

```gherkin
  Scenario: Tampered message fails verification
    Given the Learner is in the ECDSA demonstration section
    And a curve over 𝔽ₚ is configured with base point G of order n
    And a signer has private key d and public key Q = dG
    And a valid signature (r, s) for message "Hello"
    When the Learner changes the message to "World"
    And requests verification
    Then the verification point V.x does not equal r
    And the verification fails
    And the app explains that any change in the message invalidates the signature
```

---

### Scenario #64 — [P5] Wrong public key fails ECDSA verification

**Feature**: ECDSA Digital Signature
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — demonstrates key binding property
**Cost**: MEDIUM — swap public key, show verification failure
**Dependencies**: #39
**Est. TDD cycles**: 2

```gherkin
  Scenario: Wrong public key fails verification
    Given the Learner is in the ECDSA demonstration section
    And a curve over 𝔽ₚ is configured with base point G of order n
    And a signer has private key d and public key Q = dG
    And a valid signature (r, s) for message "Hello" signed by Alice
    When verification is attempted with Bob's public key
    Then the verification fails
    And the app explains that the signature is bound to the signer's key pair
```

---

### Scenario #65 — [P5] ECDH: Private key equals 1

**Feature**: ECDH Key Exchange
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — security warning for degenerate key
**Cost**: LOW — warning message
**Dependencies**: #32
**Est. TDD cycles**: 1

```gherkin
  Scenario: Private key equals 1
    Given the Learner is in the ECDH demonstration section
    And a curve over 𝔽ₚ is configured with a base point G of known order
    And Alice chooses private key a = 1
    When Alice computes her public key
    Then A = G (the base point itself)
    And the app warns that this provides no security
```

---

### Scenario #66 — [P5] ECDH: Private key equals the group order

**Feature**: ECDH Key Exchange
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — mathematical edge case
**Cost**: LOW — O result + explanation
**Dependencies**: #32
**Est. TDD cycles**: 1

```gherkin
  Scenario: Private key equals the group order
    Given the Learner is in the ECDH demonstration section
    And a curve over 𝔽ₚ is configured with a base point G of known order
    And the group order is n
    And Alice chooses private key a = n
    When Alice computes her public key
    Then A = O (the point at infinity)
    And the app explains that this is equivalent to choosing a = 0
```

---

### Scenario #67 — [P5] ECDH: Private key is zero

**Feature**: ECDH Key Exchange
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — input validation
**Cost**: LOW — reject + message
**Dependencies**: #32
**Est. TDD cycles**: 1

```gherkin
  Scenario: Private key is zero
    Given the Learner is in the ECDH demonstration section
    And a curve over 𝔽ₚ is configured with a base point G of known order
    And Alice enters private key a = 0
    Then the app rejects the key
    And explains that the private key must be between 1 and n - 1
```

---

### Scenario #68 — [P5] ECDH: Private key exceeds group order

**Feature**: ECDH Key Exchange
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — teaches modular reduction of scalars
**Cost**: LOW — warning + modular reduction explanation
**Dependencies**: #32
**Est. TDD cycles**: 1

```gherkin
  Scenario: Private key exceeds group order
    Given the Learner is in the ECDH demonstration section
    And a curve over 𝔽ₚ is configured with a base point G of known order
    And the group order is n = 29
    And Alice enters private key a = 35
    Then the app warns that the key should be between 1 and 28
    And explains that 35G = 6G due to modular reduction
```

---

### Scenario #69 — [P5] DLP: Target not in subgroup

**Feature**: Discrete Logarithm Problem
**Bounded Context**: Cryptographic Protocol
**Value**: NICE-TO-HAVE — teaches subgroup structure
**Cost**: MEDIUM — exhaustive search with failure detection
**Dependencies**: #31
**Est. TDD cycles**: 2

```gherkin
  Scenario: Target point is not in the subgroup generated by G
    Given the Learner is in the cryptographic protocol section
    And a curve over 𝔽ₚ is configured with a base point G
    And a point Q that is not a multiple of G
    When the Learner requests to find n
    Then the search exhausts all multiples of G without finding Q
    And the app explains that Q is not in the subgroup generated by G
```

---

### Scenario #70 — [P5] Extreme viewport adjustment

**Feature**: Display Elliptic Curve over Real Numbers
**Bounded Context**: Curve Visualization
**Value**: NICE-TO-HAVE — prevents curve from disappearing off-screen
**Cost**: MEDIUM — auto-zoom algorithm based on curve extent
**Dependencies**: #1
**Est. TDD cycles**: 2

```gherkin
  Scenario: Extreme parameter values require viewport adjustment
    Given the Learner has opened the real number visualization mode
    And the parameters are set to a = -100 and b = 500
    When the curve is rendered
    Then the viewport automatically adjusts to keep the curve visible
    And the axis labels reflect the new scale
```

---

### Scenario #71 — [P5] Result point outside viewport

**Feature**: Point Addition
**Bounded Context**: Point Arithmetic
**Value**: NICE-TO-HAVE — UX convenience for large-coordinate results
**Cost**: MEDIUM — pan + zoom animation to include all points
**Dependencies**: #8
**Est. TDD cycles**: 2

```gherkin
  Scenario: Result point is outside the current viewport
    Given an elliptic curve is displayed
    And the addition P + Q produces a result with very large coordinates
    When the result is computed
    Then the viewport smoothly pans and zooms to include the result point
    And all three points (P, Q, R) remain visible
```

---

### Scenario #72 — [P5] Click empty area on finite field

**Feature**: Point Selection
**Bounded Context**: Point Arithmetic
**Value**: NICE-TO-HAVE — subtle UX feedback
**Cost**: LOW — no-op + optional message
**Dependencies**: #4
**Est. TDD cycles**: 1

```gherkin
  Scenario: Click on an empty area with no nearby valid point
    Given an elliptic curve is displayed
    And the Learner is in finite field mode
    When the Learner clicks on a grid position that is not a curve point
    And no valid point is within snapping distance
    Then no point is selected
    And a subtle message indicates no valid point is nearby
```

---

### Scenario #73 — [P5] More than two points selected

**Feature**: Point Selection
**Bounded Context**: Point Arithmetic
**Value**: NICE-TO-HAVE — UX decision for selection overflow
**Cost**: LOW — FIFO replacement of oldest selection
**Dependencies**: #3 or #4
**Est. TDD cycles**: 1

```gherkin
  Scenario: Attempt to select more than two points
    Given an elliptic curve is displayed
    And the Learner has already selected two points P and Q
    When the Learner clicks on a third point
    Then the oldest selection (P) is replaced by the new point
    And the two most recent selections are shown as operands
```

---

### Scenario #74 — [P5] Non-integer scalar rejected

**Feature**: Scalar Multiplication
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — input validation
**Cost**: LOW — type check
**Dependencies**: #17
**Est. TDD cycles**: 1

```gherkin
  Scenario: Non-integer scalar is rejected
    Given an elliptic curve is displayed over a finite field
    And the Learner enters the scalar n = 2.5
    Then the input is rejected
    And a message explains that the scalar must be an integer
```

---

### Scenario #75 — [P5] Point at infinity has order 1

**Feature**: Point Order and Subgroup Visualization
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — trivial mathematical edge case
**Cost**: LOW — special case message
**Dependencies**: #25
**Est. TDD cycles**: 1

```gherkin
  Scenario: Point at infinity has order 1
    Given an elliptic curve is displayed over a finite field
    When the Learner requests the order of the point at infinity O
    Then the order is displayed as 1
    And the app explains that O generates the trivial subgroup
```

---

### Scenario #76 — [P5] Point of order 2

**Feature**: Point Order and Subgroup Visualization
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — links to y=0 doubling case
**Cost**: LOW — display {O, P} subgroup
**Dependencies**: #25
**Est. TDD cycles**: 1

```gherkin
  Scenario: Point of order 2
    Given an elliptic curve is displayed over a finite field
    And the Learner selects a point P with y = 0
    When the order is computed
    Then the order is 2
    And the subgroup {O, P} is highlighted
    And the app explains that P is its own inverse
```

---

### Scenario #77 — [P5] No point selected for order

**Feature**: Point Order and Subgroup Visualization
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — same validation pattern as #23
**Cost**: LOW — selection check
**Dependencies**: #25
**Est. TDD cycles**: 0 (shared implementation with #23)

```gherkin
  Scenario: No point selected for order
    Given an elliptic curve is displayed over a finite field
    And no point is selected
    When the Learner requests the order computation
    Then the app prompts to select a point first
```

---

### Scenario #78 — [P5] No point selected for inverse

**Feature**: Point Inverse
**Bounded Context**: Point Arithmetic
**Value**: NICE-TO-HAVE — same validation pattern
**Cost**: LOW — selection check
**Dependencies**: #13
**Est. TDD cycles**: 0 (shared implementation with #23)

```gherkin
  Scenario: No point selected for inverse
    Given an elliptic curve is displayed
    And the Learner has not selected any point
    When the Learner requests an inverse
    Then the app prompts the Learner to select a point first
```

---

### Scenario #79 — [P5] Not enough points for associativity

**Feature**: Group Properties Demonstration
**Bounded Context**: Group Exploration
**Value**: NICE-TO-HAVE — validation for 3-point operation
**Cost**: LOW — count check
**Dependencies**: #27
**Est. TDD cycles**: 1

```gherkin
  Scenario: Not enough points for associativity
    Given an elliptic curve is displayed
    And the Learner has selected only two points
    When the Learner requests associativity verification
    Then the app prompts to select a third point
```

---

### Scenario #80 — [P5] Collapse and expand explanation panel

**Feature**: Contextual Explanations
**Bounded Context**: Learning Path
**Value**: NICE-TO-HAVE — UI flexibility
**Cost**: LOW — toggle panel visibility
**Dependencies**: #7
**Est. TDD cycles**: 1

```gherkin
  Scenario: Collapse and expand explanation panel
    Given a step-by-step animation is in progress
    And the explanation panel is visible
    When the Learner collapses the panel
    Then only the visualization is shown
    And the panel can be re-expanded at any time
```

---

### Scenario #81 — [P5] Formulas render correctly with special characters

**Feature**: Contextual Explanations
**Bounded Context**: Learning Path
**Value**: NICE-TO-HAVE — rendering quality
**Cost**: MEDIUM — math rendering edge cases (superscripts, Greek letters, zoom)
**Dependencies**: #7
**Est. TDD cycles**: 2

```gherkin
  Scenario: Formulas render correctly with special characters
    Given a step-by-step animation is in progress
    And a step involves the computation of a modular inverse
    Then the formula displays superscript -1 notation
    And Greek letters (if any) are correctly rendered
    And the formula is readable at the current zoom level
```

---

### Scenario #82 — [P5] Explanation unavailable for custom operation

**Feature**: Contextual Explanations
**Bounded Context**: Learning Path
**Value**: NICE-TO-HAVE — graceful fallback
**Cost**: LOW — default message + suggestion
**Dependencies**: #7
**Est. TDD cycles**: 1

```gherkin
  Scenario: Explanation unavailable for custom operation
    Given a step-by-step animation is in progress
    And the Learner attempts an operation not covered by the tutorial system
    Then the app displays the computation result without a detailed explanation
    And suggests the nearest related tutorial topic
```

---

### Scenario #83 — [P5] No point selected for doubling (implied by #23 pattern)

**Feature**: Point Inverse / Point Doubling
**Bounded Context**: Point Arithmetic
**Value**: NICE-TO-HAVE — same "no selection" guard pattern
**Cost**: LOW — shared validation logic
**Dependencies**: #11
**Est. TDD cycles**: 0 (shared implementation)

> Not written as a separate Gherkin — uses the same selection validation infrastructure as Scenario #23.

---

## Appendix — Cross-Reference

| Original ID | New # | Priority | Simplification |
|-------------|-------|----------|----------------|
| S01 | #1  | P1 | — |
| S08 | #2  | P1 | — |
| S36 | #3  | P1 | — |
| S37 | #4  | P1 | — |
| S79 | #5  | P1 | — |
| S80 | #6  | P1 | — |
| S85 | #7  | P1 | — |
| S18 | #8  | P1 | — |
| S19 | #9  | P1 | — |
| S14 | #10 | P1 | — |
| S27 | #11 | P2 | — |
| S26 | #12 | P2 | — |
| S32 | #13 | P2 | — |
| S31 | #14 | P2 | — |
| S20 | #15 | P2 | — |
| S21 | #16 | P2 | — |
| S43 | #17 | P2 | — |
| S86 | #18 | P2 | — |
| S06+S07 | #19 | P2 | MERGED into Outline |
| S12 | #20 | P2 | — |
| S09 | #21 | P2 | — |
| S02 | #22 | P2 | — |
| S24+S25 | #23 | P2 | Pattern noted |
| S44 | #24 | P3 | — |
| S51 | #25 | P3 | — |
| S56 | #26 | P3 | — |
| S57 | #27 | P3 | — |
| S58 | #28 | P3 | — |
| S59 | #29 | P3 | — |
| S63 | #30 | P3 | — |
| S64 | #31 | P3 | — |
| S68 | #32 | P3 | — |
| S16 | #33 | P3 | — |
| S38 | #34 | P3 | — |
| S22 | #35 | P3 | — |
| S13 | #36 | P3 | — |
| S52 | #37 | P3 | — |
| S74 | #38 | P4 | — |
| S75 | #39 | P4 | — |
| S48 | #40 | P4 | — |
| S69 | #41 | P4 | — |
| S03+S04 | #42 | P4 | MERGED into Outline |
| S10+S11 | #43 | P4 | MERGED into Outline |
| S28+S29 | #44 | P4 | MERGED into Outline |
| S33+S34 | #45 | P4 | MERGED into Outline |
| S45+S46 | #46 | P4 | MERGED into Outline |
| S39 | #47 | P4 | — |
| S40 | #48 | P4 | — |
| S81 | #49 | P4 | — |
| S82+S83 | #50 | P4 | MERGED into Outline |
| S47 | #51 | P4 | — |
| S65 | #52 | P4 | — |
| S66 | #53 | P4 | — |
| S87 | #54 | P4 | — |
| S61 | #55 | P4 | — |
| S60 | #56 | P4 | — |
| S84 | #57 | P4 | — |
| S17 | #58 | P4 | — |
| S15 | #59 | P4 | — |
| S30 | #60 | P4 | — |
| S49 | #61 | P4 | — |
| S76 | #62 | P5 | — |
| S77 | #63 | P5 | — |
| S78 | #64 | P5 | — |
| S70 | #65 | P5 | — |
| S71 | #66 | P5 | — |
| S72 | #67 | P5 | — |
| S73 | #68 | P5 | — |
| S67 | #69 | P5 | — |
| S05 | #70 | P5 | — |
| S23 | #71 | P5 | — |
| S41 | #72 | P5 | — |
| S42 | #73 | P5 | — |
| S50 | #74 | P5 | — |
| S53 | #75 | P5 | — |
| S54 | #76 | P5 | — |
| S55 | #77 | P5 | — |
| S35 | #78 | P5 | — |
| S62 | #79 | P5 | — |
| S88 | #80 | P5 | — |
| S89 | #81 | P5 | — |
| S90 | #82 | P5 | — |
