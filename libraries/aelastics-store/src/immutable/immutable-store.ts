import { AnyObjectType, ObjectLiteral } from "aelastics-types"
import { Class, createClass } from "./createClass"
import { OperationContext } from "./operation-context"
import { immerable, produce, enableMapSet } from "immer"
enableMapSet()
/*
 * Project: aelastics-store
 * Created Date: Monday July 10th 2023
 * Author: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Last Modified: Saturday, 16th September 2023
 * Modified By: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Copyright (c) 2023 Aelastics (https://github.com/AelasticS)
 */

// TODO: implement immer inside the syncIdMapWithState function if needed.

/**
 * Implements an immutable state management store using Immer library to handle state updates immutably.
 * The store supports objects that are identifiable by unique IDs ("@@aelastics/ID").
 */
class ImmerState {
  [immerable] = true
  constructor(readonly state: any) {}
}
interface IdentifiableItem {
  id: string
  [key: string]: any
}

export class ImmutableStore<S extends { [key: string]: IdentifiableItem[] }> {
  private _classMap = new Map<AnyObjectType, Class<ObjectLiteral>>()
  private _state: S
  ctx = new OperationContext()

  /**
   * Creates an instance of ImmutableStore.
   * @param {S} initialState - The initial state of the store.
   */
  constructor(initialState: S) {
    this._state = initialState
  }

  /**
   * Creates a new object of the specified type and initializes it with provided properties.
   * @param {AnyObjectType} objectType - The type of object to create.
   * @param {Partial<ObjectLiteral>} initProps - Initial properties to set on the new object.
   * @returns {ObjectLiteral} The newly created object.
   */
  newObject(objectType: AnyObjectType, initProps: Partial<ObjectLiteral> = {}): ObjectLiteral {
    let c = this._classMap.get(objectType)

    if (c === undefined) {
      c = createClass(objectType, this.ctx)
      this._classMap.set(objectType, c)
    }

    return this.ctx.createObject(c, initProps, objectType)
  }

  /**
   * Adds an object to the store under the specified key.
   * @param {keyof S} key - The key under which the object should be added.
   * @param {any} object - The object to add to the store.
   * @throws {Error} if the key is not an array or does not exist on the state.
   */
  addObject(key: keyof S, object: any): void {
    if (Array.isArray(this._state[key])) {
      ;(this._state[key] as Array<any>).push(object)
    } else {
      throw new Error(`${key as string} is not an array or does not exist on state.`)
    }
  }

  /**
   * Applies a function to modify the store's state immutably.
   * @param {(draft: any) => void} f - A function that receives the current state as a draft and modifies it.
   */
  produce(f: (draft: any) => void) {
    const { state } = produce(new ImmerState(this._state), (imm: ImmerState) => {
      f(imm.state)
    })
    this.ctx.idMap = this.syncIdMapWithState(state, this.ctx.idMap)
    this._state = state
  }

  /**
   * Synchronizes the identity map with the current state.
   * @param {any} state - The current state of the store.
   * @param {any} map - The existing map of IDs to objects.
   * @returns {Map<string, any>} The updated map.
   */
  syncIdMapWithState(state: any, map: any): Map<string, any> {
    for (const key of Object.keys(state)) {
      if (Array.isArray(state[key])) {
        state[key].forEach((item: any) => {
          if (map.has(item["@@aelastics/ID"]) && !Object.is(map.get(item["@@aelastics/ID"]), item)) {
            map.set(item["@@aelastics/ID"], item)
          }
        })
      }
    }
    return map
  }

  /**
   * Retrieves the current state of the store.
   * @returns {S} The current state.
   */
  getState(): S {
    return this._state
  }
}
