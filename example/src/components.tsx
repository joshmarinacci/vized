import React, { ReactNode, useContext, useEffect } from "react";
import { RectDocEditor } from "./RectDocEditor";
import {
  Point,
  PopupManagerContext,
  SelectionManagerContext,
  StorageManager,
  StorageManagerContext,
  TreeItemProvider
} from "vized";
import "./css/components.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { faAlignCenter } from "@fortawesome/free-solid-svg-icons/faAlignCenter";

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

export function toClss(o: any): string {
  let clsses: string[] = [];
  Object.entries(o).forEach(([key, value]) => {
    if (value) clsses.push(key);
  });
  return clsses.join(" ");
}

export function FloatingNodePanel(props: { visible: boolean, style: any, provider: RectDocEditor }) {
  let selMan = useContext(SelectionManagerContext);
  return <div className={toClss({
    "floating-panel": true,
    visible: props.visible
  })} style={props.style}>
    <button onClick={() => props.provider.action_horizontal_align(selMan.getFullSelection())}>
      <FontAwesomeIcon icon={faAlignCenter} />
    </button>
    <button onClick={() => props.provider.action_vertical_align(selMan.getFullSelection())}>align
      vert
    </button>
  </div>;
}

export class Rect {
  x: number;
  y: number;
  x2: number;
  y2: number;
  private empty: boolean;

  constructor(x: number, y: number, w: number, h: number, empty?: boolean) {
    this.x = x;
    this.y = y;
    this.x2 = x + w;
    this.y2 = y + h;
    this.empty = empty ? empty : false;
  }

  union_self(rect: Rect) {
    if (rect.empty) return;
    // if(this.empty && !rect.empty) {
    //   this.x = rect.x
    //   this.y = rect.y
    //   this.x2 = rect.x2
    //   this.y2 = rect.y2
    //   return
    // }
    if (rect.x < this.x) {
      this.x = rect.x;
      this.empty = false;
    }
    if (rect.y < this.y) {
      this.y = rect.y;
      this.empty = false;
    }
    if (rect.x2 > this.x2) {
      this.x2 = rect.x2;
      this.empty = false;
    }
    if (rect.y2 > this.y2) {
      this.y2 = rect.y2;
      this.empty = false;
    }
  }

  fill(c: CanvasRenderingContext2D, color: string) {
    c.fillStyle = color;
    c.fillRect(this.x, this.y, this.x2 - this.x, this.y2 - this.y);
  }

  stroke(c: CanvasRenderingContext2D, color: string, lineWidth: number) {
    c.lineWidth = lineWidth;
    c.strokeStyle = color;
    c.strokeRect(this.x, this.y, this.x2 - this.x, this.y2 - this.y);
  }

  width() {
    return this.x2 - this.x;
  }

  height() {
    return this.y2 - this.y;
  }

  equal(bounds: Rect) {
    if (this.x != bounds.x) return false;
    if (this.y != bounds.y) return false;
    if (this.x2 != bounds.x2) return false;
    if (this.y2 != bounds.y2) return false;
    return true;
  }

  contains(pt: Point) {
    if (pt.x < this.x) return false;
    if (pt.x > this.x2) return false;
    if (pt.y < this.y) return false;
    if (pt.y > this.y2) return false;
    return true;
  }

  bottom_center(): Point {
    return new Point((this.x + this.x2) / 2, this.y2);
  }

  translate(point: Point) {
    return new Rect(this.x + point.x, this.y + point.y, this.width(), this.height(), this.empty);
  }
  translate_self(point: Point) {
    this.x = this.x + point.x
    this.y = this.y + point.y
    this.x2 = this.x2 + point.x
    this.y2 = this.y2 + point.y
  }

  isEmpty() {
    return this.empty;
  }

  makeEmpty() {
    let bounds = new Rect(0, 0, 0, 0);
    bounds.x = 10000;
    bounds.y = 10000;
    bounds.x2 = -1000;
    bounds.y2 = -1000;
    bounds.empty = true;
    return bounds;
  }

  center():Point {
    return new Point((this.x+this.x2)/2, (this.y+this.y2)/2)
  }
}

export const ColorValueRenderer = (props: { object: any, key: string, value: any }) => {
  return <div className={"color-value"} style={{
    backgroundColor: props.value
  }}><b className={"text"}>{props.value}</b></div>;
};

export function ImageIcon(props: { icon: string, selected?:boolean, onClick?:any, className?:string  }) {
  let cls = {
    "image-icon":true,
  }
  cls[props.icon] = true
  if(props.className) {
    cls[props.className] = true
  }
  return <div className={toClss(cls)} onClick={props.onClick}/>;
}

export function ImageIconButton(props: { icon: string, selected?:boolean, onClick?:any, className?:string, text?:string  }) {
  let cls = {
    'image-button':true,
  }
  if(props.className) {
    cls[props.className] = true
  }

  return <button className={toClss(cls)} onClick={props.onClick}><ImageIcon icon={props.icon}/>{props.text?<span>props.text</span>:<></>}</button>;
}
