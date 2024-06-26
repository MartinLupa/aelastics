/*
 * Project: aelastics-store
 * Created Date: Thursday November 3rd 2022
 * Author: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Last Modified: Saturday, 16th September 2023
 * Modified By: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Copyright (c) 2023 Aelastics (https://github.com/AelasticS)
 */
/*
 * Copyright (c) AelasticS 2020.
 */

import { ITransformer, WhatToDo, Node, ObjectType } from 'aelastics-types';
import { Lambda, observable, observe } from 'mobx';
import { prefixValue } from "../common/CommonConstants";
import { EventLog } from './EventLog';
import { getArrayListener, getMapListener, getObjectListener } from './Listeners';

export class AddEventListeners implements ITransformer {
  private xf: ITransformer;
  private readonly eventLog: EventLog;

  constructor(xf: ITransformer, eventLog: EventLog) {
    this.xf = xf;
    this.eventLog = eventLog;
  }
  
  private getPropertyNames(type: ObjectType<any, any>): string[] {
    const arr: string[] = [];
    for (let s of type.allProperties.keys()) {
      arr.push(`${prefixValue}${s}`);
    }
    return arr;
  }

  init(value: any, currNode: Node): [any, WhatToDo] {
    let disposer: Lambda;

    switch (currNode.type.typeCategory) {
      case 'Object':
        disposer = observe(
          value,
          getObjectListener(this.eventLog, this.getPropertyNames(currNode.type as ObjectType<any, any>))
        );
        this.eventLog.listeners.set(value, disposer);
        break;
      case 'Array':
        break;
      case 'Map':
        break;
      case 'Union':
        break;
      case 'TaggedUnion':
        break;
      case 'Intersection':
        break;
    }
    return this.xf.init(value, currNode);
  }

  result(result: any, currNode: Node): [any, WhatToDo] {
    switch (currNode.type.typeCategory) {
      case 'Object':
        //   result = handleProps(result, currNode.type)
        break;
    }
    return this.xf.result(result, currNode);
  }

  step(result: any, currNode: Node, item: any): [any, WhatToDo] {
    if (currNode.extra.role === 'asProperty') {
      let disposer: Lambda;
      switch (currNode.type.typeCategory) {
        case 'Array':
          disposer = observe(item, getArrayListener(this.eventLog, result, currNode.extra.propName!));
          this.eventLog.listeners.set(result, disposer);
          break;
        case 'Map':
          disposer = observe(item, getMapListener(this.eventLog, result, currNode.extra.propName!));
          this.eventLog.listeners.set(result, disposer);
          break;
      }
    }

    return this.xf.step(result, currNode, item);
  }
}

export const addEventListeners = (xf: ITransformer, log: EventLog) => new AddEventListeners(xf, log);
