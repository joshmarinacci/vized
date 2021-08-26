import React, { useContext, useEffect, useRef, MouseEvent, useState } from "react";
import {
  SelectionManagerContext,
  SELECTION_MANAGER, TREE_ITEM_PROVIDER,
  SelectionManager,
  ContextMenu,
  PopupManagerContext,
  Point
} from "vized"
import { RectDocEditor } from "./RectDocEditor";
import "./css/canvas.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAlignCenter } from "@fortawesome/free-solid-svg-icons/faAlignCenter";

export class Rect {
  x: number
  y: number
  x2: number
  y2: number
  private empty: boolean;
  constructor(x: number, y: number, w: number, h: number, empty?:boolean) {
    this.x = x
    this.y = y
    this.x2 = x+w
    this.y2 = y+h
    this.empty = empty?empty:false
  }

  union_self(rect:Rect) {
    if(rect.empty) return
    // if(this.empty && !rect.empty) {
    //   this.x = rect.x
    //   this.y = rect.y
    //   this.x2 = rect.x2
    //   this.y2 = rect.y2
    //   return
    // }
    if(rect.x < this.x) {
      this.x = rect.x
      this.empty = false
    }
    if(rect.y < this.y) {
      this.y = rect.y
      this.empty = false
    }
    if(rect.x2 > this.x2) {
      this.x2 = rect.x2
      this.empty = false
    }
    if(rect.y2 > this.y2) {
      this.y2 = rect.y2
      this.empty = false
    }
  }

  fill(c: CanvasRenderingContext2D, color: string) {
    c.fillStyle = color
    c.fillRect(this.x,this.y,this.x2-this.x,this.y2-this.y)
  }
  stroke(c: CanvasRenderingContext2D, color: string, lineWidth:number) {
    c.lineWidth = lineWidth
    c.strokeStyle = color
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

  bottom_center():Point {
    return new Point((this.x+this.x2)/2,this.y2)
  }

  translate(point:Point) {
    return new Rect(this.x + point.x, this.y + point.y, this.width(),this.height(), this.empty)
  }

  isEmpty() {
    return this.empty
  }

  makeEmpty() {
    let bounds = new Rect(0,0,0,0)
    bounds.x = 10000
    bounds.y = 10000
    bounds.x2 = -1000
    bounds.y2 = -1000
    bounds.empty = true
    return bounds
  }
}


type DrawingContext = {
  selection: SelectionManager;
  canvas:HTMLCanvasElement,
  provider:RectDocEditor,
  scale:number,
  pageBounds:Rect,
  canvasBounds:Rect,
  selectionBounds:Rect,
  offset:Point,
  handles:Handle[],
}

function draw_grid_overlay(ctx:DrawingContext,c:CanvasRenderingContext2D):void {
  c.strokeStyle = 'black'
  c.beginPath()
  for(let x=0; x<ctx.pageBounds.x2; x+=32) {
    c.moveTo(x, 0)
    c.lineTo(x, ctx.pageBounds.y2)
  }
  for(let y=0; y<ctx.pageBounds.y2; y+=32) {
    c.moveTo( 0,y)
    c.lineTo(ctx.pageBounds.x2,y)
  }
  c.stroke()
}

function draw_handles_overlay(ctx: DrawingContext, c: CanvasRenderingContext2D):void {
  ctx.handles.forEach((h:Rect) => {
    h.stroke(c,'green',1)
  })
}

function draw_selection_bounds(ctx: DrawingContext, c: CanvasRenderingContext2D):void {
  ctx.selectionBounds.stroke(c,"red",1)
}

function draw_page_overlay(ctx: DrawingContext, c: CanvasRenderingContext2D):void {
  ctx.pageBounds.fill(c,'white')
}

function draw_square(ctx: DrawingContext, c: CanvasRenderingContext2D, ch: any) {
  c.fillStyle = ctx.provider.getColorValue(ch, 'color')
  let bds = ctx.provider.getBoundsValue(ch)
  bds.fill(c, ctx.provider.getColorValue(ch, 'color'))
  let bw = ctx.provider.getNumberValue(ch, 'borderWidth')
  if (bw > 0) bds.stroke(c, ctx.provider.getColorValue(ch, 'borderColor'), bw)
  if (ctx.selection.isSelected(ch)) {
    bds.stroke(c, 'red', 3)
    bds.stroke(c, 'black', 1)
  }
}

function draw_group(ctx: DrawingContext, c: CanvasRenderingContext2D, ch: any) {
  if(ch.type === 'group') {
    let bds = ctx.provider.calc_group_bounds_value(ch)
    // bds.stroke(c,'purple',4)
    if (ctx.selection.isSelected(ch)) {
      bds.stroke(c, 'red', 3)
      bds.stroke(c, 'black', 1)
    }
  }
  c.save()
  c.translate(ch.x,ch.y)
  ch.children.forEach((ch:any)=>{
    if(ch.type === 'square') draw_square(ctx,c,ch)
    if(ch.type === 'circle') draw_circle(ctx,c,ch)
    if(ch.type === 'group')  draw_group(ctx,c,ch)
  })
  c.restore()
}

function draw_circle(ctx: DrawingContext, c: CanvasRenderingContext2D, ch: any) {
  c.beginPath()
  c.arc(ch.x,ch.y,ch.radius,0,Math.PI*2)
  c.closePath()
  c.fillStyle = ctx.provider.getColorValue(ch, 'color')
  c.fill()
  let bw = ctx.provider.getNumberValue(ch, 'borderWidth')
  if (bw > 0) {
    c.strokeStyle = ctx.provider.getColorValue(ch, 'borderColor')
    c.lineWidth = bw
    c.stroke()
  }
  if (ctx.selection.isSelected(ch)) {
    let bds = ctx.provider.getBoundsValue(ch)
    bds.stroke(c, 'red', 3)
    bds.stroke(c, 'black', 1)
  }

}

function draw_shapes(ctx: DrawingContext, c: CanvasRenderingContext2D, root:any):void {
  root.children.forEach((ch:any) => {
    if(ch.type === 'square') draw_square(ctx,c,ch)
    if(ch.type === 'circle') draw_circle(ctx,c,ch)
    if(ch.type === 'group')  draw_group(ctx,c,ch)
  })
}

function draw_group_bounds_overlay(ctx: DrawingContext, c: CanvasRenderingContext2D, root:any) {
  root.children.forEach((ch:any) => {
    if(ch.type === 'group')  {
      let bds = ctx.provider.getBoundsValue(ch)
      if(bds.isEmpty()) return
      c.save()
      c.globalAlpha = 0.3
      bds.fill(c,'red')
      c.restore()
    }
  })
}

function draw_to_canvas(ctx:DrawingContext, grid:boolean, group_overlay:boolean) {
  const c = ctx.canvas.getContext('2d') as CanvasRenderingContext2D

  //canvas background
  let rect = ctx.canvas.getBoundingClientRect();
  ctx.canvas.width = rect.width * devicePixelRatio;
  ctx.canvas.height = rect.height * devicePixelRatio;
  c.save()
  c.scale(devicePixelRatio,devicePixelRatio)
  ctx.canvasBounds.fill(c,'#cccccc')

  //scale to content space
  c.save()
  c.scale(ctx.scale,ctx.scale)
  c.translate(ctx.offset.x-ctx.canvasBounds.x,ctx.offset.y-ctx.canvasBounds.y)

  draw_page_overlay(ctx,c)
  if(grid) draw_grid_overlay(ctx,c)
  draw_shapes(ctx,c, ctx.provider.getSceneRoot())
  draw_selection_bounds(ctx,c)
  draw_handles_overlay(ctx,c)
  if(group_overlay) draw_group_bounds_overlay(ctx,c,ctx.provider.getSceneRoot())

  c.restore()
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

function find_handle_at_pt(handles: Handle[], pt: Point):Handle[] {
  return handles.filter((h:any) => h.contains(pt))
}

function toClss(o: any):string{
  let clsses:string[] = []
  Object.entries(o).forEach(([key,value])=>{
    if(value) clsses.push(key)
  })
  return clsses.join(" ")
}

function FloatingNodePanel(props: { visible:boolean, style:any, provider:RectDocEditor }) {
  let selMan = useContext(SelectionManagerContext)
  return <div className={toClss({
    'floating-panel': true,
    visible: props.visible
  })} style={props.style}>
    <button onClick={()=>props.provider.action_horizontal_align(selMan.getFullSelection())}>
      <FontAwesomeIcon icon={faAlignCenter}/>
    </button>
    <button onClick={()=>props.provider.action_vertical_align(selMan.getFullSelection())}>align vert</button>
  </div>
}
class Handle extends Rect {
  target: any;
  constructor(x:number,y:number,w:number,h:number,n:any) {
    super(x,y,w,h);
    this.target = n
  }
  moveTo(pt:Point) {
    this.x = pt.x-5
    this.y = pt.y-5
    this.x2 = this.x+10
    this.y2 = this.y+10
    this.target.w = this.x + 5 - this.target.x
    this.target.h = this.y + 5 - this.target.y
  }
}

function position_node(it:any, add: Point) {
  it.x = add.x
  it.y = add.y
}

export function RectCanvas(props:{provider:RectDocEditor, tool:string, grid:boolean, group_overlay:boolean, zoom:number}) {
  let canvas = useRef<HTMLCanvasElement>(null);
  let selMan = useContext(SelectionManagerContext)
  let [bounds, set_bounds] = useState(new Rect(0,0,10,10))
  let [page] = useState(new Rect(0,0,800,800))
  let [offset, set_offset] = useState(new Point(10,10))
  let [count, set_count] = useState(0)
  let [show_floating_panel, set_show_floating_panel] = useState(false)
  let [float_position, set_float_position] = useState(new Point(0,0))
  let [sel_bounds, set_sel_bounds] = useState(new Rect(0,0,10,10))
  let [handles, set_handles] = useState([] as Handle[])

  const updateHandles = () => {
    let sel:any[] = selMan.getFullSelection()
    //don't make a handle for anything but squares
    set_handles(sel.filter((n:any) => n.type === 'square').map((n:any) => {
      return new Handle(n.x+n.w-5,n.y+n.h-5,10,10,n)
    }))
    set_sel_bounds(props.provider.calc_node_array_bounds(selMan.getFullSelection()))
    redraw()
  }
  useEffect(() => {
    if(canvas.current) redraw()
    selMan.on(SELECTION_MANAGER.CHANGED, updateHandles)
    props.provider.on(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, redraw)
    props.provider.on(TREE_ITEM_PROVIDER.STRUCTURE_ADDED, redraw)
    props.provider.on(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, redraw)
    props.provider.on(TREE_ITEM_PROVIDER.STRUCTURE_REMOVED, redraw)
    return () => {
      selMan.off(SELECTION_MANAGER.CHANGED,updateHandles)
      props.provider.off(TREE_ITEM_PROVIDER.PROPERTY_CHANGED, redraw)
      props.provider.off(TREE_ITEM_PROVIDER.STRUCTURE_ADDED, redraw)
      props.provider.off(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, redraw)
      props.provider.off(TREE_ITEM_PROVIDER.STRUCTURE_REMOVED, redraw)
    }
  },[selMan,canvas,count,props.grid,props.zoom,props.group_overlay,sel_bounds])

  const pm = useContext(PopupManagerContext)

  let scale = Math.pow(2,props.zoom)

  const redraw = () => {
    if(!canvas.current) return
    let can = canvas.current as HTMLCanvasElement
    // let scene_bounds = calc_scene_bounds(props.provider)
    let bds = new Rect(0,0,can.clientWidth, can.clientHeight)
    if(!bds.equal(bounds)) {
      set_bounds(bds)
      set_count(count+1)
    } else {
      let ctx:DrawingContext = {
        canvas:can,
        provider:props.provider,
        scale:scale,
        pageBounds:page,
        canvasBounds:bds,
        selectionBounds:sel_bounds,
        offset:offset,
        handles:handles,
        selection:selMan,
      }
      draw_to_canvas(ctx, props.grid, props.group_overlay)
    }
  }

  let [mouse_pressed, set_mouse_pressed] = useState(false)
  let [mouse_start, set_mouse_start] = useState(new Point(0,0))
  let [offsets, set_offsets] = useState([] as Point[])
  let [drag_handle, set_drag_handle] = useState(null as unknown as Handle)

  const mouseDown = (e:MouseEvent<HTMLCanvasElement>) => {
    let pt = canvas_to_point(e,scale, offset)
    let hands = find_handle_at_pt(handles,pt)
    set_mouse_start(pt)
    set_mouse_pressed(true)
    if(hands.length > 0)  return set_drag_handle(hands[0])
    let nodes = find_node_at_pt(props.provider,pt)
    if(nodes.length > 0) {
      if(e.shiftKey) {
        selMan.addToSelection(nodes[0])
      } else {
        if(!selMan.isSelected(nodes[0])) selMan.setSelection(nodes[0])
      }
      if(e.altKey) {
        if(e.shiftKey) {
          let new_nodes = props.provider.do_duplicate_linked(nodes[0], false)
          selMan.setSelection(new_nodes)
        } else {
          let new_nodes = props.provider.do_duplicate(nodes[0], false)
          selMan.setSelection(new_nodes)
        }
      }
    } else {
      selMan.clearSelection()
      set_show_floating_panel(false)
    }
    set_offsets(selMan.getFullSelection().map(it => new Point(it.x,it.y)) as Point[])
    if(selMan.getFullSelection().length >= 2) {
      set_show_floating_panel(true)
      let sb = props.provider.calc_node_array_bounds(selMan.getFullSelection())
      set_float_position(sb.bottom_center().floor())
      set_sel_bounds(sb)
    }
  }
  const mouseMove = (e:MouseEvent<HTMLCanvasElement>) => {
    if(drag_handle) {
      let pt = canvas_to_point(e,scale,offset)
      drag_handle.moveTo(pt)
      redraw()
      return
    }
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
        position_node(it,offsets[i].add(diff))
        handles.forEach(h => {
          if(h.target === it) {
            h.moveTo(new Point(it.x + it.w, it.y + it.h))
          }
        })
      })
      props.provider.fire(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, selMan.getFullSelection())
      set_sel_bounds(props.provider.calc_node_array_bounds(selMan.getFullSelection()))
    }
  }
  const mouseUp = (e:MouseEvent<HTMLCanvasElement>) => {
    if(drag_handle) set_drag_handle(null as unknown as Handle)
    set_mouse_pressed(false)
    set_mouse_start(new Point(0,0))
    let sb = props.provider.calc_node_array_bounds(selMan.getFullSelection())
    set_float_position(sb.bottom_center().floor())
    set_sel_bounds(sb)
  }

  const showContextMenu = (e:MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    set_mouse_pressed(false)
    if(!selMan.isEmpty()) {
      let pt = canvas_to_point(e,1, offset)
      // @ts-ignore
      const rect = e.target.getBoundingClientRect();
      pt.y -= rect.height
      let nodes:any[] = selMan.getFullSelection()
      let menu = props.provider.calculateCanvasContextMenu(nodes)
      pm.show(<ContextMenu menu={menu} />, e.target, pt)
    }
  }


  let fp = <FloatingNodePanel
   provider={props.provider}
    visible={show_floating_panel} style={{
    left:`${float_position.x}px`,
    top:`${float_position.y}px`,
  }}/>

  return <div className="panel canvas-wrapper">
    <canvas className={'main-canvas'}
      width={bounds.width()} height={bounds.height()}
      ref={canvas}
      onMouseDown={mouseDown}
      onMouseMove={mouseMove}
      onMouseUp={mouseUp}
      onContextMenu={showContextMenu}
    />
    {fp}
  </div>
}

