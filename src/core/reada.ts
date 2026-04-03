import safeSet from 'just-safe-set'

import { middleware } from './middleware'
import { ReadaStore } from './store'
import { createByAsync, createSetBy, setFromEventTargetValue } from './utilities'

import type {
  ArraySetterT,
  BaseSetterT,
  BooleanSetterT,
  CorePreparedArrayStoreT,
  CorePreparedBooleanStoreT,
  CorePreparedNumberStoreT,
  CorePreparedObjectStoreT,
  CorePreparedStoreT,
  CorePreparedStringStoreT,
  ExtractedMiddlewareSetT,
  InnerMiddlewareFunctionT,
  NumberSetterT,
  ObjectSetterT,
  StringSetterT
} from './types'

export class Reada<ExtraSetT extends object = {}> {
  middleware = middleware
  stagedMiddleware: InnerMiddlewareFunctionT[] = []

  boolean(initialValue: boolean): CorePreparedStoreT<boolean, BooleanSetterT & ExtraSetT> {
    const store = new ReadaStore<boolean>(initialValue)

    const set = ((value: boolean) => {
      store.replaceState(Boolean(value))
    }) as BooleanSetterT

    set.toggle = () => {
      set(!store.state)
    }

    set.byAsync = createByAsync<boolean>(store)
    set.by = createSetBy<boolean>(store)

    set.reset = () => {
      set(store.initialState)
    }

    const preparedStore: CorePreparedBooleanStoreT = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      store,
      get state() {
        return store.state
      }
    }

    return this.applyMiddlewares(preparedStore)
  }

  number(initialValue: number): CorePreparedStoreT<number, NumberSetterT & ExtraSetT> {
    const store = new ReadaStore<number>(initialValue)

    const asNumber = (value: unknown) => {
      const isNumber = typeof value === 'number'

      if (isNumber) {
        return value
      }

      return Number(value)
    }

    const set = ((value: number) => {
      store.replaceState(asNumber(value))
    }) as NumberSetterT

    set.fromEventTarget = setFromEventTargetValue<number>(set)

    set.add = (value: number) => {
      set(store.state + value)
    }

    set.subtract = (value: number) => {
      set(store.state - value)
    }

    set.byAsync = createByAsync<number>(store)
    set.by = createSetBy<number>(store)

    set.reset = () => {
      set(store.initialState)
    }

    const preparedStore: CorePreparedNumberStoreT = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      store,
      get state() {
        return store.state
      }
    }

    return this.applyMiddlewares(preparedStore)
  }

  string<DataT extends string>(initialValue: DataT): CorePreparedStoreT<DataT, StringSetterT<DataT> & ExtraSetT> {
    const store = new ReadaStore<DataT>(initialValue)

    const set = ((value: DataT) => {
      store.replaceState(value)
    }) as StringSetterT<DataT>

    set.fromEventTarget = setFromEventTargetValue<DataT>(set)

    set.byAsync = createByAsync<DataT>(store)
    set.by = createSetBy<DataT>(store)

    set.reset = () => {
      set(store.initialState)
    }

    const preparedStore: CorePreparedStringStoreT<DataT> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      store,
      get state() {
        return store.state
      }
    }

    return this.applyMiddlewares(preparedStore)
  }

  array<DataT>(initialValue: DataT[]): CorePreparedStoreT<DataT[], ArraySetterT<DataT> & ExtraSetT> {
    const store = new ReadaStore<DataT[]>(initialValue)

    const set = ((value: DataT[]) => {
      store.replaceState(value)
    }) as ArraySetterT<DataT>

    set.prepend = (...items: DataT[]) => {
      set.by((draft) => {
        draft.unshift(...items)
      })
    }

    set.append = (...items: DataT[]) => {
      set.by((draft) => {
        draft.push(...items)
      })
    }

    set.byAsync = createByAsync<DataT[]>(store)
    set.by = createSetBy<DataT[]>(store)

    set.reset = () => {
      set(store.initialState)
    }

    set.lookup = (path: string | number, value: unknown) => {
      const stringPath = typeof path === 'number' ? `${path}` : path

      store.replaceState((draft) => {
        safeSet(draft, stringPath, value)
      })
    }

    const preparedStore: CorePreparedArrayStoreT<DataT> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      store,
      get state() {
        return store.state
      }
    }

    return this.applyMiddlewares(preparedStore)
  }

  object<DataT extends object>(initialValue: DataT): CorePreparedStoreT<DataT, ObjectSetterT<DataT> & ExtraSetT> {
    const store = new ReadaStore<DataT>(initialValue)

    const set = ((value: Partial<DataT>) => {
      const mergedState = { ...store.state, ...value } as DataT
      store.replaceState(mergedState)
    }) as ObjectSetterT<DataT>

    set.replace = (value: DataT) => {
      store.replaceState(() => value)
    }

    set.byAsync = async (asyncUpdater) => {
      try {
        const result = await asyncUpdater(store.state)

        if (typeof result === 'function') {
          store.replaceState((draft) => result(draft))
          return true
        }

        const mergedState = { ...store.state, ...(result as Partial<DataT>) } as DataT

        store.replaceState(mergedState)

        return true
      } catch (error) {
        console.error('[reada: error in async update]', error)
        return false
      }
    }

    set.by = createSetBy<DataT>(store)

    set.reset = () => {
      set.replace(store.initialState)
    }

    set.lookup = (path: string, value: unknown) => {
      store.replaceState((draft) => {
        safeSet(draft, path, value)
      })
    }

    const preparedStore: CorePreparedObjectStoreT<DataT> = {
      watch: (reactionOrOptions) => store.watch(reactionOrOptions),
      set,
      store,
      get state() {
        return store.state
      }
    }

    return this.applyMiddlewares(preparedStore)
  }

  withMiddleware<M extends InnerMiddlewareFunctionT>(...middlewares: M[]): Reada<ExtraSetT & ExtractedMiddlewareSetT<M>> {
    const nextReada = new Reada<ExtraSetT & ExtractedMiddlewareSetT<M>>()
    nextReada.stagedMiddleware = middlewares as InnerMiddlewareFunctionT[]
    return nextReada
  }

  private applyMiddlewares<DataT, SetT>(preparedStore: CorePreparedStoreT<DataT, SetT>): CorePreparedStoreT<DataT, SetT & ExtraSetT> {
    return this.stagedMiddleware.reduce((acc: any, fn) => fn(acc), preparedStore)
  }
}

export const reada = new Reada()
