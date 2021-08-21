import {TreeItemProvider, TreeItem, PropCluster, PropDef, PropGroup, PROP_TYPES, makeFromDef, TREE_ITEM_PROVIDER, genID } from "vized";
import React from 'react'
import {RectDocApp} from './App'
import { ObjectDelegate, PropType } from "./propsheet2";
import "./css/components.css"
import { Rect } from "./canvas";

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
SquareDef.set("style",[
  {
    key:"color",
    name:'color',
    type:PROP_TYPES.ENUM,
    live:false,
    default: 'blue',
    values:['red','green','blue','yellow'],
    renderer: ColorValueRenderer,
  }
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
  constructor(p: RectDocEditor,item:TreeItem) {
    this.ed = p
    this.item = item
  }

  propkeys(): string[] {
    if(this.item.type === 'root') {
      return ['id','title','type']
    }
    if(this.item.type === 'square') {
      return ['id','title','type','x','y','w','h','color']
    }
    return ['id'];
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
    if(key === 'x') return 'number'
    if(key === 'y') return 'number'
    if(key === 'w') return 'number'
    if(key === 'h') return 'number'
    if(key === 'color') return 'enum'
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
    let targets = this.ed.getSceneRoot().children.filter(ch => ch.id !== item.id)
    return targets
  }

  getRendererForEnumProperty(item:TreeItem, name: string): any {
    return ColorValueRenderer
  }

  getPropertyEnumValues(item:TreeItem, name: string): any[] {
    // @ts-ignore
    return SquareDef.get('style')[0].values as any[]
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
    const square3 = makeFromDef(SquareDef,{id:'sq3',x:30,y:220,w:30,h:30,color:'green'})
    root.children.push(square3)
    const child_square = makeFromDef(SquareDef,{id:'sq4',x:50,y:50,w:20,h:100, color:'teal'})
    child_square['_links'] = {
      color:square3.id,
    }
    console.log(child_square)
    root.children.push(child_square)
    return root
  }
  getColorValue(ch: any) {
    let links = ch['_links']
    if(links && links.color) {
      let master = this.root.children.find(c => c.id === links.color)
      if(master) { // @ts-ignore
        return master.color
      }
    }
    return ch.color
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
    // @ts-ignore
    return <label>{item.type} {item.id}:{item.title}</label>
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
      ch.x = 10
    })
    this.fire(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED,this.getSceneRoot())
  }
}

