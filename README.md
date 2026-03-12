# reada

⚛️ React stores.
📍 Local and shared.
🛟 TypeScript first.
🤍 DX focused API.
⚡ Simple and powerful.

## Install

Take your pick.

```sh
npm add reada
bun add reada
yarn add reada
pnpm add reada
```

## Usage

### Shared Stores

```ts
import { reada } from 'reada'

const $num = reada.number(100)
const $str = reada.string('foo')
const $bool = reada.boolean(true)
const $arr = reada.array<number>([0, 1, 2])

type MyObjectT = { name: string; age?: number; numbers?: number[] }
const $obj = reada.object<MyObjectT>({ name: 'shane' })

$num.set(200)
$num.state // 200
$num.set.add(50)
$num.state // 250
$num.set.subtract(25)
$num.state // 225
$num.set.reset()
$num.state // 100
$num.use() // 100
$num.use((state) => state * 10) // 1000

$str.set('bar')
$str.state // 'bar'
$str.set.reset()
$str.state // 'foo'

$str.use() // 'foo'
$str.use((state) => state.toUpperCase()) // 'FOO'

$bool.set(false)
$bool.state // false
$bool.toggle()
$bool.state // true
$bool.set.reset()
$bool.state // true

$bool.use() // true
$bool.use((state) => !state) // false

$arr.set([10, 11, 12])
$arr.state // [10, 11, 12]
$arr.set.append(13)
$arr.state // [10, 11, 12, 13]
$arr.set.prepend(9)
$arr.state // [9, 10, 11, 12, 13]
$arr.set.append(1, 2) // append or prepend multiple
$arr.state // [9, 10, 11, 12, 13, 1, 2]
$arr.set.reset()
$arr.state // [0, 1, 2]
$arr.set.at(2, 99) // state[2] = 99

$arr.use() // [0, 1, 99]
$arr.use((state) => state.length) // 3
$arr.use.find((value) => value > 1) // 99
$arr.use.filter((value) => value > 0) // [99, 1]
$arr.use.map((arr) => arr > 0) // [true, true, false]

$obj.set({ name: 'sidharth', numbers: [1, 2] })
$obj.state // { name: 'sidharth', numbers: [1, 2] }
$obj.set.merge({ age: 25 })
$obj.state // { name: 'sidharth', age: 25, numbers: [1, 2] }
$obj.set.reset()
$obj.state // { name: 'shane', numbers: [] }
$obj.set.at('name', 'shane')
$obj.set.at('numbers.2', 99)

$obj.use() // { name: 'shane', numbers: [0, 1, 99 ]}
$obj.use((state) => state.name) // 'shane'
$obj.use.at('name') // 'shane'
$obj.use.at('numbers.2') // 99
```

### Local Stores

```ts
import { reada } from 'reada'

const Component = () => {
  const num = reada.use.number(250)
  const str = reada.use.string('hello')
  const bool = reada.use.boolean(false)
  const arr = reada.use.array([0, 99, 122])
  const obj = reada.use.object({ foo: 'bar' })

  // Local stores have the exact same APIs.
  const handleSomething = () => {
    num.set(120)
    num.add(10)
    num.state // 130
    str.set(str.state.toUpperCase())
    str.state // 'HELLO'
    bool.toggle()
    bool.state // true
    arr.set.append(222)
    arr.set.prepend(123)
    arr.set.at('1', 55)
    arr.state // [123, 55, 99, 122, 222]
    obj.set.merge({ baz: false })
    // ... etc, etc, etc.
  }
}
```

## Immer Powered Updates

```tsx
const $user = reada.object({
  name: 'Brooklyn',
  age: 30,
  skills: ['JavaScript', 'React']
})

$user.set.by((draft) => {
  draft.name = draft.name.toUpperCase()
  draft.age += 1
  draft.skills.push('reada')
})
```

## Async Updates

```tsx
const $userIds = reada.array([])

await $userIds.set.by(async (draft) => {
  draft.length = 0 // Clear existing ids.

  const response = await fetch('/users')
  const data = await response.json()

  data.users.forEach((user) => draft.push(user.id))
})
```

### Middleware

#### Custom Middleware

```tsx
// Create a logging middleware:
const loggingMiddleware = (storeName: string) => (store) => {
  const originalSet = store.set

  store.set = (...args) => {
    console.log(`${storeName}.set`, args)
    return originalSet(...args)
  }

  return store
}

// Apply middleware:
const enhancedReada = reada.withMiddleware(loggingMiddleware)
const $settings = enhancedReada.object({ theme: 'light'})
```

#### undoRedo middleware

```ts
import { reada } from 'reada'

const undoRedo = reada.middleware.undoRedo({ maxHistory: 50 })
const enhancedReada = reada.withMiddleware(undoRedo)
const $myStore = enhancedReada.array([0, 5, 10])

$myStore.set.append(15)
$myStore.set.undo()
$myStore.set.redo()
```

## TODO

- [ ] Improve documentation on custom middleware.