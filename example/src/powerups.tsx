import {
  PROP_TYPES,
  PropCluster,
  PropGroup,
  TreeItem
} from "vized";

import { ColorValueRenderer, Rect } from "./components";
import { RectDocEditor, } from "./RectDocEditor";
export const COLORS = ['white','red','green','blue','yellow','black','transparent']

export interface ObjectPowerup {
  treeIcon():string;
  type(): string,
  def(): PropCluster,
  makeObject():TreeItem,
  getBounds(item: TreeItem, provider: RectDocEditor):Rect,
  draw(ctx:any,c: CanvasRenderingContext2D, ch: any):void,
}


export const GEOM_GROUP:PropGroup = [
  {
    type:PROP_TYPES.NUMBER,
    key:'x',
    name:'x',
    default:0,
    live:true,
    hints: {
      incrementValue:1,
    }
  },
  {
    key:'y',
    name:'y',
    type:PROP_TYPES.NUMBER,
    live:true,
    default: 0,
    hints:{
      incrementValue:1,
    }
  },
  {
    key:'w',
    name:'width',
    type: PROP_TYPES.NUMBER,
    default: 100,
    live:true,
    hints: {
      incrementValue:1,
      min:1,
    },
  },
  {
    key:'h',
    name:'height',
    type: PROP_TYPES.NUMBER,
    default: 100,
    live:true,
    hints: {
      incrementValue:1,
      min:1,
    }
  },
]

export const STYLE_GROUP:PropGroup = [
  {
    key:"color",
    name:'color',
    type:PROP_TYPES.ENUM,
    live:false,
    default: 'white',
    values:COLORS,
    renderer: ColorValueRenderer,
  },
  {
    key:"borderColor",
    name:"border color",
    type:PROP_TYPES.ENUM,
    live:false,
    default: 'black',
    values:COLORS,
    renderer: ColorValueRenderer,
  },
  {
    key:"borderWidth",
    name:"border width",
    type:PROP_TYPES.NUMBER,
    live:false,
    default:1,
  }
]
