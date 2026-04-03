import type { AsyncSetterT, DrafterT } from './types'
import type { ReadaStore } from './store'

export const createId = () => {
  return crypto.randomUUID()
}

export const setFromEventTargetValue = <ValueT>(setValue: (value: ValueT) => void) => {
  return (event: Event) => {
    const eventTarget = event?.target as HTMLInputElement | null
    const nextValue = eventTarget?.value as ValueT

    if (!eventTarget) {
      return
    }

    setValue(nextValue)
  }
}

export const createByAsync = <DataT>(store: ReadaStore<DataT>) => {
  return async (asyncUpdater: AsyncSetterT<DataT>) => {
    try {
      const result = await asyncUpdater(store.state)
      const isUpdaterFunction = typeof result === 'function'

      if (!isUpdaterFunction) {
        store.replaceState(result)
        return true
      }

      const updater = result as DrafterT<DataT>
      store.replaceState((draft) => updater(draft))

      return true
    } catch (error) {
      console.error('[reada: error in async update]', error)
      return false
    }
  }
}

export const createSetBy = <DataT>(store: ReadaStore<DataT>) => {
  return (updaterFn: DrafterT<DataT>) => {
    store.replaceState((draft) => updaterFn(draft))
  }
}
