import { reada } from './reada'
import { useMemo } from 'react'

export const useReada = (() => {
  const string = (initialState: string = '') => {
    const store = useMemo(() => reada.string(initialState), [])
    store.use() // This subscribes the component to state changes
    return store
  }

  const boolean = (initialState: boolean = false) => {
    const store = useMemo(() => reada.boolean(initialState), [])
    store.use()
    return store
  }

  const number = (initialState: number = 0) => {
    const store = useMemo(() => reada.number(initialState), [])
    store.use()
    return store
  }

  const array = <DataT>(initialState: DataT[] = []) => {
    const store = useMemo(() => reada.array<DataT>(initialState), [])
    store.use()
    return store
  }

  const object = <DataT extends object>(initialState: DataT) => {
    const store = useMemo(() => reada.object<DataT>(initialState), [])
    store.use()
    return store
  }

  return { string, boolean, array, object, number }
})()
