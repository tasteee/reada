import {
  reada as readaCore,
  type DerivedStoreT,
  type EffectCallbackT,
  type ObservableStoreT,
  type SelectorCallbackT,
  type WritableStoreT,
} from "@reada/core";
import { useArrayFilter, type UseArrayFilterHookT } from "./useArrayFilter.ts";
import { useArrayMap, type UseArrayMapHookT } from "./useArrayMap.ts";
import { useStore, type UseSelectorT, type UseStoreHookT } from "./useStore.ts";
import { useStoreAt, type UseStoreAtHookT } from "./useStoreAt.ts";

type BaseUseHookT<StateType> = UseStoreHookT<StateType>;

type ObjectUseExtensionT<StateType> = StateType extends readonly unknown[]
  ? {}
  : StateType extends Record<string, unknown>
    ? {
      at: UseStoreAtHookT<StateType>;
    }
    : {};

type ArrayUseExtensionT<StateType> = StateType extends Array<infer ItemType>
  ? {
    filter: UseArrayFilterHookT<ItemType>;
    map: UseArrayMapHookT<ItemType>;
  }
  : {};

export type WritableStoreWithUseT<StateType> = WritableStoreT<StateType> & {
  use: BaseUseHookT<StateType> & ObjectUseExtensionT<StateType> & ArrayUseExtensionT<StateType>;
};

export type DerivedStoreWithUseT<DerivedValueType> = DerivedStoreT<DerivedValueType> & {
  use: BaseUseHookT<DerivedValueType>;
};

type ReactReadaNamespaceT = {
  store: <StateType>(initialStateValue: StateType) => WritableStoreWithUseT<StateType>;
  effect: <const StoreListType extends readonly ObservableStoreT<unknown>[]>(
    storeList: StoreListType,
    callbackFunction: EffectCallbackT<StoreListType>,
  ) => () => void;
  derived: <const StoreListType extends readonly ObservableStoreT<unknown>[], DerivedValueType>(
    sourceStoreList: StoreListType,
    selectorFunction: SelectorCallbackT<StoreListType, DerivedValueType>,
  ) => DerivedStoreWithUseT<DerivedValueType>;
};

const attachUseHookToStore = <StateType>(storeValue: WritableStoreT<StateType>): WritableStoreWithUseT<StateType> => {
  const useHook = ((selectorFunction?: UseSelectorT<StateType, unknown>) => {
    const hasSelector = typeof selectorFunction === "function";

    if (hasSelector) {
      const selectedValue = useStore(storeValue, selectorFunction);
      return selectedValue;
    }

    const fullStateValue = useStore(storeValue);
    return fullStateValue;
  }) as BaseUseHookT<StateType> & ObjectUseExtensionT<StateType> & ArrayUseExtensionT<StateType>;

  // Object stores get path-based selector helper.
  const stateValue = storeValue.state;
  const isObjectStore = typeof stateValue === "object" && stateValue !== null && !Array.isArray(stateValue);

  if (isObjectStore) {
    const useAt = ((pathValue: string) => {
      const objectStoreValue = storeValue as WritableStoreT<Record<string, unknown>>;
      const valueAtPath = useStoreAt(objectStoreValue, pathValue);
      return valueAtPath;
    }) as UseStoreAtHookT<StateType & Record<string, unknown>>;

    Object.assign(useHook, {
      at: useAt,
    });
  }

  // Array stores get shallow-memoized filter/map selectors.
  const isArrayStore = Array.isArray(stateValue);

  if (isArrayStore) {
    const useFilter = ((predicateFunction: (itemValue: unknown, itemIndex: number, itemList: unknown[]) => boolean) => {
      const arrayStoreValue = storeValue as unknown as WritableStoreT<unknown[]>;
      const filteredList = useArrayFilter(arrayStoreValue, predicateFunction);
      return filteredList;
    }) as UseArrayFilterHookT<unknown>;

    const useMap = ((transformFunction: (itemValue: unknown, itemIndex: number, itemList: unknown[]) => unknown) => {
      const arrayStoreValue = storeValue as unknown as WritableStoreT<unknown[]>;
      const mappedList = useArrayMap(arrayStoreValue, transformFunction);
      return mappedList;
    }) as UseArrayMapHookT<unknown>;

    Object.assign(useHook, {
      filter: useFilter,
      map: useMap,
    });
  }

  const writableStoreWithUse = Object.assign(storeValue, {
    use: useHook,
  }) as WritableStoreWithUseT<StateType>;

  return writableStoreWithUse;
};

const attachUseHookToDerivedStore = <DerivedValueType>(
  derivedStoreValue: DerivedStoreT<DerivedValueType>,
): DerivedStoreWithUseT<DerivedValueType> => {
  const useHook = ((selectorFunction?: UseSelectorT<DerivedValueType, unknown>) => {
    const hasSelector = typeof selectorFunction === "function";

    if (hasSelector) {
      const selectedValue = useStore(derivedStoreValue, selectorFunction);
      return selectedValue;
    }

    const fullValue = useStore(derivedStoreValue);
    return fullValue;
  }) as BaseUseHookT<DerivedValueType>;

  const derivedStoreWithUse = Object.assign(derivedStoreValue, {
    use: useHook,
  }) as DerivedStoreWithUseT<DerivedValueType>;

  return derivedStoreWithUse;
};

export const reada: ReactReadaNamespaceT = {
  store: <StateType>(initialStateValue: StateType): WritableStoreWithUseT<StateType> => {
    const writableStore = readaCore.store(initialStateValue);
    const writableStoreWithUse = attachUseHookToStore(writableStore);
    return writableStoreWithUse;
  },
  effect: readaCore.effect,
  derived: <const StoreListType extends readonly ObservableStoreT<unknown>[], DerivedValueType>(
    sourceStoreList: StoreListType,
    selectorFunction: SelectorCallbackT<StoreListType, DerivedValueType>,
  ): DerivedStoreWithUseT<DerivedValueType> => {
    const derivedStore = readaCore.derived(sourceStoreList, selectorFunction);
    const derivedStoreWithUse = attachUseHookToDerivedStore(derivedStore);
    return derivedStoreWithUse;
  },
};

export type { UseArrayFilterHookT, UseArrayMapHookT, UseSelectorT, UseStoreAtHookT, UseStoreHookT };