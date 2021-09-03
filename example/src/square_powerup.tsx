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

import { GEOM_GROUP, ObjectPowerup, STYLE_GROUP } from "./powerups";
import { ID_DEF, RectDocEditor, SHAPE_TYPES, TITLE_DEF } from "./RectDocEditor";
import { Rect } from "./components";

export const SquareDef:PropCluster = new Map<string, PropGroup>()
SquareDef.set("base",[
  ID_DEF,
  TITLE_DEF,
  {
    type: PROP_TYPES.STRING,
    name: 'type',
    locked: true,
    key: 'type',
    default:SHAPE_TYPES.SQUARE,
  },
])
SquareDef.set("geom",GEOM_GROUP)
SquareDef.set("style",STYLE_GROUP)

export class SquarePowerup implements ObjectPowerup {
  def() {
    return SquareDef
  }

  getBounds(item:TreeItem, provider: RectDocEditor): Rect {
    return new Rect(
      provider.getNumberValue(item,'x'),
      provider.getNumberValue(item,'y'),
      provider.getNumberValue(item,'w'),
      provider.getNumberValue(item,'h'),
    )
  }

  makeObject() {
    return makeFromDef(SquareDef,{id:genID('square_'),w:50,h:50, title:'unnamed square'})
  }

  treeIcon(): string {
    return "square";
  }

  type(): string {
    return "square";
  }

}
