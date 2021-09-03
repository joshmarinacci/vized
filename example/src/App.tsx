import 'vized/dist/index.css'
import React, { Component, MouseEvent} from "react";
import "./css/general.css"
import "./css/grid.css"
import "./css/treetable.css"
import "./css/propsheet.css"
import {TreeTable, SelectionManager, SelectionManagerContext, PopupManager, PopupManagerContext, PopupContainer,
  StorageManager, StorageManagerContext, Spacer,
} from "vized"


import { RectDocEditor} from "./RectDocEditor";
import { RectCanvas } from "./canvas";
import { PropSheet } from "./propsheet2";
import {
  ButtonGroup, DropdownMenu,
  ExportButton, ImageIconButton,
  KeyboardWatcher,
  LoadButton, PNGButton,
  SaveButton,
  SelectedButton
} from "./components";
import { TextboxPowerup } from "./textbox_powerup";
import { CirclePowerup } from "./circle_powerup";

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
  grid:boolean,
  group_overlay:boolean,
  zoom:number,
}

let provider = new RectDocEditor({})
provider.addPowerup(TextboxPowerup)
provider.addPowerup(CirclePowerup)

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



export class RectDocApp extends Component<Props, State> {
  constructor({ props }: { props: any }) {
    super(props)
    this.state = {
      leftDivider: '250px',
      rightDivider: '250px',
      bottomDivider:'0px',
      tool:'selection-tool',
      grid:false,
      group_overlay:false,
      zoom:0,
    }
  }
  render() {
    const gridStyle = {
      gridTemplateColumns: `${this.state.leftDivider} 0px 1fr 0px ${this.state.rightDivider}`,
      gridTemplateRows: `3rem 1fr 2rem 0px ${this.state.bottomDivider}`,
    }

    return (

    <div className="grid" style={gridStyle}>
      <div className="toolbar gray bottom-border">
        <DropdownMenu provider={this.props.provider} title={"File"}>
          <ExportButton provider={this.props.provider}/>
          <SaveButton provider={this.props.provider}/>
          <LoadButton provider={this.props.provider}/>
          <PNGButton provider={this.props.provider}/>
        </DropdownMenu>
        <DropdownMenu provider={this.props.provider} title={"Objects"}>
          <ImageIconButton icon={"plus"} onClick={() => this.props.provider.add_square(selMan.getSelection())} text={"square"}/>
          <ImageIconButton icon={"plus"} onClick={() => this.props.provider.add_circle(selMan.getSelection())} text={"circle"}/>
          <ImageIconButton icon={"plus"} onClick={() => this.props.provider.add_group(selMan.getSelection())} text={"group"}/>
        </DropdownMenu>
      </div>

      <Resizer onMouseDown={this.resizeLeft}/>

      <div className="toolbar gray bottom-border">
        <ButtonGroup>
          <ImageIconButton icon={"mouse-cursor"} onClick={()=> this.setState({tool:'selection-tool'})} selected={this.state.tool==='selection-tool'}/>
          <ImageIconButton icon={"move-shape"} onClick={()=> this.setState({tool:'move-tool'})} selected={this.state.tool==='move-tool'}/>
        </ButtonGroup>
        <ImageIconButton selected={this.state.grid} icon={'grid'} onClick={()=>this.setState({grid:!this.state.grid})}/>
        <SelectedButton onClick={()=> this.setState({group_overlay:!this.state.group_overlay})} selected={this.state.group_overlay}>group overlay</SelectedButton>
        <ImageIconButton icon={"circle-minus"} onClick={()=>this.setState({zoom:this.state.zoom-1})}/>
        <label>{this.state.zoom}</label>
        <ImageIconButton icon={'circle-plus'} onClick={()=> this.setState({zoom:this.state.zoom+1})}/>
        <button onClick={()=>this.props.provider.do_layout()}>layout</button>
      </div>

      <Resizer onMouseDown={this.resizeRight}/>

      <div className="toolbar gray bottom-border">
        <label>Properties</label>
      </div>


      <div className={'panel high-2'}>
          <TreeTable root={this.props.provider.getSceneRoot()} provider={this.props.provider}/>
      </div>


      <Resizer onMouseDown={this.resizeLeft}/>

      <div className="panel">
        <RectCanvas provider={this.props.provider} tool={this.state.tool} grid={this.state.grid} zoom={this.state.zoom} group_overlay={this.state.group_overlay}/>
      </div>

      <Resizer onMouseDown={this.resizeRight}/>

      <div className={'panel high-2'} style={{ backgroundColor: '#ecf0f1'}}>
        <PropSheet provider={this.props.provider}/>
      </div>



      <Resizer onMouseDown={this.resizeLeft}/>
      <div className="toolbar top-border">
        <ImageIconButton icon={'caret-left'} onClick={this.toggleLeftPane}/>
        <Spacer/>
        <label>status bar</label>
        <Spacer/>
        <ImageIconButton icon={'caret-right'} onClick={this.toggleRightPane}/>
      </div>
      <Resizer onMouseDown={this.resizeRight}/>
      <PopupContainer/>
      <KeyboardWatcher provider={this.props.provider}/>
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

