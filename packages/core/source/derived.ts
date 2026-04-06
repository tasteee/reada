import { type StoreTupleStateT } from "./effect.ts";
import {
  READA_INTERNAL_SYMBOL,
  subscribeToStore,
  getStoreSnapshot,
  type ObservableStoreT,
  type StoreInternalT,
  type StoreObserverT,
} from "./store.ts";

export type DerivedStoreT<DerivedValueType> = ObservableStoreT<DerivedValueType> & {
  readonly value: DerivedValueType;
};

export type SelectorCallbackT<
  StoreListType extends readonly ObservableStoreT<unknown>[],
  DerivedValueType,
> = (stateTuple: StoreTupleStateT<StoreListType>) => DerivedValueType;

const checkIsStateEqual = <StateType>(leftStateValue: StateType, rightStateValue: StateType): boolean => {
  const isStateEqual = leftStateValue === rightStateValue;
  return isStateEqual;
};

const getStateTuple = <const StoreListType extends readonly ObservableStoreT<unknown>[]>(
  storeList: StoreListType,
): StoreTupleStateT<StoreListType> => {
  const stateList = storeList.map((storeValue) => {
    const stateValue = getStoreSnapshot(storeValue);
    return stateValue;
  });

  const stateTuple = stateList as StoreTupleStateT<StoreListType>;
  return stateTuple;
};

export const createDerivedStore = <
  const StoreListType extends readonly ObservableStoreT<unknown>[],
  DerivedValueType,
>(
  sourceStoreList: StoreListType,
  selectorFunction: SelectorCallbackT<StoreListType, DerivedValueType>,
): DerivedStoreT<DerivedValueType> => {
  const observerSet = new Set<StoreObserverT<DerivedValueType>>();

  // This cache keeps derived evaluation lazy while preserving latest computed value.
  const derivedState = {
    isCacheAvailable: false,
    isDirty: true,
    cachedValue: undefined as DerivedValueType | undefined,
  };

  const computeDerivedValue = (): DerivedValueType => {
    const stateTuple = getStateTuple(sourceStoreList);
    const nextDerivedValue = selectorFunction(stateTuple);

    return nextDerivedValue;
  };

  const getCachedValue = (): DerivedValueType => {
    const isCacheMissing = !derivedState.isCacheAvailable;
    const isCacheDirty = derivedState.isDirty;
    const shouldRefreshCache = isCacheMissing || isCacheDirty;

    if (shouldRefreshCache) {
      const nextDerivedValue = computeDerivedValue();

      derivedState.cachedValue = nextDerivedValue;
      derivedState.isCacheAvailable = true;
      derivedState.isDirty = false;
    }

    const cachedValue = derivedState.cachedValue as DerivedValueType;
    return cachedValue;
  };

  const notifyObservers = (nextDerivedValue: DerivedValueType): void => {
    const observerList = Array.from(observerSet);

    observerList.forEach((observerFunction) => {
      observerFunction(nextDerivedValue);
    });
  };

  const handleSourceChange = (): void => {
    const isObserverActive = observerSet.size > 0;

    if (!isObserverActive) {
      derivedState.isDirty = true;
      return;
    }

    const previousDerivedValue = getCachedValue();
    const nextDerivedValue = computeDerivedValue();
    const isDerivedValueEqual = checkIsStateEqual(previousDerivedValue, nextDerivedValue);

    derivedState.cachedValue = nextDerivedValue;
    derivedState.isCacheAvailable = true;
    derivedState.isDirty = false;

    if (isDerivedValueEqual) {
      return;
    }

    notifyObservers(nextDerivedValue);
  };

  sourceStoreList.forEach((sourceStoreValue) => {
    subscribeToStore(sourceStoreValue, () => {
      handleSourceChange();
    });
  });

  const subscribe = (observerFunction: StoreObserverT<DerivedValueType>): (() => void) => {
    observerSet.add(observerFunction);

    // On first active observer, establish a baseline value without emitting.
    const isCacheMissing = !derivedState.isCacheAvailable;
    const isCacheDirty = derivedState.isDirty;
    const shouldPrimeCache = isCacheMissing || isCacheDirty;

    if (shouldPrimeCache) {
      getCachedValue();
    }

    const stopObserver = (): void => {
      observerSet.delete(observerFunction);
    };

    return stopObserver;
  };

  const derivedStoreRecord: Record<PropertyKey, unknown> = {
    [READA_INTERNAL_SYMBOL]: {
      getSnapshot: () => getCachedValue(),
      subscribe: subscribe,
    } satisfies StoreInternalT<DerivedValueType>,
  };

  Object.defineProperty(derivedStoreRecord, "value", {
    enumerable: true,
    configurable: false,
    get: () => getCachedValue(),
  });

  const derivedStore = derivedStoreRecord as DerivedStoreT<DerivedValueType>;
  return derivedStore;
};