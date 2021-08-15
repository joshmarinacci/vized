import React, { useContext, useEffect, useRef, MouseEvent } from "react";
import {SelectionManagerContext, SELECTION_MANAGER, TREE_ITEM_PROVIDER, TreeItemProvider,


} from "vized"

function draw_to_canvas(can:HTMLCanvasElement, provider:TreeItemProvider) {
  const c = can.getContext('2d') as CanvasRenderingContext2D
  c.fillStyle = 'white'
  c.fillRect(0, 0, can.width, can.height)
  c.save()
  provider.getSceneRoot().children.forEach((ch:any) => {
    c.fillStyle = ch.color
    c.fillRect(ch.x,ch.y,ch.w,ch.h)
  })
  c.restore()
}

class Point {
  public x: number;
  public y: number;
  constructor(x:number,y:number) {
    this.x = x
    this.y = y
  }
}
// @ts-ignore
function cavnas_to_mouse(e: MouseEvent):Point {
  // let rect = e.target.getClientBounds()
  return new Point(e.clientX, e.clientY)
}

export function RectCanvas(props:{provider:TreeItemProvider}) {
  let canvas = useRef<HTMLCanvasElement>(null);
  let selMan = useContext(SelectionManagerContext)

  useEffect(() => {
    if(canvas.current) redraw()
    selMan.on(SELECTION_MANAGER.CHANGED, redraw)
    props.provider.on(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, redraw)
    props.provider.on(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, redraw)
    return () => {
      selMan.off(SELECTION_MANAGER.CHANGED,redraw)
      props.provider.off(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, redraw)
      props.provider.off(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, redraw)
    }
  })
  const redraw = () => {
    if(!canvas.current) return
    // @ts-ignore
    let can = canvas.current as HTMLCanvasElement
    draw_to_canvas(can,props.provider)
  }

  const mouseDown = (e:MouseEvent<HTMLCanvasElement>) => {
    let pt = cavnas_to_mouse(e)
    console.log("mouse down",pt)
  }
  return <div className="panel">
    <canvas style={{border: '1px solid red', width:'300px', height:'300px'}}
    width={300} height={300} ref={canvas}
    onMouseDown={mouseDown}
    />
  </div>
}

