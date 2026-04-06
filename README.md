# reada

A small, framework-agnostic, DX focused reactive state toolkit for TypeScript and JavaScript. It keeps your state explicit, readable, and easy to evolve.

Start with plain values. Read synchronously. Write intentionally. Add React support with the same mental model.

```bash
npm install @reada/core
```

If you use React bindings, install React as a peer dependency in your app.

## Create Stores

Create stores from normal values.

_I suggest keeping the `$` prefix as a visual cue that wherever you see these identifiers in your codebase, you know they are stores and don't have to think twice._

```ts
import { reada } from "@reada/core"

const $name = reada.store("")
const $count = reada.store(0)
const $isLoading = reada.store(false)
const $tagList = reada.store<string[]>([])

const $user = reada.store({
  email: "",
  role: "guest",
  address: { city: "" }
})
```

## Write State

Use one write entry point. Reach for helpers when they match your state shape.

```ts
$name.write("grace")
$count.write((stateValue) => stateValue + 1)
$isLoading.on()

$user.patch({ role: "admin" })
$user.at("address.city", "Austin")

$tagList.append("typescript")
$tagList.remove((tagValue) => tagValue === "old-tag")

await $user.write(async (stateValue) => {
  const response = await fetch("/api/user")
  const nextUser = await response.json()
  return {
    ...stateValue,
    ...nextUser
  }
})
```

Read state any time with `.state`.

```ts
const currentName = $name.state
const currentCount = $count.state
```

## React

Import from `reada/react` and call `.use()` directly on your store.

```tsx
import { reada } from "@reada/react"

const $name = reada.store("grace")
const $nameList = reada.store(["hannah", "kensie", "patty"])
const $greeting = reada.derived([$name], ([name]) => `Hello, ${name}`)

const $user = reada.store({
  email: "grace@reada.dev",
  role: "guest",
  address: { city: "Austin" }
})

function ProfilePanel() {
  const userValue = $user.use()
  const greetingValue = $greeting.use()
  const cityValue = $user.use.at("address.city")
  const emailValue = $user.use((stateValue) => stateValue.email)
  const hNameList = $nameList.use.filter((nameValue) => nameValue.startsWith("h"))
  const upperNameList = $nameList.use.map((nameValue) => nameValue.toUpperCase())

  return (
    <section>
      <h2>{greetingValue}</h2>
      <p>
        {emailValue} ({userValue.role})
      </p>
      <p>{cityValue}</p>
      <p>{hNameList.join(", ")}</p>
      <p>{upperNameList.join(", ")}</p>
    </section>
  )
}
```

Use full-state subscriptions when you need the whole value. Use selectors when you care about precision. The API stays the same either way.

## Derived and Effects

Compose values and reactions without adding extra concepts.

_I suggest using a `$$` prefix for derived value stores
so that it remains obvious, without any added thought,
that these are derived (inherantly side-effects) and
can not be directly written to or modified._

```ts
// You can create derived, reactive values.
// The first argument is an array of stores that
// the derived value depends on. The second argument
// is the function to derive the value when a dependency changes.
const $$summary = reada.derived([$user, $count], ([userValue, countValue]) => {
  return `${userValue.email} (${countValue})`
})

// You can prescribe side-effects.
const stopEffect = reada.effect([$name, $summary], ([nameValue, summaryValue]) => {
  console.log(nameValue, summaryValue)
})

$$summary.value
stopEffect()
```

## Local Development

Run tests from the workspace root with simple commands.

```bash
bun run core:test
bun run react:test
bun run test
```

Keep state design boring, clear, and intentional. reada handles the wiring so you can focus on product behavior.
