import { produce } from 'immer'

import type { DrafterT, SubscriberT, WatchOptionsT, WatchReactionT, WatcherEntryT } from './types'

export class ReadaStore<StateT> {
  initialState: StateT
  currentState: StateT
  previousState: StateT
  subscribers: Map<string, SubscriberT<StateT, unknown>>
  watchers: Map<string, WatcherEntryT<StateT>>

  constructor(initialState: StateT) {
    this.initialState = initialState
    this.currentState = initialState
    this.previousState = initialState
    this.subscribers = new Map<string, SubscriberT<StateT, unknown>>()
    this.watchers = new Map<string, WatcherEntryT<StateT>>()
  }

  public get state() {
    return this.currentState
  }

  subscribe = <SelectedT>(subscriber: SubscriberT<StateT, SelectedT>) => {
    this.subscribers.set(subscriber.id, subscriber as SubscriberT<StateT, unknown>)

    return () => {
      this.unsubscribe(subscriber.id)
    }
  }

  unsubscribe = (id: string) => {
    this.subscribers.delete(id)
  }

  watch = <SelectedT>(reactionOrOptions: WatchReactionT<StateT> | WatchOptionsT<StateT, SelectedT>) => {
    const id = crypto.randomUUID()

    if (typeof reactionOrOptions === 'function') {
      const entry: WatcherEntryT<StateT> = {
        reaction: reactionOrOptions as (oldValue: unknown, newValue: unknown) => void,
        previousValue: this.currentState
      }

      this.watchers.set(id, entry)

      return () => {
        this.watchers.delete(id)
      }
    }

    const selector = reactionOrOptions.selector
    const selectedValue = selector(this.currentState)

    const entry: WatcherEntryT<StateT> = {
      selector: selector as (state: StateT) => unknown,
      reaction: reactionOrOptions.reaction as (oldValue: unknown, newValue: unknown) => void,
      previousValue: selectedValue
    }

    this.watchers.set(id, entry)

    return () => {
      this.watchers.delete(id)
    }
  }

  replaceState = (newStateOrUpdater: StateT | DrafterT<StateT>) => {
    const isUpdaterFunction = typeof newStateOrUpdater === 'function'

    let newState = newStateOrUpdater as StateT

    if (isUpdaterFunction) {
      const updater = newStateOrUpdater as DrafterT<StateT>
      newState = produce(this.currentState, updater)
    }

    if (newState === this.currentState) {
      return
    }

    const oldState = this.currentState

    this.previousState = this.currentState
    this.currentState = newState

    this.subscribers.forEach((subscriber) => {
      const selector = subscriber.derive

      if (selector) {
        const selectedValue = selector(newState)
        const hasChanged = selectedValue !== subscriber.previousValue

        if (!hasChanged) {
          return
        }

        subscriber.update(selectedValue)
        subscriber.previousValue = selectedValue

        return
      }

      const hasChanged = subscriber.previousValue !== newState

      if (!hasChanged) {
        return
      }

      subscriber.update(newState as unknown)
      subscriber.previousValue = newState as unknown
    })

    this.watchers.forEach((watcher) => {
      const selector = watcher.selector

      if (selector) {
        const nextSelectedValue = selector(newState)
        const hasChanged = nextSelectedValue !== watcher.previousValue

        if (!hasChanged) {
          return
        }

        watcher.reaction(watcher.previousValue, nextSelectedValue)
        watcher.previousValue = nextSelectedValue

        return
      }

      watcher.reaction(oldState, newState)
      watcher.previousValue = newState
    })
  }
}
