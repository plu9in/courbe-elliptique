import { describe, it, expect } from "vitest";
import { AnimationStep } from "./AnimationStep.js";

describe("AnimationStep", () => {
  it("carries a label and an explanation", () => {
    const step: AnimationStep = {
      label: "Draw line",
      explanation: "Draw a straight line through P and Q",
    };

    expect(step.label).toBe("Draw line");
    expect(step.explanation).toBe("Draw a straight line through P and Q");
  });

  it("can carry a formula template with substituted values", () => {
    const step: AnimationStep = {
      label: "Compute slope",
      explanation: "The slope of the secant line through P and Q",
      formula: "s = (y₂ - y₁) / (x₂ - x₁)",
      values: { y1: 2, y2: 4, x1: 1, x2: 3 },
    };

    expect(step.formula).toBe("s = (y₂ - y₁) / (x₂ - x₁)");
    expect(step.values).toEqual({ y1: 2, y2: 4, x1: 1, x2: 3 });
  });
});
