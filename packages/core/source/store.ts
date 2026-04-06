import { getArrayHelpers, type ArrayHelpersT, type ArrayWriteT } from "./helpers/array.ts";
import { getBooleanHelpers, type BooleanHelpersT, type BooleanWriteT } from "./helpers/boolean.ts";
import { getNumberHelpers, type NumberHelpersT, type NumberWriteT } from "./helpers/number.ts";
import { getObjectHelpers, type ObjectHelpersT, type ObjectWriteT } from "./helpers/object.ts";

const READ_ONLY_STATE_ERROR_MESSAGE = "reada: .state is read-only. Use .write() to update state.";

export const READA_INTERNAL_SYMBOL = Symbol("reada.internal");

export type StoreObserverT<StateType> = (stateValue: StateType) => void;

export type StoreInternalT<StateType> = {
  getSnapshot: () => StateType;
  subscribe: (observerFunction: StoreObserverT<StateType>) => () => void;
};

export type ObservableStoreT<StateType> = {
  readonly [READA_INTERNAL_SYMBOL]: StoreInternalT<StateType>;
};

export type SyncUpdaterT<StateType> = (stateValue: StateType) => StateType;

export type AsyncUpdaterT<StateType> = (stateValue: StateType) => Promise<StateType>;

export type WriteT<StateType> = {
  (nextStateValue: StateType): void;
  (updaterFunction: SyncUpdaterT<StateType>): void;
  (updaterFunction: AsyncUpdaterT<StateType>): Promise<void>;
};

type BooleanStoreHelpersT<StateType> = StateType extends boolean ? BooleanHelpersT : {};

type NumberStoreHelpersT<StateType> = StateType extends number ? NumberHelpersT : {};

type ArrayStoreHelpersT<StateType> = StateType extends Array<infer ItemType> ? ArrayHelpersT<ItemType> : {};

type ObjectStoreHelpersT<StateType> = StateType extends readonly unknown[]
  ? {}
  : StateType extends object
    ? ObjectHelpersT<StateType & Record<string, unknown>>
    : {};

export type WritableStoreT<StateType> = ObservableStoreT<StateType> & {
  readonly state: StateType;
  write: WriteT<StateType>;
  reset: () => void;
} & BooleanStoreHelpersT<StateType>
  & NumberStoreHelpersT<StateType>
  & ArrayStoreHelpersT<StateType>
  & ObjectStoreHelpersT<StateType>;

export const getStoreSnapshot = <StateType>(storeValue: ObservableStoreT<StateType>): StateType => {
  const internalStore = storeValue[READA_INTERNAL_SYMBOL];
  const snapshotValue = internalStore.getSnapshot();

  return snapshotValue;
};

export const subscribeToStore = <StateType>(
  storeValue: ObservableStoreT<StateType>,
  observerFunction: StoreObserverT<StateType>,
): (() => void) => {
  const internalStore = storeValue[READA_INTERNAL_SYMBOL];
  const stopObserver = internalStore.subscribe(observerFunction);

  return stopObserver;
};

const checkIsStateEqual = <StateType>(leftStateValue: StateType, rightStateValue: StateType): boolean => {
  const isStateEqual = leftStateValue === rightStateValue;
  return isStateEqual;
};

export const createWritableStore = <StateType>(initialStateValue: StateType): WritableStoreT<StateType> => {
  const observerSet = new Set<StoreObserverT<StateType>>();

  // This mutable box keeps state private while exposing a read-only getter.
  const storeState = {
    currentStateValue: initialStateValue,
  };

  const notifyObservers = (nextStateValue: StateType): void => {
    const observerList = Array.from(observerSet);

    observerList.forEach((observerFunction) => {
      observerFunction(nextStateValue);
    });
  };

  const setState = (nextStateValue: StateType): void => {
    const previousStateValue = storeState.currentStateValue;
    const isStateEqual = checkIsStateEqual(previousStateValue, nextStateValue);

    if (isStateEqual) {
      return;
    }

    storeState.currentStateValue = nextStateValue;
    notifyObservers(nextStateValue);
  };

  const subscribe = (observerFunction: StoreObserverT<StateType>): (() => void) => {
    observerSet.add(observerFunction);

    const stopObserver = (): void => {
      observerSet.delete(observerFunction);
    };

    return stopObserver;
  };

  const write = ((nextStateOrUpdater: StateType | SyncUpdaterT<StateType> | AsyncUpdaterT<StateType>) => {
    const isUpdaterFunction = typeof nextStateOrUpdater === "function";

    if (!isUpdaterFunction) {
      setState(nextStateOrUpdater);
      return;
    }

    const updaterFunction = nextStateOrUpdater as SyncUpdaterT<StateType> | AsyncUpdaterT<StateType>;
    const currentStateValue = storeState.currentStateValue;
    const updaterResultValue = updaterFunction(currentStateValue);
    const isAsyncResult = updaterResultValue instanceof Promise;

    if (!isAsyncResult) {
      const nextStateValue = updaterResultValue;
      setState(nextStateValue);
      return;
    }

    const applyAsyncWrite = async (): Promise<void> => {
      const nextStateValue = await updaterResultValue;
      setState(nextStateValue);
    };

    return applyAsyncWrite();
  }) as WriteT<StateType>;

  const reset = (): void => {
    setState(initialStateValue);
  };

  const storeRecord: Record<PropertyKey, unknown> = {
    write,
    reset,
    [READA_INTERNAL_SYMBOL]: {
      getSnapshot: () => storeState.currentStateValue,
      subscribe: subscribe,
    } satisfies StoreInternalT<StateType>,
  };

  Object.defineProperty(storeRecord, "state", {
    enumerable: true,
    configurable: false,
    get: () => storeState.currentStateValue,
    set: () => {
      throw new Error(READ_ONLY_STATE_ERROR_MESSAGE);
    },
  });

  // Type-specific helper methods are attached based on initial value shape.
  const isBooleanStore = typeof initialStateValue === "boolean";
  const isNumberStore = typeof initialStateValue === "number";
  const isArrayStore = Array.isArray(initialStateValue);
  const isObjectStore = typeof initialStateValue === "object" && initialStateValue !== null && !Array.isArray(initialStateValue);

  if (isBooleanStore) {
    const booleanHelpers = getBooleanHelpers(write as unknown as BooleanWriteT);
    Object.assign(storeRecord, booleanHelpers);
  }

  if (isNumberStore) {
    const numberHelpers = getNumberHelpers(write as unknown as NumberWriteT);
    Object.assign(storeRecord, numberHelpers);
  }

  if (isArrayStore) {
    const arrayHelpers = getArrayHelpers(write as unknown as ArrayWriteT<unknown>);
    Object.assign(storeRecord, arrayHelpers);
  }

  if (isObjectStore) {
    const objectHelpers = getObjectHelpers(write as unknown as ObjectWriteT<Record<string, unknown>>);
    Object.assign(storeRecord, objectHelpers);
  }

  const writableStore = storeRecord as WritableStoreT<StateType>;
  return writableStore;
};