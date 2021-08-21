import React, { useContext, useState, useEffect, ChangeEvent } from "react";
import {
  SelectionManagerContext,
  TreeItemProvider,
  SELECTION_MANAGER,
  TreeItem,
  PopupManagerContext,
} from "vized";

export type PropType = 'string' | 'number' | 'boolean' | 'enum'

export interface ObjectDelegate {
  propkeys(item:TreeItem): string[];
  isPropLinked(item:TreeItem, name: string): Boolean;
  getPropType( item:TreeItem, name: string): PropType;
  getPropValue(item:TreeItem, name: string): any;
  setPropValue(item:TreeItem, name:string, value:any): void;
  isPropEditable(item: TreeItem, name: string): Boolean;
  valueToString(item: TreeItem, name: string): string;
  getRendererForEnumProperty(item: TreeItem, name: string): any;
  getPropertyEnumValues(item: TreeItem, name: string): any[];
}

function NumberEditor(props: { item: TreeItem, delegate: ObjectDelegate, name:string }) {
    console.log('rendering number editor')
    // let {def, obj} = props
    // const [value,setValue] = useState(obj[def.key])
    // let step = 1
    // if(def.hints) {
    //   const hints = def.hints as NumberHints
    //   if('incrementValue' in hints) step = hints.incrementValue
    // }
    // function setObjectValue(v:any, offset=0) {
    //   if(!isNaN(parseFloat(v))) {
    //     v = parseFloat(v)
    //     v += offset
    //     if(def.hints) {
    //       const hints = def.hints as NumberHints
    //       if('min' in hints) { // @ts-ignore
    //         v = Math.max(v,hints.min)
    //       }
    //       if('max' in hints) { // @ts-ignore
    //         v = Math.min(v,hints.max)
    //       }
    //     }
    //     setValue(v)
    //     setItemValue(props.provider,def,obj,v)
    //   }
    // }
  const [vv, svv] = useState(()=>{
    let value = props.delegate.getPropValue(props.item,props.name)
    return value as any
  })
  function updateValue(e:ChangeEvent<HTMLInputElement>):void {
    let str = e.target.value
    let num = parseFloat(str)
    if(Number.isNaN(num)) {
      //set local w/ string
      svv(str)
    } else {
      //set local
      svv(str)
      //set live
      props.delegate.setPropValue(props.item,props.name,num)
    }
  }
  return <input type='number' value={vv} onChange={updateValue}  className={'editor'}/>
}


function StringEditor(props: { item: TreeItem, name: string, delegate: ObjectDelegate }) {
  const [vv, svv] = useState(()=>{
    let value = props.delegate.getPropValue(props.item,props.name)
    return value as any
  })
  function updateValue(e:ChangeEvent<HTMLInputElement>):void {
    let str = e.target.value
    svv(str)
    props.delegate.setPropValue(props.item,props.name,str)
  }
  return <input type='input' value={vv} onChange={updateValue} className={'editor'}/>
}

function StandardEnumRenderer(props:{object:TreeItem, key:string, value:any}) {
  return <span>{props.value}</span>
}


// function HBox({ ...rest }):JSX.Element {
//   return <div {...rest} className={'hbox'} />
// }

function EnumPicker (props:{delegate:ObjectDelegate,item:TreeItem, name:string, onSelect:any, Renderer:any}) {
  const {item, delegate, onSelect, Renderer, name} = props
  const values = delegate.getPropertyEnumValues(item,name)
  const items = values.map((val:any)=>
    <div className={'hbox fill'}
      key={val}
      onClick={(e:any)=>onSelect(val)}>
      <Renderer object={item} name={name} value={val}/>
    </div>
  )
  return <div className="popup-menu vbox">{items}</div>
}

function EnumEditor(props: { item: TreeItem, name: string, delegate: ObjectDelegate }) {
  const {item,name, delegate} = {...props}
  // @ts-ignore
  const [value,setValue] = useState(()=> delegate.getPropValue(item,name))
  const PM = useContext(PopupManagerContext) as any
  let EnumItemRenderer = delegate.getRendererForEnumProperty(item,name)
  if(!EnumItemRenderer) EnumItemRenderer = StandardEnumRenderer
  let selectedRenderedValue = <EnumItemRenderer object={item} name={name} value={value}/>

  function updateValue(val:any):void {
    setValue(val)
    delegate.setPropValue(item,name,val)
    PM.hide()
  }

  function open(e:MouseEvent) {
    PM.show(<EnumPicker delegate={delegate} item={item} name={name} Renderer={EnumItemRenderer} onSelect={updateValue}/>, e.target)
  }
  // @ts-ignore
  return <button onClick={open}  className={'editor enum-value'}>{selectedRenderedValue}</button>
}

export function PropSheet(props:{provider:TreeItemProvider, }) {
  let selMan = useContext(SelectionManagerContext)
  const [item, setItem] = useState(selMan.getSelection())
  const prov = props.provider
  // @ts-ignore
  // let [count, set_count] = useState(0)
  // const repaint = () => set_count(count+1)
  useEffect(() => {
    let hand = () => setItem(selMan.getSelection())
    selMan.on(SELECTION_MANAGER.CHANGED, hand)
    return () => selMan.off(SELECTION_MANAGER.CHANGED,hand)
  })

  // useEffect(() => {
  //   let hand = it => {
  //     setSelection(selMan.getSelection())
  //     repaint()
  //   }
  //   prov.on(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, hand)
  //   return () => {
  //     prov.off(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, hand)
  //   }
  // })
  // @ts-ignore
  let del:ObjectDelegate = prov.getObjectDelegate(item) as ObjectDelegate

  return <div className="prop-sheet">{del.propkeys(item).map((name:string) => {
    let type = del.getPropType(item,name)
    let id = item.id

    let lab = <label key={`${id}-${name}-label`} className={'label'}>{name}</label>

    let link = <button key={`${id}-${name}-linked`} className={'link'}>[ ]</button>
    if(del.isPropLinked(item,name)) {
      link = <button key={`${id}-${name}-linked`} className={'link'}>[x]</button>
    }

    let pe = <label key={`${id}-${name}-editor`}>---</label>
    if(del.isPropEditable(item,name)) {
      if(type === 'number') pe = <NumberEditor key={`${id}-${name}-editor`} delegate={del} item={item} name={name}/>
      if(type === 'string') pe = <StringEditor key={`${id}-${name}-editor`} delegate={del} item={item} name={name}/>
      if(type === 'enum') pe =   <EnumEditor   key={`${id}-${name}-editor`} delegate={del} item={item} name={name}/>
    } else {
      pe = <label key={`${id}-${name}-value`} className={'value'}>{del.valueToString(item,name)}</label>
    }

    return [lab,link,pe]
  })}</div>

}
