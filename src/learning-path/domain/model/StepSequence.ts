export class StepSequence {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly currentLabel: string;

  private constructor(private readonly labels: string[], private readonly index: number) {
    this.currentStep = index + 1;
    this.totalSteps = labels.length;
    this.currentLabel = labels[index];
  }

  static create(labels: string[]): StepSequence {
    return new StepSequence(labels, 0);
  }

  next(): StepSequence {
    if (this.index >= this.labels.length - 1) return this;
    return new StepSequence(this.labels, this.index + 1);
  }

  previous(): StepSequence {
    if (this.index <= 0) return this;
    return new StepSequence(this.labels, this.index - 1);
  }
}
