import { createDerivedStore, type DerivedStoreT, type SelectorCallbackT } from "./derived.ts";
import { createEffect, type EffectCallbackT } from "./effect.ts";
import { createWritableStore, type ObservableStoreT, type WritableStoreT } from "./store.ts";

type ReadaNamespaceT = {
  store: <StateType>(initialStateValue: StateType) => WritableStoreT<StateType>;
  effect: <const StoreListType extends readonly ObservableStoreT<unknown>[]>(
    storeList: StoreListType,
    callbackFunction: EffectCallbackT<StoreListType>,
  ) => () => void;
  derived: <const StoreListType extends readonly ObservableStoreT<unknown>[], DerivedValueType>(
    sourceStoreList: StoreListType,
    selectorFunction: SelectorCallbackT<StoreListType, DerivedValueType>,
  ) => DerivedStoreT<DerivedValueType>;
};

export const reada: ReadaNamespaceT = {
  store: createWritableStore,
  effect: createEffect,
  derived: createDerivedStore,
};

export type {
  AsyncUpdaterT,
  ObservableStoreT,
  StoreInternalT,
  StoreObserverT,
  SyncUpdaterT,
  WritableStoreT,
  WriteT,
} from "./store.ts";
export type { DerivedStoreT, SelectorCallbackT } from "./derived.ts";
export type { EffectCallbackT, StoreTupleStateT } from "./effect.ts";