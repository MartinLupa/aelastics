import * as f from "./m2t.meta.model";
import {
  ConnectionInfo,
  CpxTemplate,
  defaultConnectionInfo,
  Element,
  Template,
  WithRefProps,
} from "./../../index";
import { ModelStore } from "./../../index";

export type IM2T_Props = WithRefProps<f.M2T_Model> & { store?: ModelStore };

export const M2T: CpxTemplate<IM2T_Props, f.M2T_Model> = (props) => {
  return new Element(f.M2T_Model, props, undefined);
};

export const Dir: Template<f.IDirectory> = (props) => {
  return new Element(f.Directory, props, "items");
};

export const Doc: Template<f.IDocument> = (props) => {
  return new Element(f.Document, props, "items");
};

export const DocParent: Template<f.IDocument> = (props) => {
  const connInfo: ConnectionInfo = {
    isParentProp: false,
    textContentAllowed: false,
    isReconnectAllowed: false,
    propName: "elements",
    textPropName: "items",
  };

  return new Element(f.Document, props, "items");
};

export const P: Template<f.IParagraph> = (props) => {
  const connInfo: ConnectionInfo = defaultConnectionInfo("elements");
  connInfo.textContentAllowed = true;
  connInfo.textPropName = "txtContent";

  return new Element(f.Paragraph, props, connInfo);
};

export const Sec: Template<f.ISection> = (props) => {
  return new Element(f.Section, props, "elements");
};

export const SecParent: Template<f.ISection> = (props) => {
  return new Element(f.Section, props, "parentSection");
};
