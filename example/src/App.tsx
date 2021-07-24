import 'vized/dist/index.css'
import React, { Component, useContext, useEffect, useRef } from "react";
import "./css/grid.css"
import "./css/treetable.css"
import "./css/propsheet.css"
import {TreeTable, SelectionManager, SelectionManagerContext, PropSheet, SELECTION_MANAGER, TREE_ITEM_PROVIDER, TreeItemProvider} from "vized"
// @ts-ignore
import {PopupContainer, Spacer} from 'appy-comps'

const selMan = new SelectionManager()
type Props = {
  provider:any,
}
type State = {
  leftDivider:string,
  rightDivider:string,
  bottomDivider:string,
}
export class RectDocApp extends Component<Props, State> {
  constructor({ props }: { props: any }) {
    super(props)
    this.state = {
      leftDivider: '250px',
      rightDivider: '250px',
      bottomDivider:'0px',
    }
  }
  render() {
    const gridStyle = {
      gridTemplateColumns: `${this.state.leftDivider} 0px 1fr 0px ${this.state.rightDivider}`,
      gridTemplateRows: `2rem 1fr 2rem 0px ${this.state.bottomDivider}`,
    }
    return (
    <SelectionManagerContext.Provider value={selMan}>
    <div className="grid" style={gridStyle}>
      <div className="toolbar gray">
        <button onClick={() => this.props.provider.save()} title={'save project'}>save</button>
      </div>

      <Resizer onMouseDown={this.resizeLeft}/>

      <div className="toolbar gray">
        {/*<button onClick={(e)=>showAddPopup(e,this.props.provider)}>add</button>*/}
      </div>

      <Resizer onMouseDown={this.resizeRight}/>

      <div className="toolbar gray">
        <label>My Cool Editor</label>
      </div>


      <div className={'panel high-2'}>
          <TreeTable root={this.props.provider.getSceneRoot()} provider={this.props.provider}/>
      </div>


      <Resizer onMouseDown={this.resizeLeft}/>

      <div className="panel">
        <RectCanvas provider={this.props.provider}/>
      </div>

      <Resizer onMouseDown={this.resizeRight}/>

      <div className={'panel high-2'} style={{ backgroundColor: '#ecf0f1'}}>
        <PropSheet provider={this.props.provider}/>
      </div>



      <Resizer onMouseDown={this.resizeLeft}/>
      <div className="toolbar">
        <button onClick={this.toggleLeftPane}>toggle left</button>
        <Spacer/>
        <label>status bar</label>
        <Spacer/>
        <button onClick={this.toggleRightPane}>toggle right</button>
      </div>
      <Resizer onMouseDown={this.resizeRight}/>
      <PopupContainer/>

    </div>
  </SelectionManagerContext.Provider>)

  }


  //event handlers
  resizeLeft = () => {
    window.addEventListener('mousemove',this.resizeLeftWindow)
    window.addEventListener('mouseup', this.endResizeLeftWindow)
  }
  resizeLeftWindow =(e:MouseEvent) => {
    this.setState({leftDivider:e.clientX+'px'})
  }
  endResizeLeftWindow = () => {
    window.removeEventListener('mousemove', this.resizeLeftWindow)
    window.removeEventListener('mouseup', this.endResizeLeftWindow)
  }


  resizeRight = () => {
    window.addEventListener('mousemove', this.resizeRightWindow)
    window.addEventListener('mouseup', this.endResizeRightWindow)
  }
  resizeRightWindow = (e:MouseEvent)=>{
    // @ts-ignore
    const size = document.querySelector('.grid').getBoundingClientRect()
    this.setState({rightDivider:(size.width-e.clientX)+'px'})
  }
  // @ts-ignore
  endResizeRightWindow = (e:MouseEvent) => {
    window.removeEventListener('mousemove', this.resizeRightWindow)
    window.removeEventListener('mouseup', this.endResizeRightWindow)
  }

  toggleLeftPane = () => {
    if(this.state.leftDivider === '0px') {
      this.setState({leftDivider:'250px'})
    } else {
      this.setState({leftDivider:'0px'})
    }
  }
  toggleRightPane = () => {
    if(this.state.rightDivider === '0px') {
      this.setState({rightDivider:'250px'})
    } else {
      this.setState({rightDivider:'0px'})
    }
  }
  toggleBottomPane = () => {
    if(this.state.bottomDivider === '0px') {
      this.setState({bottomDivider:'250px'})
    } else {
      this.setState({bottomDivider:'0px'})
    }
  }

}

const Resizer = (props:any) => {
  return <div className="resizer" {...props}/>
}

function RectCanvas(props:{provider:TreeItemProvider}) {
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
    const c = can.getContext('2d') as CanvasRenderingContext2D
    c.fillStyle = 'white'
    c.fillRect(0, 0, can.width, can.height)
    c.save()
    props.provider.getSceneRoot().children.forEach((ch:any) => {
      c.fillStyle = ch.color
      c.fillRect(ch.x,ch.y,ch.w,ch.h)
    })
    c.restore()
  }

  return <div className="panel">
    <canvas style={{border: '1px solid red', width:'300px', height:'300px'}}
            width={300} height={300} ref={canvas}
            // onClick={this.onClick}
            // onMouseDown={this.mouseDown}
            // onMouseUp={this.mouseUp}
            // onMouseMove={this.mouseMove}
    />
  </div>
}
