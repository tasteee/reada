import safeGet from 'just-safe-get'

import type {
  ArraySetterT,
  CorePreparedStoreT,
  NumberSetterT,
  ObjectSetterT,
  StringSetterT,
  WatchOptionsT,
  WatchReactionT
} from '../core/types'
import type { ReadaStore } from '../core/store'

export type BaseUseT<DataT> = {
  <SelectedT = DataT>(selector?: (state: DataT) => SelectedT): SelectedT
}

export type ArrayUseT<DataT> = BaseUseT<DataT[]> & {
  map: <ValueT>(mapper: (item: DataT) => ValueT) => ValueT[]
  find: (finder: (item: DataT) => boolean) => DataT | undefined
  filter: (filter: (item: DataT) => boolean) => DataT[]
  lookup: <ValueT = DataT>(path: string | number, fallback?: ValueT) => ValueT | DataT
}

export type ObjectUseT<DataT> = BaseUseT<DataT> & {
  lookup: <ValueT>(path: string, fallback?: ValueT) => ValueT
}

export type PreparedStoreT<DataT, SetterT, UseT> = CorePreparedStoreT<DataT, SetterT> & {
  use: UseT
}

export type PreparedBooleanStoreT = PreparedStoreT<boolean, import('../core/types').BooleanSetterT, BaseUseT<boolean>>

export type PreparedNumberStoreT = PreparedStoreT<number, NumberSetterT, BaseUseT<number>>

export type PreparedStringStoreT<DataT extends string = string> = PreparedStoreT<DataT, StringSetterT<DataT>, BaseUseT<DataT>>

export type PreparedArrayStoreT<DataT> = PreparedStoreT<DataT[], ArraySetterT<DataT>, ArrayUseT<DataT>>

export type PreparedObjectStoreT<DataT extends object> = PreparedStoreT<DataT, ObjectSetterT<DataT>, ObjectUseT<DataT>>

export type ReactStoreFactoryT<DataT, SetterT, UseT> = {
  store: ReadaStore<DataT>
  set: SetterT
  watch: (reactionOrOptions: WatchReactionT<DataT> | WatchOptionsT<DataT, unknown>) => () => void
  state: DataT
  use: UseT
}

export const createArrayUseExtensions = <DataT>(use: BaseUseT<DataT[]>): ArrayUseT<DataT> => {
  const arrayUse = use as ArrayUseT<DataT>

  arrayUse.lookup = <ValueT = DataT>(path: string | number, fallback?: ValueT) => {
    const stringPath = typeof path === 'number' ? `${path}` : path
    return arrayUse((state) => safeGet(state, stringPath, fallback))
  }

  arrayUse.find = (finder: (item: DataT) => boolean) => {
    return arrayUse((state) => state.find(finder))
  }

  arrayUse.filter = (filter: (item: DataT) => boolean) => {
    return arrayUse((state) => state.filter(filter))
  }

  arrayUse.map = <ValueT>(mapper: (item: DataT) => ValueT) => {
    return arrayUse((state) => state.map(mapper))
  }

  return arrayUse
}

export const createObjectUseExtensions = <DataT extends object>(use: BaseUseT<DataT>): ObjectUseT<DataT> => {
  const objectUse = use as ObjectUseT<DataT>

  objectUse.lookup = <ValueT>(path: string, fallback?: ValueT) => {
    return objectUse((state) => safeGet(state, path, fallback) as ValueT)
  }

  return objectUse
}
