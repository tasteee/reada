import { subscribeToStore, getStoreSnapshot, type ObservableStoreT } from "./store.ts";

export type StoreTupleStateT<StoreListType extends readonly ObservableStoreT<unknown>[]> = {
  [StoreIndex in keyof StoreListType]: StoreListType[StoreIndex] extends ObservableStoreT<infer StateType>
    ? StateType
    : never;
};

export type EffectCallbackT<StoreListType extends readonly ObservableStoreT<unknown>[]> = (
  stateTuple: StoreTupleStateT<StoreListType>,
) => void;

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

export const createEffect = <const StoreListType extends readonly ObservableStoreT<unknown>[]>(
  storeList: StoreListType,
  callbackFunction: EffectCallbackT<StoreListType>,
): (() => void) => {
  const effectState = {
    isStopped: false,
  };

  const stopObserverList = storeList.map((storeValue) => {
    const stopObserver = subscribeToStore(storeValue, () => {
      const isStopped = effectState.isStopped;

      if (isStopped) {
        return;
      }

      const stateTuple = getStateTuple(storeList);
      callbackFunction(stateTuple);
    });

    return stopObserver;
  });

  const stop = (): void => {
    const isStopped = effectState.isStopped;

    if (isStopped) {
      return;
    }

    effectState.isStopped = true;

    stopObserverList.forEach((stopObserver) => {
      stopObserver();
    });
  };

  return stop;
};