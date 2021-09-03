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

import { ObjectPowerup } from "./powerups";
import { ID_DEF, RectDocEditor, SHAPE_TYPES, TITLE_DEF } from "./RectDocEditor";
import { Rect } from "./components";

export const GroupDef:PropCluster = new Map<string, PropGroup>()
GroupDef.set("base",[
  ID_DEF,
  TITLE_DEF,
  {
    type: PROP_TYPES.STRING,
    name: 'type',
    locked: true,
    key: 'type',
    default:SHAPE_TYPES.GROUP,
  }
])
GroupDef.set("geom",[
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
])

export class GroupPowerup implements ObjectPowerup {
  def() {
    return GroupDef;
  }

  getBounds(item:TreeItem, provider: RectDocEditor): Rect {
      return provider.calc_group_bounds_value(item)
  }

  makeObject() {
    let g = makeFromDef(GroupDef,{
      id:genID('group_'),
      title:"unnamed group"})
    g.children = []
    return g
  }

  treeIcon(): string {
    return "group";
  }

  type(): string {
    return "group";
  }
}
