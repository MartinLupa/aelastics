/*
 * Project: aelastics-store
 * Created Date: Friday September 15th 2023
 * Author: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Last Modified: Sunday, 17th September 2023
 * Modified By: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Copyright (c) 2023 Aelastics (https://github.com/AelasticS)
 */

import { AnyObjectType, ObjectLiteral } from "aelastics-types"

import { immerable } from "immer"
import { getUnderlyingType, objectUUID } from "../common/CommonConstants"
import {
  defineSimpleValue,
  defineComplexObjectProp,
  defineComplexArrayProp,
  defineManyToMany,
  defineManyToOne,
  defineOneToMany,
  defineOneToOne,
} from "./propCreatorsWithUndo"
import { OperationContext } from "./operation-context"
import { uuidv4Generator } from "./repository"

//
export type Class<P> = { new (init: Partial<P>): P }

/**
 * Dynamically creates a class based on a given object type.
 * Initializes the class with properties and defines getter and setter methods for each property.
 * Handles the creation of inverse relationships between objects.
 *
 * @param objectType - The object type for which the class is being created.
 * @param ctx - The operation context used for tracking changes.
 * @returns The dynamically created class based on the given object type.
 */
export function createClass<P extends ObjectLiteral>(objectType: AnyObjectType, ctx: OperationContext): Class<P> {
  const props = objectType.allProperties
  const inverses = objectType.allInverse

  class DynamicClass {
    [key: string]: any
    constructor(init: Partial<P>) {
      this.isDeleted = false
      // Initialize private properties
      props.forEach((type, propName) => {
        const privatePropName = `_${propName}`
        //TODO: Currently the initialization is wrong. In the case where we pass actual references to the objest, they must be stored accordinglt, based on the uuid or object, depending on the type of the property

        // if init[propName] and the type is an entity, then we should store the uuid of the object
        // if init[propName] and the type is not an entity, then we should store the object itself
        // if init[propName] is an array, then we should check if the type of the objects inside the array is an entity and store the uuids of the objects, or store the objects themselves, otherwise store an empty array
        // if init[propName] is undefined, then we should store undefined

        // if (init[propName] && type.isEntity) {
        //   this[privatePropName] = init[propName][objectUUID]
        // }

        if (init[propName]) this[privatePropName] = init[propName]
        else if (type.typeCategory === "Array") {
          this[privatePropName] = []
        } else this[privatePropName] = undefined
      })
      this[objectUUID] = uuidv4Generator()
    }
  }
  // Define properties
  props.forEach((propType, propName) => {
    if (inverses.has(propName)) {
      // get inverse info
      const inverseDescriptor = inverses.get(propName)!
      // set local variables
      const propObjectType = objectType // COMMENT: This is the type of the object that the property belongs to
      const realPropType = getUnderlyingType(propType) // COMMENT: In the case when the propType is a link, this will return the actual type of the link
      const { propName: inversePropName, propType: inversePropType, type: inverseObjectType } = inverseDescriptor
      const isPropID = propObjectType.isEntity
      const isInversePropID = inverseObjectType.isEntity

      // Define the property using the appropriate function based on its type and inverse
      if (realPropType.typeCategory === "Object" && inversePropType === "Object") {
        defineOneToOne(
          DynamicClass.prototype,
          propName,
          inversePropName,
          propObjectType,
          inverseObjectType,
          ctx,
          isPropID,
          isInversePropID
        )
      } else if (realPropType.typeCategory === "Object" && inversePropType === "Array") {
        defineManyToOne(
          DynamicClass.prototype,
          propName,
          inversePropName,
          propObjectType,
          inverseObjectType,
          ctx,
          isPropID,
          isInversePropID
        )
      } else if (realPropType.typeCategory === "Array" && inversePropType === "Object") {
        defineOneToMany(
          DynamicClass.prototype,
          propName,
          inversePropName,
          propObjectType,
          inverseObjectType,
          ctx,
          isPropID,
          isInversePropID
        )
      } else if (realPropType.typeCategory === "Array" && inversePropType === "Array") {
        defineManyToMany(
          DynamicClass.prototype,
          propName,
          inversePropName,
          propObjectType,
          inverseObjectType,
          ctx,
          isPropID,
          isInversePropID
        )
      }
    } else {
      // Define the property without an inverse
      const realPropType = getUnderlyingType(propType)
      if (realPropType.isSimple()) {
        defineSimpleValue(DynamicClass.prototype, propName, realPropType, ctx)
      } else if (realPropType.typeCategory === "Object") {
        const invType = realPropType as AnyObjectType

        defineComplexObjectProp(DynamicClass.prototype, propName, invType.isEntity, ctx, invType)
      } else if (realPropType.typeCategory === "Array") {
        const invType = realPropType as AnyObjectType
        defineComplexArrayProp(DynamicClass.prototype, propName, invType.isEntity, ctx, invType)
      }
    }
  })

  // define id property if it is an entity
  // if (type.isEntity) {
  //   if (type.identifier.length > 1) {
  //     throw new Error(`Entity type "${type.name}" error - No composite identifier allowed!`)
  //   }
  //   const idPropName = type.identifier[0]
  //   const privatePropName = `_${idPropName}`

  //   Object.defineProperty(DynamicClass.prototype, objectUUID, {
  //     get() {
  //       return this[privatePropName]
  //     },
  //     configurable: true,
  //   })
  // }
  // Return the dynamically created class with its own name
  Object.defineProperty(DynamicClass, "name", { value: objectType.name })
  return DynamicClass as Class<P>
}
