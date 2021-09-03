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
import { ColorValueRenderer, Rect } from "./components";
import { RectDocEditor } from "./RectDocEditor";
import { COLORS, ObjectPowerup } from "./powerups";
import { SquareDef } from "./square_powerup";

export const BoundsDef:PropCluster = new Map<string,PropGroup>()
BoundsDef.set("base",[
  {
    type: PROP_TYPES.STRING,
    name: 'type',
    locked: true,
    key: 'type',
    default:'bounds',
  },
])

const GEOM_GROUP:PropGroup = [
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
BoundsDef.set("geom",GEOM_GROUP)

const TextboxDef:PropCluster = new Map<string,PropGroup>()
TextboxDef.set("base",[
  {
    type: PROP_TYPES.STRING,
    name:'ID',
    locked:true,
    key: "id",
  },
  {
    type:PROP_TYPES.STRING,
    name:'Title',
    locked:false,
    key:'title',
    default:''
  },
  {
    type: PROP_TYPES.STRING,
    name: 'type',
    locked: true,
    key: 'type',
    default:"textbox",
  },
  {
    type: PROP_TYPES.STRING,
    name:'text',
    locked:false,
    key:'text',
    default:'empty text'
  }
])
TextboxDef.set("geom",GEOM_GROUP)
TextboxDef.set("layout",[
  {
    key:'fontSize',
    name:"font size",
    type:PROP_TYPES.NUMBER,
    live:false,
    default:16,
  },
  {
    key:'horizontalAlign',
    name:'Align H',
    type:PROP_TYPES.ENUM,
    live:false,
    values:["start","center","end"],
    default:"center",
  },
  {
    key:'verticalAlign',
    name:'Align V',
    type:PROP_TYPES.ENUM,
    live:false,
    values:["start","center","end"],
    default:"center",
  },
])
TextboxDef.set("style",[
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
    key:"backgroundColor",
    name:'background color',
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
  },
])

export class TextboxPowerup extends ObjectPowerup {
  def() {
    return TextboxDef
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
      return makeFromDef(TextboxDef, {
        id: genID('textbox'),
        title: 'text box',
        color: 'black',
        backgroundColor: 'green',
        borderColor: 'blue',
        borderWidth: 5,
      })
  }

  treeIcon(): string {
    return "textbox";
  }

  type(): string {
    return "textbox";
  }

  draw(ctx: any, c: CanvasRenderingContext2D, ch: any): void {
    //draw background
    // c.fillStyle = ctx.provider.getColorValue(ch, 'backgroundColor')
    let bds = ctx.provider.getBoundsValue(ch)
    bds.fill(c, ctx.provider.getColorValue(ch, 'backgroundColor'))

    //draw border
    let bw = ctx.provider.getNumberValue(ch, 'borderWidth')
    if (bw > 0) bds.stroke(c, ctx.provider.getColorValue(ch, 'borderColor'), bw)

    c.save()
    c.translate(bds.x,bds.y)

    //draw text
    let txt = ctx.provider.getStringValue(ch,'text')
    c.font = `normal ${ctx.provider.getNumberValue(ch,'fontSize')}px sans-serif`;
    let metrics = c.measureText(txt)
    let txt_bounds = new Rect(0,0,-metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight,metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)

    let pt = new Point(0,0)
    let halign = ctx.provider.getStringValue(ch,'horizontalAlign')
    if(halign === 'start')  pt.x = txt_bounds.x
    if(halign === 'center') pt.x = bds.width()/2 - txt_bounds.width()/2
    if(halign === 'end')    pt.x = bds.width() - txt_bounds.width()
    let valign = ctx.provider.getStringValue(ch,'verticalAlign')
    if(valign === 'start')  pt.y = txt_bounds.y
    if(valign === 'center') pt.y = bds.height()/2 - txt_bounds.height()/2
    if(valign === 'end')    pt.y = bds.height() - txt_bounds.height()

    c.fillStyle = ctx.provider.getColorValue(ch,'color')
    c.fillText(txt,pt.x,pt.y+metrics.fontBoundingBoxAscent)
    c.restore()

    if (ctx.selection.isSelected(ch)) {
      bds.stroke(c, 'red', 3)
      bds.stroke(c, 'black', 1)
    }
  }

  useResizeHandle(item:TreeItem): boolean {
    return true
  }
}

