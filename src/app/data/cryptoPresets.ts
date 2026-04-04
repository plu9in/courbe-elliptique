export interface CryptoPreset {
  id: string;
  name: string;
  shortName: string;
  category: "bitcoin" | "tls" | "modern" | "zk";
  usage: string;
  nativeForm: "weierstrass" | "montgomery" | "twisted-edwards";
  equation: string;
  realParams: {
    p: string;
    a: string;
    b: string;
    note?: string;
  };
  /** Small-prime parameters for visualization (same equation shape) */
  toyParams: {
    a: number;
    b: number;
    p: number;
  };
}

export const CATEGORIES: Record<string, { label: string; color: string }> = {
  bitcoin: { label: "Bitcoin & Ethereum", color: "#F7931A" },
  tls: { label: "TLS & Web Security", color: "#4A90D9" },
  modern: { label: "Modern Crypto", color: "#A78BFA" },
  zk: { label: "Zero-Knowledge Proofs", color: "#34D399" },
};

export const CRYPTO_PRESETS: CryptoPreset[] = [
  // ===== Bitcoin & Ethereum =====
  {
    id: "secp256k1",
    name: "secp256k1",
    shortName: "secp256k1",
    category: "bitcoin",
    usage: "Bitcoin, Ethereum (ECDSA signatures)",
    nativeForm: "weierstrass",
    equation: "y^2 = x^3 + 7",
    realParams: {
      p: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F",
      a: "0",
      b: "7",
      note: "p = 2\u00B2\u2075\u2076 \u2212 2\u00B3\u00B2 \u2212 977",
    },
    toyParams: { a: 0, b: 7, p: 67 },
  },

  // ===== TLS & Web Security =====
  {
    id: "p256",
    name: "P-256 / secp256r1",
    shortName: "P-256",
    category: "tls",
    usage: "TLS, HTTPS, JWT, FIDO2, Apple Secure Enclave",
    nativeForm: "weierstrass",
    equation: "y^2 = x^3 - 3x + b",
    realParams: {
      p: "0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF",
      a: "\u22123 (mod p)",
      b: "0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B",
      note: "p = 2\u00B2\u2075\u2076 \u2212 2\u00B2\u00B2\u2074 + 2\u00B9\u2079\u00B2 + 2\u2079\u2076 \u2212 1",
    },
    toyParams: { a: -3, b: 3, p: 23 },
  },
  {
    id: "p384",
    name: "P-384",
    shortName: "P-384",
    category: "tls",
    usage: "NSA Suite B, high-security TLS certificates",
    nativeForm: "weierstrass",
    equation: "y^2 = x^3 - 3x + b",
    realParams: {
      p: "2\u00B3\u2078\u2074 \u2212 2\u00B9\u00B2\u2078 \u2212 2\u2079\u2076 + 2\u00B3\u00B2 \u2212 1",
      a: "\u22123 (mod p)",
      b: "0xB3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875A...",
    },
    toyParams: { a: -3, b: 5, p: 37 },
  },

  // ===== Modern Crypto =====
  {
    id: "curve25519",
    name: "Curve25519",
    shortName: "X25519",
    category: "modern",
    usage: "Signal, WireGuard, TLS 1.3, SSH key exchange",
    nativeForm: "montgomery",
    equation: "y^2 = x^3 + 486662x^2 + x",
    realParams: {
      p: "2\u00B2\u2075\u2075 \u2212 19",
      a: "486662 (Montgomery A)",
      b: "1 (Montgomery B)",
      note: "Montgomery form. Converted to Weierstrass for visualization.",
    },
    toyParams: { a: 2, b: 3, p: 31 },
  },
  {
    id: "ed25519",
    name: "Ed25519",
    shortName: "Ed25519",
    category: "modern",
    usage: "OpenSSH, GPG, Solana, digital signatures",
    nativeForm: "twisted-edwards",
    equation: "-x^2 + y^2 = 1 + dx^2y^2",
    realParams: {
      p: "2\u00B2\u2075\u2075 \u2212 19",
      a: "\u22121 (Edwards a)",
      b: "d = 0x52036CEE2B6FFE738CC740797779E898...",
      note: "Twisted Edwards form. Same underlying curve as Curve25519.",
    },
    toyParams: { a: 2, b: 3, p: 31 },
  },
  {
    id: "ristretto255",
    name: "Ristretto255",
    shortName: "Ristretto",
    category: "modern",
    usage: "Signal protocol, cofactor-free group abstraction",
    nativeForm: "twisted-edwards",
    equation: "Group abstraction over Ed25519 (eliminates cofactor 8)",
    realParams: {
      p: "2\u00B2\u2075\u2075 \u2212 19",
      a: "Same as Ed25519",
      b: "Same as Ed25519",
      note: "Not a separate curve \u2014 a prime-order group construction on Ed25519.",
    },
    toyParams: { a: 2, b: 3, p: 31 },
  },

  // ===== Zero-Knowledge Proofs =====
  {
    id: "bn254",
    name: "BN254 (alt_bn128)",
    shortName: "BN254",
    category: "zk",
    usage: "Ethereum precompiles (EIP-196), Groth16, zkSync",
    nativeForm: "weierstrass",
    equation: "y^2 = x^3 + 3",
    realParams: {
      p: "21888242871839275222246405745257275088696311157297823662689037894645226208583",
      a: "0",
      b: "3",
      note: "254-bit Barreto-Naehrig curve. Pairing-friendly.",
    },
    toyParams: { a: 0, b: 3, p: 23 },
  },
  {
    id: "bls12-381",
    name: "BLS12-381",
    shortName: "BLS12",
    category: "zk",
    usage: "Ethereum 2.0 (BLS signatures), Zcash Sapling, modern ZK proofs",
    nativeForm: "weierstrass",
    equation: "y^2 = x^3 + 4",
    realParams: {
      p: "4002409555221667393417789825735904156556882819939007885332058136124031650490837864442687629129015664037894272559787",
      a: "0",
      b: "4",
      note: "381-bit curve. Pairing-friendly. G1 in Short Weierstrass.",
    },
    toyParams: { a: 0, b: 4, p: 29 },
  },
  {
    id: "jubjub",
    name: "Jubjub",
    shortName: "Jubjub",
    category: "zk",
    usage: "Zcash Sapling, ZK-SNARKs circuits over BLS12-381",
    nativeForm: "twisted-edwards",
    equation: "-x^2 + y^2 = 1 + dx^2y^2",
    realParams: {
      p: "Scalar field of BLS12-381",
      a: "\u22121 (Edwards)",
      b: "d = 0x2A9318E74BFA2B48F5FD9207E6BD7FD4...",
      note: "Defined over the scalar field of BLS12-381 for efficient in-circuit arithmetic.",
    },
    toyParams: { a: -1, b: 5, p: 41 },
  },
  {
    id: "babyjubjub",
    name: "Baby Jubjub",
    shortName: "BabyJub",
    category: "zk",
    usage: "Circom, ZoKrates, EIP-2494, Ethereum ZK circuits",
    nativeForm: "twisted-edwards",
    equation: "168700x^2 + y^2 = 1 + 168696x^2y^2",
    realParams: {
      p: "Scalar field of BN254",
      a: "168700 (Edwards a)",
      b: "168696 (Edwards d)",
      note: "Defined over BN254 scalar field. Montgomery equiv: A=168698, B=1.",
    },
    toyParams: { a: -1, b: 2, p: 23 },
  },
];
