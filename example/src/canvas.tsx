import React, { useContext, useEffect, useRef, MouseEvent, useState } from "react";
import {
  SelectionManagerContext,
  SELECTION_MANAGER, TREE_ITEM_PROVIDER,
  TreeItemProvider,
  SelectionManager,
  ContextMenu,
  PopupManagerContext,
  Point
} from "vized"
import { RectDocEditor } from "./RectDocEditor";

export class Rect {
  x: number
  y: number
  x2: number
  y2: number
  constructor(x: number, y: number, w: number, h: number) {
    this.x = x
    this.y = y
    this.x2 = x+w
    this.y2 = y+h
  }

  union(x:number, y:number, w:number, h:number) {
    this.x = Math.min(x, this.x)
    this.y = Math.min(y, this.y)
    this.x2 = Math.max(x+w,this.x2)
    this.y2 = Math.max(y+h,this.y2)
  }

  fill(c: CanvasRenderingContext2D, color: string) {
    c.fillStyle = color
    c.fillRect(this.x,this.y,this.x2-this.x,this.y2-this.y)
  }
  stroke(c: CanvasRenderingContext2D, color: string, lineWidth:number) {
    c.lineWidth = lineWidth
    c.fillStyle = color
    c.strokeRect(this.x,this.y,this.x2-this.x,this.y2-this.y)
  }

  width() {
    return this.x2 - this.x
  }

  height() {
    return this.y2 - this.y
  }

  equal(bounds: Rect) {
    if(this.x != bounds.x) return false
    if(this.y != bounds.y) return false
    if(this.x2 != bounds.x2) return false
    if(this.y2 != bounds.y2) return false
    return true
  }

  contains(pt: Point) {
      if(pt.x < this.x) return false
      if(pt.x > this.x2) return false
      if(pt.y < this.y) return false
      if(pt.y > this.y2) return false
      return true
  }
}

// @ts-ignore
function calc_scene_bounds(provider: TreeItemProvider):Rect {
  let bounds = new Rect(0,0,0,0)
  bounds.x = 0
  bounds.y = 0
  bounds.x2 = 100
  bounds.y2 = 100
  provider.getSceneRoot().children.forEach((ch:any) => {
    if(ch.x < bounds.x) bounds.x = ch.x
    if(ch.x + ch.w > bounds.x2) bounds.x2 = ch.x+ch.w
    if(ch.y < bounds.y) bounds.y = ch.y
    if(ch.y + ch.h > bounds.y2) bounds.y2 = ch.y+ch.h
  })
  return bounds
}

function draw_to_canvas(can: HTMLCanvasElement, provider:RectDocEditor,
                        scale: number, selMan: SelectionManager,
                        bounds:Rect, page:Rect, offset:Point) {
  const c = can.getContext('2d') as CanvasRenderingContext2D
  bounds.fill(c,'#cccccc')
  c.save()
  c.scale(scale,scale)
  c.translate(-bounds.x + offset.x,-bounds.y + offset.y)
  page.fill(c,'white')
  provider.getSceneRoot().children.forEach((ch:any) => {
    c.fillStyle = provider.getColorValue(ch)
    let bds = provider.getBoundsValue(ch)
    bds.fill(c,provider.getColorValue(ch))
    if(selMan.isSelected(ch)) {
      bds.stroke(c,'red',3)
      bds.stroke(c,'black',1)
    }
  })
  c.restore()
}

// @ts-ignore
function canvas_to_point(e: MouseEvent, scale:number, offset:Point):Point {
  // @ts-ignore
  let rect = e.target.getBoundingClientRect()
  return new Point(e.clientX-rect.x-offset.x, e.clientY-rect.y-offset.y).divide(scale)
}

function find_node_at_pt(provider: RectDocEditor, pt: Point):any[] {
  return provider.getSceneRoot().children.filter((ch:any) => provider.getBoundsValue(ch).contains(pt))
}

export function RectCanvas(props:{provider:RectDocEditor, tool:string}) {
  let canvas = useRef<HTMLCanvasElement>(null);
  let selMan = useContext(SelectionManagerContext)
  let [zoom] = useState(0)
  let [bounds, set_bounds] = useState(new Rect(0,0,10,10))
  let [offset, set_offset] = useState(new Point(10,10))
  let [count, set_count] = useState(0)

  useEffect(() => {
    if(canvas.current) redraw()
    selMan.on(SELECTION_MANAGER.CHANGED, redraw)
    props.provider.on(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, redraw)
    props.provider.on(TREE_ITEM_PROVIDER.STRUCTURE_ADDED, redraw)
    props.provider.on(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, redraw)
    props.provider.on(TREE_ITEM_PROVIDER.STRUCTURE_REMOVED, redraw)
    return () => {
      selMan.off(SELECTION_MANAGER.CHANGED,redraw)
      props.provider.off(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, redraw)
      props.provider.off(TREE_ITEM_PROVIDER.STRUCTURE_ADDED, redraw)
      props.provider.off(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, redraw)
      props.provider.off(TREE_ITEM_PROVIDER.STRUCTURE_REMOVED, redraw)
    }
  },[selMan,canvas,count])

  const pm = useContext(PopupManagerContext)

  let scale = Math.pow(2,zoom)

  const redraw = () => {
    if(!canvas.current) return
    let can = canvas.current as HTMLCanvasElement
    let scene_bounds = calc_scene_bounds(props.provider)
    let bds = new Rect(0,0,can.clientWidth, can.clientHeight)
    if(!bds.equal(bounds)) {
      set_bounds(bds)
      set_count(count+1)
    } else {
      draw_to_canvas(can, props.provider, scale, selMan, bds, scene_bounds, offset)
    }
  }

  let [mouse_pressed, set_mouse_pressed] = useState(false)
  let [mouse_start, set_mouse_start] = useState(new Point(0,0))
  let [offsets, set_offsets] = useState([] as Point[])

  const mouseDown = (e:MouseEvent<HTMLCanvasElement>) => {
    let pt = canvas_to_point(e,scale, offset)
    let nodes = find_node_at_pt(props.provider,pt)
    if(nodes.length > 0) {
      if(e.shiftKey) {
        selMan.addToSelection(nodes[0])
      } else {
        if(!selMan.isSelected(nodes[0])) selMan.setSelection(nodes[0])
      }
    } else {
      selMan.clearSelection()
    }
    set_mouse_start(pt)
    set_mouse_pressed(true)
    set_offsets(selMan.getFullSelection().map(it => new Point(it.x,it.y)) as Point[])
  }
  const mouseMove = (e:MouseEvent<HTMLCanvasElement>) => {
    if(props.tool === 'move-tool' && mouse_pressed) {
      let pt = canvas_to_point(e,scale, new Point(0,0))
      let diff:Point = pt.minus(mouse_start)
      set_offset(diff)
      set_count(count+1)
    }
    if(mouse_pressed && props.tool === 'selection-tool' && !selMan.isEmpty()) {
      let pt = canvas_to_point(e,scale, offset)
      let diff:Point = pt.minus(mouse_start)
      selMan.getFullSelection().forEach((it,i) => {
        it.x = offsets[i].x + diff.x
        it.y = offsets[i].y + diff.y
        props.provider.fire(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, it)
      })
    }
  }
  const mouseUp = (e:MouseEvent<HTMLCanvasElement>) => {
    set_mouse_pressed(false)
    set_mouse_start(new Point(0,0))
  }

  const showContextMenu = (e:MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    set_mouse_pressed(false)
    // let sel = selMan.getFullSelection()
    if(!selMan.isEmpty()) {
      let pt = canvas_to_point(e,1, offset)
      // @ts-ignore
      const rect = e.target.getBoundingClientRect();
      pt.y -= rect.height
      // let node = selMan.getSelection()
      let menu:any[] = []
      if(!selMan.isEmpty()) {
        let nodes:any[] = selMan.getFullSelection()
        menu.push({
          title: 'delete',
          icon: 'delete',
          fun: () => nodes.forEach(item => props.provider.deleteChild(item))
        })
        if(nodes.length >=  2) {
          menu.push({
            title:'horizontal align',
            fun:() => {
              let it = nodes[0]
              let center = new Point(it.x+it.w/2,it.y)
              nodes.forEach(it => it.x = center.x - it.w/2)
              props.provider.fire(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, it)
            }
          })
          menu.push({
            title:'vertical align',
            fun:() => {
              let it = nodes[0]
              let center = new Point(it.x,it.y+it.h/2)
              nodes.forEach(it => it.y = center.y - it.h/2)
              props.provider.fire(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, it)
            }
          })
        }
      }
      // const menu = props.provider.calculateContextMenu(node)
      pm.show(<ContextMenu menu={menu} />, e.target, pt)
    }
  }
  return <div className="panel">
    <canvas style={{border: '1px solid red', width:`100%`, height:`100%`}}
      width={bounds.width()} height={bounds.height()}
      ref={canvas}
      onMouseDown={mouseDown}
      onMouseMove={mouseMove}
      onMouseUp={mouseUp}
      onContextMenu={showContextMenu}
    />
  </div>
}

