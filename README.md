# Elliptic Curve Group Explorer

An interactive web application to visually explore **group theory on elliptic curves** — from geometric intuition over real numbers to finite field arithmetic and cryptographic protocols.

Built as an educational tool for university students (L3/M1) in mathematics and computer science, bridging the gap between abstract algebra and its application in modern cryptography.

## Features

### Curve Visualization
- **Real numbers (ℝ)** — smooth continuous curves on a Cartesian plane with real-time parameter adjustment
- **Finite fields (𝔽ₚ)** — discrete point grids over prime fields with automatic point enumeration
- Interactive parameter sliders for `a`, `b`, and prime `p`
- Discriminant validation (singular curve detection) and primality checks

### Group Operations with Geometric Construction
Every operation is visualized **step by step** with construction lines:

| Operation | Construction |
|-----------|-------------|
| **P + Q** | Secant line → third intersection R' → vertical reflection → R |
| **2P** | Tangent line → second intersection R' → vertical reflection → R |
| **−P** | Vertical reflection line from P to −P |
| **nP** | Repeated addition with progressive orbit trail |

Each step displays the corresponding mathematical formula rendered with KaTeX.

### Group Exploration
- **Orbit visualization** — animate the full cyclic subgroup ⟨P⟩ = {P, 2P, ..., (n−1)P}
- **Point order** — find the smallest n such that nP = O
- **Generator detection** — identify if a point generates the entire group
- **Group axiom verification** — commutativity, associativity, identity, closure

### Cryptographic Protocols
- **Discrete Logarithm Problem (DLP)** — brute-force search demonstrating the computational asymmetry (easy forward, hard reverse)
- **ECDH Key Exchange** — step-by-step Diffie-Hellman demonstration with Alice and Bob deriving the same shared secret

### Crypto Curve Presets
10 real-world curves selectable from the sidebar, each with a "toy" small-prime version for interactive visualization:

| Category | Curves |
|----------|--------|
| Bitcoin & Ethereum | secp256k1 |
| TLS & Web Security | P-256, P-384 |
| Modern Crypto | Curve25519, Ed25519, Ristretto255 |
| Zero-Knowledge Proofs | BN254, BLS12-381, Jubjub, Baby Jubjub |

Each preset shows the real parameters (hex), equation form badge (Weierstrass/Montgomery/Edwards), and usage context.

## Architecture

The project follows **hexagonal architecture** with a pure domain model and strict TDD:

```
src/
├── curve-visualization/          # Bounded Context: Curve Visualization
│   └── domain/model/
│       ├── EllipticCurve.ts      # Curve over ℝ — evaluate, add, double, inverse
│       ├── FiniteFieldCurve.ts   # Curve over 𝔽ₚ — modular arithmetic, DLP, ECDH
│       └── CurvePoint.ts         # Value Object: (x, y)
├── learning-path/                # Bounded Context: Learning Path
│   └── domain/model/
│       ├── StepSequence.ts       # Immutable step navigation (next/previous)
│       └── AnimationStep.ts      # Step with explanation, formula, values
└── app/                          # Infrastructure: React UI
    ├── components/
    │   ├── CurveCanvas.tsx       # Canvas 2D renderer with construction lines
    │   ├── Sidebar.tsx           # Controls, presets, operations
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

70 unit tests covering the domain model (curve arithmetic, group operations, DLP, ECDH).

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
- Purple construction lines and intermediate points
- Playfair Display headings, Source Sans 3 body, Fira Code formulas

## Roadmap

- [ ] **P4** — ECDSA signature/verification, double-and-add algorithm visualization
- [ ] **P5** — Edge cases, viewport auto-zoom, formula rendering polish
- [ ] **Zero-Knowledge Proofs** — planned future extension (the reason finite fields are the primary focus)

## License

ISC
