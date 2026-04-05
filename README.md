# Elliptic Curve Group Explorer

An interactive web application to visually explore **group theory on elliptic curves** — from geometric intuition over real numbers to finite field arithmetic and cryptographic protocols.

Built as an educational tool for university students (L3/M1) in mathematics and computer science, bridging the gap between abstract algebra and its application in modern cryptography.

## Why This Matters

Modern cryptography (Bitcoin, TLS, Signal, Ethereum...) relies on a simple mathematical asymmetry:

- **Easy direction**: given a point P and a number n, compute Q = nP (fast, polynomial time)
- **Hard direction**: given P and Q, find n such that Q = nP (infeasible, exponential time)

This is the **Elliptic Curve Discrete Logarithm Problem (ECDLP)**. This app lets you see it happen — step by step, on curves small enough to visualize, using the exact same algorithms that secure the internet.

## Key Concepts

### What is p and why does it matter?

Every elliptic curve in cryptography is defined over a **finite field** 𝔽ₚ, where p is a prime number. The full equation is:

> y² ≡ x³ + ax + b **(mod p)**

The prime p determines the "universe" of the curve — all coordinates are integers from 0 to p−1, and every arithmetic operation (addition, multiplication, division) wraps around modulo p.

| What p controls | Small p (toy, e.g. 67) | Real p (e.g. secp256k1) |
|---|---|---|
| Grid size | 67 × 67 = 4,489 cells | 2²⁵⁶ × 2²⁵⁶ cells |
| Points on curve | ~67 points | ~2²⁵⁶ points |
| DLP difficulty | ~28 steps (instant) | ~2¹²⁸ steps (infeasible) |
| Visualization | Easy — fits on screen | Impossible |

The **same equation** (e.g. y²=x³+7 for secp256k1) and the **same algorithms** (point addition, scalar multiplication, ECDH, ECDSA) work identically at both scales. Only p changes — and p is what makes it secure.

### Toy curves vs real curves

This app uses small primes (p = 23, 29, 37, 67, 97) to visualize curves that are structurally identical to their real-world counterparts:

| Real curve | Equation | Real p | Toy p | Usage |
|---|---|---|---|---|
| secp256k1 | y²=x³+7 | 2²⁵⁶ − 2³² − 977 | 67 | Bitcoin, Ethereum |
| P-256 | y²=x³−3x+b | 2²⁵⁶ − 2²²⁴ + 2¹⁹² + 2⁹⁶ − 1 | 23 | TLS, HTTPS, FIDO2 |
| BN254 | y²=x³+3 | 254-bit prime | 23 | Ethereum ZK precompiles |
| BLS12-381 | y²=x³+4 | 381-bit prime | 29 | Ethereum 2.0, Zcash |

The educational approach: **understand the mechanism on small numbers, then appreciate why large numbers make it secure.**

### Generators and prime order

A **generator** G is a point whose multiples {G, 2G, 3G, ..., nG = O} cover the entire group. If G generates all N points, its **order** is N.

Why crypto requires **prime-order** generators:

- If the order is **composite** (e.g. 28 = 4 × 7), the group contains small subgroups. An attacker can solve the DLP separately in each small subgroup and recombine (Pohlig-Hellman attack).
- If the order is **prime** (e.g. 29), there are **no non-trivial subgroups**. The DLP must be solved in one piece — maximum security.

This is why real curves (secp256k1, P-256...) are chosen so that their group order is a very large prime.

In the app: select a point, click **Orbit of P** — if the displayed order is prime and equals the group order, it's a valid cryptographic base point.

### How to encrypt a message with elliptic curves

Elliptic curves **don't encrypt messages directly**. They solve a harder problem: how can two people who have never met agree on a shared secret, even if an eavesdropper watches their entire conversation?

The answer is a three-step process:

#### Step 1 — Key exchange (ECDH, what this app demonstrates)

Alice and Bob agree on a public curve and a generator point G. Then:

```
Alice picks a secret number  a = 7     (private key — never shared)
Alice computes               A = 7G    (public key — sent to Bob)

Bob picks a secret number    b = 11    (private key — never shared)
Bob computes                 B = 11G   (public key — sent to Alice)

Alice computes               S = 7·B  = 7·11·G = 77G
Bob computes                 S = 11·A = 11·7·G = 77G
                                        ↑ same point!
```

Both arrive at the same point S, but an eavesdropper who saw A = 7G and B = 11G cannot find S without solving the DLP (finding 7 from G and 7G), which is computationally infeasible for large primes.

**You can see this happen in the app**: select a point G, click **ECDH Demo**.

#### Step 2 — Derive a symmetric key (KDF)

The shared point S = (x, y) is not directly usable as an encryption key. It's passed through a **Key Derivation Function** (KDF) like HKDF-SHA256:

```
symmetric_key = HKDF-SHA256(S.x)    →    256-bit AES key
```

This step converts the large curve point into a fixed-size byte sequence suitable for a symmetric cipher.

#### Step 3 — Encrypt with a symmetric cipher (AES-GCM, ChaCha20...)

The actual message is encrypted using a fast symmetric algorithm with the derived key:

```
ciphertext = AES-256-GCM(key = symmetric_key, plaintext = "Hello Bob!")
```

Only someone with the same symmetric key (i.e. Alice or Bob) can decrypt.

#### The complete picture

```
┌─────────┐                              ┌─────────┐
│  Alice   │                              │   Bob   │
│          │     A = aG (public key)      │         │
│  a = 7   │ ──────────────────────────►  │  b = 11 │
│          │     B = bG (public key)      │         │
│          │ ◄──────────────────────────  │         │
│          │                              │         │
│ S = a·B  │    (same shared secret S)    │ S = b·A │
│ key=KDF(S)                              │ key=KDF(S)
│          │                              │         │
│ encrypt  │ ───── ciphertext ──────────► │ decrypt │
│ with AES │                              │ with AES│
└─────────┘                              └─────────┘
     ▲                                        ▲
     │          Eavesdropper sees:             │
     │          A = 7G, B = 11G               │
     │          but CANNOT compute S           │
     │          (would need to solve DLP)      │
     └────────────────────────────────────────┘
```

**In summary**: elliptic curves handle the key exchange (the hard part). A classical symmetric cipher handles the encryption (the fast part). This hybrid approach is used by TLS (HTTPS), Signal, WireGuard, SSH, and virtually every modern encrypted protocol.

#### What about ECDSA? (signing, not encrypting)

ECDSA is **not encryption** — it's a **digital signature**. It proves that a message was written by the owner of a private key, without revealing that key. It guarantees **authenticity and integrity**, not **confidentiality**.

The app demonstrates ECDSA in 7 steps: key pair → hash → nonce → signature (r, s) → verification.

### Zero-Knowledge Proofs (ZK Proofs)

A zero-knowledge proof lets you **prove you know a secret without revealing it**. This sounds paradoxical, but elliptic curves make it possible.

#### Schnorr Protocol — "I know x, but I won't tell you"

The Schnorr protocol proves knowledge of a private key x (where Q = xG is public) in 4 moves:

```
Public: curve, generator G, public key Q = xG
Secret: x (only the Prover knows this)

    Prover                          Verifier
      │                                │
      │  1. Pick random nonce r        │
      │     Compute R = rG             │
      │  ──────── R ─────────────────► │
      │                                │
      │  ◄──────── c ─────────────────  │  2. Send random challenge c
      │                                │
      │  3. Compute s = r + c·x mod n  │
      │  ──────── s ─────────────────► │
      │                                │  4. Check: sG == R + cQ
      │                                │     If yes → convinced!
```

**Why it's zero-knowledge**: the Verifier only sees R, c, and s. None of these reveal x:
- R is random (masked by nonce r)
- s = r + c·x mixes the secret with the random nonce — without r, you can't extract x
- The Verifier could have generated (R, c, s) themselves by simulation — so the transcript carries no information about x

**In the app**: select a base point G, click **Schnorr Protocol**. The 6-step walkthrough shows the commit → challenge → response → verification cycle.

#### Pedersen Commitment — "I'll tell you later, and I can't change my mind"

A Pedersen commitment lets you **lock in a secret value** without revealing it, then open it later.

```
Setup: two generators G and H (nobody knows the discrete log of H w.r.t. G)

Commit:   C = v·G + r·H     (v = secret value, r = random blinding factor)
                              C is published — it hides v completely

Opening:  reveal v and r     → Verifier checks v·G + r·H == C
```

Two key properties:
- **Hiding**: C reveals nothing about v (the blinding factor r makes C uniformly random)
- **Binding**: the committer can't change their mind — opening to a different v' would require finding r' such that v'G + r'H = C, which means solving the DLP for H w.r.t. G

Pedersen commitments are the building block of modern ZK systems: Bulletproofs, Groth16, and Zcash all use them internally.

**In the app**: select P (as G) and Q (as H), click **Pedersen Commitment**. The 6-step walkthrough shows commit → hiding → opening → binding.

#### Where ZK meets the curves we've built

Everything connects:
- **Schnorr** uses scalar multiplication (nP) and point addition (R + cQ) — the same operations from the Group Operations panel
- **Pedersen** uses two independent scalar multiplications and addition — same math, different context
- The **DLP hardness** is what makes both protocols secure: you can't cheat without solving a discrete log
- The **BN254** and **BLS12-381** presets are the exact curves used in Ethereum's ZK rollups (zkSync, Scroll, Polygon zkEVM)

### The Discrete Logarithm Problem (DLP)

The **DLP: find n** button demonstrates the core security assumption:

1. Select **P** (base point) and **Q** (target point)
2. The app searches exhaustively: P, 2P, 3P, 4P... until it finds Q
3. A growing trail shows the search path step by step

**Important**: not all (P, Q) pairs work. Q must be **in the subgroup generated by P** (i.e. Q must be a multiple of P). If P is a generator of the full group, every Q works. If P generates only a subgroup, the app warns you and the search may fail.

## Features

### Curve Visualization
- **Real numbers (ℝ)** — smooth continuous curves on a Cartesian plane with real-time parameter adjustment
- **Finite fields (𝔽ₚ)** — discrete point grids over prime fields with automatic point enumeration
- Interactive parameter sliders for `a`, `b`, and prime `p`
- Discriminant validation (singular curve detection) and primality checks

### Group Operations with Geometric Construction

Every operation is visualized **step by step** with construction lines.

**Over real numbers (ℝ)** — classic geometric constructions:

| Operation | Construction |
|-----------|-------------|
| **P + Q** | Coral secant line → purple R' (third intersection) → purple vertical reflection → green R |
| **2P** | Amber tangent line → purple R' → vertical reflection → green R |
| **−P** | Purple vertical line from P to −P |
| **nP** | Progressive green orbit trail |

**Over finite fields (𝔽ₚ)** — modular "lines" as discrete dot patterns:

A "line" y ≡ sx + c (mod p) is rendered as **p discrete dots** scattered across the grid by modular wrapping. Curve-line intersections are highlighted with rings, making the 3-intersection property visually obvious — even though the geometry is abstract.

| Operation | Construction |
|-----------|-------------|
| **P + Q** | p coral dots (modular secant) → rings at P, Q, R' → vertical column → R |
| **2P** | p dots (modular tangent) → rings at P(×2), R' → vertical column → R |
| **−P** | p purple dots on vertical column x = xₚ |

Each step displays the corresponding mathematical formula rendered with KaTeX.

### Group Exploration
- **Orbit visualization** — animate the full cyclic subgroup ⟨P⟩ = {P, 2P, ..., (n−1)P} with progressive trail
- **Point order** — find the smallest n such that nP = O
- **Generator detection** — identify if a point generates the entire group
- **Group axiom verification** — commutativity, associativity, identity, closure

### Cryptographic Protocols
- **Discrete Logarithm Problem (DLP)** — brute-force search with progressive trail, generator warning, and subgroup detection
- **ECDH Key Exchange** — step-by-step Diffie-Hellman: Alice(a=7) and Bob(b=11) independently derive the same shared secret
- **ECDSA Sign & Verify** — 7-step walkthrough: key pair → hash → nonce → signature → verification
- **Double-and-Add** — efficient scalar multiplication showing the binary decomposition of n

### Zero-Knowledge Proofs
- **Schnorr Protocol** — 6-step interactive proof of knowledge: commit (R=rG) → challenge (c) → response (s=r+cx) → verify (sG = R+cQ). Proves you know the private key without revealing it.
- **Pedersen Commitment** — 6-step commitment scheme: commit (C=vG+rH) → hiding property → opening → binding property. The building block of Bulletproofs, Groth16, and Zcash.

### Crypto Curve Presets

10 real-world curves selectable from the sidebar, each with a toy small-prime version for interactive visualization:

| Category | Curves |
|----------|--------|
| Bitcoin & Ethereum | secp256k1 |
| TLS & Web Security | P-256, P-384 |
| Modern Crypto | Curve25519, Ed25519, Ristretto255 |
| Zero-Knowledge Proofs | BN254, BLS12-381, Jubjub, Baby Jubjub |

Each preset shows the real parameters (hex), equation form badge (**W** Weierstrass / **M** Montgomery / **E** Edwards), and usage context. Expandable detail panel with field size, notes, and the toy equivalent.

## Architecture

The project follows **hexagonal architecture** with a pure domain model and strict TDD:

```
src/
├── curve-visualization/          # Bounded Context: Curve Visualization
│   └── domain/model/
│       ├── EllipticCurve.ts      # Curve over ℝ — evaluate, add, double, inverse
│       ├── FiniteFieldCurve.ts   # Curve over 𝔽ₚ — modular arithmetic, DLP, ECDH, ECDSA
│       └── CurvePoint.ts         # Value Object: (x, y)
├── learning-path/                # Bounded Context: Learning Path
│   └── domain/model/
│       ├── StepSequence.ts       # Immutable step navigation (next/previous)
│       └── AnimationStep.ts      # Step with explanation, formula, values
└── app/                          # Infrastructure: React UI
    ├── components/
    │   ├── CurveCanvas.tsx       # Canvas 2D renderer with construction lines
    │   ├── Sidebar.tsx           # Controls, presets, operations
    │   ├── CollapsibleCard.tsx   # Collapsible sidebar panels
    │   ├── StepPanel.tsx         # Step-by-step navigation + KaTeX formulas
    │   └── CryptoPresets.tsx     # Crypto curve selector
    ├── hooks/
    │   └── useCurveState.ts      # Application state (useReducer)
    └── data/
        └── cryptoPresets.ts      # 10 standard crypto curve definitions
```

**Domain purity**: the domain layer has zero framework dependencies — pure TypeScript with no imports from React, Vite, or any library. All infrastructure concerns (rendering, UI, formula display) live in the `app/` layer.

## Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
git clone https://github.com/plu9in/courbe-elliptique.git
cd courbe-elliptique
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Tests

```bash
npm test
```

79 unit tests covering the domain model (curve arithmetic, group operations, DLP, ECDH, ECDSA, Schnorr, Pedersen).

### Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Domain | Pure TypeScript |
| UI Framework | React 19 |
| Build | Vite 8 |
| Math Rendering | KaTeX |
| Visualization | Canvas 2D API |
| Testing | Vitest |
| Mutation Testing | Stryker Mutator |
| Design System | Material Design 3 (dark theme) |

## Design

**"Chalk & Canvas"** aesthetic — a dark mathematical workspace inspired by the classroom blackboard:

- Deep navy-black background (`#0D1117`)
- Glowing teal curves with shadow bloom
- Amber (P), coral (Q), green (R) point accents
- Purple construction lines and intermediate points (R')
- Modular lines rendered as discrete dot patterns on 𝔽ₚ
- Playfair Display headings, Source Sans 3 body, Fira Code formulas
- Collapsible sidebar panels with smooth animations

## Roadmap

- [x] **Zero-Knowledge Proofs** — Schnorr protocol and Pedersen commitments
- [ ] **Montgomery & Edwards forms** — native visualization for Curve25519, Ed25519, Jubjub
- [ ] **Larger primes** — BigInt support for p > 97 with zoom/pan navigation

## License

ISC
