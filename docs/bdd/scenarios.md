# BDD Scenarios — Elliptic Curve Group Theory Explorer

> Generated from client spec on 2026-04-04
> Source: direct input — "Interactive application to visually understand group theory on elliptic curves"

## Summary

| Bounded Context        | Features | Scenarios | Happy | Edge | Error |
|------------------------|----------|-----------|-------|------|-------|
| Curve Visualization    | 3        | 18        | 5     | 9    | 4     |
| Point Arithmetic       | 4        | 24        | 8     | 11   | 5     |
| Group Exploration      | 3        | 17        | 7     | 7    | 3     |
| Cryptographic Protocol | 3        | 15        | 6     | 5    | 4     |
| Learning Path          | 2        | 12        | 4     | 5    | 3     |
| **Total**              | **15**   | **86**    | **30**| **37**| **19**|

## Actors

| Actor         | Role                              | Goal                                                              |
|---------------|-----------------------------------|-------------------------------------------------------------------|
| Learner       | Student in mathematics/CS (L3/M1) | Visually understand point addition and group structure on elliptic curves |
| Presenter     | Teacher or lecturer               | Demonstrate elliptic curve group concepts during a class or talk  |

## Bounded Contexts

| Context                | Ubiquitous Language (key terms)                                                        |
|------------------------|----------------------------------------------------------------------------------------|
| Curve Visualization    | Curve, Parameter, Discriminant, Singular, Grid, Viewport, Prime Field, Real Field      |
| Point Arithmetic       | Point, Addition, Doubling, Inverse, Identity, Tangent, Secant, Intersection, Reflection, Step |
| Group Exploration      | Scalar Multiplication, Orbit, Order, Subgroup, Generator, Commutativity, Associativity, Closure |
| Cryptographic Protocol | Private Key, Public Key, Shared Secret, Signature, Verification, Discrete Logarithm, Base Point |
| Learning Path          | Animation, Step, Explanation, Tutorial, Progression, Concept                           |

## Hypotheses

> These assumptions were made where the spec was silent or ambiguous.
> **Review and validate before proceeding.**

1. **H1 — Real then Finite**: the app offers visualization over real numbers first (for geometric intuition), then over finite fields (for cryptographic math). Both modes coexist.
2. **H2 — Target audience**: university students (L3/M1 level) in mathematics or computer science.
3. **H3 — Discrete grid**: over 𝔽ₚ, points are displayed on a p×p discrete grid.
4. **H4 — Modular wrapping**: "lines" over 𝔽ₚ are visualized with modular wrapping to show how the secant/tangent operation works in modular arithmetic.
5. **H5 — Point at infinity symbol**: the identity element O is represented by a dedicated symbol outside the grid/curve, since it cannot be plotted geometrically.
6. **H6 — Invalid parameters are educational**: when the user enters invalid parameters (Δ=0, non-prime p), the app displays an explanation rather than just blocking input.
7. **H7 — Snap-to-nearest**: clicking near (but not exactly on) a point snaps to the nearest valid point on the curve/grid.
8. **H8 — Crypto scope**: ECDH key exchange, ECDSA signature, and the discrete logarithm problem are all in scope.
9. **H9 — ZK Proofs out of scope**: zero-knowledge proofs are planned for a future iteration and are not covered here.
10. **H10 — No persistence**: no save/share/export functionality in v1.
11. **H11 — Controllable steps**: each step-by-step animation allows forward, backward, and skip-to-end navigation.

---

## Curve Visualization

### Feature: Display Elliptic Curve over Real Numbers

```gherkin
Feature: Display Elliptic Curve over Real Numbers
  As a Learner
  I want to see an elliptic curve plotted on a Cartesian plane
  So that I can build geometric intuition before working with finite fields

  Background:
    Given the Learner has opened the real number visualization mode

  # --- Happy Path ---

  Scenario: Display a standard elliptic curve
    Given the parameters are set to a = -1 and b = 1
    When the curve is rendered
    Then the curve y² = x³ - x + 1 is displayed on the Cartesian plane
    And the curve is smooth and continuous
    And the x-axis and y-axis are visible with labeled graduations

  Scenario: Adjust parameter a and see the curve update
    Given the curve y² = x³ - x + 1 is displayed
    When the Learner changes parameter a to -3
    Then the curve updates in real time to y² = x³ - 3x + 1
    And the shape of the curve visibly changes

  # --- Edge Cases ---

  Scenario: Curve with two connected components
    Given the parameters are set to a = -3 and b = 2
    When the curve is rendered
    Then the curve displays two distinct connected components
    And both components are clearly visible

  Scenario: Curve with a single connected component
    Given the parameters are set to a = -1 and b = 1
    When the curve is rendered
    Then the curve displays a single connected component

  Scenario: Extreme parameter values require viewport adjustment
    Given the parameters are set to a = -100 and b = 500
    When the curve is rendered
    Then the viewport automatically adjusts to keep the curve visible
    And the axis labels reflect the new scale

  # --- Error Cases ---

  Scenario: Singular curve is rejected with explanation
    Given the Learner sets parameters a = -3 and b = 2
    And these parameters produce a discriminant equal to zero
    When the curve is rendered
    Then the app displays an explanation that the curve is singular
    And the explanation mentions that 4a³ + 27b² must not equal zero
    And no curve is plotted

  Scenario: Cusp singularity explanation
    Given the Learner sets parameters a = 0 and b = 0
    When the curve is rendered
    Then the app explains that y² = x³ has a cusp at the origin
    And a visual hint shows where the singularity occurs
```

### Feature: Display Elliptic Curve over a Finite Field

```gherkin
Feature: Display Elliptic Curve over a Finite Field
  As a Learner
  I want to see the points of an elliptic curve over a prime field 𝔽ₚ
  So that I can understand how elliptic curves work in cryptographic settings

  Background:
    Given the Learner has opened the finite field visualization mode

  # --- Happy Path ---

  Scenario: Display curve points over a small prime field
    Given the prime is set to p = 23
    And the parameters are set to a = 1 and b = 1
    When the curve is rendered
    Then a 23 × 23 grid is displayed
    And each point (x, y) satisfying y² ≡ x³ + x + 1 (mod 23) is highlighted
    And the total number of points is displayed (excluding the point at infinity)
    And the point at infinity O is shown as a dedicated symbol outside the grid

  Scenario: Change the prime field
    Given the curve over 𝔽₂₃ is displayed with a = 1 and b = 1
    When the Learner changes the prime to p = 31
    Then the grid resizes to 31 × 31
    And the points are recalculated for the new field
    And the point count updates

  # --- Edge Cases ---

  Scenario: Very small prime field
    Given the prime is set to p = 5
    And the parameters are set to a = 1 and b = 1
    When the curve is rendered
    Then a 5 × 5 grid is displayed
    And only a handful of points are highlighted
    And each point is individually labeled with its coordinates

  Scenario: Larger prime field adjusts point size
    Given the prime is set to p = 97
    When the curve is rendered
    Then the grid adapts its spacing to fit 97 × 97
    And points remain distinguishable

  # --- Error Cases ---

  Scenario: Non-prime number is rejected with explanation
    Given the Learner enters p = 15
    When the curve attempts to render
    Then the app explains that p must be a prime number
    And it suggests the nearest primes: 13 and 17

  Scenario: Singular curve over finite field
    Given the prime is set to p = 23
    And the parameters produce a discriminant of zero modulo 23
    When the curve attempts to render
    Then the app explains that the curve is singular over 𝔽₂₃
    And no points are plotted
```

### Feature: Configure Curve Parameters

```gherkin
Feature: Configure Curve Parameters
  As a Learner
  I want to adjust the curve equation parameters interactively
  So that I can explore how different curves behave

  Background:
    Given the Learner is on the curve visualization page

  # --- Happy Path ---

  Scenario: Use sliders to modify parameters
    Given the curve y² = x³ + ax + b is displayed
    When the Learner drags the slider for parameter a from -1 to 2
    Then the curve updates continuously as the slider moves
    And the displayed equation reflects the current value of a

  # --- Edge Cases ---

  Scenario: Discriminant indicator warns before reaching singularity
    Given the Learner is adjusting parameter b with a slider
    When the discriminant approaches zero
    Then a visual indicator shows the discriminant value decreasing
    And the indicator turns to a warning color near zero

  Scenario: Switch between real and finite field mode preserves parameters
    Given the Learner is viewing the curve with a = 1 and b = 1 over real numbers
    When the Learner switches to finite field mode
    Then the parameters a = 1 and b = 1 are preserved
    And the Learner is prompted to choose a prime p

  # --- Error Cases ---

  Scenario: Manually entered parameter is not a number
    Given the Learner types "abc" into the parameter a input field
    Then the input is rejected
    And a message indicates that a must be a number
```

---

## Point Arithmetic

### Feature: Point Addition

```gherkin
Feature: Point Addition
  As a Learner
  I want to add two points on an elliptic curve step by step
  So that I can understand the geometric construction behind the group operation

  Background:
    Given an elliptic curve is displayed

  # --- Happy Path (Real Numbers) ---

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

  # --- Happy Path (Finite Field) ---

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

  # --- Business Rule Variations ---

  Scenario: Adding a point to the identity returns the same point
    Given the Learner has selected point P = (1, 2)
    When the Learner requests the addition P + O
    Then the app explains that O is the identity element
    And the result is P = (1, 2)
    And no geometric construction is needed

  Scenario: Adding a point to its inverse yields the identity
    Given the Learner has selected point P = (1, 2)
    And the Learner has selected point -P = (1, -2)
    When the Learner requests the addition P + (-P)
    Then step 1 shows a vertical line through P and -P
    And step 2 explains that a vertical line does not intersect the curve a third time
    And the result is the point at infinity O

  # --- Edge Cases ---

  Scenario: Two selected points are the same triggers doubling
    Given the Learner has selected point P = (1, 2)
    And the Learner selects the same point P = (1, 2) as the second operand
    When the Learner requests the addition
    Then the app informs that P + P will use the doubling construction
    And the doubling step-by-step animation plays

  Scenario: Result point is outside the current viewport
    Given the addition P + Q produces a result with very large coordinates
    When the result is computed
    Then the viewport smoothly pans and zooms to include the result point
    And all three points (P, Q, R) remain visible

  # --- Error Cases ---

  Scenario: No points selected
    Given the Learner has not selected any point
    When the Learner requests an addition
    Then the app prompts the Learner to select two points first

  Scenario: Only one point selected
    Given the Learner has selected only point P = (1, 2)
    When the Learner requests an addition
    Then the app prompts the Learner to select a second point
```

### Feature: Point Doubling

```gherkin
Feature: Point Doubling
  As a Learner
  I want to double a point on the curve step by step
  So that I can understand the tangent construction for P + P

  Background:
    Given an elliptic curve is displayed

  # --- Happy Path (Real Numbers) ---

  Scenario: Double a point over real numbers
    Given the Learner is in real number mode with curve y² = x³ - 7x + 10
    And the Learner has selected point P = (1, 2)
    When the Learner requests the doubling of P
    Then step 1 draws the tangent line to the curve at P
    And step 2 highlights the second intersection point R' of the tangent with the curve
    And step 3 reflects R' over the x-axis to obtain R = 2P
    And the result R is displayed with its coordinates
    And the derivative formula for the slope is shown

  # --- Happy Path (Finite Field) ---

  Scenario: Double a point over a finite field
    Given the Learner is in finite field mode with p = 23, a = 1, b = 1
    And the Learner has selected point P = (0, 1)
    When the Learner requests the doubling of P
    Then step 1 computes the tangent slope s = (3x² + a) · (2y)⁻¹ mod 23
    And step 2 shows the modular inverse of 2y
    And step 3 computes the result coordinates
    And the result 2P is displayed on the grid

  # --- Edge Cases ---

  Scenario: Double a point with y = 0 over real numbers
    Given the Learner has selected a point P where y = 0
    When the Learner requests the doubling of P
    Then step 1 draws the vertical tangent at P
    And step 2 explains that the tangent is vertical and does not intersect the curve again
    And the result is the point at infinity O
    And the app explains this means P has order 2

  Scenario: Double a point with y = 0 over a finite field
    Given the Learner is in finite field mode
    And the Learner has selected a point P = (x, 0)
    When the Learner requests the doubling of P
    Then the app explains that 2y = 0 has no modular inverse
    And the result is the point at infinity O

  # --- Error Cases ---

  Scenario: Doubling the point at infinity
    Given the Learner attempts to double the point at infinity O
    When the doubling is requested
    Then the app explains that O + O = O
    And the result is O
```

### Feature: Point Inverse

```gherkin
Feature: Point Inverse
  As a Learner
  I want to see the inverse of a point on the curve
  So that I can understand the symmetry property of the group

  Background:
    Given an elliptic curve is displayed

  # --- Happy Path ---

  Scenario: Show inverse over real numbers
    Given the Learner is in real number mode
    And the Learner has selected point P = (3, 5)
    When the Learner requests the inverse of P
    Then the point -P = (3, -5) is highlighted on the curve
    And a vertical line connecting P and -P is drawn
    And an explanation states that the inverse reflects over the x-axis

  Scenario: Show inverse over a finite field
    Given the Learner is in finite field mode with p = 23
    And the Learner has selected point P = (3, 5)
    When the Learner requests the inverse of P
    Then the point -P = (3, 18) is highlighted on the grid
    And the computation -5 mod 23 = 18 is shown
    And a visual link connects P and -P

  # --- Edge Cases ---

  Scenario: Inverse of a point on the x-axis
    Given the Learner has selected point P = (x, 0)
    When the Learner requests the inverse of P
    Then the app shows that -P = P
    And an explanation states that points on the x-axis are their own inverse

  Scenario: Inverse of the point at infinity
    When the Learner requests the inverse of the point at infinity O
    Then the app shows that -O = O
    And an explanation states that the identity is its own inverse

  # --- Error Cases ---

  Scenario: No point selected for inverse
    Given the Learner has not selected any point
    When the Learner requests an inverse
    Then the app prompts the Learner to select a point first
```

### Feature: Point Selection

```gherkin
Feature: Point Selection
  As a Learner
  I want to select points on the curve by clicking
  So that I can use them for arithmetic operations

  Background:
    Given an elliptic curve is displayed

  # --- Happy Path ---

  Scenario: Select a point on the curve over real numbers
    Given the Learner is in real number mode
    When the Learner clicks near the point (1, 2) on the curve
    Then the nearest point on the curve is selected
    And the selected point is visually highlighted
    And its exact coordinates are displayed

  Scenario: Select a point on the grid over a finite field
    Given the Learner is in finite field mode with p = 23
    When the Learner clicks on the grid point (6, 4)
    And (6, 4) is a valid point on the curve
    Then the point (6, 4) is selected and highlighted
    And its coordinates are displayed

  # --- Edge Cases ---

  Scenario: Click near but not exactly on a valid point over a finite field
    Given the Learner is in finite field mode
    When the Learner clicks between grid points, closest to (6, 4)
    Then the point (6, 4) is snapped to and selected

  Scenario: Select the point at infinity
    Given the app displays the point at infinity symbol O
    When the Learner clicks on the O symbol
    Then the point at infinity is selected as an operand

  Scenario: Deselect a point
    Given point P = (1, 2) is currently selected
    When the Learner clicks on P again
    Then P is deselected
    And the highlight is removed

  # --- Error Cases ---

  Scenario: Click on an empty area with no nearby valid point
    Given the Learner is in finite field mode
    When the Learner clicks on a grid position that is not a curve point
    And no valid point is within snapping distance
    Then no point is selected
    And a subtle message indicates no valid point is nearby

  Scenario: Attempt to select more than two points
    Given the Learner has already selected two points P and Q
    When the Learner clicks on a third point
    Then the oldest selection (P) is replaced by the new point
    And the two most recent selections are shown as operands
```

---

## Group Exploration

### Feature: Scalar Multiplication

```gherkin
Feature: Scalar Multiplication
  As a Learner
  I want to compute nP step by step for a given point P and scalar n
  So that I can understand how repeated addition works and leads to orbits

  Background:
    Given an elliptic curve is displayed over a finite field

  # --- Happy Path ---

  Scenario: Compute scalar multiplication step by step
    Given the Learner has selected point P = (0, 1) on curve over 𝔽₂₃ with a = 1, b = 1
    And the Learner enters the scalar n = 5
    When the Learner requests the computation of 5P
    Then step 1 shows 2P = P + P (doubling)
    And step 2 shows 3P = 2P + P (addition)
    And step 3 shows 4P = 3P + P (addition)
    And step 4 shows 5P = 4P + P (addition)
    And each intermediate result is plotted on the grid
    And the final result 5P is highlighted

  Scenario: Visualize the orbit of a point
    Given the Learner has selected point P on the curve
    When the Learner requests the full orbit of P
    Then all points P, 2P, 3P, ..., nP = O are computed sequentially
    And each point appears on the grid one by one in animation
    And a trail connects successive points
    And the order of P is displayed when O is reached

  # --- Business Rule Variations ---

  Scenario: Scalar multiplication with n = 1
    Given the Learner enters the scalar n = 1
    When the computation is performed
    Then the result is 1P = P
    And the app explains that multiplying by 1 returns the point itself

  Scenario: Scalar multiplication with n = 0
    Given the Learner enters the scalar n = 0
    When the computation is performed
    Then the result is 0P = O (the point at infinity)
    And the app explains that multiplying by zero yields the identity

  # --- Edge Cases ---

  Scenario: Scalar multiplication reaches the identity
    Given the order of point P is 7
    And the Learner enters the scalar n = 7
    When the computation completes
    Then the result is 7P = O
    And the app highlights that n equals the order of P
    And an explanation about cyclic subgroups is displayed

  Scenario: Large scalar uses double-and-add visualization
    Given the Learner enters a scalar n = 42
    When the Learner requests the computation
    Then the app offers to show the double-and-add method
    And each doubling and addition step is shown
    And the binary representation of 42 is displayed alongside

  # --- Error Cases ---

  Scenario: Negative scalar
    Given the Learner enters the scalar n = -3
    When the computation is performed
    Then the app computes 3P first, then takes its inverse
    And explains that -nP = n(-P) = -(nP)

  Scenario: Non-integer scalar is rejected
    Given the Learner enters the scalar n = 2.5
    Then the input is rejected
    And a message explains that the scalar must be an integer
```

### Feature: Point Order and Subgroup Visualization

```gherkin
Feature: Point Order and Subgroup Visualization
  As a Learner
  I want to see the order of a point and the subgroup it generates
  So that I can understand the cyclic structure of elliptic curve groups

  Background:
    Given an elliptic curve is displayed over a finite field

  # --- Happy Path ---

  Scenario: Compute and display the order of a point
    Given the Learner has selected point P = (0, 1) on curve over 𝔽₂₃
    When the Learner requests the order of P
    Then the app computes P, 2P, 3P, ..., until nP = O
    And the order n is displayed
    And all points in the subgroup are highlighted on the grid

  Scenario: Highlight a generator of the full group
    Given the Learner has selected a point G whose order equals the group order
    When the order computation completes
    Then the app indicates that G is a generator of the entire group
    And all points on the curve are highlighted as part of the subgroup

  # --- Edge Cases ---

  Scenario: Point at infinity has order 1
    When the Learner requests the order of the point at infinity O
    Then the order is displayed as 1
    And the app explains that O generates the trivial subgroup

  Scenario: Point of order 2
    Given the Learner selects a point P with y = 0
    When the order is computed
    Then the order is 2
    And the subgroup {O, P} is highlighted
    And the app explains that P is its own inverse

  # --- Error Cases ---

  Scenario: No point selected
    Given no point is selected
    When the Learner requests the order computation
    Then the app prompts to select a point first
```

### Feature: Group Properties Demonstration

```gherkin
Feature: Group Properties Demonstration
  As a Learner
  I want to verify the group axioms visually
  So that I can convince myself that elliptic curve points form a group

  Background:
    Given an elliptic curve is displayed

  # --- Happy Path ---

  Scenario: Demonstrate commutativity
    Given the Learner has selected points P = (0, 1) and Q = (6, 4)
    When the Learner requests commutativity verification
    Then the app computes P + Q step by step
    And then computes Q + P step by step
    And both results are displayed side by side
    And the app confirms that P + Q = Q + P

  Scenario: Demonstrate associativity
    Given the Learner has selected points P, Q, and R on the curve
    When the Learner requests associativity verification
    Then the app computes (P + Q) + R step by step
    And then computes P + (Q + R) step by step
    And both results are displayed side by side
    And the app confirms that (P + Q) + R = P + (Q + R)

  Scenario: Demonstrate identity element
    Given the Learner has selected point P = (3, 5)
    When the Learner requests identity verification
    Then the app computes P + O
    And the result is P = (3, 5)
    And the app confirms that O is the identity element

  Scenario: Demonstrate closure
    Given the Learner has selected points P and Q on the curve
    When the Learner requests closure verification
    Then the app computes P + Q = R
    And verifies that R satisfies the curve equation
    And the app confirms that the group is closed under addition

  # --- Edge Cases ---

  Scenario: Associativity with the point at infinity
    Given the Learner selects P, Q = O, and R
    When associativity is verified
    Then both (P + O) + R and P + (O + R) equal P + R
    And the app confirms associativity holds even with the identity

  Scenario: All properties summarized
    When the Learner requests a full group axiom summary
    Then the app lists all four axioms: closure, associativity, identity, inverse
    And indicates which have been verified in this session
    And offers to verify any remaining axiom

  # --- Error Cases ---

  Scenario: Not enough points for associativity
    Given the Learner has selected only two points
    When the Learner requests associativity verification
    Then the app prompts to select a third point
```

---

## Cryptographic Protocol

### Feature: Discrete Logarithm Problem

```gherkin
Feature: Discrete Logarithm Problem
  As a Learner
  I want to understand why the discrete logarithm problem is hard on elliptic curves
  So that I can grasp the security foundation of elliptic curve cryptography

  Background:
    Given the Learner is in the cryptographic protocol section
    And a curve over 𝔽ₚ is configured with a base point G

  # --- Happy Path ---

  Scenario: Forward computation is easy
    Given the base point G and scalar n = 17
    When the Learner requests the computation of Q = 17G
    Then the app computes Q step by step using double-and-add
    And displays the result Q on the grid
    And shows the computation took a small number of steps
    And explains that computing nG is efficient (polynomial time)

  Scenario: Reverse computation is hard
    Given the base point G and a target point Q = 17G
    When the Learner requests to find n such that Q = nG
    Then the app begins a brute-force search: G, 2G, 3G, ...
    And each attempt is shown on the grid
    And the growing number of attempts is displayed
    And the app explains that no shortcut is known (exponential time)

  # --- Edge Cases ---

  Scenario: Small group makes the problem trivially solvable
    Given the curve has a group of order 7
    And Q = 5G
    When the brute-force search is performed
    Then the answer n = 5 is found after 5 steps
    And the app explains that small groups provide no security

  Scenario: Larger prime demonstrates computational difficulty
    Given p = 97 and the group order is large
    When the Learner requests the reverse computation
    Then the brute-force search visibly slows down
    And the app extrapolates the difficulty for cryptographic-size primes (256 bits)

  # --- Error Cases ---

  Scenario: Target point is not in the subgroup generated by G
    Given a point Q that is not a multiple of G
    When the Learner requests to find n
    Then the search exhausts all multiples of G without finding Q
    And the app explains that Q is not in the subgroup generated by G
```

### Feature: ECDH Key Exchange

```gherkin
Feature: ECDH Key Exchange
  As a Learner
  I want to simulate an Elliptic Curve Diffie-Hellman key exchange
  So that I can understand how two parties agree on a shared secret

  Background:
    Given the Learner is in the ECDH demonstration section
    And a curve over 𝔽ₚ is configured with a base point G of known order

  # --- Happy Path ---

  Scenario: Complete key exchange step by step
    Given Alice chooses her private key a = 7
    And Bob chooses his private key b = 11
    When the Learner starts the ECDH demonstration
    Then step 1 shows Alice computing her public key A = 7G on the grid
    And step 2 shows Bob computing his public key B = 11G on the grid
    And step 3 shows Alice and Bob exchanging public keys
    And step 4 shows Alice computing the shared secret S = 7B = 7 · 11G
    And step 5 shows Bob computing the shared secret S = 11A = 11 · 7G
    And both computations are shown to produce the same point S
    And the app highlights that a · bG = b · aG by commutativity of scalar multiplication

  Scenario: Learner inputs custom private keys
    Given the Learner enters private key a = 3 for Alice
    And the Learner enters private key b = 5 for Bob
    When the exchange is performed
    Then all steps are computed with these custom values
    And the shared secret is verified to match

  # --- Edge Cases ---

  Scenario: Private key equals 1
    Given Alice chooses private key a = 1
    When Alice computes her public key
    Then A = G (the base point itself)
    And the app warns that this provides no security

  Scenario: Private key equals the group order
    Given the group order is n
    And Alice chooses private key a = n
    When Alice computes her public key
    Then A = O (the point at infinity)
    And the app explains that this is equivalent to choosing a = 0

  # --- Error Cases ---

  Scenario: Private key is zero
    Given Alice enters private key a = 0
    Then the app rejects the key
    And explains that the private key must be between 1 and n - 1

  Scenario: Private key exceeds group order
    Given the group order is n = 29
    And Alice enters private key a = 35
    Then the app warns that the key should be between 1 and 28
    And explains that 35G = 6G due to modular reduction
```

### Feature: ECDSA Digital Signature

```gherkin
Feature: ECDSA Digital Signature
  As a Learner
  I want to simulate an ECDSA signature and verification
  So that I can understand how digital signatures work on elliptic curves

  Background:
    Given the Learner is in the ECDSA demonstration section
    And a curve over 𝔽ₚ is configured with base point G of order n
    And a signer has private key d and public key Q = dG

  # --- Happy Path ---

  Scenario: Sign a message step by step
    Given the signer's private key is d = 7
    And the message to sign is "Hello"
    When the Learner starts the signing demonstration
    Then step 1 shows the hash of "Hello" being computed as integer e
    And step 2 shows a random nonce k being chosen
    And step 3 computes the point R = kG on the grid
    And step 4 extracts r = R.x mod n
    And step 5 computes s = k⁻¹(e + r·d) mod n
    And the signature (r, s) is displayed

  Scenario: Verify a valid signature step by step
    Given a message "Hello" with signature (r, s)
    And the signer's public key Q is known
    When the Learner starts the verification demonstration
    Then step 1 computes the hash e of "Hello"
    And step 2 computes w = s⁻¹ mod n
    And step 3 computes u₁ = e·w mod n and u₂ = r·w mod n
    And step 4 computes the verification point V = u₁G + u₂Q on the grid
    And step 5 checks that V.x mod n equals r
    And the verification succeeds
    And the app explains why the math guarantees correctness

  # --- Edge Cases ---

  Scenario: Nonce reuse demonstrates vulnerability
    Given the signer signs two different messages with the same nonce k
    When both signatures are displayed
    Then the app shows that the private key can be recovered from the two signatures
    And explains why nonce reuse breaks ECDSA security

  # --- Error Cases ---

  Scenario: Tampered message fails verification
    Given a valid signature (r, s) for message "Hello"
    When the Learner changes the message to "World"
    And requests verification
    Then the verification point V.x does not equal r
    And the verification fails
    And the app explains that any change in the message invalidates the signature

  Scenario: Wrong public key fails verification
    Given a valid signature (r, s) for message "Hello" signed by Alice
    When verification is attempted with Bob's public key
    Then the verification fails
    And the app explains that the signature is bound to the signer's key pair
```

---

## Learning Path

### Feature: Step-by-Step Animation Control

```gherkin
Feature: Step-by-Step Animation Control
  As a Learner
  I want to control the pace of each geometric construction
  So that I can understand each sub-operation before moving to the next

  Background:
    Given a step-by-step animation is playing

  # --- Happy Path ---

  Scenario: Advance to the next step
    Given the animation is paused at step 2 of 5
    When the Learner clicks the "next step" button
    Then step 3 is animated
    And the step counter shows "3 / 5"
    And the contextual explanation updates for step 3

  Scenario: Go back to a previous step
    Given the animation is at step 4 of 5
    When the Learner clicks the "previous step" button
    Then the visualization reverts to the state at step 3
    And the step counter shows "3 / 5"
    And the explanation updates for step 3

  # --- Edge Cases ---

  Scenario: Skip to the final result
    Given the animation is at step 1 of 5
    When the Learner clicks the "skip to end" button
    Then all remaining steps are applied instantly
    And the final result is displayed
    And all construction lines remain visible

  Scenario: Go back from the first step
    Given the animation is at step 1 of 5
    When the Learner clicks the "previous step" button
    Then nothing happens
    And the button appears disabled

  Scenario: Advance past the last step
    Given the animation is at step 5 of 5
    When the Learner clicks the "next step" button
    Then nothing happens
    And the button appears disabled

  # --- Error Cases ---

  Scenario: Animation interrupted by parameter change
    Given the animation is at step 3 of 5
    When the Learner changes a curve parameter
    Then the animation is cancelled
    And the visualization resets with the new parameters
    And a message explains that the previous operation was invalidated
```

### Feature: Contextual Explanations

```gherkin
Feature: Contextual Explanations
  As a Learner
  I want to see mathematical explanations alongside each visual step
  So that I can connect the geometry to the algebra

  Background:
    Given a step-by-step animation is in progress

  # --- Happy Path ---

  Scenario: Display explanation with mathematical formula
    Given the animation is showing the slope computation for P + Q
    When step 2 is reached
    Then a panel displays the explanation in natural language
    And the formula s = (y₂ - y₁) / (x₂ - x₁) is rendered
    And the actual numeric values are substituted into the formula
    And the corresponding geometric element (the secant line) is highlighted on the curve

  Scenario: Explanation adapts to the field type
    Given the Learner is in finite field mode
    When the slope computation step is reached
    Then the explanation mentions modular arithmetic
    And the formula includes "mod p"
    And the modular inverse computation is detailed

  # --- Edge Cases ---

  Scenario: Explanation for a degenerate case
    Given the Learner is adding P + (-P)
    When the vertical line step is reached
    Then the explanation describes why the vertical line yields no third intersection
    And introduces the concept of the point at infinity as a necessary completion
    And links to the group identity axiom

  Scenario: Collapse and expand explanation panel
    Given the explanation panel is visible
    When the Learner collapses the panel
    Then only the visualization is shown
    And the panel can be re-expanded at any time

  Scenario: Formulas render correctly with special characters
    Given a step involves the computation of a modular inverse
    Then the formula displays superscript -1 notation
    And Greek letters (if any) are correctly rendered
    And the formula is readable at the current zoom level

  # --- Error Cases ---

  Scenario: Explanation unavailable for custom operation
    Given the Learner attempts an operation not covered by the tutorial system
    Then the app displays the computation result without a detailed explanation
    And suggests the nearest related tutorial topic
```

---

## Coverage Matrix

| Feature                          | Happy | Edge | Error | Total |
|----------------------------------|-------|------|-------|-------|
| Display Curve over ℝ             | 2     | 3    | 2     | 7     |
| Display Curve over 𝔽ₚ           | 2     | 2    | 2     | 6     |
| Configure Parameters             | 1     | 2    | 1     | 4     |
| **Subtotal: Curve Visualization**| **5** | **7**| **5** | **17**|
| Point Addition                   | 2     | 2    | 2     | 6     |
| Point Doubling                   | 2     | 2    | 1     | 5     |
| Point Inverse                    | 2     | 2    | 1     | 5     |
| Point Selection                  | 2     | 3    | 2     | 7     |
| **Subtotal: Point Arithmetic**   | **8** | **9**| **6** | **23**|
| Scalar Multiplication            | 2     | 2    | 2     | 6     |
| Order and Subgroup               | 2     | 2    | 1     | 5     |
| Group Properties                 | 4     | 2    | 1     | 7     |
| **Subtotal: Group Exploration**  | **8** | **6**| **4** | **18**|
| Discrete Logarithm               | 2     | 2    | 1     | 5     |
| ECDH Key Exchange                | 2     | 2    | 2     | 6     |
| ECDSA Signature                  | 2     | 1    | 2     | 5     |
| **Subtotal: Crypto Protocol**    | **6** | **5**| **5** | **16**|
| Animation Control                | 2     | 3    | 1     | 6     |
| Contextual Explanations          | 2     | 3    | 1     | 6     |
| **Subtotal: Learning Path**      | **4** | **6**| **2** | **12**|
| **TOTAL**                        |**31** |**33**|**22** | **86**|
