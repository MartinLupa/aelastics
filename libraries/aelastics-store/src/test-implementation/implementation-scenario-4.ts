import { enableMapSet, enablePatches, immerable, produce, produceWithPatches, setAutoFreeze } from "immer"
import { capitalizeFirstLetter } from "../common/CommonConstants"
enablePatches()
enableMapSet()
setAutoFreeze(false) // setting auto freeze to false to avoid the error "Cannot assign to read only property 'parent' of object"

// The createClass function creates a class with a parent and child relation
export function createClass(immerState: ImmerState) {
  const parent = "parent"
  const child = "child"
  const privateparent = "_parent"
  const privatechild = "_child"

  class Foo implements iFoo {
    [key: string]: any
    _id: string
    _name: string
    _parent: string | undefined = undefined
    _child: string | undefined = undefined;
    [immerable] = true

    constructor(props: { id: string; name: string }) {
      this._id = props.id
      this._name = props.name
    }

    get id(): string {
      return this._id
    }

    get name(): string {
      return this._name
    }

    set name(value: string) {
      this._name = value
    }

    setParentName(value: string, idMap: Map<string, Foo>) {
      const parent = idMap.get(this._parent!)!
      if (parent) {
        parent.name = value
      }
    }
    setParentChild(value: string, idMap: Map<string, Foo>) {
      const parent = idMap.get(this._parent!)!
      if (parent) {
        parent[child] = idMap.get(value)
      }
    }
  }

  // Define the parent and child properties
  Object.defineProperty(Foo.prototype, parent, {
    get(): Foo | undefined {
      return this[privateparent] ? idMap.get(this[privateparent]) : undefined
    },
    set(value: Foo | undefined) {
      // Disconnect the old inverse target
      const oldvalue = this[parent]

      if (oldvalue) {
        oldvalue[privatechild] = undefined
      }

      if (value) {
        value[privatechild] = this.id
        this[privateparent] = value.id

        //------ SOLUTION  ATTEMPT 1 ------
        // cannot do this because then we store the proxy of the object in the idmap
        // idMap.set(this.id, this)
        // idMap.set(value?.id, value)
        //------
      } else {
        this[privateparent] = undefined
      }
    },

    enumerable: true,
  })

  // const target = Foo.prototype

  // target[`set${capitalizeFirstLetter(parent)}Name`] = function (value: string, idMap: Map<string, Foo>) {
  //   const parent = idMap.get(this._parent!)!
  //   if (parent) {
  //     parent.name = value
  //   }
  // }

  // target[`set${capitalizeFirstLetter(parent)}Child`] = function (value: string, idMap: Map<string, Foo>) {
  //   const parent = idMap.get(this._parent!)!
  //   if (parent) {
  //     parent[child] = idMap.get(value)
  //   }
  // }

  Object.defineProperty(Foo.prototype, "child", {
    get(): Foo | undefined {
      return this[privatechild] ? idMap.get(this[privatechild]) : undefined
    },
    set(value: Foo | undefined) {
      // Disconnect the old inverse target
      const oldvalue = this[child]

      if (oldvalue) {
        oldvalue[privateparent] = undefined
      }

      if (value !== undefined) {
        this[privatechild] = value.id
        value[privateparent] = this.id

        //------ SOLUTION ATTEMPT 1 ------
        // cannot do this because then we store the proxy of the object in the idmap
        // idMap.set(this.id, this)
        // idMap.set(value?.id, value)
        //------
      } else {
        this[privatechild] = undefined
      }
    },
    enumerable: true,
  })

  return Foo
}

// The interface for the Foo class
export interface iFoo {
  id: string
  name: string
  parent?: iFoo | undefined
  child?: iFoo | undefined
  setParentName(value: string, idMap: Map<string, iFoo>): void
}

export const idMap = new Map<string, any>()

// The TestStore class where only the state and/or the idMap is mutable
export class TestStore {
  private immerState: ImmerState

  constructor() {
    this.immerState = new ImmerState([])
  }

  newObject(id: string, name: string) {
    const obj = createClass(this.immerState)
    const objInstance = new obj({ id, name })
    idMap.set(id, objInstance)
    return objInstance
  }

  produceWithIdMap(f: (draft: any) => void) {
    const [newState, patches] = produceWithPatches(this.immerState, (draft) => f(draft.state))
    this.immerState.state = newState.state
  }

  //----------------- SOLUTION ATTEMPT 2 -----------------
  /*
  we will try here to update the idmap manually,
  however, what happens when we change name in the nested object??
  */
  produceAndUpdateIdMap(f: (draft: ImmerState) => void) {
    const [newState, patches] = produceWithPatches(this.immerState, (draft: ImmerState) => {
      f(draft)
    })
    this.immerState.state = newState.state

    // patches.forEach((patch) => {
    //   let ref = newState as any
    //   for (const key of patch.path) {
    //     ref = ref[key]
    //     if (typeof ref === "object" && ref.id) {
    //       break
    //     }
    //   }

    //   switch (patch.op) {
    //     case "replace":
    //       idMap.set(ref.id, ref)
    //       break
    //     // case "remove":
    //     //   this._idMap.delete(ref.id)
    //     //   break
    //   }
    // })
  }

  getState() {
    return this.immerState.state
  }
}

//----------------- SOLUTION ATTEMPT 3 -----------------
export class ImmerState {
  [immerable] = true
  private _state: iFoo[]
  constructor(state: iFoo[]) {
    this._state = state
  }
  get state() {
    return this._state
  }
  set state(value) {
    this._state = value
  }
}
