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
import "./css/canvas.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAlignCenter } from "@fortawesome/free-solid-svg-icons/faAlignCenter";

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

  bottom_center() {
    return new Point((this.x+this.x2)/2,this.y2)
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

function calc_node_bounds(nodes:any[]):Rect {
  let bounds = new Rect(0,0,0,0)
  bounds.x = 10000
  bounds.y = 10000
  bounds.x2 = -1000
  bounds.y2 = -1000
  nodes.forEach((ch:any) => {
    if(ch.x < bounds.x) bounds.x = ch.x
    if(ch.x + ch.w > bounds.x2) bounds.x2 = ch.x+ch.w
    if(ch.y < bounds.y) bounds.y = ch.y
    if(ch.y + ch.h > bounds.y2) bounds.y2 = ch.y+ch.h
  })
  return bounds
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

function draw_shapes(ctx: DrawingContext, c: CanvasRenderingContext2D):void {
  ctx.provider.getSceneRoot().children.forEach((ch:any) => {
    c.fillStyle = ctx.provider.getColorValue(ch,'color')
    let bds = ctx.provider.getBoundsValue(ch)
    bds.fill(c,ctx.provider.getColorValue(ch,'color'))
    let bw = ctx.provider.getNumberValue(ch,'borderWidth')
    if(bw > 0) bds.stroke(c,ctx.provider.getColorValue(ch,'borderColor'),bw)
    if(ctx.selection.isSelected(ch)) {
      bds.stroke(c,'red',3)
      bds.stroke(c,'black',1)
    }
  })

}

function draw_to_canvas(ctx:DrawingContext, grid:boolean) {
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
  draw_shapes(ctx,c)
  draw_selection_bounds(ctx,c)
  draw_handles_overlay(ctx,c)

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
export function RectCanvas(props:{provider:RectDocEditor, tool:string, grid:boolean, zoom:number}) {
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
    set_handles(sel.map((n:any) => {
      return new Handle(n.x+n.w-5,n.y+n.h-5,10,10,n)
    }))
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
  },[selMan,canvas,count,props.grid,props.zoom,sel_bounds])

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
      draw_to_canvas(ctx, props.grid)
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
    if(hands.length > 0) {
      return set_drag_handle(hands[0])
    }
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
      let sb = calc_node_bounds(selMan.getFullSelection())
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
        it.x = offsets[i].x + diff.x
        it.y = offsets[i].y + diff.y
        handles.forEach(h => {
          if(h.target === it) {
            h.moveTo(new Point(it.x + it.w, it.y + it.h))
          }
        })
      })
      props.provider.fire(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, selMan.getFullSelection())
      set_sel_bounds(calc_node_bounds(selMan.getFullSelection()))
    }
  }
  const mouseUp = (e:MouseEvent<HTMLCanvasElement>) => {
    if(drag_handle) set_drag_handle(null as unknown as Handle)
    set_mouse_pressed(false)
    set_mouse_start(new Point(0,0))
    let sb = calc_node_bounds(selMan.getFullSelection())
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

