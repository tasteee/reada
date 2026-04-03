// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { reada } from '../../src/core'

describe('core reada', () => {
  it('manages boolean state', () => {
    const $flag = reada.boolean(false)

    $flag.set(true)
    expect($flag.state).toBe(true)

    $flag.set.toggle()
    expect($flag.state).toBe(false)
  })

  it('supports watch reactions', () => {
    const $count = reada.number(0)

    let captured = 0

    $count.watch((oldValue, newValue) => {
      captured = newValue
    })

    $count.set(42)

    expect(captured).toBe(42)
  })

  it('supports object updates without react', async () => {
    const $user = reada.object({ name: 'Rokki', age: 30 })

    $user.set({ age: 31 })
    expect($user.state.age).toBe(31)

    await $user.set.byAsync(async (state) => {
      return {
        name: state.name.toUpperCase()
      }
    })

    expect($user.state.name).toBe('ROKKI')
  })
})
