import type { ReadaStore } from './store'

export type SelectorT<DataT, SelectedT> = (state: DataT) => SelectedT

export type WatchReactionT<DataT> = (oldValue: DataT, newValue: DataT) => void

export type WatchOptionsT<DataT, SelectedT = DataT> = {
  selector: SelectorT<DataT, SelectedT>
  reaction: (oldValue: SelectedT, newValue: SelectedT) => void
}

export type DrafterT<DataT> = (draft: DataT) => void | DataT

export type AsyncSetterT<DataT> = (state: DataT) => Promise<DrafterT<DataT> | DataT>

export type BaseSetterT<DataT> = {
  (value: DataT): void
  reset: () => void
  byAsync: (asyncUpdater: AsyncSetterT<DataT>) => Promise<boolean>
  by: (updaterFn: DrafterT<DataT>) => void
}

export type BooleanSetterT = BaseSetterT<boolean> & {
  toggle: () => void
}

export type NumberSetterT = BaseSetterT<number> & {
  add: (value: number) => void
  subtract: (value: number) => void
  fromEventTarget: (event: Event) => void
}

export type StringSetterT<DataT extends string = string> = BaseSetterT<DataT> & {
  fromEventTarget: (event: Event) => void
}

export type ArraySetterT<DataT> = BaseSetterT<DataT[]> & {
  append: (...items: DataT[]) => void
  prepend: (...items: DataT[]) => void
  lookup: (path: string | number, value: unknown) => void
}

export type ObjectSetterT<DataT extends object> = {
  (value: Partial<DataT>): void
  lookup: (path: string, value: unknown) => void
  replace: (value: DataT) => void
  reset: () => void
  byAsync: (asyncUpdater: AsyncSetterT<DataT>) => Promise<boolean>
  by: (updaterFn: DrafterT<DataT>) => void
}

export type SubscriberT<DataT, SelectedT = DataT> = {
  id: string
  update: (newValue: SelectedT) => void
  derive?: SelectorT<DataT, SelectedT>
  previousValue: SelectedT
}

export type WatcherEntryT<DataT> = {
  selector?: SelectorT<DataT, unknown>
  reaction: (oldValue: unknown, newValue: unknown) => void
  previousValue: unknown
}

export type SubscribeT<DataT> = (subscriber: SubscriberT<DataT, unknown>) => () => void

export type CorePreparedStoreT<DataT, SetterT = BaseSetterT<DataT>> = {
  set: SetterT
  state: DataT
  store: ReadaStore<DataT>
  watch: (reactionOrOptions: WatchReactionT<DataT> | WatchOptionsT<DataT, unknown>) => () => void
}

export type CorePreparedBooleanStoreT = CorePreparedStoreT<boolean, BooleanSetterT>

export type CorePreparedNumberStoreT = CorePreparedStoreT<number, NumberSetterT>

export type CorePreparedStringStoreT<DataT extends string = string> = CorePreparedStoreT<DataT, StringSetterT<DataT>>

export type CorePreparedArrayStoreT<DataT> = CorePreparedStoreT<DataT[], ArraySetterT<DataT>>

export type CorePreparedObjectStoreT<DataT extends object> = CorePreparedStoreT<DataT, ObjectSetterT<DataT>>

export type InnerMiddlewareFunctionT = <StoreT extends { set: any; state: any }>(store: StoreT) => any

export type TypedMiddlewareFunctionT<SetEnhancementT extends object> = InnerMiddlewareFunctionT & {
  readonly __setEnhancement?: SetEnhancementT
}

export type ExtractedMiddlewareSetT<M> = M extends TypedMiddlewareFunctionT<infer SE>
  ? SE extends object
    ? SE
    : {}
  : {}

export type MiddlewareFunctionT<OptionsT = unknown> = (options: OptionsT) => InnerMiddlewareFunctionT
