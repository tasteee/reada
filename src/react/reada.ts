import { Reada as CoreReada } from '../core/reada'

import { useStore } from './useStore'
import { createArrayUseExtensions, createObjectUseExtensions } from './types'

import type {
  BaseUseT,
  PreparedArrayStoreT,
  PreparedBooleanStoreT,
  PreparedNumberStoreT,
  PreparedObjectStoreT,
  PreparedStoreT,
  PreparedStringStoreT
} from './types'

import type {
  ArraySetterT,
  BooleanSetterT,
  ExtractedMiddlewareSetT,
  InnerMiddlewareFunctionT,
  NumberSetterT,
  ObjectSetterT,
  StringSetterT
} from '../core/types'

const createPreparedStoreWithUse = <DataT, SetterT, UseT>(
  coreStore: {
    set: SetterT
    store: import('../core/store').ReadaStore<DataT>
    watch: (reactionOrOptions: any) => () => void
    state: DataT
  },
  use: UseT
) => {
  return {
    set: coreStore.set,
    store: coreStore.store,
    watch: coreStore.watch,
    use,
    get state() {
      return coreStore.state
    }
  }
}

export class ReactReada<ExtraSetT extends object = {}> extends CoreReada<ExtraSetT> {
  boolean = (initialValue: boolean): PreparedStoreT<boolean, BooleanSetterT & ExtraSetT, BaseUseT<boolean>> => {
    const coreStore = super.boolean(initialValue)

    const use = (<SelectedT = boolean>(selector?: (state: boolean) => SelectedT) => {
      return useStore(coreStore.store, selector)
    }) as BaseUseT<boolean>

    const preparedStore = createPreparedStoreWithUse(coreStore, use) as PreparedStoreT<boolean, BooleanSetterT & ExtraSetT, BaseUseT<boolean>>

    return preparedStore
  }

  number = (initialValue: number): PreparedStoreT<number, NumberSetterT & ExtraSetT, BaseUseT<number>> => {
    const coreStore = super.number(initialValue)

    const use = (<SelectedT = number>(selector?: (state: number) => SelectedT) => {
      return useStore(coreStore.store, selector)
    }) as BaseUseT<number>

    const preparedStore = createPreparedStoreWithUse(coreStore, use) as PreparedStoreT<number, NumberSetterT & ExtraSetT, BaseUseT<number>>

    return preparedStore
  }

  string = <DataT extends string>(initialValue: DataT): PreparedStoreT<DataT, StringSetterT<DataT> & ExtraSetT, BaseUseT<DataT>> => {
    const coreStore = super.string<DataT>(initialValue)

    const use = (<SelectedT = DataT>(selector?: (state: DataT) => SelectedT) => {
      return useStore(coreStore.store, selector)
    }) as BaseUseT<DataT>

    const preparedStore = createPreparedStoreWithUse(coreStore, use) as PreparedStoreT<DataT, StringSetterT<DataT> & ExtraSetT, BaseUseT<DataT>>

    return preparedStore
  }

  array = <DataT>(initialValue: DataT[]): PreparedStoreT<DataT[], ArraySetterT<DataT> & ExtraSetT, BaseUseT<DataT[]>> => {
    const coreStore = super.array<DataT>(initialValue)

    const useBase = (<SelectedT = DataT[]>(selector?: (state: DataT[]) => SelectedT) => {
      return useStore(coreStore.store, selector)
    }) as BaseUseT<DataT[]>

    const use = createArrayUseExtensions<DataT>(useBase)

    const preparedStore = createPreparedStoreWithUse(coreStore, use) as PreparedStoreT<DataT[], ArraySetterT<DataT> & ExtraSetT, BaseUseT<DataT[]>>

    return preparedStore
  }

  object = <DataT extends object>(initialValue: DataT): PreparedStoreT<DataT, ObjectSetterT<DataT> & ExtraSetT, BaseUseT<DataT>> => {
    const coreStore = super.object<DataT>(initialValue)

    const useBase = (<SelectedT = DataT>(selector?: (state: DataT) => SelectedT) => {
      return useStore(coreStore.store, selector)
    }) as BaseUseT<DataT>

    const use = createObjectUseExtensions<DataT>(useBase)

    const preparedStore = createPreparedStoreWithUse(coreStore, use) as PreparedStoreT<DataT, ObjectSetterT<DataT> & ExtraSetT, BaseUseT<DataT>>

    return preparedStore
  }

  withMiddleware = <M extends InnerMiddlewareFunctionT>(...middlewares: M[]): ReactReada<ExtraSetT & ExtractedMiddlewareSetT<M>> => {
    const nextCore = super.withMiddleware(...middlewares)
    const nextReact = new ReactReada<ExtraSetT & ExtractedMiddlewareSetT<M>>()
    nextReact.stagedMiddleware = nextCore.stagedMiddleware
    return nextReact
  }
}

export const reada = new ReactReada()
