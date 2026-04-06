import { reada as readaCore, type ObservableStoreT } from "@reada/core";
import { useSyncExternalStore } from "react";

type StoreWithStateT<StateType> = {
  readonly state: StateType;
};

type StoreWithValueT<StateType> = {
  readonly value: StateType;
};

export type UseSelectorT<StateType, SelectedValueType> = (stateValue: StateType) => SelectedValueType;

export type UseStoreHookT<StateType> = {
  (): StateType;
  <SelectedValueType>(selectorFunction: UseSelectorT<StateType, SelectedValueType>): SelectedValueType;
};

type UseableStoreT<StateType> = ObservableStoreT<StateType> & (StoreWithStateT<StateType> | StoreWithValueT<StateType>);

const checkStoreHasStateGetter = <StateType>(
  storeValue: UseableStoreT<StateType>,
): storeValue is ObservableStoreT<StateType> & StoreWithStateT<StateType> => {
  const hasStateGetter = "state" in storeValue;
  return hasStateGetter;
};

const getStoreSnapshotValue = <StateType>(storeValue: UseableStoreT<StateType>): StateType => {
  const hasStateGetter = checkStoreHasStateGetter(storeValue);

  if (hasStateGetter) {
    const stateValue = storeValue.state;
    return stateValue;
  }

  const valueValue = storeValue.value;
  return valueValue;
};

const subscribeToStore = <StateType>(storeValue: UseableStoreT<StateType>, onStoreChange: () => void): (() => void) => {
  const stopEffect = readaCore.effect([storeValue], () => {
    onStoreChange();
  });

  return stopEffect;
};

export function useStore<StateType>(storeValue: UseableStoreT<StateType>): StateType;
export function useStore<StateType, SelectedValueType>(
  storeValue: UseableStoreT<StateType>,
  selectorFunction: UseSelectorT<StateType, SelectedValueType>,
): SelectedValueType;
export function useStore<StateType, SelectedValueType>(
  storeValue: UseableStoreT<StateType>,
  selectorFunction?: UseSelectorT<StateType, SelectedValueType>,
): StateType | SelectedValueType {
  const getSelectedSnapshot = (): StateType | SelectedValueType => {
    const stateValue = getStoreSnapshotValue(storeValue);

    const hasSelector = typeof selectorFunction === "function";

    if (!hasSelector) {
      return stateValue;
    }

    const selectedValue = selectorFunction(stateValue);
    return selectedValue;
  };

  const subscribeToStore = (onStoreChange: () => void): (() => void) => {
    const stopSubscription = subscribeToStore(storeValue, onStoreChange);
    return stopSubscription;
  };

  const selectedSnapshotValue = useSyncExternalStore(subscribeToStore, getSelectedSnapshot, getSelectedSnapshot);
  return selectedSnapshotValue;
}