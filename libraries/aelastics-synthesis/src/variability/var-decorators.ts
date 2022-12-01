// https://luckylibora.medium.com/typescript-method-decorators-in-depth-problems-and-solutions-74387d51e6a

import { Any } from "aelastics-types"
import { abstractM2M } from "../transformations/abstractM2M_v2"


// https://stackoverflow.com/questions/55179461/reflection-in-javascript-how-to-intercept-an-object-for-function-enhancement-d




const __VarPoint = "__VarPoint"

interface IOption {
  methodName:string,
  evalCondition:(...args:any[])=>boolean,
}

export interface IVarOption {
  varMethod:string,
  evalFun:(inputElem:Any, annotElem:any, transform:abstractM2M<any, any>)=>boolean
  default:boolean
}


// method decorator
export const VarPoint = (name:string) => {
    return function  (target:any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value = function (...args: any[]) {
              const options:IOption[] = descriptor.value[name]
              const option = options.find((option)=>{
                return option.evalCondition()
              })
              if(!option) {
                throw new Error(`No option condition evaluated to true`)
              }
              let result = target[option.methodName](...args);
              return result;
            }
        descriptor.value[__VarPoint] = name
        descriptor.value[name] = []
        return descriptor
    }
}

// method decorator
export const VarOption = (methodName:string, condition:(...args:any[])=>boolean, defulat=false) =>{

    return function  (target:any, propertyKey: string, descriptor: PropertyDescriptor) {
        const method:Function = target[methodName]
        // @ts-ignore
        if (method[__VarPoint])
        {
            let o:IOption = {
                methodName: propertyKey,
                evalCondition: condition,
            }
            // @ts-ignore
            method[method[__VarPoint]].push(o)
        }
        return descriptor;
      }
}

