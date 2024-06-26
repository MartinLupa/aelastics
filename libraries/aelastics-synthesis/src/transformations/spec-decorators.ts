// https://luckylibora.medium.com/typescript-method-decorators-in-depth-problems-and-solutions-74387d51e6a

import { Any } from "aelastics-types";
import { IModelElement } from "generic-metamodel";
import { Element } from "../jsx/element";
import { abstractM2M } from "./abstractM2M";

// https://stackoverflow.com/questions/55179461/reflection-in-javascript-how-to-intercept-an-object-for-function-enhancement-d

const __SpecPoint = "__SpecPoint";

export interface ISpecOption {
  specMethod: string;
  inputType: Any;
}

// method decorator
export const SpecPoint = () => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // save original method
    const original: (...a: any[]) => Element<any> = target[propertyKey];
    descriptor.value = function (this: abstractM2M<any, any>, ...args: any[]) {
      const a: IModelElement = args[0];
      const aType = this.context.store.getTypeOf(a);

      // TODO handle subtyping of specPoints(VarPoints). It is needed to combine options from subtype and supertype
      const options: ISpecOption[] = (this as any)[__SpecPoint][propertyKey];
      const option = options?.find((option) => {
        return option.inputType.isOfType(aType);
      });
      
      if (!option) {
        throw new Error(`No specilized method found`);
      }

      // TODO handle if orgResult and specResult are arrays
      // TODO check typing for orgResults and specResult correspondingly

      // get result form original method
      let orgResult = original.apply(this, args);
      // get result from specialized method
      let specResult: Element<IModelElement> = (this as any)[option.specMethod](
        ...args
      );
      // connect corresponding results(elemnets)
      orgResult.subElement = specResult;
      orgResult.isAbstract = true;
      // return result from original method
      return orgResult;
    };

    // added because in composition of decorator, descriptor will be another decorator, not a function
    target[__SpecPoint] = { ...target[__SpecPoint], [propertyKey]: [] };

    return descriptor;
  };
};

// method decorator
export const SpecOption = (methodName: string, type: Any) => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const method: Function = target[__SpecPoint][methodName];
    // @ts-ignore
    if (method) {
      let o: ISpecOption = {
        specMethod: propertyKey,
        inputType: type,
      };
      // @ts-ignore
      method.push(o);
    }
    return descriptor;
  };
};
