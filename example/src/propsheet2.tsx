import React, { useContext, useState, useEffect, ChangeEvent } from "react";
import {
  SelectionManagerContext,
  TreeItemProvider,
  SELECTION_MANAGER,
  TreeItem,
  PopupManagerContext,
  TREE_ITEM_PROVIDER,
  PROP_TYPES,
} from "vized";
import { ImageIconButton, toClss } from "./components";

export type PropType = 'string' | 'number' | 'boolean' | 'enum'

export interface ObjectDelegate {
  propkeys(item:TreeItem): string[];
  isPropLinked(item:TreeItem, name: string): boolean;
  getPropType( item:TreeItem, name: string): PropType;
  getPropValue(item:TreeItem, name: string): any;
  setPropValue(item:TreeItem, name:string, value:any): void;
  isPropEditable(item: TreeItem, name: string): boolean;
  valueToString(item: TreeItem, name: string): string;
  getLinkedValueToString(item: TreeItem, name: string): string;
  getRendererForEnumProperty(item: TreeItem, name: string): any;
  getPropertyEnumValues(item: TreeItem, name: string): any[];
  removePropLink(item: TreeItem, name: string): void;
  getPossibleLinkTargets(item: TreeItem, name: string): TreeItem[];
  setPropLinkTarget(item: TreeItem, name: string, target: TreeItem): void;
  getPropLinkTargetTitle(id: TreeItem): string;
  getDelegateForObjectProperty(item:TreeItem, name:string):ObjectDelegate;
}

function NumberEditor(props: { item: TreeItem, delegate: ObjectDelegate, name:string, disabled:boolean }) {
  let {item, name, delegate, disabled} = {...props}
  const [value, setValue] = useState(()=> delegate.getPropValue(item,name))
  function updateValue(str:string,offset:number) {
    // setValue(str)
    let num = parseFloat(str)
    if(!Number.isNaN(num)) {
      num += offset
      delegate.setPropValue(item,name,num)
      setValue(""+num)
    } else {
      setValue(str)
    }
  }

  // @ts-ignore
  function onKeyDown(e:KeyboardEvent<HTMLInputElement>) {
    if(e.key === 'ArrowUp' && e.shiftKey) {
      e.preventDefault()
      updateValue(e.target.value,10)
    }
    if(e.key === 'ArrowDown' && e.shiftKey) {
      e.preventDefault()
      updateValue(e.target.value,-10)
    }
  }

  return <input type='number'
                value={value}
                className={'editor'}
                disabled={disabled}
                onChange={(e)=>{
                  updateValue(e.target.value,0)
                }}
                onKeyDown={onKeyDown}/>
}


function StringEditor(props: { item: TreeItem, name: string, delegate: ObjectDelegate, disabled:boolean }) {
  const {disabled} = {...props}
  const [value, setValue] = useState(()=> props.delegate.getPropValue(props.item,props.name))
  function updateValue(e:ChangeEvent<HTMLInputElement>):void {
    let str = e.target.value
    setValue(str)
    props.delegate.setPropValue(props.item,props.name,str)
  }
  return <input type='input' value={value} onChange={updateValue} className={'editor'} disabled={disabled}/>
}

function StandardEnumRenderer(props:{object:TreeItem, key:string, value:any}) {
  return <span>{props.value}</span>
}

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

function EnumEditor(props: { item: TreeItem, name: string, delegate: ObjectDelegate, disabled:boolean }) {
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

function ObjectPropEditor(props: { item: TreeItem, disabled: boolean, name: string, delegate: ObjectDelegate }) {
  let del = props.delegate.getDelegateForObjectProperty(props.item,props.name)
  let item = props.delegate.getPropValue(props.item,props.name)
  return <div>
    {del.propkeys(item).map(name => {
      let type = del.getPropType(item,name)
      let id = item.id
      let lab  = <label key={`${id}-${name}-label`} className={'label'}>{name}</label>
      let pe   = <label key={`${id}-${name}-editor`}>---</label>
      if(type === 'number') pe = <NumberEditor key={`${id}-${name}-editor`} delegate={del} item={item} name={name} disabled={false}/>
      if(type === 'string') pe = <StringEditor key={`${id}-${name}-editor`} delegate={del} item={item} name={name} disabled={false}/>
      if(type === 'enum') pe =   <EnumEditor   key={`${id}-${name}-editor`} delegate={del} item={item} name={name} disabled={false}/>
      return [lab,pe]
    })}
  </div>
}


function LinkPicker(props: { item:TreeItem, name: string, delegate: ObjectDelegate }) {
  const {item,name, delegate} = {...props}
  const PM = useContext(PopupManagerContext) as any
  let items = delegate.getPossibleLinkTargets(item,name).map((target:TreeItem,i:number) => {
    return <button key={i} onClick={()=>{
      delegate.setPropLinkTarget(item, name, target)
      PM.hide()
    }}>{delegate.getPropLinkTargetTitle(target)}</button>
  })
  return <div className={'vbox popup-menu'}>
    {items}
    <button onClick={()=>{
      delegate.removePropLink(item,name)
      PM.hide()
    }}>none</button>
  </div>
}

function OpenLinkEditorButton(props: { item: TreeItem, name: string, delegate: ObjectDelegate }) {
  const {item,name, delegate} = {...props}
  let linked = delegate.isPropLinked(item,name)
  const PM = useContext(PopupManagerContext) as any
  function open(e:MouseEvent) {
      PM.show(<LinkPicker delegate={delegate} item={item} name={name}/>, e.target)
  }
  // @ts-ignore
  return <ImageIconButton onClick={open} icon="link" className={toClss({linked:linked, 'image-button-link':true})}/>
}

export function PropSheet(props:{provider:TreeItemProvider, }) {
  let selMan = useContext(SelectionManagerContext)
  const [item, setItem] = useState(selMan.getSelection())
  const prov = props.provider
  // @ts-ignore
  let [count, set_count] = useState(0)
  const repaint = () => set_count(count+1)
  useEffect(() => {
    let hand = () => setItem(selMan.getSelection())
    selMan.on(SELECTION_MANAGER.CHANGED, hand)
    return () => selMan.off(SELECTION_MANAGER.CHANGED,hand)
  })

  useEffect(() => {
    let hand = () => repaint()
    prov.on(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, hand)
    return () => {
      prov.off(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, hand)
    }
  })
  // @ts-ignore
  let del:ObjectDelegate = prov.getObjectDelegate(item) as ObjectDelegate

  return <div className="prop-sheet">{del.propkeys(item).map((name:string) => {
    let type = del.getPropType(item,name)
    let id = item.id
    let lab  = <label key={`${id}-${name}-label`} className={'label'}>{name}</label>
    let link = <OpenLinkEditorButton key={`${id}-${name}-linked`} delegate={del} item={item} name={name}/>
    let pe   = <label key={`${id}-${name}-editor`}>---</label>
    if(del.isPropEditable(item,name) && !del.isPropLinked(item,name)) {
      if(type === 'number') pe = <NumberEditor key={`${id}-${name}-editor`} delegate={del} item={item} name={name} disabled={false}/>
      if(type === 'string') pe = <StringEditor key={`${id}-${name}-editor`} delegate={del} item={item} name={name} disabled={false}/>
      if(type === 'enum') pe =   <EnumEditor   key={`${id}-${name}-editor`} delegate={del} item={item} name={name} disabled={false}/>
      if(type === PROP_TYPES.OBJECT) pe = <ObjectPropEditor key={`${id}-${name}--editor`}
                                                            delegate={del}
                                                            item={item}
                                                            name={name}
                                                            disabled={false}/>
    } else {
      if(del.isPropLinked(item,name)) {
        pe = <label key={`${id}-${name}-value`}
                    className={'value'}>{del.getLinkedValueToString(item,name)}</label>
      } else {
        pe = <label key={`${id}-${name}-value`}
                    className={'value'}>{del.valueToString(item, name)}</label>
      }
    }

    return [lab,link,pe]
  })}</div>

}
