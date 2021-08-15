import React, { useContext, useEffect, useRef, MouseEvent, useState } from "react";
import {
  SelectionManagerContext,
  SELECTION_MANAGER, TREE_ITEM_PROVIDER,
  TreeItemProvider,
  SelectionManager,
} from "vized"

function draw_to_canvas(can: HTMLCanvasElement, provider:TreeItemProvider, scale: number, selMan: SelectionManager) {
  const c = can.getContext('2d') as CanvasRenderingContext2D
  c.fillStyle = 'white'
  c.fillRect(0, 0, can.width, can.height)
  c.save()
  c.scale(scale,scale)
  provider.getSceneRoot().children.forEach((ch:any) => {
    c.fillStyle = ch.color
    c.fillRect(ch.x,ch.y,ch.w,ch.h)
    if(selMan.isSelected(ch)) {
      c.lineWidth = 3
      c.strokeStyle = 'red'
      c.strokeRect(ch.x,ch.y,ch.w,ch.h)
      c.lineWidth = 1
      c.strokeStyle = 'black'
      c.strokeRect(ch.x,ch.y,ch.w,ch.h)
    }
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

  divideScalar(scale: number) {
    return new Point(this.x/scale,this.y/scale)
  }
}
// @ts-ignore
function canvas_to_point(e: MouseEvent, scale:number):Point {
  // @ts-ignore
  let rect = e.target.getBoundingClientRect()
  // let rect = e.target.getClientBounds()
  return new Point(e.clientX-rect.x, e.clientY-rect.y).divideScalar(scale)
}

function rect_contains(ch: any, pt: Point) {
  if(pt.x < ch.x) return false
  if(pt.x > ch.x + ch.w) return false
  if(pt.y < ch.y) return false
  if(pt.y > ch.y + ch.h) return false
  return true
}

function find_node_at_pt(provider: TreeItemProvider, pt: Point):any[] {
  return provider.getSceneRoot().children.filter((ch:any) => rect_contains(ch,pt))
}

export function RectCanvas(props:{provider:TreeItemProvider}) {
  let canvas = useRef<HTMLCanvasElement>(null);
  let selMan = useContext(SelectionManagerContext)
  let [zoom] = useState(1)

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
  let scale = Math.pow(2,zoom)

  const redraw = () => {
    if(!canvas.current) return
    // @ts-ignore
    let can = canvas.current as HTMLCanvasElement
    draw_to_canvas(can,props.provider,scale, selMan)
  }

  const mouseDown = (e:MouseEvent<HTMLCanvasElement>) => {
    let pt = canvas_to_point(e,scale)
    let nodes = find_node_at_pt(props.provider,pt)
    if(nodes.length > 0) {
      selMan.setSelection(nodes[0])
    }
  }
  return <div className="panel">
    <canvas style={{border: '1px solid red', width:'800px', height:'800px'}}
    width={800} height={800} ref={canvas}
    onMouseDown={mouseDown}
    />
  </div>
}

