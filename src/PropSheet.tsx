import React, { Component, useState, useContext, useEffect } from "react";
// @ts-ignore
import {HBox, PopupManager, PopupManagerContext, VBox} from 'appy-comps'

import { SELECTION_MANAGER, SelectionManagerContext } from "./SelectionManager";
// @ts-ignore
import HSLUVColorPicker from "./HSLUVColorPicker";
import { TreeItemProvider, TREE_ITEM_PROVIDER, TreeItem } from "./TreeItemProvider";

import "./css/propsheet.css"

export const TYPES = {
  STRING:'string',
  NUMBER:'number',
  BOOLEAN:'boolean',
  ENUM:'enum',
  COLOR:'color',
  GROUP:'group',
}

/*
PropDef describes a single property
PropGroup is a list of prop defs
PropCluster is a set of PropGroups
 */
type NumberHints = {
  incrementValue:number,
  min?:number,
  max?:number,
}
type NoHints = {}
export type PropDef = {
  key:string,
  name:string,
  type:string,
  renderer?:any,
  default?:any,
  live?:boolean,
  locked?:boolean,
  hints?:NumberHints|NoHints,
  values?:any[],
}
export type PropGroup = PropDef[]
export type PropCluster = Map<string,PropGroup>

export function makeFromDef(cd:PropCluster, override:any):TreeItem {
  const obj = {}
  Array.from(cd.values()).forEach((grp)=>{
    grp.forEach(def => {
      if(override.hasOwnProperty(def.key)) {
        obj[def.key] = override[def.key]
      } else {
        obj[def.key] = def.default
      }
    })
  })
  return obj as TreeItem
}

// @ts-ignore
class ClusterDelegate {
  // private propsArray: PropDef[];
  private readonly propsMap: Map<string,PropDef>;
  private readonly propKeys: any[];
  private readonly provider: TreeItemProvider;
  private readonly renderers: Map<string,any>;
  constructor(provider:TreeItemProvider, cluster:PropCluster) {
    // this.propsArray = []
    this.propsMap = new Map<string, PropDef>()
    this.propKeys = []
    this.provider = provider
    this.renderers = new Map<string, any>()
    Array.from(cluster.values()).forEach((group:PropGroup) => {
      group.forEach(def => {
        this.propsMap[def.key] = def
        this.propKeys.push(def.key)
      })
    })
  }
  getPropertyKeys(item:TreeItem):string[] {
    return this.propKeys
  }
  getPropertyValue(item:TreeItem,key:string):any {
    return item[key]
  }
  getPropertyDefaultValue(key:string) {
    return this.propsMap[key].default
  }
  getPropertyType(item:TreeItem,key:string) {
    return this.propsMap[key].type
  }
  isPropertyLocked(item:TreeItem,key:string) {
    return this.propsMap[key].locked
  }
  // @ts-ignore
  isPropertyLive(item:object,key:string) {
    return this.propsMap[key].live
  }
  // @ts-ignore
  getPropertyEnumValues(item:TreeItem,key:string):any[] {
    return this.propsMap[key].values
  }
  // @ts-ignore
  getRendererForEnumProperty(item,key:string,value) {
    return this.propsMap[key].renderer
  }
  // @ts-ignore
  setPropertyValue(item:TreeItem,key:string,value):void {
    console.log("setting value to",value)
    const oldValue = item[key]
    item[key] = value
    this.provider.fire(TREE_ITEM_PROVIDER.PROPERTY_CHANGED,{
      provider: this.provider,
      child:item,
      propKey:key,
      oldValue:oldValue,
      newValue:value
    })
  }
  hasHints(item,key:string) {
    if(this.propsMap[key].hints) return true
    return false
  }
  getHints(item,key:string) {
    return this.propsMap[key].hints
  }
}

// @ts-ignore
const StandardEnumRenderer = (props:{object:TreeItem, key:string, value:any}) => {
  return <span>{props.value}</span>
}
// type PropEditorProps = {
//   cluster:PropGroup,
//   item:TreeItem,
//   propKey:string,
//   provider:TreeItemProvider,
// }
function PropEditor(props:{provider:TreeItemProvider, item:TreeItem, def:PropDef}) {
  let key = props.def.key
  let def = props.def
  let item = props.item
  if(props.def.locked) return <i>{props.item[key]}</i>
  if(props.def.type === TYPES.BOOLEAN) return <BooleanEditor1 def={props.def} obj={props.item} provider={props.provider}/>
  if(props.def.type === TYPES.NUMBER) return <NumberEditor1 def={def} obj={item} provider={props.provider}/>
  if(props.def.type === TYPES.STRING) return <StringEditor1 provider={props.provider} obj={item} def={def}/>
  if(props.def.type === TYPES.ENUM)   return <EnumEditor1 provider={props.provider} item={item} def={def}/>
  return <b>{def.type}:{getItemValue(def,item)}</b>
}

function getItemValue(def: PropDef, obj: TreeItem) {
  return obj[def.key]
}
function getRendererForEnumProperty(def: PropDef, obj: TreeItem) {
  return def.renderer
}

function setItemValue(provider: TreeItemProvider, def: PropDef, obj: TreeItem, value: any) {
  const oldValue = obj[def.key]
  obj[def.key] = value
  provider.fire(TREE_ITEM_PROVIDER.PROPERTY_CHANGED,{
    provider: provider,
    child:obj,
    propKey:def.key,
    oldValue:oldValue,
    newValue:value
  })
}

function getPropertyEnumValues(def: PropDef, item: TreeItem) {
  return def.values
}


function isPropertyLive(def: PropDef, obj: TreeItem) {
  return def.live
}



const NumberEditor1 = (props:{def:PropDef,obj:TreeItem, provider:TreeItemProvider}) => {
  let {def, obj} = props
  const [value,setValue] = useState(obj[def.key])
  let step = 1
  if(def.hints) {
    const hints = def.hints as NumberHints
    if('incrementValue' in hints) step = hints.incrementValue
  }
  function setObjectValue(v:any, offset=0) {
    if(!isNaN(parseFloat(v))) {
      v = parseFloat(v)
      v += offset
      if(def.hints) {
        const hints = def.hints as NumberHints
        if('min' in hints) { // @ts-ignore
          v = Math.max(v,hints.min)
        }
        if('max' in hints) { // @ts-ignore
          v = Math.min(v,hints.max)
        }
      }
      setValue(v)
      setItemValue(props.provider,def,obj,v)
    }
  }
  return <input type='number' value={value} step={step}
  onChange={(e)=> {
    setValue(e.target.value)
    if(isPropertyLive(def,obj)) setObjectValue(e.target.value)
  }}
  // onKeyDown={(e:KeyboardEvent)=>{
  //   if(e.key === 'ArrowUp' && e.shiftKey) {
  //     e.preventDefault()
  //     setObjectValue(e.target?.value,+10*step)
  //   }
  //   if(e.key === 'ArrowDown' && e.shiftKey) {
  //     e.preventDefault()
  //     setObjectValue(e.target?.value,-10*step)
  //   }
  // }}
  // onKeyPress={(e:KeyboardEvent)=>{
  //   if(e.charCode === 13) setObjectValue(e.target?.value)
  // }}
  onBlur={(e) => setObjectValue(e.target.value)}
  />
}

const BooleanEditor1 = (props:{def:PropDef, obj:TreeItem, provider:TreeItemProvider}) => {
  let {def, obj, provider} = props
  const [value,setValue] = useState(obj[def.key])
  return <input type='checkbox' checked={value}
  onChange={(e)=>{
    setValue(e.target.checked)
    setItemValue(provider,def,obj,e.target.checked)
  }}/>
}

const StringEditor1 = (props:{
  provider:TreeItemProvider,
  obj:TreeItem,
  def:PropDef,
  })=>{
  let {obj,provider, def} = props
  const pv = getItemValue(def,obj)
  const [value,setValue] = useState(pv)
  return <input type='string'
                value={value}
                onChange={(e)=>{
                  setValue(e.target.value)
                  if(isPropertyLive(def,obj)) {
                    setItemValue(provider,def,obj, e.target.value)
                  }
                }}
                onKeyPress={(e)=>{
                  if(e.charCode === 13) {
                    setItemValue(provider,def,obj, value)
                  }
                }}
                onBlur={()=> setItemValue(provider,def,obj, value)}
  />
}


const EnumEditor1 = (props:{def:PropDef,item:TreeItem,provider:TreeItemProvider}) => {
  let {def, item,provider} = props
  const [value,setValue] = useState(getItemValue(def,item))
  const PM = useContext(PopupManagerContext) as any
  let EnumItemRenderer = getRendererForEnumProperty(def,item)
  if(!EnumItemRenderer) EnumItemRenderer = StandardEnumRenderer

  let selectedRenderedValue = <EnumItemRenderer object={item} name={name} value={value}/>

  function open(e:MouseEvent) {
    console.log("opening picker")
    PM.show(<EnumPicker
      item={item}
      def={def}
      Renderer={EnumItemRenderer}
      onSelect={(val:any)=>{
        setValue(val)
        PM.hide()
        setItemValue(provider,def,item,val)
      }}
    />, e.target)
  }
  // @ts-ignore
  return <button onClick={open}>{selectedRenderedValue}</button>
}


function EnumPicker (props:{def:PropDef,item:TreeItem, onSelect:any, Renderer:any}) {
  const {item, def, onSelect, Renderer} = props
  const values = getPropertyEnumValues(def,item)
  const items = values?.map(val=>
    <HBox
      key={val}
  onClick={(e)=>onSelect(val)}>
  {/*<b>{val}</b>*/}
  <Renderer object={item} name={name} value={val}/>
  </HBox>
)
  return <VBox className="popup-menu">{items}</VBox>
}

export function PropSheet(props:{provider:TreeItemProvider}) {
  let selMan = useContext(SelectionManagerContext)
  const item = selMan.getSelection()
  const prov = props.provider
  let cluster = prov.getPropertyClusters(item)
  const [selection, setSelection] = useState(selMan.getSelection())
  useEffect(() => {
    let hand = (s) => {
      setSelection(selMan.getSelection())
    }
    selMan.on(SELECTION_MANAGER.CHANGED, hand)
    return () => {
      selMan.off(SELECTION_MANAGER.CHANGED,hand)
    }
  })

  console.log("rendering prop sheet with item",item,cluster)

  return <div className="prop-wrapper">{Array.from(cluster.entries()).map(([key,pg]) => {
      return <PropSection key={key} title={key} cluster={pg} prov={prov} item={item}/>
    })}</div>


// export class PropSheet extends Component<PropSheetProps,PropSheetState> {
//   private h2: () => void;
//   private hand: (s) => void;
//   constructor(props) {
//     super(props)
//     this.state = {
//       selection:null
//     }
//   }
//   componentDidMount() {
    // this.h2 = () => this.setState({selection:selMan.getSelection()})
    // this.props.provider.on(TREE_ITEM_PROVIDER.PROPERTY_CHANGED,this.h2)
    // this.hand = (s) => this.setState({selection:selMan.getSelection()})
    // selMan.on(SELECTION_MANAGER.CHANGED, this.hand)
  // }
  // componentWillUnmount() {
    // selMan.off(SELECTION_MANAGER.CHANGED, this.hand);
    // this.props.provider.off(TREE_ITEM_PROVIDER.PROPERTY_CHANGED,this.h2)
  // }
  // render() {
    // const item = selMan.getSelection()
    // const prov = this.props.provider
    // let clusters = prov.getPropertyClusters(item)
    // return <div className="prop-wrapper">{Object.keys(clusters).map(key => {
    //     return <PropSection key={key} title={key} cluster={clusters[key]} prov={prov} item={item}/>
    //   })}</div>
    // return <div>prop sheet stuff here</div>
  // }
  // renderIndeterminate(prop) {
  //   if(prop.isIndeterminate()) {
  //     return <i key={prop.getKey()+'-indeterminate'} className="icon fa fa-exclamation-circle"/>
  //   } else {
  //     return ""
  //   }
  // }
  /*
  calculateProps() {
    const items = selMan.getFullSelection()
    const first = items[0]
    const prov = this.props.provider
    let props = prov.getProperties(first)
    items.forEach((item)=>{
      props = calculateIntersection(props, prov.getProperties(item))
    })
    return props.map((prop)=>{
      const multi = new MultiPropProxy(prov, prop.key)
      items.forEach((item)=>{
        const p2 = prov.getProperties(item)
        const match = p2.find(def=>def.key === prop.key)
        multi.addSubProxy(new PropProxy(prov,item,match))
      })
      return multi
    });
  }
   */
  // calculateGroups(props) {
  //   const group_defs = props.filter(p => p.getType() === TYPES.GROUP)
  //   group_defs.forEach(def => {
  //     const group_keys = def.getGroupKeys()
  //     //remove any groups in the group keys of a group def
  //     props = props.filter(p => group_keys.indexOf(p.getKey())<0)
  //   })
  //   return props
  // }
}

function PropSection(props:{cluster:PropGroup, title:string, prov:TreeItemProvider, item:TreeItem}) {
  let {item, prov, cluster} = props
  return <div className={"prop-sheet"}>
    <header>{props.title}</header>
    {props.cluster.map(def => {
      return [
        <label key={def.key+'-label'}>{def.key}</label>,
        <PropEditor key={def.key+'-editor-'+item.id} provider={prov} item={item} def={def}/>
      ]
    })}
  </div>
}
//return items from A that are also in B
function calculateIntersection(A,B) {
  return  A.filter((pa)=> B.find((pb)=>pa.key===pb.key))
}


class MultiPropProxy {
  private provider: TreeItemProvider;
  private key: string;
  private subs: PropProxy[];
  constructor(provider:TreeItemProvider,key:string) {
    this.provider = provider
    this.key = key
    this.subs = []
  }
  addSubProxy(sub) {
    this.subs.push(sub)
  }
  first() {
    return this.subs[0]
  }
  getName()  { return this.first().getName()  }
  getValue() { return this.first().getValue() }
  isCustom() { return this.first().isCustom() }
  hasHints() { return this.first().hasHints() }
  getHints() { return this.first().getHints() }
  isLocked() { return this.first().isLocked() }
  getType()  { return this.first().getType()  }
  isType(s)  { return this.first().isType(s)  }
  isLive()   { return this.first().isLive()   }
  getKey()   { return this.key                }
  getGroupKeys() { return this.first().getGroupKeys() }
  setValue(v) {
    this.subs.forEach((s)=> s.setValue(v))
  }
  isIndeterminate() {
    let same = true
    let value = this.first().getValue()
    this.subs.forEach((s)=>{
      if(s.getValue() !== value) same = false
    })
    return !same;
  }
}


class PropProxy {
  private provider: TreeItemProvider;
  private item: TreeItem;
  private def: any;
  constructor(provider:TreeItemProvider, item:TreeItem, def:any) {
    this.provider = provider
    this.item = item
    this.def = def
  }
  getKey() {
    return this.def.key
  }
  getName() {
    return this.def.name
  }
  isCustom() {
    return this.def.custom
  }
  isLocked() {
    return this.def.locked
  }
  getType() {
    return this.def.type
  }
  getValue() {
    return this.def.value
  }
  isLive() {
    return this.def.live
  }
  isType(type) {
    return this.def.type === type
  }
  setValue(value) {
    return this.provider.setPropertyValue(this.item,this.def,value)
  }
  hasHints() {
    return this.def.hints
  }
  getHints() {
    return this.def.hints
  }
  getGroupKeys() {
    return this.def.group
  }
  isIndeterminate() { return false; }
}
