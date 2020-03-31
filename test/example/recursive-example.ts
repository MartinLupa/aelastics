/*
 * Copyright (c) AelasticS 2019.
 */
import * as t from '../../src/aelastics-types'
import { DriverTypeLicences, DriverTypeProfession } from './types-example'

export const secondLevelObject = t.object(
  {
    name: t.string
  },
  'secondLevelObject'
)
export const rootLevelLevelObject = t.object(
  {
    a: secondLevelObject,
    b: secondLevelObject
  },
  'rootLevelObject'
)

export const schema = t.schema('schema')

export const companyType = t.object(
  {
    name: t.string,
    city: t.string,
    director: t.link(schema, 'worker', 'director')
  },
  'company',
  schema
)

export const workerType = t.object(
  {
    firstName: t.string,
    lastName: t.string,
    company: companyType
  },
  'worker',
  schema
)

t.inverseProps(companyType, 'director', workerType, 'company')

export const arrayOfRootLevelObjects = t.arrayOf(rootLevelLevelObject)

export const objectWithArrays = t.object(
  {
    a: arrayOfRootLevelObjects,
    b: arrayOfRootLevelObjects
  },
  'object whit arrays'
)

export const arraySchema = t.schema('arraySchema')

export const arrayObject = t.object(
  {
    a: t.boolean,
    b: t.number,
    c: t.arrayOf(t.link(arraySchema, 'firstLevelArray', 'c'))
  },
  'arrayObject',
  arraySchema
)

export const firstLevelArray = t.arrayOf(arrayObject, 'firstLevelArray')

arraySchema.addType(firstLevelArray)

export const mapSchema = t.schema('mapSchema')

export const mapOfRootLevelObjects = t.mapOf(t.string, rootLevelLevelObject)

export const rootMap = t.mapOf(
  t.string,
  t.object(
    {
      a: t.boolean,
      b: t.number.lessThan(32),
      c: t.optional(t.string),
      d: t.link(mapSchema, 'rootMap', 'object')
    },
    'object'
  ),
  'rootMap'
)
mapSchema.addType(rootMap)

export const intersectionInstance = t.intersectionOf([
  t.object({ a: t.string.derive('').alphabetical }),
  t.object({ b: t.string })
])

export const objectWithIntersections = t.object(
  {
    a: intersectionInstance,
    b: intersectionInstance
  },
  'object with intersection'
)

export const intersectionSchema = t.schema('intersectionSchema')

export const secondLevelIntersectionObject = t.object(
  {
    a: t.link(intersectionSchema, 'recursiveIntersection', 'recursiveIntersection'),
    b: t.boolean,
    c: t.string
  },
  'secondLevelIntersectionObject',
  intersectionSchema
)

export const recursiveIntersection = t.intersectionOf(
  [t.object({ a: secondLevelIntersectionObject }), t.object({ b: t.string })],
  'recursiveIntersection'
)
intersectionSchema.addType(recursiveIntersection)

export const simpleObject = t.object({ a: t.string }, 'simple object')
export const simpleSubtype = t.subtype(simpleObject, { date: t.date })
export const objectWithSubtipes = t.object(
  { a: simpleSubtype, b: simpleSubtype },
  'objectWithSubtypes'
)

export const subtypeSchema = t.schema('subtypeSchema')
export const secondLevelSybtypeObject = t.object(
  {
    a: t.boolean,
    b: t.link(subtypeSchema, 'recursiveSubtype', 'recursiveSubtype')
  },
  'secondLevelSybtypeObject',
  subtypeSchema
)
export const recursiveSubtype = t.subtype(
  simpleObject,
  { b: t.number.greaterThan(11), c: secondLevelSybtypeObject },
  'recursiveSubtype',
  subtypeSchema
)

/*
import * as t from "../index";

// 1.
export function lazyFunction(f:()=> t.Any) {
    return function () {
        // @ts-ignore
        return f.apply(this, arguments);
    };
}
const lazyTreeType1 = lazyFunction(() => treeType1);

export const treeType1 = t.object({info:t.string, children:t.arrayOf(lazyTreeType1())});

export const tree1:t.TypeOf<typeof treeType> = {info:"", children:[]};

// export const treeType = t.subtype(treeTypeAbs, {children:treeTypeAbs});


// 2.
/!*
export const recursiveType = <fn extends ()=>any>  (f:fn) => {
    const res:ReturnType<fn> = f();
    return res;
}
const lazyTreeType = recursiveType(() => treeType);
*!/


// 3.
export class RecursiveTypeC<fn extends ()=> t.Any> extends t.TypeC<ReturnType<fn>> {

    constructor(name: string , public readonly getTypeFun:fn) {
        super(name);
    }

    public getType():t.Any {return this.getType();}
}
export const recursiveType = <ft extends ()=> t.Any>  (f:ft)=> new RecursiveTypeC("recursive", f);

const lazyTreeType = lazyFunction(() => treeType);

export const treeType = t.object({info:t.string, children:t.arrayOf(recursiveType(lazyTreeType))});
export const tree:t.TypeOf<typeof treeType> = {info:"", children:[]};


*/
