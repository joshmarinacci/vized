import React, { ReactNode, useContext, useEffect } from "react";
import { RectDocEditor } from "./RectDocEditor";
import { StorageManagerContext, StorageManager } from "vized";
import { SelectionManagerContext, TreeItemProvider } from "vized";
import { PopupManagerContext } from "vized";
import "./css/components.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";

export function ExportButton(props:{provider:RectDocEditor}) {
  let SM = useContext(StorageManagerContext) as StorageManager
  let PM = useContext(PopupManagerContext)
  const save = () => {
    let json = props.provider.save() as object
    SM.forceJSONDownload(json,'graphics')
    PM.hide()
  }
  return <button onClick={save} title={'save project'}>export</button>
}

export function SaveButton(props:{provider:TreeItemProvider}) {
  let SM = useContext(StorageManagerContext) as StorageManager
  let PM = useContext(PopupManagerContext)
  const save = () => {
    let json = props.provider.save() as object
    SM.saveToLocalStorage(json,'LAST_DOC')
    PM.hide()
  }
  return <button onClick={save} title={'save project'}>save</button>
}

export function LoadButton(props: { provider: TreeItemProvider }) {
  let SM = useContext(StorageManagerContext) as StorageManager
  let PM = useContext(PopupManagerContext)
  const load = () => {
    let json = SM.loadFromLocalStorage('LAST_DOC')
    if(json) {
      props.provider.load(json)
    } else {
      console.log("error loading json")
    }
    PM.hide()
  }
  return <button onClick={load} title={'load last project'}>use last</button>
}

export function DropdownMenu(props: {provider:RectDocEditor, title:string, children:ReactNode}) {
  let PM = useContext(PopupManagerContext)
  // @ts-ignore
  const open = (e:MouseEvent) => {
    PM.show(<div className="popup-menu">{props.children}</div>,e.target)
  }
  // @ts-ignore
  return <button onClick={open}>{props.title}
    <FontAwesomeIcon icon={faCaretDown}/>
  </button>
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
export function ButtonGroup(props:{children:ReactNode}) {
  return <div className={'button-group'}>{props.children}</div>
}
