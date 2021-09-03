import React, { MouseEvent, useContext, useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  Point,
  PopupManagerContext,
  SELECTION_MANAGER,
  SelectionManager,
  SelectionManagerContext,
  TREE_ITEM_PROVIDER
} from "vized";
import { RectDocEditor, SHAPE_TYPES } from "./RectDocEditor";
import "./css/canvas.css";
import { FloatingNodePanel, Rect } from "./components";
import { TreeItem } from "../../src";
import { ObjectDelegate } from "./propsheet2";


type DrawingContext = {
  selection: SelectionManager;
  canvas:HTMLCanvasElement,
  provider:RectDocEditor,
  scale:number,
  pageBounds:Rect,
  canvasBounds:Rect,
  selectionBounds:Rect,
  offset:Point,
  handles:ResizeHandle[],
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

function draw_shapes(ctx: DrawingContext, c: CanvasRenderingContext2D, root:any):void {
  root.children.forEach((ch:any) => {
    if(ctx.provider.hasPowerup(ch.type)) {
      ctx.provider.getPowerup(ch.type).draw(ctx,c,ch);
    }
  })
}

function draw_group_bounds_overlay(ctx: DrawingContext, c: CanvasRenderingContext2D, root:any) {
  root.children.forEach((ch:any) => {
    if(ch.type === SHAPE_TYPES.GROUP)  {
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

function find_handle_at_pt(handles: ResizeHandle[], pt: Point):ResizeHandle[] {
  return handles.filter((h:any) => h.contains(pt))
}

class ResizeHandle extends Rect {
  target: any;
  private delegate: ObjectDelegate;
  constructor(x:number,y:number,w:number,h:number,target:any, delegate:ObjectDelegate) {
    super(x,y,w,h);
    this.target = target
    this.delegate = delegate
  }
  moveTo(pt:Point) {
    this.x = pt.x-5
    this.y = pt.y-5
    this.x2 = this.x+10
    this.y2 = this.y+10
    this.delegate.setPropValue(this.target,'w',this.x+5-this.target.x)
    this.delegate.setPropValue(this.target,'h',this.y+5-this.target.y)
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
  let [offset, set_offset] = useState(new Point(10,10))
  let [count, set_count] = useState(0)
  let [show_floating_panel, set_show_floating_panel] = useState(false)
  let [float_position, set_float_position] = useState(new Point(0,0))
  let [sel_bounds, set_sel_bounds] = useState(new Rect(0,0,10,10))
  let [handles, set_handles] = useState([] as ResizeHandle[])

  const updateHandles = () => {
    let sel:any[] = selMan.getFullSelection()
    //don't make a handle for anything but squares
    function useHandles(ch:TreeItem) {
      if(!props.provider.hasPowerup(ch.type)) return false
      return props.provider.getPowerup(ch.type).useResizeHandle(ch)
    }
    set_handles(sel.filter(useHandles).map((n:any) => new ResizeHandle(n.x+n.w-5,n.y+n.h-5,10,10,n,
      props.provider.getObjectDelegate(n as TreeItem))))
    set_sel_bounds(props.provider.calc_node_array_bounds(selMan.getFullSelection()))
    if(selMan.isEmpty()) set_show_floating_panel(false)
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
        pageBounds:props.provider.getBoundsValue(props.provider.getSceneRoot()),
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
  let [drag_handle, set_drag_handle] = useState(null as unknown as ResizeHandle)

  const mouseDown = (e:MouseEvent<HTMLCanvasElement>) => {
    let pt = canvas_to_point(e,scale, offset)
    let hands = find_handle_at_pt(handles,pt)
    set_mouse_start(pt)
    set_mouse_pressed(true)
    if(hands.length > 0)  return set_drag_handle(hands[0])
    let nodes = find_node_at_pt(props.provider,pt)
    if(nodes.length > 0) {
      let last = nodes[nodes.length-1]
      if(e.shiftKey) {
        selMan.addToSelection(last)
      } else {
        if(!selMan.isSelected(last)) selMan.setSelection(last)
      }
      if(e.altKey) {
        if(e.shiftKey) {
          selMan.setSelection(props.provider.do_duplicate_linked(last, false))
        } else {
          selMan.setSelection(props.provider.do_duplicate(last, false))
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
    if(drag_handle) set_drag_handle(null as unknown as ResizeHandle)
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
      let menu = props.provider.calculateCanvasContextMenu(nodes, selMan)
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

