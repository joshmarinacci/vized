import {TreeItemProvider, TreeItem, ClusterDelegate } from "vized";
import React from 'react'
import {RectDocApp} from './App'
import { PROP_TYPES } from "vized";

const ColorValueRenderer = (props:{object:any, key:string, value:any}) => {
  return <b style={{
    backgroundColor:props.value,
      border:'black',
      padding: '0.5em',
  }}>{props.value}</b>
}

function makeClusterDef(provider:TreeItemProvider,json:object) {
  const obj = {}
  Object.keys(json).map(clusterKey => {
    obj[clusterKey] = new ClusterDelegate(provider,clusterKey,json[clusterKey])
  })
  return obj
}

const GroupDef = {
  base: {
    id: {
      type: PROP_TYPES.STRING,
      name: 'ID',
      locked: true,
    },
    type: {
      type: PROP_TYPES.STRING,
      name:'type',
      locked:true,
      default:'group',
    },
    title: {
      type: PROP_TYPES.STRING,
      name:'title',
    }
  }
}

const SquareDef = {
  base: { //the base cluster
    id: {
      type: PROP_TYPES.STRING,
      name: 'ID',
      locked: true,
    },
    type: {
      type: PROP_TYPES.STRING,
      name:'type',
      locked:true,
      default:'square',
    }
  },
  geom:{
    x:{
      type:PROP_TYPES.NUMBER,
      default:0,
      live:true,
      hints: {
        incrementValue:1,
      }
    },
    y:{
      type:PROP_TYPES.NUMBER,
      default:0,
      live:true,
      hints: {
        incrementValue:1,
      }
    },
    w: {
      type: PROP_TYPES.NUMBER,
      default: 100,
      live:true,
      hints: {
        incrementValue:1,
        min:1,
      },
    },
    h: {
      type: PROP_TYPES.NUMBER,
      default: 100,
      live:true,
      hints: {
        incrementValue:1,
        min:1,
      }
    },
  },
  style: {
    color: {
      type: PROP_TYPES.ENUM,
      default: 'blue',
      live:false,
      values:['red','green','blue'],
      renderer: ColorValueRenderer,
    },
  }
}




// @ts-ignore
function makeFromDef(clusters, override):TreeItem {
  const obj = {}
  Object.keys(clusters).forEach(cKey => {
    const cluster = clusters[cKey]
    cluster.getPropertyKeys().forEach((key:string) => {
      console.log(key)
      if(key in override) {
        obj[key] = override[key]
      } else {
        obj[key] = cluster.getPropertyDefaultValue(key)
      }
    })
  })
  return obj as TreeItem
}

export class RectDocEditor extends TreeItemProvider {
  private squareClusters: {};
  private groupClusters: {};
  constructor(options:any) {
    super(options)
    this.squareClusters = makeClusterDef(this,SquareDef)
    this.groupClusters = makeClusterDef(this,GroupDef)
    this.root = this.makeEmptyRoot(null)
  }

  // @ts-ignore
  makeEmptyRoot(doc:any):TreeItem {
    const root = {id:'root',type:'root',children:[]} as TreeItem
    const square1 = makeFromDef(this.squareClusters,{id:'sq1',w:50})
    root.children.push(square1)
    const square2 = makeFromDef(this.squareClusters,{id:'sq2',x:150,y:20,w:30,h:30,color:'red'})
    root.children.push(square2)
    const square3 = makeFromDef(this.squareClusters,{id:'sq3',x:30,y:220,w:30,h:30,color:'green'})
    root.children.push(square3)
    const g1 = makeFromDef(this.groupClusters,{id:'g1'})
    root.children.push(g1)
    return root
  }

  getSceneRoot():TreeItem {
    return this.root
  }
  getPropertyClusters(item:any) {
    if(item) {
      if (item.type === 'square') return this.squareClusters
      if (item.type === 'group') return this.groupClusters
    }
    return {}
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

