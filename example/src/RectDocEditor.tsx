import {TreeItemProvider, TreeItem, PropCluster, PropDef, PropGroup, PROP_TYPES, makeFromDef } from "vized";
import React from 'react'
import {RectDocApp} from './App'

const ColorValueRenderer = (props:{object:any, key:string, value:any}) => {
  return <b style={{
    backgroundColor:props.value,
      border:'black',
      padding: '0.5em',
  }}>{props.value}</b>
}

const ID_DEF:PropDef = {
  type: PROP_TYPES.STRING,
  name:'ID',
  locked:true,
  key: "id",
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

let SquareDef:PropCluster = new Map<string, PropGroup>()
SquareDef.set("base",[
  ID_DEF,
  {
    type: PROP_TYPES.STRING,
    name: 'type',
    locked: true,
    key: 'type',
    default:'square',
  }
])
SquareDef.set("geom",GEOM_GROUP)
SquareDef.set("style",[
  {
    key:"color",
    name:'color',
    type:PROP_TYPES.ENUM,
    live:false,
    default: 'blue',
    values:['red','green','blue'],
    renderer: ColorValueRenderer,
  }
])

const RootDef:PropCluster = new Map<string, PropGroup>()
RootDef.set("base",[
  ID_DEF,
  {
   key:'title',
    name:'title',
    type:PROP_TYPES.STRING
  }
])


export class RectDocEditor extends TreeItemProvider {
  constructor(options:any) {
    super(options)
    this.root = this.makeEmptyRoot(null)
  }

  // @ts-ignore
  makeEmptyRoot(doc:any):TreeItem {
    const root = {id:'root',type:'root',children:[], title:"foo"} as TreeItem
    const square1 = makeFromDef(SquareDef,{id:'sq1',w:50})
    root.children.push(square1)
    const square2 = makeFromDef(SquareDef,{id:'sq2',x:150,y:20,w:30,h:30,color:'red'})
    root.children.push(square2)
    const square3 = makeFromDef(SquareDef,{id:'sq3',x:30,y:220,w:30,h:30,color:'green'})
    root.children.push(square3)
    return root
  }

  getSceneRoot():TreeItem {
    return this.root
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
    return <label>{item.type} {item.id}</label>
  }

  getApp() {
    return <RectDocApp provider={this}/>
  }

  // @ts-ignore
  calculateContextMenu(item:TreeItem) {
    const cmds = []
    cmds.push({
      title:'do thing',
      icon:"boo",
      fun:()=>console.log("doing a function")
    })
    cmds.push({divider: true})
    return cmds
  }
}

