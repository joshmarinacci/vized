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
import { COLORS, GEOM_GROUP, ObjectPowerup } from "./powerups";
import { RectDocEditor, SHAPE_TYPES } from "./RectDocEditor";
import { Rect } from "./components";
import { BoundsDef } from "./textbox_powerup";

const FlexDef:PropCluster = new Map<string,PropGroup>()
FlexDef.set("base",[
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
    default:"flexbox",
  },
  {
    type: PROP_TYPES.ENUM,
    name:'direction',
    locked:false,
    key:'direction',
    default: "vertical",
    values:["vertical","horizontal"],
  },
  {
    type: PROP_TYPES.ENUM,
    name:'justify',
    key:"justify",
    default:'start',
    values:['start','center','end']
  }
])
FlexDef.set("geom",GEOM_GROUP)

export class FlexPowerup extends ObjectPowerup {
  def() {
    return FlexDef
  }

  draw(ctx: any, c: CanvasRenderingContext2D, ch: any): void {
    let bds = ctx.provider.getBoundsValue(ch)
    bds.fill(c, 'red')


    //draw the children
    c.save()
    c.translate(ch.x,ch.y)
    ch.children.forEach((ch:any)=>{
      if(ctx.provider.hasPowerup(ch.type)) {
        ctx.provider.getPowerup(ch.type).draw(ctx,c,ch);
      }
    })
    c.restore()
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
    let obj = makeFromDef(FlexDef, {
      id: genID('flex'),
      title: 'flex box',
      color: 'black',
    })
    obj.children = []
    return obj
  }

  treeIcon(): string {
    return "square";
  }

  type(): string {
    return "flexbox";
  }

  useResizeHandle(item:TreeItem): boolean {
    return true;
  }

  canAddChild(parent:TreeItem, childType: string): boolean {
    if(childType === 'square') return true
    return false
  }
  afterSetProp(item:any,prop:string,value:any):void {
    this.performLayout(item)
  }

  afterAddChild(parent:TreeItem, child:TreeItem) {
    this.performLayout(parent)
  }

  private performLayout(item: any) {
    // console.log("doing layout on",item,prop,value)
    if(item.direction === "vertical") {
      let y = 0
      item.children.forEach((ch: any) => {
        ch.x = 0
        ch.y = y
        y += ch.h
      })
      let leftover = item.h - y
      if(leftover > 0) {
        if (item.justify === 'start') {
          //move nothing
        }
        if (item.justify === 'center') {
          //shift all by half the leftover amount
          item.children.forEach((ch:any) => ch.y += leftover/2)
        }
        if (item.justify === 'end') {
          //shift all to the end by leftover amount
          item.children.forEach((ch:any) => ch.y += leftover)
        }
      }
    }
    if(item.direction === 'horizontal') {
      let x = 0
      item.children.forEach((ch: any) => {
        ch.x = x
        ch.y = 0
        x += ch.w
      })
      let leftover = item.w - x
      if(leftover > 0) {
        if (item.justify === 'start') {
          //move nothing
        }
        if (item.justify === 'center') {
          //shift all by half the leftover amount
          item.children.forEach((ch:any) => ch.x += leftover/2)
        }
        if (item.justify === 'end') {
          //shift all to the end by leftover amount
          item.children.forEach((ch:any) => ch.x += leftover)
        }
      }
    }
  }
}
