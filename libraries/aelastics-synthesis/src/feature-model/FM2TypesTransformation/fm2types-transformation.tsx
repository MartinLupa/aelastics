/** @jsx hm */

import { Element } from "../../jsx/element";
import { hm } from "../../jsx/handle";
import { ModelStore } from "../../jsx/ModelsStore";
import { abstractM2M } from "../../transformations/abstractM2M";
import * as fm from "../FM_MetaModel/fm-meta.model-V2.type";
import { SpecPoint, SpecOption } from "../../transformations/spec-decorators";
import {
  Property,
  TypeArray,
  TypeModel,
  TypeObject,
  TypeOptional,
} from "../Types_MetaModel/types-components";
import * as t from "../Types_MetaModel/types-meta.model";

export class FM2TypesTransformations extends abstractM2M<
  fm.IFeatureDiagram,
  t.ITypeModel
> {
  constructor(store: ModelStore) {
    super(store);
  }

  template(fd: fm.IFeatureDiagram) {
    return (
      <TypeModel name={fd.name} MDA_level="M2">
        {fd.elements.map((e) => this.Feature2Type(e as fm.IFeature))}
      </TypeModel>
    );
  }

  Feature2Type(f: fm.IFeature): Element<t.IType> {
    let type = undefined;
    if (
      f.maxCardinality == 1 ||
      this.context.store.isTypeOf(f, fm.GroupFeature)
    ) {
      type = this.Feature2Object(f);
    } else {
      type = this.Feature2Array(f);
    }

    if (f.minCardinality === 0) {
      type = <TypeOptional>{type}</TypeOptional>;
    }

    return type;
  }

  @SpecPoint()
  Feature2Object(f: fm.IFeature): Element<t.IType> {
    return (
      <TypeObject name={f.name}>
        {f.subfeatures?.map((e) => this.Feature2Type(e as fm.IFeature))}
      </TypeObject>
    );
  }

  @SpecOption("Feature2Object", fm.SolitaryFeature)
  Solitary2Object(f: fm.ISolitaryFeature): Element<t.IObject> {
    return (
      <TypeObject>
        {f.attributes?.map((e) => this.Attribute2Property(e as fm.IAttribute))}
      </TypeObject>
    );
  }

  @SpecOption("Feature2Object", fm.GroupFeature)
  Group2Object(f: fm.IGroupFeature): Element<t.IObject> {
    return <TypeObject></TypeObject>;
  }

  Attribute2Property(a: fm.IAttribute): Element<t.IProperty> {
    return <Property name={a.name}></Property>;
  }

  // Feature2ArrayType(f: fm.IFeature): Element<t.IType> {
  //   return <ArrayType>

  //   </ArrayType>;
  // }

  Feature2Array(f: fm.IFeature): Element<t.IType> {
    // ovde je dovoljno da se napravi jedan tip (taj konkretan)
    let type = this.Feature2Object(f);

    return <TypeArray>{this.Feature2Object(f)}</TypeArray>;
  }

  //unija nije potrebna

  //   Feature2Union(f: fm.IFeature): Element<t.IUnion> {
  //     return (
  //       <Union>
  //         {f.subfeatures?.map((e) => this.Feature2Type(e as fm.IFeature))}
  //       </Union>
  //     );
  //   }
}
