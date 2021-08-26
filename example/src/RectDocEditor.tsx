import {
  genID,
  makeFromDef,
  PROP_TYPES,
  PropCluster,
  PropDef,
  PropGroup,
  TREE_ITEM_PROVIDER,
  TreeItem,
  TreeItemProvider,
  Point,
} from "vized";
import React from "react";
import { RectDocApp } from "./App";
import { ObjectDelegate, PropType } from "./propsheet2";
import "./css/components.css";
import { Rect } from "./canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquare } from "@fortawesome/free-solid-svg-icons/faSquare";
import { faCircle } from "@fortawesome/free-solid-svg-icons/faCircle";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons/faLayerGroup";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons/faCircleNotch";


const ColorValueRenderer = (props:{object:any, key:string, value:any}) => {
  return <div className={'color-value'} style={{
    backgroundColor:props.value,
  }}><b className={'text'}>{props.value}</b></div>
}

const ID_DEF:PropDef = {
  type: PROP_TYPES.STRING,
  name:'ID',
  locked:true,
  key: "id",
}
const TITLE_DEF:PropDef = {
  type:PROP_TYPES.STRING,
  name:'Title',
  locked:false,
  key:'title',
  default:''
}

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

const STYLE_GROUP:PropGroup = [
    {
      key:"color",
      name:'color',
      type:PROP_TYPES.ENUM,
      live:false,
      default: 'white',
      values:['white','red','green','blue','yellow','black'],
      renderer: ColorValueRenderer,
    },
    {
      key:"borderColor",
      name:"border color",
      type:PROP_TYPES.ENUM,
      live:false,
      default: 'black',
      values:['white','red','green','blue','yellow','black'],
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
SquareDef.set("style",STYLE_GROUP)

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

export const GroupDef:PropCluster = new Map<string, PropGroup>()
GroupDef.set("base",[
  ID_DEF,
  TITLE_DEF,
  {
    type: PROP_TYPES.STRING,
    name: 'type',
    locked: true,
    key: 'type',
    default:'group',
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

const RootDef:PropCluster = new Map<string, PropGroup>()
RootDef.set("base",[
  ID_DEF,
  TITLE_DEF,
])


class RDEObjectDelegate implements ObjectDelegate {
  // @ts-ignore
  private ed: RectDocEditor;
  private item: TreeItem;
  private def: Map<string,PropGroup>;
  // @ts-ignore
  private propmap: Map<string, PropDef>;
  private _propkeys: string[];
  constructor(p: RectDocEditor,item:TreeItem) {
    this.ed = p
    this.item = item

    this.def = RootDef
    if (this.item.type === 'square') this.def = SquareDef
    if (this.item.type === 'circle') this.def = CircleDef
    if (this.item.type === 'group') this.def = GroupDef

    this.propmap = new Map<string,PropDef>()
    this._propkeys = new Array<string>()
    this.def.forEach(group => {
      group.forEach(def => {
        this.propmap.set(def.key,def)
        this._propkeys.push(def.key)
      })
    })
  }

  propkeys(): string[] {
    return this._propkeys
  }
  isPropLinked(item:TreeItem, key:string): boolean {
    if(this.item['_links']) {
      if(this.item['_links'][key]) {
        // console.log("linked from",this.item['_links'][key])
        return true
      }
    }
    return false;
  }
  isPropEditable(item:TreeItem, name: string): boolean {
    if(name === 'type') return false
    if(name === 'id') return false
    return true;
  }
  getPropType(item:TreeItem, key: string): PropType {
    let def = this.propmap.get(key)
    if(def) return def.type as PropType
    return 'string'
  }
  getPropValue(item:TreeItem, name: string): any {
    return item[name]
  }
  setPropValue(item:TreeItem, name: string, value: any): void {
    item[name] = value
    this.ed.fire(TREE_ITEM_PROVIDER.PROPERTY_CHANGED,item)
  }
  valueToString(item:TreeItem, name: string): string {
    if(item[name]) return item[name].toString()
    return "???";
  }
  getLinkedValueToString(item:TreeItem, name: string): string {
    let links = this.item['_links']
    if(links && links[name]) {
      let master = this.ed.getSceneRoot().children.find(ch => ch.id === links[name])
      if(master) return this.valueToString(master,name)
    }
    return "???";
  }
  removePropLink(item:TreeItem, name: string): void {
    let links = item['_links']
    if(links && links[name]) {
      links[name] = undefined
      this.ed.fire(TREE_ITEM_PROVIDER.PROPERTY_CHANGED,item)
    }
  }
  setPropLinkTarget(item:TreeItem, name:string, target:TreeItem):void {
    if(!item['_links']) item['_links'] = {}
    let links = item['_links']
    links[name] = target.id
    this.ed.fire(TREE_ITEM_PROVIDER.PROPERTY_CHANGED,item)
  }
  getPossibleLinkTargets(item:TreeItem, name: string): TreeItem[] {
    return this.ed.getSceneRoot().children.filter(ch => ch.id !== item.id)
  }
  getRendererForEnumProperty(item:TreeItem, name: string): any {
    return ColorValueRenderer
  }
  getPropertyEnumValues(item:TreeItem, name: string): any[] {
    // @ts-ignore
    return this.propmap.get(name).values
  }
  getPropLinkTargetTitle(target:TreeItem): string {
    //@ts-ignore
    return target.id + " : " + target.title
  }
}

class NullObjectDelegate implements ObjectDelegate {
  propkeys(): string[] {
    return [];
  }

  isPropLinked(item:TreeItem, key: string): boolean {
    return false;
  }

  getPropType(item:TreeItem, key: string): PropType {
    return 'string'
  }

  getPropValue(item:TreeItem, name: string): any {
  }

  setPropValue(item:TreeItem, name: string, value: any): void {
  }

  isPropEditable(item:TreeItem, name: string): boolean {
    return false;
  }

  valueToString(item:TreeItem, name: string): string {
    return "";
  }

  getRendererForEnumProperty(item:TreeItem, name: string): any {
    return ColorValueRenderer
  }

  getPropertyEnumValues(item:TreeItem, name: string): any[] {
    return [];
  }

  getLinkedValueToString(item:TreeItem, name: string): string {
    return "";
  }

  removePropLink(item:TreeItem, name: string): void {
  }

  getPossibleLinkTargets(item:TreeItem, name: string): TreeItem[] {
    return [];
  }

  setPropLinkTarget(item:TreeItem, name: string, target:TreeItem): void {
  }

  getPropLinkTargetTitle(id:TreeItem): string {
    return "";
  }
}

export class RectDocEditor extends TreeItemProvider {
  constructor(options:any) {
    super(options)
    this.root = this.makeEmptyRoot(null)
  }

  appendChild(parent:TreeItem, child:TreeItem) {
    parent.children.push(child)
    this.fire(TREE_ITEM_PROVIDER.STRUCTURE_ADDED, child)
  }
  deleteChild(child:TreeItem):void {
    this.root.children = this.root.children.filter(n => n !== child)
    this.fire(TREE_ITEM_PROVIDER.STRUCTURE_REMOVED, child)
  }
  // @ts-ignore
  makeEmptyRoot(doc:any):TreeItem {
    const root = {id:'root',type:'root',children:[], title:"foo"} as TreeItem
    const square1 = makeFromDef(SquareDef,{id:'sq1',w:50, title:'master'})
    root.children.push(square1)
    const square2 = makeFromDef(SquareDef,{id:'sq2',x:150,y:20,w:30,h:30,color:'red',title:'bar'})
    root.children.push(square2)
    const square3 = makeFromDef(SquareDef,{id:'sq3',x:30,y:220,w:30,h:30,color:'green', title:'green'})
    root.children.push(square3)
    const child_square = makeFromDef(SquareDef,{id:'sq4',x:50,y:50,w:20,h:100, color:'teal',title:"teal"})
    child_square['_links'] = {
      color:square3.id,
    }
    root.children.push(child_square)

    const child_circle1 = makeFromDef(CircleDef,{id:'cir1',x:200,y:200,radius:20, color:'teal', title:'circle'})
    root.children.push(child_circle1)

    const group1 = makeFromDef(GroupDef, {id:'grp1', title:"group 1"})
    group1.children = []
    root.children.push(group1)
    const square4 = makeFromDef(SquareDef, {id:'sq5', x:100,y:100,w:20,h:20, color:'blue',title:'child square'})
    group1.children.push(square4)

    return root
  }
  getColorValue(ch: any, name:string) {
    let links = ch['_links']
    if(links && links[name]) {
      let master = this.root.children.find(c => c.id === links[name])
      if(master) { // @ts-ignore
        return master[name]
      }
    }
    return ch[name]
  }

  getNumberValue(ch: TreeItem, name: string):number {
    let links = ch['_links']
    if(links && links[name]) {
      let master = this.root.children.find(c => c.id === links[name])
      if(master) { // @ts-ignore
        return master[name] as number
      }
    }
    return ch[name]
  }

  getBoundsValue(ch: any):Rect {
    return new Rect(
      this.getNumberValue(ch,'x'),
      this.getNumberValue(ch,'y'),
      this.getNumberValue(ch,'w'),
      this.getNumberValue(ch,'h'),
    )
  }

  getSceneRoot():TreeItem {
    return this.root
  }
  getObjectDelegate(item:TreeItem):ObjectDelegate {
    if(!item) return new NullObjectDelegate()
    return new RDEObjectDelegate(this,item)
  }
  // @ts-ignore
  getPropertyClusters(item:TreeItem):PropCluster {
    if (item) {
      if (item.type === 'root') return RootDef
      if (item.type === 'square') return SquareDef
      if (item.type === 'group') return GroupDef
      if (item.type === 'circle') return CircleDef
    }
    return new Map()
  }

  canAddChild(item:TreeItem) {
    console.log("target is",item.type)
    if(item.type === 'root') return true
    return false
  }
  canBeSibling(item:TreeItem,target:TreeItem) {
    if(target.type === 'square' && item.type === 'square') return true
    return false
  }
  moveChildAfterSibling(src:TreeItem,dst:TreeItem) {
    const nold = this.root.children.indexOf(src)
    this.root.children.splice(nold,1)

    const nnew = this.root.children.indexOf(dst)
    this.root.children.splice(nnew+1,0,src)
  }
  // @ts-ignore
  moveChildToNewParent(src:TreeItem,dst:TreeItem) {
    const nold = this.root.children.indexOf(src)
    this.root.children.splice(nold,1)
    this.root.children.push(src)
  }


  getRendererForItem(item:TreeItem) {
    let icon = <FontAwesomeIcon icon={faCircleNotch}/>
    if (item.type === 'square')  icon = <FontAwesomeIcon icon={faSquare} />
    if (item.type === 'group')  icon = <FontAwesomeIcon icon={faLayerGroup}/>
    if (item.type === 'circle')  icon = <FontAwesomeIcon icon={faCircle}/>
    let title = (item as any).title
    return <label> {icon} {title}</label>
  }

  getDocType() {
    return "rect-doc-editor"
  }


  getApp() {
    return <RectDocApp provider={this}/>
  }

  // @ts-ignore
  calculateContextMenu(item:TreeItem) {
    const cmds = []
    if(item !== this.root) {
      cmds.push({
        title: 'delete',
        icon: 'delete',
        fun: () => this.deleteChild(item)
      })
    }
    if(item === this.root) {
      cmds.push({ title:'add square', fun:() =>  this.add_square()})
    }
    // cmds.push({divider: true})
    return cmds
  }


  add_square() {
    this.appendChild(this.root, makeFromDef(SquareDef,{id:genID('square_'),w:50}))
  }

  do_layout() {
    this.getSceneRoot().children.forEach((ch:any) => {
      ch.x = Math.round(ch.x/32)*32
      ch.y = Math.round(ch.y/32)*32
    })
    this.fire(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED,this.getSceneRoot())
  }

  do_duplicate(item: TreeItem, move:boolean):TreeItem {
    let cln:any = {}
    Object.entries(item).forEach(([key,value])=>{
      cln[key] = value
      if(key === 'title') {
        cln[key] = value + ' copy'
      }
    })
    cln.id = genID("square_")
    if(move) {
      cln.x += 20
      cln.y += 20
    }
    this.getSceneRoot().children.push(cln as TreeItem)
    this.fire(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED,this.getSceneRoot())
    return cln
  }

  do_duplicate_linked(item: any, move:boolean):TreeItem {
    let cln:any = {
      _links:{}
    }
    Object.entries(item).forEach(([key,value])=>{
      cln[key] = value
      if(key === 'title') {
        cln[key] = value + ' copy'
      }
      if(key !== 'x' && key !== 'y' && key !== 'title') {
        cln._links[key] = item.id
      }
    })
    cln.id = genID("square_")
    if(move) {
      cln.x += 20
      cln.y += 20
    }
    this.getSceneRoot().children.push(cln as TreeItem)
    this.fire(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED,this.getSceneRoot())
    return cln
  }

  action_horizontal_align(nodes:any[]):void {
    let it = nodes[0]
    let center = new Point(it.x + it.w / 2, it.y)
    nodes.forEach(it => it.x = center.x - it.w / 2)
    this.fire(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, it)
  }
  action_vertical_align(nodes:any[]):void {
    let it = nodes[0]
    let center = new Point(it.x,it.y+it.h/2)
    nodes.forEach(it => it.y = center.y - it.h/2)
    this.fire(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, it)
  }


  calculateCanvasContextMenu(nodes:any[]):any[] {
    let menu = []
    menu.push({
      title: 'delete',
      icon: 'delete',
      fun: () => nodes.forEach(item => this.deleteChild(item))
    })
    menu.push({
      title:`duplicate`,
      fun: () => nodes.forEach(item => this.do_duplicate(item,true))
    })
    menu.push({
      title:`duplicate linked`,
      fun: () => nodes.forEach(item => this.do_duplicate_linked(item,true))
    })
    if(nodes.length >=  2) {
      menu.push({
        title:'horizontal align',
        fun:() => this.action_horizontal_align(nodes)
      })
      menu.push({
        title:'vertical align',
        fun:() => this.action_vertical_align(nodes)
      })
    }
    return menu
  }

  deleteChildren(nodes: any[]):void {
    let childs = this.root.children.slice()
    nodes.forEach(nd => {
      childs = childs.filter(n => n.id !== nd.id)
    })
    this.root.children = childs
    this.fire(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, this.root)
  }
}

