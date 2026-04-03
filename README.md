# reada

Reada is a framework-agnostic state core with a dreamy API and wrappers for popular frameworks.

- Built on top of immer.
- Tiny API surface, fast to learn.
- Shared stores and local stores.
- TypeScript-first, friendly inference.
- Async-safe updates with `set.byAsync(...)`
- Middleware support with undo/redo included

## Install

```sh
npm add reada
# or
bun add reada
# or
yarn add reada
# or
pnpm add reada
```

## 30-Second Start

Use this when you are working in normal JS/TS.

```ts
import { reada } from 'reada'

const $count = reada.number(0)
$count.set(5)
$count.set.add(2)
console.log($count.state) // 7

const unwatch = $count.watch((oldValue, newValue) => {
  console.log('count changed', { oldValue, newValue })
})

$count.set(10) // { oldValue: 7, newValue: 10 }
unwatch()
```

## 30-Second React Start

Use the React adapter to get `store.use(...)`.

```tsx
import { reada } from 'reada/react'

const $count = reada.number(0)

export function Counter() {
  $count.use()

  return (
    <div>
      <p>{$count.state}</p>
      <button onClick={() => $count.set.add(1)}>Increment</button>
      <button onClick={() => $count.set.subtract(1)}>Decrement</button>
      <button onClick={() => $count.set.reset()}>Reset</button>
    </div>
  )
}
```

## Store Types

All stores have the same shape:

- `state`
- `set(...)`
- `watch(...)`
- `store` (raw internal store)
- `use(...)` only in `reada/react`

Factory methods:

- `reada.boolean(initial)`
- `reada.number(initial)`
- `reada.string(initial)`
- `reada.array(initial)`
- `reada.object(initial)`

## Practical Examples

### Boolean Store

```ts
import { reada } from 'reada'

const $isOpen = reada.boolean(false)

$isOpen.set(true)
$isOpen.set.toggle()
$isOpen.set.reset()
```

### Number Store

```ts
import { reada } from 'reada'

const $price = reada.number(100)

$price.set(250)
$price.set.add(25)
$price.set.subtract(50)
$price.set.reset()
```

### String Store

```ts
import { reada } from 'reada'

const $name = reada.string('rookie')

$name.set('pro')
$name.set.by((draft) => draft.toUpperCase())
$name.set.reset()
```

### Array Store

```ts
import { reada } from 'reada'

const $items = reada.array<number>([1, 2, 3])

$items.set([4, 5])
$items.set.append(6, 7)
$items.set.prepend(0)
$items.set.lookup(1, 99)
$items.set.reset()
```

### Object Store

```ts
import { reada } from 'reada'

type UserT = {
  name: string
  age: number
  tags: string[]
}

const $user = reada.object<UserT>({
  name: 'Shane',
  age: 30,
  tags: ['builder']
})

$user.set({ age: 31 })
$user.set.lookup('tags.1', 'maintainer')
$user.set.replace({ name: 'Shane', age: 40, tags: [] })
$user.set.reset()
```

## Derived Reads In React

```tsx
import { reada } from 'reada/react'

const $cart = reada.array<{ id: string; price: number }>([])

export function CartSummary() {
  const itemCount = $cart.use((state) => state.length)
  const total = $cart.use((state) => state.reduce((sum, item) => sum + item.price, 0))

  return (
    <div>
      <p>Items: {itemCount}</p>
      <p>Total: ${total}</p>
    </div>
  )
}
```

## Immer-Powered Updates

```ts
import { reada } from 'reada'

const $profile = reada.object({
  name: 'Brooklyn',
  age: 30,
  skills: ['TypeScript']
})

$profile.set.by((draft) => {
  draft.name = draft.name.toUpperCase()
  draft.age += 1
  draft.skills.push('reada')
})
```

## Async Updates

```ts
import { reada } from 'reada'

const $ids = reada.array<number>([])

await $ids.set.byAsync(async () => {
  const response = await fetch('/users')
  const data = await response.json()

  return data.users.map((user: { id: number }) => user.id)
})
```

## Local Component Stores (React)

Use `useReada` when each component instance should own its own store.

```tsx
import { useReada } from 'reada/react'

export function LocalCounter() {
  const count = useReada.number(10)

  return <button onClick={() => count.set.add(1)}>{count.state}</button>
}
```

## Middleware

### Custom Middleware

```ts
import { reada } from 'reada'

const loggerMiddleware = <StoreT extends { set: (...args: any[]) => any }>(store: StoreT) => {
  const originalSet = store.set

  store.set = ((...args: any[]) => {
    console.log('set called with', args)
    return originalSet(...args)
  }) as StoreT['set']

  return store
}

const enhancedReada = reada.withMiddleware(loggerMiddleware)
const $settings = enhancedReada.object({ theme: 'light' })

$settings.set({ theme: 'dark' })
```

### undoRedo Middleware

```ts
import { reada } from 'reada'

const undoRedo = reada.middleware.undoRedo({ maxHistory: 50 })
const enhancedReada = reada.withMiddleware(undoRedo)

const $count = enhancedReada.number(0)

$count.set(1)
$count.set(2)
$count.set.undo()
$count.set.redo()
```

## Import Guide

```ts
// Core only
import { reada } from 'reada'

// React adapter
import { reada, useReada, useStore } from 'reada/react'
```

It stays out of your way and lets you ship fast.

Call now while supplies last.
