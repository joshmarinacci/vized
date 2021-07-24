import React, {Component, useState, useContext} from 'react';
// @ts-ignore
import {HBox, PopupManager, PopupManagerContext, VBox} from 'appy-comps'

import selMan, {SELECTION_MANAGER} from "./SelectionManager";
// @ts-ignore
import HSLUVColorPicker from "./HSLUVColorPicker";
import { TreeItemProvider, TREE_ITEM_PROVIDER, TreeItem } from "./TreeItemProvider";

import "./propsheet.css"

export const TYPES = {
  STRING:'string',
  NUMBER:'number',
  BOOLEAN:'boolean',
  ENUM:'enum',
  COLOR:'color',
  GROUP:'group',
}

export class ClusterDelegate {
  private propsArray: any[];
  private propsMap: {};
  private propKeys: any[];
  private provider: TreeItemProvider;
  private renderers: {};
  // @ts-ignore
  constructor(provider:TreeItemProvider,key:string, json:object) {
    this.propsArray = []
    this.propsMap = {}
    this.propKeys = []
    this.provider = provider
    this.renderers = {}
    Object.keys(json).forEach(key => {
      const def = json[key]
      def.key = key
      this.propsArray.push(def)
      this.propsMap[def.key] = def
      this.propKeys.push(key)
      if(def.type === TYPES.ENUM) {
        this.renderers[def.key] = def.renderer
      }
    })
  }
  // @ts-ignore
  getPropertyKeys(item:object) {
    return this.propKeys
  }
  getPropertyValue(item:object,key:string) {
    return item[key]
  }
  getPropertyDefaultValue(key:string) {
    return this.propsMap[key].default
  }
  // @ts-ignore
  getPropertyType(item,key:string) {
    return this.propsMap[key].type
  }
  // @ts-ignore
  isPropertyLocked(item:object,key:string) {
    return this.propsMap[key].locked
  }
  // @ts-ignore
  isPropertyLive(item:object,key:string) {
    return this.propsMap[key].live
  }
  // @ts-ignore
  getPropertyEnumValues(item,key:string) {
    return this.propsMap[key].values
  }
  // @ts-ignore
  getRendererForEnumProperty(item,key:string,value) {
    return this.propsMap[key].renderer
  }
  // @ts-ignore
  setPropertyValue(item,key:string,value) {
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
  // @ts-ignore
  hasHints(item,key:string) {
    if(this.propsMap[key].hints) return true
    return false
  }
  // @ts-ignore
  getHints(item,key:string) {
    return this.propsMap[key].hints
  }
}

// @ts-ignore
const StandardEnumRenderer = (props:{object:object, key:string, value:any}) => {
  return <span>{props.value}</span>
}
type PropEditorProps = {
  cluster:any,
  item:object,
  propKey:string,
  provider:TreeItemProvider,
}
class PropEditor extends Component<PropEditorProps, {}> {
  render() {
    const c = this.props.cluster
    const it = this.props.item
    const key = this.props.propKey
    if(c.isPropertyLocked(it,key)) return <i>{c.getPropertyValue(it,key)}</i>
    if(c.getPropertyType(it,key) === TYPES.BOOLEAN) return <BooleanEditor1 cluster={c} obj={it} name={key}/>
    if(c.getPropertyType(it,key) === TYPES.NUMBER)  return <NumberEditor1  cluster={c} obj={it} name={key}/>
    if(c.getPropertyType(it,key) === TYPES.STRING)  return <StringEditor1  cluster={c} obj={it} name={key}/>
    if(c.getPropertyType(it,key) === TYPES.ENUM)    return <EnumEditor1    cluster={c} obj={it} name={key}/>
    return <b>{c.getPropertyType(it,key)}:{c.getPropertyValue(it,key)}</b>
  }
}

const NumberEditor1 = (props:{cluster:ClusterDelegate,obj:object,name:string}) => {
  let {cluster, obj, name} = {...props}
  const [value,setValue] = useState(cluster.getPropertyValue(obj,name))
  let step = 1
  if(cluster.hasHints(obj,name)) {
    const hints = cluster.getHints(obj,name)
    if('incrementValue' in hints) step = hints.incrementValue
  }
  function setObjectValue(v:any, offset=0) {
    if(!isNaN(parseFloat(v))) {
      v = parseFloat(v)
      v += offset
      if(cluster.hasHints(obj,name)) {
        const hints = cluster.getHints(obj, name)
        if('min' in hints) v = Math.max(v,hints.min)
        if('max' in hints) v = Math.min(v,hints.max)
      }
      setValue(v)
      cluster.setPropertyValue(obj, name, v)
    }
  }
  return <input type='number' value={value} step={step}
  onChange={(e)=> {
    setValue(e.target.value)
    if(cluster.isPropertyLive(obj,name)) setObjectValue(e.target.value)
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

const BooleanEditor1 = (props:{cluster:ClusterDelegate,obj:any,name:string}) => {
  let {cluster, obj, name} = props
  const [value,setValue] = useState(cluster.getPropertyValue(obj,name))
  return <input type='checkbox' checked={value}
  onChange={(e)=>{
    setValue(e.target.checked)
    cluster.setPropertyValue(obj,name,e.target.checked)
  }}/>

}

const StringEditor1 = (props:{cluster:ClusterDelegate,obj:any,name:string})=>{
  let {cluster, obj, name} = props
  const pv = cluster.getPropertyValue(obj,name)
  const [value,setValue] = useState(pv)
  return <input type='string'
  value={value}
  onChange={(e)=>{
    setValue(e.target.value)
    if(cluster.isPropertyLive(obj,name)) {
      cluster.setPropertyValue(obj, name, e.target.value)
    }
  }}
  onKeyPress={(e)=>{
    if(e.charCode === 13) {
      cluster.setPropertyValue(obj,name,value)
    }
  }}
  onBlur={()=>{
    cluster.setPropertyValue(obj,name,value)
  }}
  />
}

const EnumEditor1 = (props:{cluster:ClusterDelegate,obj:object,name:string}) => {
  let {cluster, obj, name} = props
  const [value,setValue] = useState(cluster.getPropertyValue(obj,name))
  const context = useContext(PopupManagerContext) as any
  let EnumItemRenderer = cluster.getRendererForEnumProperty(obj,name,value)
  if(!EnumItemRenderer) EnumItemRenderer = StandardEnumRenderer

  let selectedRenderedValue = <EnumItemRenderer object={obj} name={name} value={value}/>

  function open(e:MouseEvent) {
    context.show(<EnumPicker
      object={obj}
    cluster={cluster}
    name={name}
    Renderer={EnumItemRenderer}
    onSelect={(val:any)=>{
      setValue(val)
      context.hide()
      cluster.setPropertyValue(obj,name,val)
    }}
    />, e.target)
  }
  // @ts-ignore
  return <button onClick={open}>{selectedRenderedValue}</button>
}

const EnumPicker = ({object, name, onSelect, cluster, Renderer}) => {
  const values = cluster.getPropertyEnumValues(object,name)
  const items = values.map(val=>
    <HBox
      key={val}
  onClick={(e)=>onSelect(val)}>
  {/*<b>{val}</b>*/}
  <Renderer object={object} name={name} value={val}/>
  </HBox>
)
  return <VBox className="popup-menu">{items}</VBox>
}

type PropSheetProps = {
  provider:TreeItemProvider
}
type PropSheetState = {
  selection:any,
}

export class PropSheet extends Component<PropSheetProps,PropSheetState> {
  private h2: () => void;
  private hand: (s) => void;
  constructor(props) {
    super(props)
    this.state = {
      selection:null
    }
  }
  componentDidMount() {
    this.h2 = () => this.setState({selection:selMan.getSelection()})
    this.props.provider.on(TREE_ITEM_PROVIDER.PROPERTY_CHANGED,this.h2)
    this.hand = (s) => this.setState({selection:selMan.getSelection()})
    selMan.on(SELECTION_MANAGER.CHANGED, this.hand)
  }
  componentWillUnmount() {
    selMan.off(SELECTION_MANAGER.CHANGED, this.hand);
    this.props.provider.off(TREE_ITEM_PROVIDER.PROPERTY_CHANGED,this.h2)
  }
  render() {
    // const item = selMan.getSelection()
    // const prov = this.props.provider
    // let clusters = prov.getPropertyClusters(item)
    // return <div className="prop-wrapper">{Object.keys(clusters).map(key => {
    //     return <PropSection key={key} title={key} cluster={clusters[key]} prov={prov} item={item}/>
    //   })}</div>
    return <div>prop sheet stuff here</div>
  }
  renderIndeterminate(prop) {
    if(prop.isIndeterminate()) {
      return <i key={prop.getKey()+'-indeterminate'} className="icon fa fa-exclamation-circle"/>
    } else {
      return ""
    }
  }
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
  calculateGroups(props) {
    const group_defs = props.filter(p => p.getType() === TYPES.GROUP)
    group_defs.forEach(def => {
      const group_keys = def.getGroupKeys()
      //remove any groups in the group keys of a group def
      props = props.filter(p => group_keys.indexOf(p.getKey())<0)
    })
    return props
  }
}


/*class PropSection extends Component {
  render() {
    return <div className="prop-sheet">
      <header>{this.props.title}</header>
    {
      this.props.cluster.getPropertyKeys(this.props.item).map(key => {
        return [
          <label key={key+'-label'}>{key}</label>,
          this.renderPropEditor(this.props.cluster,this.props.item,key)
        ]
      })
    }
    </div>
  }

  calculateDefs() {
  }

  renderPropEditor(cluster, item, key) {
    return <PropEditor key={key+'-editor-'+item.id} propKey={key} provider={this.props.provider} item={item} cluster={cluster}/>
  }
}
*/
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
