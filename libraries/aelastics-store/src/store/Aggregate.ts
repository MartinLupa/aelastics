/*
 * Project: aelastics-store
 * Created Date: Friday April 21st 2023
 * Author: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Last Modified: Saturday, 16th September 2023
 * Modified By: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Copyright (c) 2023 Aelastics (https://github.com/AelasticS)
 */

import * as t from "aelastics-types";
import { Repository } from "./Repository";
import {
  observable,
  action,
  intercept,
  observe,
  IArraySplice,
  IObservableObject,
  values,
} from "mobx";
import { EventLog } from "../eventLog/EventLog";
import { ServerProxy } from "../server-proxy/ServerProxy";
import { getUnderlyingType } from "../common/CommonConstants";
import { isSuccess } from "aelastics-result";
import { IStoreObject, objectType } from "../common/CommonConstants";
import { Schema } from "inspector";
import { Command, ObjectCommand } from "../server-proxy/CommandMaker";
import { ObjectLiteral } from "aelastics-types";
import { Base } from "./Base";

/**
 * // TODO identifier generation
 * // TODO inverse properties
 * // TODO state of objects, via
 * // TODO creating ServerCommand
 * // TODO creating ServerQuery
 * // TODO transactions
 * // TODO cash for created instances
 * // TODO find an object by ID
 * // TODO find objects by ID
 *
 **/

/**
 * Aggreagate - DDD aggregate is a cluster of domain objects that can be treated as a single unit.
 */

export class Aggregate<R extends ObjectLiteral, ID = string> extends Base<ID> {

  public readonly rootType: t. ObjectType<any,any>;

  //  @observable
  public root: IStoreObject<R> | undefined; // = undefined as any

  constructor(
    rootType: t. ObjectType<any,any>,
    root?: IStoreObject<R>,
    server?: ServerProxy
  ) {
    super(server);
    this.rootType = rootType;
    this.root = root;
  }

  //  @action
  public createRoot(initValue?: Partial<R>): IStoreObject<R> {
    this["root"] = this.deepCreate(this.rootType, initValue);
    return this["root"];
  }
  public  getTypeSchemaOfObject<
    T extends IStoreObject<ObjectLiteral>
  >(obj: T): t.TypeSchema {
    return this.rootType.ownerSchema;
  }
   
  public getTypeSchemaByFullName(schemaPath: string): t.TypeSchema | undefined {
    if(this.rootType.ownerSchema.absolutePathName === schemaPath)
      return this.rootType.ownerSchema
    return undefined
  }

  public getTypeOfObject<T extends IStoreObject<ObjectLiteral>>(obj: T): t.Any {
    const schema = this.getTypeSchemaOfObject(obj);
    const path = obj[objectType];
    const type = schema.getType(path);
    if (!type)
      throw new Error(
        `Object type '${path}' does not exist in schema '${schema.name}'`
      );
    return type;
  }

  public importDTO(initValue: ObjectLiteral) {
    const obj = super.importFromDTO(this.rootType, initValue);
    //@ts-ignore
    this.root = obj;
    return obj;
  }

  public exportDTO() {
    if(this.root)
      return super.exportToDTO(this.rootType, this.root)
  }

  /**
   * Strategies:
   *  1. subtypes collapsed into supertype/expanded into separte
   *  2. all relationships collapsed into one super rel/expanded into separte rels
   *  3. all attaributes are collapsed
   *
   */
  public save() {
    if (!this.server) throw new Error("Store without server.");
    const cmdMaker = this.server.getCommandMaker();
    const cmds = cmdMaker.makeCommands(this.eventLog);
    const req = this.server.getServerRequest<Command, any>(cmds);
    const res = this.server.execute(req);
    // TODO: reset store and eventLog, or clear and populate with results
    this.eventLog.clear();
  }

  /*
  public load(rootID: string){

  }

  public loadProperty(object: object, property: string) {
    // make query command to get object/s 
    // izvuci iz objekta njegov tip: t1, uzeti tip propertija: t2 a onda naci inverzni property: i1 od datog propertija i konstruisati query koji izvlaci t2 a uslov je da je i1 = objectID 
    // query izvrsava repository za t2 i on formira objekte preko HandleProps
    // setovati po ulaznom objektu properti sa dobijenim objektom/ima (bez event log-a!)
  }
*/
}
