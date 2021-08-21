import React, { useContext, useState, useEffect, ChangeEvent } from "react";
import {
  SelectionManagerContext,
  TreeItemProvider,
  SELECTION_MANAGER,
  TreeItem,
} from "vized";


export type PropType = 'string' | 'number' | boolean

export interface ObjectDelegate {
  propkeys(item:TreeItem): string[];
  isPropLinked(item:TreeItem, name: string): Boolean;
  getPropType( item:TreeItem, name: string): PropType;
  getPropValue(item:TreeItem, name: string): any;
  setPropValue(item:TreeItem, name:string, value:any): void;
  isPropEditable(item: TreeItem, name: string): Boolean;
  valueToString(item: TreeItem, name: string): string;
}

function NumberEditor(props: { item: TreeItem, delegate: ObjectDelegate, name:string }) {
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
  return <input type='number' value={vv} onChange={updateValue}/>
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
  return <input type='input' value={vv} onChange={updateValue}/>
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

    let lab = <label key={name+'-label'} className={'label'}>{name}</label>

    let link = <button key={name+'-linked'} className={'link'}>[ ]</button>
    if(del.isPropLinked(item,name)) {
      link = <button key={name+'-linked'} className={'link'}>[x]</button>
    }

    let pe = <label key={name+'-editor'}>---</label>
    if(del.isPropEditable(item,name)) {
      if(type === 'number') pe = <NumberEditor key={name+'-editor'} delegate={del} item={item} name={name}/>
      if(type === 'string') pe = <StringEditor key={name+'-editor'} delegate={del} item={item} name={name}/>
    } else {
      pe = <label key={name+'-value'} className={'value'}>{del.valueToString(item,name)}</label>
    }

    return [lab,link,pe]
  })}</div>

}
