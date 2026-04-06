const INVALID_STEP_ERROR_MESSAGE = "reada: step must be a positive number.";

type NumberWriteInputT = number | ((stateValue: number) => number);

export type NumberWriteT = (nextStateOrUpdater: NumberWriteInputT) => void | Promise<void>;

export type NumberHelpersT = {
  increment: (stepValue?: number) => void;
  decrement: (stepValue?: number) => void;
};

const checkIsValidStep = (stepValue: number): boolean => {
  const isFiniteStep = Number.isFinite(stepValue);
  const isPositiveStep = stepValue > 0;
  const isValidStep = isFiniteStep && isPositiveStep;

  return isValidStep;
};

const assertValidStep = (stepValue: number): void => {
  const isValidStep = checkIsValidStep(stepValue);

  if (!isValidStep) {
    throw new Error(INVALID_STEP_ERROR_MESSAGE);
  }
};

export const getNumberHelpers = (writeNumberState: NumberWriteT): NumberHelpersT => {
  const increment = (stepValue: number = 1): void => {
    assertValidStep(stepValue);

    writeNumberState((stateValue) => {
      const nextStateValue = stateValue + stepValue;
      return nextStateValue;
    });
  };

  const decrement = (stepValue: number = 1): void => {
    assertValidStep(stepValue);

    writeNumberState((stateValue) => {
      const nextStateValue = stateValue - stepValue;
      return nextStateValue;
    });
  };

  return {
    increment,
    decrement,
  };
};