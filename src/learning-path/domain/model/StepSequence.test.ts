import { describe, it, expect } from "vitest";
import { StepSequence } from "./StepSequence.js";

describe("StepSequence", () => {
  it("can be created from a list of step labels", () => {
    const seq = StepSequence.create(["Draw line", "Find intersection", "Reflect", "Show result", "Done"]);

    expect(seq).toBeDefined();
    expect(seq.currentStep).toBe(1);
  });

  it("reports its current position and total number of steps", () => {
    const seq = StepSequence.create(["A", "B", "C", "D", "E"]);

    expect(seq.currentStep).toBe(1);
    expect(seq.totalSteps).toBe(5);
    expect(seq.currentLabel).toBe("A");
  });

  it("advances to the next step", () => {
    const seq = StepSequence.create(["A", "B", "C", "D", "E"]);

    const advanced = seq.next();

    expect(advanced.currentStep).toBe(2);
    expect(advanced.currentLabel).toBe("B");
    expect(advanced.totalSteps).toBe(5);
  });

  it("cannot advance past the last step", () => {
    let seq = StepSequence.create(["A", "B", "C"]);
    seq = seq.next().next(); // Now at step 3/3

    const atEnd = seq.next();

    expect(atEnd.currentStep).toBe(3);
    expect(atEnd.currentLabel).toBe("C");
  });

  it("goes back to the previous step", () => {
    const seq = StepSequence.create(["A", "B", "C", "D", "E"]);
    const atStep4 = seq.next().next().next(); // step 4

    const back = atStep4.previous();

    expect(back.currentStep).toBe(3);
    expect(back.currentLabel).toBe("C");
  });

  it("cannot go back before the first step", () => {
    const seq = StepSequence.create(["A", "B", "C"]);

    const atStart = seq.previous();

    expect(atStart.currentStep).toBe(1);
    expect(atStart.currentLabel).toBe("A");
  });
});
