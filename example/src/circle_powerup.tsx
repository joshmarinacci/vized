import {
  genID,
  makeFromDef,
  PROP_TYPES,
  PropCluster,
  PropGroup,
  TreeItem
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

  draw(ctx: any, c: CanvasRenderingContext2D, ch: any): void {
      c.beginPath()
      c.arc(ch.x,ch.y,ch.radius,0,Math.PI*2)
      c.closePath()
      c.fillStyle = ctx.provider.getColorValue(ch, 'color')
      c.fill()
      let bw = ctx.provider.getNumberValue(ch, 'borderWidth')
      if (bw > 0) {
        c.strokeStyle = ctx.provider.getColorValue(ch, 'borderColor')
        c.lineWidth = bw
        c.stroke()
      }
      if (ctx.selection.isSelected(ch)) {
        let bds = ctx.provider.getBoundsValue(ch)
        bds.stroke(c, 'red', 3)
        bds.stroke(c, 'black', 1)
      }
  }
  useResizeHandle(item:TreeItem): boolean {
    return false;
  }
}
