import 'vized/dist/index.css'
import React, { Component, useContext, MouseEvent } from "react";
import "./css/grid.css"
import "./css/treetable.css"
import "./css/propsheet.css"
import "./css/components.css"
import {TreeTable, SelectionManager, SelectionManagerContext, TreeItemProvider,
  PopupManager, PopupManagerContext, PopupContainer,
  StorageManager, StorageManagerContext, Spacer,
  makeFromDef
} from "vized"


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCaretRight, faCaretLeft
} from "@fortawesome/free-solid-svg-icons";
import { RectDocEditor, SquareDef } from "./RectDocEditor";
import { RectCanvas } from "./canvas";
import { PropSheet } from "./propsheet2";


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
  tool:string,
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

function LoadButton(props: { provider: TreeItemProvider }) {
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

function PNGButton(props: { provider: TreeItemProvider }) {
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

function AddChildButton(props:{provider:RectDocEditor}) {
  const on_click = () => {
    let root = props.provider.getSceneRoot()
    if(props.provider.canAddChild(root)) {
      const square1 = makeFromDef(SquareDef,{id:'sq4',w:50})
      provider.appendChild(root,square1)
    }
  }
  return <button onClick={on_click} title={'add child'}>add</button>
}

export class RectDocApp extends Component<Props, State> {
  constructor({ props }: { props: any }) {
    super(props)
    this.state = {
      leftDivider: '250px',
      rightDivider: '250px',
      bottomDivider:'0px',
      tool:'selection-tool',
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
        <AddChildButton provider={provider}/>
        <button onClick={()=> this.setState({tool:'selection-tool'})}>select</button>
        <button onClick={()=> this.setState({tool:'move-tool'})}>move</button>
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
        <RectCanvas provider={this.props.provider} tool={this.state.tool}/>
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
  resizeLeft = (e:MouseEvent<HTMLElement>) => {
    // @ts-ignore
    window.addEventListener('mousemove',this.resizeLeftWindow)
    // @ts-ignore
    window.addEventListener('mouseup', this.endResizeLeftWindow)
  }
  resizeLeftWindow = (e:MouseEvent<MouseEvent>):any => {
    this.setState({leftDivider:e.clientX+'px'})
  }
  endResizeLeftWindow = (e:MouseEvent<HTMLElement>) => {
    // @ts-ignore
    window.removeEventListener('mousemove', this.resizeLeftWindow)
    // @ts-ignore
    window.removeEventListener('mouseup', this.endResizeLeftWindow)
  }


  resizeRight = (e:MouseEvent<HTMLElement>) => {
    // @ts-ignore
    window.addEventListener('mousemove', this.resizeRightWindow)
    // @ts-ignore
    window.addEventListener('mouseup', this.endResizeRightWindow)
  }
  resizeRightWindow = (e:MouseEvent<HTMLElement>)=>{
    // @ts-ignore
    const size = document.querySelector('.grid').getBoundingClientRect()
    this.setState({rightDivider:(size.width-e.clientX)+'px'})
  }

  endResizeRightWindow = (e:MouseEvent<HTMLElement>) => {
    // @ts-ignore
    window.removeEventListener('mousemove', this.resizeRightWindow)
    // @ts-ignore
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

