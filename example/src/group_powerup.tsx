import {
  genID,
  makeFromDef,
  PROP_TYPES,
  PropCluster,
  PropGroup,
  TreeItem
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

  draw(ctx: any, c: CanvasRenderingContext2D, ch: any): void {
    if(ch.type === SHAPE_TYPES.GROUP) {
      let bds = ctx.provider.calc_group_bounds_value(ch)
      // bds.stroke(c,'purple',4)
      if (ctx.selection.isSelected(ch)) {
        bds.stroke(c, 'red', 3)
        bds.stroke(c, 'black', 1)
      }
    }
    c.save()
    c.translate(ch.x,ch.y)
    ch.children.forEach((ch:any)=>{
      if(ctx.provider.hasPowerup(ch.type)) {
        ctx.provider.getPowerup(ch.type).draw(ctx,c,ch);
      }
      // if(ch.type === SHAPE_TYPES.GROUP)  draw_group(ctx,c,ch)
    })
    c.restore()
  }
  useResizeHandle(item:TreeItem): boolean {
    return false
  }
}
