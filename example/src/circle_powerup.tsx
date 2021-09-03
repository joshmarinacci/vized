import {
  genID,
  makeFromDef,
  Point,
  PROP_TYPES,
  PropCluster,
  PropDef,
  PropGroup,
  SelectionManager,
  TREE_ITEM_PROVIDER,
  TreeItem,
  TreeItemProvider
} from "vized";
import { ID_DEF, RectDocEditor, TITLE_DEF } from "./RectDocEditor";
import { ObjectPowerup, STYLE_GROUP } from "./powerups";
import { Rect } from "./components";

export const CircleDef:PropCluster = new Map<string,PropGroup>()
CircleDef.set("base",[
  ID_DEF,
  TITLE_DEF,
  {
    type: PROP_TYPES.STRING,
    name: 'type',
    locked: true,
    key: 'type',
    default:'circle',
  },
])
CircleDef.set("geom",[
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
    type:PROP_TYPES.NUMBER,
    key:'radius',
    name:'radius',
    default:10,
    live:true,
    hints: {
      incrementValue:1,
    }
  },
])
CircleDef.set("style",STYLE_GROUP)


export class CirclePowerup implements ObjectPowerup {
  def() {
    return CircleDef;
  }

  getBounds(item:TreeItem, provider: RectDocEditor): Rect {
      let r = provider.getNumberValue(item,'radius')
      return new Rect(
        provider.getNumberValue(item,'x')-r,
        provider.getNumberValue(item,'y')-r,
        r*2,
        r*2)
  }

  makeObject() {
    return makeFromDef(CircleDef, {
      id: genID('circle_'),
      title:"unnamed circle",
      r:30,
    })
  }

  treeIcon(): string {
    return "circle";
  }

  type(): string {
    return "circle";
  }
}
