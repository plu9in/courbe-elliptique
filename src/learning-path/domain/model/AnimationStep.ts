export interface AnimationStep {
  readonly label: string;
  readonly explanation: string;
  readonly formula?: string;
  readonly values?: Record<string, number>;
}
