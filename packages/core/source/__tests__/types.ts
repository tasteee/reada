import { reada } from "../index.ts";

const assertType = <ExpectedType>(value: ExpectedType): void => {
  void value;
};

// Store creation should infer from initial value.
const $name = reada.store("");
const $count = reada.store(0);
const $isReady = reada.store(false);
const $user = reada.store({ email: "", role: "guest" });
const $tagList = reada.store<string[]>([]);

assertType<string>($name.state);
assertType<number>($count.state);
assertType<boolean>($isReady.state);
assertType<{ email: string; role: string }>($user.state);
assertType<string[]>($tagList.state);

// Helper methods should only exist for matching store types.
$isReady.toggle();
$isReady.on();
$isReady.off();

$count.increment();
$count.decrement();

$tagList.append("typescript");
$tagList.prepend("dx");
$tagList.remove((tagValue) => {
  const isMatch = tagValue === "dx";
  return isMatch;
});

$user.patch({ role: "admin" });
$user.at("email", "grace@reada.dev");

// @ts-expect-error boolean helper must not exist on number store
$count.toggle();

// @ts-expect-error number helper must not exist on string store
$name.increment();

// @ts-expect-error array helper must not exist on object store
$user.append("nope");

// @ts-expect-error object helper must not exist on string store
$name.patch({ value: "nope" });

// Effect tuple should be fully typed in order.
reada.effect([$name, $count], ([nameState, countState]) => {
  assertType<string>(nameState);
  assertType<number>(countState);
});

// Derived selector tuple should be fully typed and derived should be read-only.
const $summary = reada.derived([$user, $count], ([userState, countState]) => {
  assertType<{ email: string; role: string }>(userState);
  assertType<number>(countState);

  const label = userState.email;
  const visits = countState;

  return { label, visits };
});

assertType<{ label: string; visits: number }>($summary.value);

// @ts-expect-error derived store must not expose write
$summary.write({ label: "", visits: 0 });

// @ts-expect-error derived store must not expose reset
$summary.reset();