// RUN inside aelastics-store folder:
// heft test --test-path-pattern ./src/test-implementation/implementation-scenario-3.test.ts

import { iFoo, ImmerState, TestStore } from "./implementation-scenario-3"

let parent: iFoo
let child: iFoo
let store: any

describe("produce the state and update the id map", () => {
  beforeAll(() => {
    store = new TestStore()
    parent = store.newObject("1", "parent")
    child = store.newObject("2", "child")
  })
  test("Add stuff to state", () => {
    store.produceAndUpdateIdMap((draft: any[]) => {
      draft.push(parent)
      draft.push(child)
    })
    const state = store.getState()

    expect(state[0]).toBe(parent)
    expect(state[1]).toBe(child)
  })

  test("Add relation between foos", () => {
    store.produceAndUpdateIdMap((draft: any[]) => {
      draft[1].parent = draft[0]
    })
    const state = store.getState()

    expect(state[0]?.child).toBe(state[1])
    expect(state[1]?.parent).toBe(state[0])
  })

  // state = [foo1, foo2]
  // idMap = { "1": foo1, "2": foo2 }

  test("change name of the nested parent", () => {
    const initialparent = store.getState()[0]
    store.produceAndUpdateIdMap((draft: any[]) => {
      // store._idMap.set(draft[0].id, draft[0])
      draft[1].parent.name = "new name"
    })

    const state = store.getState()
    //check that this is a new object
    expect(state[0]).not.toBe(initialparent)
    expect(state[0].name).toBe("new name")
  })
})
