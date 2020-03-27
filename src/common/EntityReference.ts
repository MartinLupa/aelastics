/*
 * Copyright (c) AelasticS 2019.
 *
 */

import { TypeC, Any, ConversionContext } from './Type'
import {
  DtoObjectType,
  DtoProps,
  isObject,
  ObjectType,
  ObjectTypeC,
  Props
} from '../complex-types/ObjectType'
import {
  appendPath,
  Errors,
  Failure,
  failures,
  failureValidation,
  isFailure,
  Path,
  Result,
  success,
  Success,
  ValidationError,
  validationError
} from 'aelastics-result'
import { ComplexTypeC, InstanceReference } from '../complex-types/ComplexType'

// You can use const assertion (added in typescript 3.4)
// https://stackoverflow.com/questions/55570729/how-to-limit-the-keys-of-an-object-to-the-strings-of-an-array-in-typescript
// https://www.typescriptlang.org/docs/handbook/utility-types.html

export type TypeOfKey<C extends ObjectTypeC<any, readonly string[]>> = C['ID']
export type DtoTypeOfKey<C extends ObjectTypeC<any, readonly string[]>> = C['ID_DTO']

export type DtoEntityReference<T extends ObjectTypeC<any, readonly string[]>> = {
  ref: InstanceReference
  reference: DtoTypeOfKey<T>
}

export class EntityReference<T extends ObjectTypeC<any, readonly string[]>> extends ComplexTypeC<
  T,
  TypeOfKey<T>,
  DtoEntityReference<T>
> {
  public readonly referencedType: T = this.baseType

  constructor(name: string, obj: T) {
    super(name, obj)
  }

  // value should be of type corresponding to the identifier of the referenced type
  validate(value: any, path: Path = []): Success<boolean> | Failure {
    const result = isObject(value)
      ? success(value)
      : failureValidation('Value is not object', path, this.name, value)
    if (isFailure(result)) {
      return result
    }
    const identifier = this.referencedType.identifier
    const errors: Errors = []
    if (Object.keys(value).length > identifier.length) {
      const fail = failureValidation('Extra properties', path, this.name, value)
      if (isFailure(fail)) {
        return fail
      }
    }
    for (let i = 0; i < identifier.length; i++) {
      const k = identifier[i]
      if (value[k] === undefined) {
        errors.push(
          validationError(
            'missing property',
            appendPath(path, k, this.referencedType.baseType[k] as TypeC<any>),
            this.name
          )
        )
        continue
      }
      const ak = value[k]
      const t = this.referencedType.baseType[k] as TypeC<any>

      const validation = t.validate(ak, appendPath(path, k, t.name, ak))
      if (isFailure(validation)) {
        errors.push(...validation.errors)
      }
    }
    return errors.length ? failures(errors) : success(true)
  }

  makeInstanceFromDTO(
    input: DtoEntityReference<T>,
    path: Path,
    visitedNodes: Map<any, any>,
    errors: ValidationError[],
    context: ConversionContext
  ): TypeOfKey<T> {
    let output: Props = {}
    if (!isObject(input.reference)) {
      errors.push(validationError('Reference is not valid', path, this.name, input))
      return output
    }
    const identifier = this.referencedType.identifier
    for (let i = 0; i < identifier.length; i++) {
      const k: string = identifier[i]
      const ak = output[k]
      const t = this.referencedType.baseType[k] as TypeC<any>

      const conversion = t.fromDTOCyclic(
        ak,
        appendPath(path, k, t.name, ak),
        visitedNodes,
        errors,
        context
      )
      output[k] = conversion.value
    }
    return output as TypeOfKey<T>
  }

  makeDTOInstance(
    input: TypeOfKey<T>,
    path: Path,
    visitedNodes: Map<any, any>,
    errors: ValidationError[],
    context: ConversionContext
  ): DtoEntityReference<T> {
    let output: DtoEntityReference<T> = {
      ref: this.makeReference(input, context),
      reference: {}
    }
    const key = this.referencedType.identifier
    for (let i = 0; i < key.length; i++) {
      const k = key[i]
      const ak = input[k]
      const t = this.referencedType.baseType[k] as TypeC<any>
      const conversion = t.toDTOCyclic(
        input,
        appendPath(path, k, t.name, ak),
        visitedNodes,
        errors,
        context
      )
      ObjectTypeC.addProperty(output.reference, k, conversion)
    }
    return output
  }
  validateLinks(traversed: Map<Any, Any>): Result<boolean> {
    return this.referencedType.validateLinks(traversed)
  }
}

export const ref = <T extends ObjectTypeC<any, readonly string[]>>(
  t: T,
  name: string = `referenceTo${t.name}`
) => new EntityReference<T>(name, t)
