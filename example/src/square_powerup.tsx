import {
  genID,
  makeFromDef,
  PROP_TYPES,
  PropCluster,
  PropGroup,
  TreeItem
} from "vized";

import { GEOM_GROUP, ObjectPowerup, STYLE_GROUP } from "./powerups";
import { ID_DEF, RectDocEditor, TITLE_DEF } from "./RectDocEditor";
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
    default:'square',
  },
])
SquareDef.set("geom",GEOM_GROUP)
SquareDef.set("style",STYLE_GROUP)

export class SquarePowerup implements ObjectPowerup {
  useResizeHandle(item: TreeItem): boolean {
    return true
  }
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

  draw(ctx: any, c: CanvasRenderingContext2D, ch: any): void {
      c.fillStyle = ctx.provider.getColorValue(ch, 'color')
      let bds = ctx.provider.getBoundsValue(ch)
      bds.fill(c, ctx.provider.getColorValue(ch, 'color'))
      let bw = ctx.provider.getNumberValue(ch, 'borderWidth')
      if (bw > 0) bds.stroke(c, ctx.provider.getColorValue(ch, 'borderColor'), bw)
      if (ctx.selection.isSelected(ch)) {
        bds.stroke(c, 'red', 3)
        bds.stroke(c, 'black', 1)
      }
  }

}
