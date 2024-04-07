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

import { Any, AnyObjectType, ArrayType, ObjectLiteral } from "aelastics-types";

import { immerable } from "immer";
import { getUnderlyingType } from "../common/CommonConstants";
import {
  defineSimpleValue,
  defineComplexObjectProp,
  defineComplexArrayProp,
  defineManyToMany,
  defineManyToOne,
  defineOneToMany,
  defineOneToOne,
} from "./propCreatorsWithUndo";
import { OperationContext } from "./operation-context";

//
export type Class<P> = { new (init: Partial<P>): P };

/**
 * Dynamically creates a class based on a given object type.
 * Initializes the class with properties and defines getter and setter methods for each property.
 * Handles the creation of inverse relationships between objects.
 *
 * @param type - The object type for which the class is being created.
 * @param ctx - The operation context used for tracking changes.
 * @returns The dynamically created class based on the given object type.
 */
export function createClass<P extends ObjectLiteral>(
  type: AnyObjectType,
  ctx: OperationContext
): Class<P> {
  const props = type.allProperties;
  const inverses = type.allInverse;

  class DynamicClass {
    [key: string]: any;
    constructor(init: Partial<P>) {
      this.isDeleted = false;
      // Initialize private properties
      props.forEach((type, propName) => {
        const privatePropName = `_${propName}`;
        if (init[propName]) this[privatePropName] = init[propName];
        else if (type.typeCategory === "Array") {
          this[privatePropName] = [];
        } else this[privatePropName] = undefined;
      });
    }
  }
  // Define properties
  props.forEach((propType, propName) => {
    if (inverses.has(propName)) {
      // get inverse info
      const inverseDescriptor = inverses.get(propName)!;
      // set local variables
      const {
        propName: inversePropName,
        propType: inversePropType,
        type: inverseObjectType,
      } = inverseDescriptor;
      const propObjectType = propType as AnyObjectType;
      const isPropID = propObjectType.isEntity;
      const isInversePropID = inverseObjectType.isEntity;

      // Define the property using the appropriate function based on its type and inverse
      if (propType.typeCategory === "Object" && inversePropType === "Object") {
        defineOneToOne(
          DynamicClass.prototype,
          propName,
          inversePropName,
          propObjectType,
          inverseObjectType,
          ctx,
          isPropID,
          isInversePropID
        );
      } else if (
        propType.typeCategory === "Object" &&
        inversePropType === "Array"
      ) {
        defineOneToMany(
          DynamicClass.prototype,
          propName,
          inversePropName,
          propObjectType,
          inverseObjectType,
          ctx,
          isPropID,
          isInversePropID
        );
      } else if (
        propType.typeCategory === "Array" &&
        inversePropType === "Object"
      ) {
        defineManyToOne(
          DynamicClass.prototype,
          propName,
          inversePropName,
          propObjectType,
          inverseObjectType,
          ctx,
          isPropID,
          isInversePropID
        );
      } else if (
        propType.typeCategory === "Array" &&
        inversePropType === "Array"
      ) {
        defineManyToMany(
          DynamicClass.prototype,
          propName,
          inversePropName,
          propObjectType,
          inverseObjectType,
          ctx,
          isPropID,
          isInversePropID
        );
      }
    } else {
      // Define the property without an inverse
      const realPropType = getUnderlyingType(propType);
      if (realPropType.isSimple()) {
        defineSimpleValue(DynamicClass.prototype, propName, realPropType, ctx);
      } else if (realPropType.typeCategory === "Object") {
        const invType = realPropType as AnyObjectType;

        defineComplexObjectProp(
          DynamicClass.prototype,
          propName,
          invType.isEntity,
          ctx,
          invType
        );
      } else if (realPropType.typeCategory === "Array") {
        const invType = realPropType as AnyObjectType;
        defineComplexArrayProp(
          DynamicClass.prototype,
          propName,
          invType.isEntity,
          ctx,
          invType
        );
      }
    }
  });

  // define id property if it is an entity
  if (type.isEntity) {
    if (type.identifier.length > 1) {
      throw new Error(
        `Entity type "${type.name}" error - No composite identifier allowed!`
      );
    }
    const idPropName = type.identifier[0]; //
    const privatePropName = `_${idPropName}`;
    Object.defineProperty(DynamicClass.prototype, "id", {
      get() {
        return this[privatePropName];
      },
    });
  }
  // Return the dynamically created class with its own name
  Object.defineProperty(DynamicClass, "name", { value: type.name });
  return DynamicClass as Class<P>;
}