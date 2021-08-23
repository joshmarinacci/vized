import React, { ReactNode, useContext, useEffect } from "react";
import { RectDocEditor } from "./RectDocEditor";
import { StorageManagerContext, StorageManager } from "vized";
import { SelectionManagerContext, TreeItemProvider } from "vized";

export function ExportButton(props:{provider:RectDocEditor}) {
  let SM = useContext(StorageManagerContext) as StorageManager
  const save = () => {
    let json = props.provider.save() as object
    SM.forceJSONDownload(json,'graphics')
  }
  return <button onClick={save} title={'save project'}>export</button>
}

export function SaveButton(props:{provider:TreeItemProvider}) {
  let SM = useContext(StorageManagerContext) as StorageManager
  const save = () => {
    let json = props.provider.save() as object
    SM.saveToLocalStorage(json,'LAST_DOC')
  }
  return <button onClick={save} title={'save project'}>save</button>
}

export function LoadButton(props: { provider: TreeItemProvider }) {
  let SM = useContext(StorageManagerContext) as StorageManager
  const load = () => {
    let json = SM.loadFromLocalStorage('LAST_DOC')
    if(json) {
      props.provider.load(json)
    } else {
      console.log("error loading json")
    }
  }
  return <button onClick={load} title={'load last project'}>last</button>
}

export function SelectedButton(props: { onClick: () => void, selected: boolean, children: ReactNode }) {
  return <button onClick={props.onClick} className={props.selected?"selected":""}>{props.children}</button>
}

export function KeyboardWatcher(props:{provider:RectDocEditor}) {
  let SM = useContext(SelectionManagerContext)
  useEffect(()=>{
    let kbh = (e:KeyboardEvent) => {
      // console.log("keypress",e.key,e.target)
      if(e.key === 'Backspace') {
        props.provider.deleteChildren(SM.getFullSelection())
        SM.clearSelection()
      }
    }
    document.addEventListener('keypress',kbh)
    return () => document.removeEventListener('keypress',kbh)
  })
  return <div id={'keyboard-watcher'}/>
}

export function PNGButton(props: { provider: TreeItemProvider }) {
  let SM = useContext(StorageManagerContext) as StorageManager
  const doit = () => {
    let canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    // draw_to_canvas(canvas,props.provider)
    SM.canvasToPNGBlob(canvas).then(blob => SM.forcePNGDownload(blob,'export'))
  }
  return <button onClick={doit} title={'load last project'}>PNG</button>
}

export function AddChildButton(props:{provider:RectDocEditor}) {
  const on_click = () => props.provider.add_square()
  return <button onClick={on_click} title={'add child'}>add</button>
}
