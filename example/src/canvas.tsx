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

class Rect {
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
}

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

function draw_to_canvas(can: HTMLCanvasElement, provider:TreeItemProvider, scale: number, selMan: SelectionManager, bounds:Rect) {
  const c = can.getContext('2d') as CanvasRenderingContext2D
  c.fillStyle = 'white'
  c.fillRect(0, 0, bounds.x2, bounds.y2)
  c.save()
  c.scale(scale,scale)
  c.translate(-bounds.x,-bounds.y)

  bounds.fill(c,'cyan')

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

// @ts-ignore
function canvas_to_point(e: MouseEvent, scale:number):Point {
  // @ts-ignore
  let rect = e.target.getBoundingClientRect()
  // let rect = e.target.getClientBounds()
  return new Point(e.clientX-rect.x, e.clientY-rect.y).divide(scale)
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
  let [zoom] = useState(0)
  let [bounds, set_bounds] = useState(new Rect(0,0,10,10))
  // @ts-ignore
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
    // @ts-ignore
    let can = canvas.current as HTMLCanvasElement
    let bds = calc_scene_bounds(props.provider)
    if(!bds.equal(bounds)) {
      set_bounds(bds)
      set_count(count+1)
    } else {
      draw_to_canvas(can, props.provider, scale, selMan, bds)
    }
  }

  let [mouse_pressed, set_mouse_pressed] = useState(false)
  let [mouse_start, set_mouse_start] = useState(new Point(0,0))
  let [offsets, set_offsets] = useState([] as Point[])

  const mouseDown = (e:MouseEvent<HTMLCanvasElement>) => {
    let pt = canvas_to_point(e,scale)
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
    if(mouse_pressed && !selMan.isEmpty()) {
      let pt = canvas_to_point(e,scale)
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

  const contextMenu = (e:MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    set_mouse_pressed(false)
    // let sel = selMan.getFullSelection()
    if(!selMan.isEmpty()) {
      let pt = canvas_to_point(e,1)
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
  // let bds = calc_scene_bounds(props.provider)
  let w = bounds.width()
  let h = bounds.height()
  return <div className="panel">
    <canvas style={{border: '1px solid red', width:`${w}px`, height:`${h}px`}}
    width={w} height={h} ref={canvas}
      onMouseDown={mouseDown}
      onMouseMove={mouseMove}
      onMouseUp={mouseUp}
            onContextMenu={contextMenu}
    />
  </div>
}

