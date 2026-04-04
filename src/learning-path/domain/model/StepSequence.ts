import type { AnimationStep } from "./AnimationStep.js";

export class StepSequence {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly currentLabel: string;
  readonly currentExplanation?: string;
  readonly currentFormula?: string;
  readonly currentValues?: Record<string, number>;

  private constructor(
    private readonly steps: AnimationStep[],
    private readonly index: number,
  ) {
    this.currentStep = index + 1;
    this.totalSteps = steps.length;
    this.currentLabel = steps[index].label;
    this.currentExplanation = steps[index].explanation;
    this.currentFormula = steps[index].formula;
    this.currentValues = steps[index].values;
  }

  static create(labels: string[]): StepSequence {
    return new StepSequence(
      labels.map((label) => ({ label, explanation: label })),
      0,
    );
  }

  static fromSteps(steps: AnimationStep[]): StepSequence {
    return new StepSequence(steps, 0);
  }

  next(): StepSequence {
    if (this.index >= this.steps.length - 1) return this;
    return new StepSequence(this.steps, this.index + 1);
  }

  previous(): StepSequence {
    if (this.index <= 0) return this;
    return new StepSequence(this.steps, this.index - 1);
  }
}
