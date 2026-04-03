import type { TypedMiddlewareFunctionT } from '../types'

type UndoRedoOptionsT = {
  maxHistory?: number
}

type HistorySizeT = {
  past: number
  future: number
}

export type UndoRedoSetEnhancementT = {
  clearHistory: () => void
  getHistorySize: () => HistorySizeT
  canUndo: () => boolean
  canRedo: () => boolean
  redo: () => void
  undo: () => void
}

type UndoRedoStoreT = {
  set: Record<string, any> & ((arg: any) => void)
  state: any
}

const DEFAULT_MAX_HISTORY = 50

export const undoRedoMiddleware = (options: UndoRedoOptionsT = {}): TypedMiddlewareFunctionT<UndoRedoSetEnhancementT> => {
  const maxHistory = options.maxHistory ?? DEFAULT_MAX_HISTORY

  return <StoreT extends UndoRedoStoreT>(store: StoreT): StoreT & { set: UndoRedoSetEnhancementT } => {
    type DataT = StoreT['state']
    type EnhancedSetT = StoreT['set'] & UndoRedoSetEnhancementT

    const originalSet = store.set as EnhancedSetT
    const replaceState = (originalSet.replace ?? store.set) as (value: DataT) => void

    const history: DataT[] = []
    const future: DataT[] = []

    const pushHistory = () => {
      history.push(store.state as DataT)

      if (history.length > maxHistory) {
        history.shift()
      }

      future.length = 0
    }

    const enhancedSet = ((arg: any) => {
      pushHistory()
      return originalSet(arg)
    }) as EnhancedSetT

    const enhancedSetRecord = enhancedSet as Record<string, any>

    Object.keys(originalSet).forEach((key) => {
      if (key === 'undo') {
        return
      }

      if (key === 'redo') {
        return
      }

      const originalMethod = originalSet[key]

      if (typeof originalMethod !== 'function') {
        enhancedSetRecord[key] = originalMethod
        return
      }

      enhancedSetRecord[key] = (...args: any[]) => {
        pushHistory()
        return originalMethod(...args)
      }
    })

    enhancedSet.undo = () => {
      if (history.length === 0) {
        return
      }

      const previousState = history.pop() as DataT

      future.push(store.state as DataT)

      if (future.length > maxHistory) {
        future.shift()
      }

      replaceState(previousState)
    }

    enhancedSet.redo = () => {
      if (future.length === 0) {
        return
      }

      const nextState = future.pop() as DataT

      history.push(store.state as DataT)

      if (history.length > maxHistory) {
        history.shift()
      }

      replaceState(nextState)
    }

    enhancedSet.canUndo = () => {
      return history.length > 0
    }

    enhancedSet.canRedo = () => {
      return future.length > 0
    }

    enhancedSet.getHistorySize = () => {
      return {
        past: history.length,
        future: future.length
      }
    }

    enhancedSet.clearHistory = () => {
      history.length = 0
      future.length = 0
    }

    store.set = enhancedSet

    return store as StoreT & { set: UndoRedoSetEnhancementT }
  }
}
