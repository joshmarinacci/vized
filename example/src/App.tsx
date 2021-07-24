import 'vized/dist/index.css'
import React, { Component, useContext, useEffect, useRef } from "react";
import "./css/grid.css"
import "./css/treetable.css"
import "./css/propsheet.css"
import "./css/components.css"
import {TreeTable, SelectionManager, SelectionManagerContext, PropSheet, SELECTION_MANAGER, TREE_ITEM_PROVIDER, TreeItemProvider,
  PopupManager, PopupManagerContext, PopupContainer,
  StorageManager, StorageManagerContext, Spacer,
} from "vized"
// @ts-ignore
// import {Spacer} from 'appy-comps'


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCaretRight, faCaretLeft
} from "@fortawesome/free-solid-svg-icons";
import { RectDocEditor } from "./RectDocEditor";


const STORAGE = new StorageManager()
const selMan = new SelectionManager()
const PM = new PopupManager()
type Props = {
  provider:any,
}
type State = {
  leftDivider:string,
  rightDivider:string,
  bottomDivider:string,
}

let provider = new RectDocEditor({})

export function App() {
  return(
    <SelectionManagerContext.Provider value={selMan}>
      <PopupManagerContext.Provider value={PM}>
        <StorageManagerContext.Provider value={STORAGE}>
          <RectDocApp  provider={provider}/>
        </StorageManagerContext.Provider>
      </PopupManagerContext.Provider>
    </SelectionManagerContext.Provider>
  )
}

function ExportButton(props:{provider:TreeItemProvider}) {
  let SM = useContext(StorageManagerContext) as StorageManager
  const save = () => {
    let json = props.provider.save() as object
    SM.forceJSONDownload(json,'graphics')
  }
  return <button onClick={save} title={'save project'}>export</button>
}

function SaveButton(props:{provider:TreeItemProvider}) {
  let SM = useContext(StorageManagerContext) as StorageManager
  const save = () => {
    let json = props.provider.save() as object
    SM.saveToLocalStorage(json,'LAST_DOC')
  }
  return <button onClick={save} title={'save project'}>save</button>
}

function LoadButton(props: { provider: any }) {
  let SM = useContext(StorageManagerContext) as StorageManager
  const load = () => {
    let json = SM.loadFromLocalStorage('LAST_DOC')
    if(json) {
      props.provider.load(json)
    } else {
      console.log("error loading json")
    }
  }
  return <button onClick={load} title={'load last project'}>last</button>
}

function PNGButton(props: { provider: any }) {
  let SM = useContext(StorageManagerContext) as StorageManager
  const doit = () => {
    let canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    let c = canvas.getContext('2d') as CanvasRenderingContext2D
    c.fillStyle = 'white'
    c.fillRect(0,0,100,100)
    c.fillStyle = 'red'
    c.fillRect(20,20,20,20)
    SM.canvasToPNGBlob(canvas).then(blob => SM.forcePNGDownload(blob,'export'))
  }
  return <button onClick={doit} title={'load last project'}>PNG</button>
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

    <div className="grid" style={gridStyle}>
      <div className="toolbar gray">
        <ExportButton provider={this.props.provider}/>
        <SaveButton provider={this.props.provider}/>
        <LoadButton provider={this.props.provider}/>
        <PNGButton provider={this.props.provider}/>
      </div>

      <Resizer onMouseDown={this.resizeLeft}/>

      <div className="toolbar gray">
        {/*<button onClick={(e)=>showAddPopup(e,this.props.provider)}>add</button>*/}
      </div>

      <Resizer onMouseDown={this.resizeRight}/>

      <div className="toolbar gray">
        <label>Rectangles</label>
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
        <button onClick={this.toggleLeftPane}>
          <FontAwesomeIcon icon={faCaretLeft}/>
          </button>
        <Spacer/>
        <label>status bar</label>
        <Spacer/>
        <button onClick={this.toggleRightPane}>
          <FontAwesomeIcon icon={faCaretRight}/>
        </button>
      </div>
      <Resizer onMouseDown={this.resizeRight}/>
      <PopupContainer/>
    </div>)
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

