type BooleanWriteInputT = boolean | ((stateValue: boolean) => boolean);

export type BooleanWriteT = (nextStateOrUpdater: BooleanWriteInputT) => void | Promise<void>;

export type BooleanHelpersT = {
  toggle: () => void;
  on: () => void;
  off: () => void;
};

export const getBooleanHelpers = (writeBooleanState: BooleanWriteT): BooleanHelpersT => {
  const toggle = (): void => {
    writeBooleanState((stateValue) => !stateValue);
  };

  const on = (): void => {
    writeBooleanState(true);
  };

  const off = (): void => {
    writeBooleanState(false);
  };

  return {
    toggle,
    on,
    off,
  };
};