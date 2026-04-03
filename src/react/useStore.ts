import { useEffect, useMemo, useState } from 'react'

import { createId } from '../core/utilities'
import type { ReadaStore } from '../core/store'

export const useStore = <StateT, SelectedT = StateT>(store: ReadaStore<StateT>, selector?: (state: StateT) => SelectedT) => {
  const id = useMemo(createId, [])

  const initialValue = selector ? selector(store.state) : (store.state as unknown as SelectedT)

  const [value, setValue] = useState<SelectedT>(initialValue)

  useEffect(() => {
    return store.subscribe<SelectedT>({
      derive: selector,
      previousValue: value,
      update: setValue,
      id
    })
  }, [id, selector])

  return value
}
