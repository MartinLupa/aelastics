// RUN inside aelastics-store folder:
// heft test --test-path-pattern ./src/test-implementation/implementation-scenario-3.test.ts

import { idMap, iFoo, ImmerState, TestStore } from "./implementation-scenario-4"

let parent: iFoo
let child: iFoo
let store: any

describe("produce the state and update the id map", () => {
  beforeAll(() => {
    store = new TestStore()
  })
  test("Add stuff to state", () => {
    store.produceAndUpdateIdMap((draft: ImmerState) => {
      parent = store.newObject("1", "parent")
      child = store.newObject("2", "child")

      draft.state.push(parent)
      draft.state.push(child)

      draft.state[1].parent = draft.state[0]

      draft.state[1].parent.name = "new parent name"
    })
    const state = store.getState()

    expect(state[0]).toBe(parent)
    expect(state[1]).toBe(child)

    //check that this is a new object
    // expect(state[0]).not.toBe(initialparent)
    expect(state[0].name).toBe("new parent name")

    const initialChild = store.getState()[1]

    store.produceAndUpdateIdMap((draft: ImmerState) => {
      idMap.set(draft.state[1].id, draft.state[1])
      draft.state[0].child!.name = "new child name"
      // draft.state[1].name = "new child name"
    })

    const newChild = store.getState()[1]
    const childFromIdMap = idMap.get("2")

    expect(newChild).not.toBe(initialChild)
    expect(newChild).not.toBe(childFromIdMap)
    expect(childFromIdMap).toBe(initialChild)
  })
})
