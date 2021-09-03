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
import React from "react";
import { RectDocApp } from "./App";
import { ObjectDelegate, PropType } from "./propsheet2";
import "./css/components.css";
import { ColorValueRenderer, ImageIcon, Rect } from "./components";
import { GEOM_GROUP, ObjectPowerup, STYLE_GROUP } from "./powerups";

export const SHAPE_TYPES = {
  SQUARE:"square",
  TEXTBOX:"textbox",
  CIRCLE:'circle',
  GROUP:'group',
  ROOT: "root"
}

export const ID_DEF:PropDef = {
  type: PROP_TYPES.STRING,
  name:'ID',
  locked:true,
  key: "id",
}
export const TITLE_DEF:PropDef = {
  type:PROP_TYPES.STRING,
  name:'Title',
  locked:false,
  key:'title',
  default:''
}

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

const RootDef:PropCluster = new Map<string, PropGroup>()
RootDef.set("base",[
  ID_DEF,
  TITLE_DEF,
])

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
BoundsDef.set("geom",GEOM_GROUP)


let TYPE_MAP = new Map<string,Map<string,PropGroup>>()
TYPE_MAP.set(SHAPE_TYPES.SQUARE,SquareDef)
TYPE_MAP.set(SHAPE_TYPES.ROOT,RootDef)
TYPE_MAP.set('bounds',BoundsDef)

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
    if(TYPE_MAP.has(this.item.type)) this.def = TYPE_MAP.get(this.item.type) as Map<string,PropGroup>

    this.propmap = new Map<string,PropDef>()
    this._propkeys = new Array<string>()
    this.def.forEach(group => {
      group.forEach(def => {
        this.propmap.set(def.key,def)
        this._propkeys.push(def.key)
      })
    })
  }

  propkeys(item:TreeItem): string[] {
    return this._propkeys
  }
  isPropLinked(item:TreeItem, key:string): boolean {
    if(this.item['_links'] && this.item['_links'][key]) return true
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

  getDelegateForObjectProperty(item:TreeItem, name: string): ObjectDelegate {
    let def = this.propmap.get(name)
    if(def && def.type === PROP_TYPES.OBJECT) {
      return new RDEObjectDelegate(this.ed,this.getPropValue(item,name))
    } else {
      // @ts-ignore
      return null
    }
  }

  getPropGroups(item:TreeItem): string[] {
    return Array.from(this.def.keys())
  }

  getPropsForGroup(item:TreeItem, name: string): string[] {
    // @ts-ignore
    return Array.from(this.def.get(name).map(df => df.key))
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

  getDelegateForObjectProperty(item:TreeItem, name: string): ObjectDelegate {
    // @ts-ignore
    return null
  }

  getPropGroups(item:TreeItem): string[] {
    return [];
  }

  getPropsForGroup(item:TreeItem, name: string): string[] {
    return [];
  }
}

export class RectDocEditor extends TreeItemProvider {
  private powerups: ObjectPowerup[];
  private powerupsByType: Map<string,ObjectPowerup>;
  constructor(options:any) {
    super(options)
    this.powerups = [];
    this.powerupsByType = new Map<string, ObjectPowerup>()
    this.root = this.makeEmptyRoot(null)
    // this.addPowerup(TextboxPowerup)
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
    const root = {id:'root',type:SHAPE_TYPES.ROOT,children:[], title:"foo"} as TreeItem
    const square1 = makeFromDef(SquareDef,{id:'sq1',w:50, title:'master'})
    root.children.push(square1)
    const square2 = makeFromDef(SquareDef,{id:'sq2',x:150,y:20,w:30,h:30,color:'red',title:'bar'})
    root.children.push(square2)
    const square3 = makeFromDef(SquareDef,{id:'sq3',x:30,y:220,w:30,h:30,color:'green', title:'source square'})
    root.children.push(square3)
    const child_square = makeFromDef(SquareDef,{id:'sq4',x:50,y:50,w:20,h:100, color:'teal',title:"linked color"})
    child_square['_links'] = {
      color:square3.id,
    }
    root.children.push(child_square)
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

  getObjectValue(ch: TreeItem, name: string):object {
    let links = ch['_links']
    if(links && links[name]) {
      let master = this.root.children.find(c => c.id === links[name])
      if(master) { // @ts-ignore
        return master[name] as object
      }
    }
    return ch[name]
  }

  getStringValue(ch: any, name: string):string {
    let links = ch['_links']
    if(links && links[name]) {
      let master = this.root.children.find(c => c.id === links[name])
      if(master) { // @ts-ignore
        return master[name] as string
      }
    }
    return ch[name]
  }


  getBoundsValue(ch: any):Rect {
    if(this.hasPowerup(ch.type)) {
      return this.getPowerup(ch.type).getBounds(ch,this)
    }
    return new Rect(
      this.getNumberValue(ch,'x'),
      this.getNumberValue(ch,'y'),
      this.getNumberValue(ch,'w'),
      this.getNumberValue(ch,'h'),
    )
  }

  calc_node_array_bounds(nodes:any[]):Rect {
    let bounds = new Rect(0,0,0,0)
    bounds.x = 10000
    bounds.y = 10000
    bounds.x2 = -1000
    bounds.y2 = -1000
    nodes.forEach((child:any) => {
      let ch:Rect = this.getBoundsValue(child)
      if(ch.x < bounds.x) bounds.x = ch.x
      if(ch.x2 > bounds.x2) bounds.x2 = ch.x2
      if(ch.y < bounds.y) bounds.y = ch.y
      if(ch.y2 > bounds.y2) bounds.y2 = ch.y2
    })
    return bounds
  }

  calc_group_bounds_value(group: any):Rect {
    let bounds = new Rect(0,0,0,0).makeEmpty()
    group.children.forEach((child:any) => {
      bounds.union_self(this.getBoundsValue(child))
    })
    bounds = bounds.translate(new Point(group.x,group.y))
    return bounds
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
      if (item.type === SHAPE_TYPES.ROOT) return RootDef
      if (item.type === SHAPE_TYPES.SQUARE) return SquareDef
    }
    return new Map()
  }

  canAddChild(item:TreeItem) {
    console.log("target is",item.type)
    if(item.type === SHAPE_TYPES.ROOT) return true
    return false
  }
  canBeSibling(item:TreeItem,target:TreeItem) {
    if(target.type === SHAPE_TYPES.SQUARE && item.type === SHAPE_TYPES.SQUARE) return true
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
    let icon = <ImageIcon icon={"circle"}/>
    if(this.hasPowerup(item.type)) icon = <ImageIcon icon={this.getPowerup(item.type).treeIcon()}/>
    if (item.type === SHAPE_TYPES.SQUARE)  icon = <ImageIcon icon={"square"} />
    if (item.type === SHAPE_TYPES.ROOT)  icon = <ImageIcon icon={"root"}/>
    let title = (item as any).title
    return <div className={'hbox'}> {icon} <label style={{padding:'0 0.25rem'}}>{title}</label></div>
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
    if(item === this.root || item.type === SHAPE_TYPES.GROUP) {
      this.powerups.forEach(pow => {
        cmds.push({ title:'add ' + pow.type(),
          fun:() => this.appendChild(item,pow.makeObject())})
      })
      cmds.push({ title:'add square', fun:() =>  this.add_square(item)})
    }
    // cmds.push({divider: true})
    return cmds
  }


  add_square(parent:any) {
    this.appendChild(parent, makeFromDef(SquareDef,{id:genID('square_'),w:50,h:50, title:'unnamed square'}))
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


  calculateCanvasContextMenu(nodes:any[], selMan:SelectionManager):any[] {
    let menu = []
    menu.push({
      title: 'delete',
      icon: 'delete',
      fun: () => {
        nodes.forEach(item => this.deleteChild(item))
        selMan.clearSelection()
      }
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


  addPowerup(powerup:ObjectPowerup) {
    this.powerups.push(powerup)
    this.powerupsByType.set(powerup.type(),powerup)
    TYPE_MAP.set(powerup.type(),powerup.def())
  }
  hasPowerup(type:string):boolean {
    return this.powerupsByType.has(type)
  }
  getPowerup(type:string):ObjectPowerup {
    // @ts-ignore
    return this.powerupsByType.get(type)
  }
}

