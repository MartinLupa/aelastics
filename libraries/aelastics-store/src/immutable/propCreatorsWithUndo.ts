/*
 * Project: aelastics-store
 * Created Date: Wednesday September 13th 2023
 * Author: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Last Modified: Sunday, 17th September 2023
 * Modified By: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Copyright (c) 2023 Aelastics (https://github.com/AelasticS)
 */

import { Any, AnyObjectType } from "aelastics-types";
import {
  OperationContext,
  ObjectNotFoundError,
  Operation,
} from "./operation-context";
import { capitalizeFirstLetter } from "../common/CommonConstants";

// Define simple value property
export function defineSimpleValue(
  target: any,
  propName: string,
  targetType: Any,
  context: OperationContext
) {
  const privatePropName = `_${propName}`;
  target[privatePropName] = undefined;

  Object.defineProperty(target, propName, {
    get() {
      if (this.isDeleted) {
        throw new Error("Cannot access properties on a deleted object.");
      }
      return this[privatePropName];
    },
    set(value: any) {
      if (this.isDeleted) {
        throw new Error("Cannot modify properties on a deleted object.");
      }
      if (this[privatePropName] === value) return;

      const operation: Operation = {
        operationType: "set",
        target: this,
        propName: propName,
        oldValue: this[privatePropName],
        newValue: value,
        targetType: targetType,
        inversePropName: undefined,
      };

      context.pushOperation(operation);

      this[privatePropName] = value;
    },
  });
}

export function defineComplexObjectProp(
  target: any,
  propName: string,
  isPropID: boolean,
  context: OperationContext,
  targetType: AnyObjectType
) {
  const privatePropName = `_${propName}`;
  Object.defineProperty(target, propName, {
    get() {
      if (this.isDeleted) {
        throw new Error("Cannot access properties on a deleted object.");
      }
      // check for deleted objects
      const propValue = isPropID
        ? context.idMap.get(this[privatePropName])
        : this[privatePropName];
      if (propValue && propValue.isDeleted) {
        return undefined;
      }
      return propValue;
    },
    set(value: any) {
      if (this.isDeleted) {
        throw new Error("Cannot modify properties on a deleted object.");
      }

      if (value && value.isDeleted) {
        throw new Error("Cannot set a property to a deleted object.");
      }
      const oldValue = this[privatePropName];
      this[privatePropName] = isPropID ? value.id : value;

      context.pushOperation({
        operationType: "set",
        target: this,
        propName: propName,
        oldValue: oldValue,
        newValue: value,
        targetType,
      });
    },
  });
}

export function defineComplexArrayProp(
  target: any,
  propName: string,
  isPropID: boolean,
  context: OperationContext,
  targetType: AnyObjectType
) {
  const privatePropName = `_${propName}`;

  // Getter
  Object.defineProperty(target, propName, {
    get() {
      if (this.isDeleted) {
        throw new Error("Cannot access properties on a deleted object.");
      }

      let resultArray: any[] = [];

      if (isPropID) {
        resultArray = this[privatePropName].map((id: string) => {
          const obj = context.idMap.get(id);
          if (!obj) {
            throw new Error(
              `Object with ID "${id}" of type "${targetType.name}" not found.`
            );
          }
          return obj.isDeleted ? undefined : obj;
        });
      } else {
        resultArray = this[privatePropName].filter(
          (obj: any) => !obj.isDeleted
        );
      }

      return resultArray.filter((obj: any) => obj !== undefined);
    },
  });

  // Add method
  target[`add${capitalizeFirstLetter(propName)}`] = function (item: any) {
    if (this.isDeleted || item.isDeleted) {
      throw new Error("Cannot modify properties on a deleted object.");
    }
    this[privatePropName].push(isPropID ? item.id : item);
    context.pushOperation({
      operationType: "add",
      target: this,
      targetType,
      propName,
      value: item,
    });
  };

  target[`add${propName.charAt(0).toUpperCase() + propName.slice(1)}`] =
    function (item: any) {
      this[privatePropName].push(isPropID ? item.id : item);
      context.pushOperation({
        operationType: "add",
        target: this,
        propName: propName,
        value: item,
        targetType: targetType,
      });
    };
  // Remove method
  target[`remove${capitalizeFirstLetter(propName)}`] = function (item: any) {
    if (this.isDeleted || item.isDeleted) {
      throw new Error("Cannot modify properties on a deleted object.");
    }

    const index = this[privatePropName].indexOf(isPropID ? item.id : item);
    if (index === -1) return;

    this[privatePropName].splice(index, 1);

    context.pushOperation({
      operationType: "remove",
      target: this,
      targetType: targetType,
      propName: propName,
      value: item,
    });
  };
}

export function defineOneToOne(
  target: any,
  propName: string,
  inversePropName: string,
  targetType: AnyObjectType,
  inverseType: AnyObjectType,
  context: OperationContext,
  isPropID: boolean = false,
  isInversePropID: boolean = false
) {
  const privatePropName = `_${propName}`;

  Object.defineProperty(target, propName, {
    get() {
      if (this.isDeleted) {
        throw new Error("Cannot access properties on a deleted object.");
      }
      if (isPropID) {
        const id = this[privatePropName];
        if (id === undefined) {
          return undefined;
        }
        const obj = context.idMap.get(id);
        if (!obj) {
          throw new ObjectNotFoundError(
            id,
            targetType,
            `Object with ID "${id}" not found in idMap for target type "${targetType.name}".`
          );
        }
        return obj.isDeleted ? undefined : obj;
      } else {
        return this[privatePropName]?.isDeleted
          ? undefined
          : this[privatePropName];
      }
    },

    set(value: any) {
      if (this.isDeleted || (value && value.isDeleted)) {
        throw new Error("Cannot modify properties on a deleted object.");
      }

      const oldValue = this[propName];
      if (oldValue === value) return;

      // Disconnect the old inverse target
      if (oldValue) {
        oldValue[`_${inversePropName}`] = undefined;
      }

      // Connect the new inverse target
      if (value) {
        value[`_${inversePropName}`] = isInversePropID ? this.id : this;
      }

      // Update the property
      this[privatePropName] = isPropID ? value?.id : value;

      // Push the operation to the stack
      context.pushOperation({
        operationType: "set",
        target: this,
        targetType,
        inversePropName,
        propName,
        oldValue,
        newValue: value,
      });
    },
  });
}

export function defineOneToMany(
  target: any,
  propName: string,
  inversePropName: string,
  targetType: AnyObjectType,
  inverseType: AnyObjectType,
  context: OperationContext,
  isPropID: boolean = false,
  isInversePropID: boolean = false
) {
  const privatePropName = `_${propName}`;
  target[privatePropName] = [];

  Object.defineProperty(target, propName, {
    get() {
      if (this.isDeleted) {
        throw new Error("Cannot access properties on a deleted object.");
      }
      if (isPropID) {
        return this[privatePropName]
          .map((id: string) => context.idMap.get(id))
          .filter((item: any) => item && !item.isDeleted);
      } else {
        return this[privatePropName].filter((item: any) => !item.isDeleted);
      }
    },
  });

  // Add method
  target[`add${capitalizeFirstLetter(propName)}`] = function (item: any) {
    if (this.isDeleted || item.isDeleted) {
      throw new Error("Cannot modify properties on a deleted object.");
    }

    const valueToAdd = isPropID ? item.id : item;
    this[privatePropName].push(valueToAdd);

    if (isInversePropID) {
      item[`_${inversePropName}`] = this.id;
    } else {
      item[`_${inversePropName}`] = this;
    }

    context.pushOperation({
      operationType: "add",
      target: this,
      targetType,
      propName,
      value: item,
    });
  };

  target[`remove${propName.charAt(0).toUpperCase() + propName.slice(1)}`] =
    function (item: any) {
      if (this.isDeleted || item.isDeleted) {
        throw new Error("Cannot modify properties on a deleted object.");
      }
      const index = this[privatePropName].indexOf(isPropID ? item.id : item);
      if (index === -1) return;

      // Update the operation stack
      context.pushOperation({
        operationType: "remove",
        target: this,
        targetType,
        propName,
        value: item,
      });

      this[privatePropName].splice(index, 1);
      item[`_${inversePropName}`] = undefined;
    };
}

export function defineManyToOne(
  target: any,
  propName: string,
  inversePropName: string,
  targetType: AnyObjectType,
  inverseType: AnyObjectType,
  context: OperationContext,
  isPropID: boolean = false,
  isInversePropID: boolean = false
) {
  const { operationStack, redoStack } = context;
  const privatePropName = `_${propName}`;

  Object.defineProperty(target, propName, {
    get() {
      if (this.isDeleted) {
        throw new Error("Cannot access properties on a deleted object.");
      }

      if (isPropID) {
        const value = this[privatePropName];
        if (value === undefined) return undefined;

        const obj = context.idMap.get(value);
        if (!obj) {
          throw new ObjectNotFoundError(
            value,
            targetType,
            `Object with ID "${value}" not found in idMap for target type "${targetType.name}".`
          );
        }

        return obj.isDeleted ? undefined : obj;
      } else {
        return this[privatePropName]?.isDeleted
          ? undefined
          : this[privatePropName];
      }
    },

    set(value: any) {
      if (this.isDeleted) {
        throw new Error("Cannot modify properties on a deleted object.");
      }

      // Find the value to set based on isPropID
      let valueToSet = isPropID ? value.id : value;

      // Find the old value
      const oldValue = isPropID
        ? context.idMap.get(this[privatePropName])
        : this[privatePropName];

      if (oldValue === valueToSet) return;

      // Disconnect the old parent
      if (oldValue) {
        const index = oldValue[`_${inversePropName}`].indexOf(
          isInversePropID ? this.id : this
        );
        if (index !== -1) {
          oldValue[`_${inversePropName}`].splice(index, 1);
        }
      }

      // Update the property
      this[privatePropName] = valueToSet;

      // Connect the new parent
      if (value) {
        if (
          isInversePropID &&
          !value[`_${inversePropName}`].includes(this.id)
        ) {
          value[`_${inversePropName}`].push(this.id);
        } else if (
          !isInversePropID &&
          !value[`_${inversePropName}`].includes(this)
        ) {
          value[`_${inversePropName}`].push(this);
        }
      }

      // Push the operation to the stack
      context.pushOperation({
        operationType: "set",
        target: this,
        targetType,
        inversePropName,
        propName,
        oldValue,
        newValue: valueToSet,
      });
    },
  });
}

export function defineManyToMany(
  target: any,
  propName: string,
  inversePropName: string,
  targetType: AnyObjectType,
  inverseType: AnyObjectType,
  context: OperationContext,
  isPropID: boolean = false,
  isInversePropID: boolean = false
) {
  const { operationStack, redoStack } = context;
  const privatePropName = `_${propName}`;
  const privateInversePropName = `_${inversePropName}`;

  Object.defineProperty(target, propName, {
    get() {
      if (this.isDeleted) {
        throw new Error("Cannot access properties on a deleted object.");
      }

      // If the property is supposed to hold IDs, simply return the array of IDs
      if (isPropID) {
        return this[privatePropName].filter((id: string) => {
          const obj = context.idMap.get(id);
          return obj && !obj.isDeleted;
        });
      }

      // If the property is supposed to hold object references, filter out deleted objects
      return this[privatePropName].filter((obj: any) => !obj.isDeleted);
    },
  });

  // Add method
  target[`add${capitalizeFirstLetter(propName)}`] = function (item: any) {
    if (this.isDeleted || item.isDeleted) {
      throw new Error("Cannot modify properties on a deleted object.");
    }

    // Find the value to add based on isPropID
    const valueToAdd = isPropID ? item.id : item;

    // Check if the item is already in the array
    if (this[privatePropName].includes(valueToAdd)) {
      return;
    }

    // Add the item to the array
    this[privatePropName].push(valueToAdd);

    // Add the inverse item
    if (isInversePropID) {
      item[privateInversePropName].push(this.id);
    } else {
      item[privateInversePropName].push(this);
    }

    // Push the operation to the operation stack
    context.pushOperation({
      operationType: "add",
      target: this,
      targetType,
      propName,
      value: item,
    });
  };

  // Remove method
  target[`remove${capitalizeFirstLetter(propName)}`] = function (item: any) {
    if (this.isDeleted || item.isDeleted) {
      throw new Error("Cannot modify properties on a deleted object.");
    }

    // Find the value to remove based on isPropID
    const valueToRemove = isPropID ? item.id : item;

    // Find the index of the item in the array
    const index = this[privatePropName].indexOf(valueToRemove);

    // If the item is not in the array, return
    if (index === -1) {
      return;
    }

    // Remove the item from the array
    this[privatePropName].splice(index, 1);

    // Remove the inverse item
    const inverseIndex = isInversePropID
      ? item[privateInversePropName].indexOf(this.id)
      : item[privateInversePropName].indexOf(this);

    if (inverseIndex !== -1) {
      item[privateInversePropName].splice(inverseIndex, 1);
    }

    // Push the operation to the operation stack
    context.pushOperation({
      operationType: "remove",
      target: this,
      targetType,
      propName,
      value: item,
    });
  };
}