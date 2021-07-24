import React, {Component} from 'react'
// @ts-ignore
// import {PopupManager, VBox, PopupManagerContext} from 'appy-comps'
import {makePoint} from './utils'
import { PopupManagerContext } from './util/PopupManager';
import { VBox } from './util/Hbox';

const GridLayout = (props:{
  showRight: boolean;
  showLeft: boolean;
  rightWidth: number;
  leftWidth: number;
  children:any[]
}) => {
  let clss = "grid fill";
  let leftWidth = props.leftWidth
  let rightWidth = props.rightWidth
  if (!props.showLeft) {
    clss += ' hide-left'
    leftWidth = 0
  }
  if (!props.showRight) {
    clss += ' hide-right'
    rightWidth = 0
  }
  const cols = `
    [left] ${leftWidth}px
    [left-resize] 2px
    [center] auto
    [right-resize] 2px
    [right] ${rightWidth}px
    `
  const style = {gridTemplateColumns:cols}
  return <div className={clss} style={style}>{props.children}</div>
};

// export const Toolbar = (props:{
//   left: boolean;
//   scroll: boolean;
//   middle: boolean;
//   center: boolean;
//   top: boolean;
//   bottom: boolean;
//   right: boolean;
//   children:any[]
// }) => {
//   let cls = "toolbar";
//   if (props.left) cls += " left";
//   if (props.right) cls += " right";
//   if (props.bottom) cls += " bottom";
//   if (props.top) cls += " top";
//   if (props.center) cls += " center";
//   if (props.middle) cls += " middle";
//   if (props.scroll) cls += " scroll";
//   return <div className={cls}>{props.children}</div>
// };
//
// export const Panel = (props:{
//   transparent: boolean;
//   left: boolean;
//   scroll: boolean;
//   middle: boolean;
//   center: boolean;
//   top: boolean;
//   bottom: boolean;
//   right: boolean;
//   children:any[]
//
// }) => {
//   let cls = 'panel';
//   if (props.left) cls += " left";
//   if (props.right) cls += " right";
//   if (props.bottom) cls += " bottom";
//   if (props.top) cls += " top";
//   if (props.center) cls += " center";
//   if (props.middle) cls += " middle";
//   if (props.scroll) cls += " scroll";
//   if (props.transparent) cls += " transparent"
//   return <div className={cls}>{props.children}</div>
// };
export const Spacer = () => {
  return <span className='spacer'/>
};

export const ToggleButton = (props:{selected:any,}) => {
  const {selected, ...rest} = props
  const clss = selected?"selected":""
  return <button className={clss} {...rest}/>
}

export const MenuPopup = (props:{actions:any[]}) => {
  return <PopupManagerContext.Consumer>{(pm:any) => (
    <VBox className={"popup-menu"}>
      {props.actions.map((act:any,i:number)=>{
        if(act.divider) return <div className="divider" key={i}/>
        let enabled = false
        if(typeof act.enabled === 'undefined') enabled = true
        if(act.enabled === true) enabled = true
        return <button  key={i}
                        disabled={!enabled}
                        onClick={()=>{
                          pm.hide();
                          if(act.fun) act.fun()
                        }}><i className={act.icon}/> {act.title}</button>
      })}
    </VBox>
  )}</PopupManagerContext.Consumer>
}

type GridEditorAppState = {
  showLeft:boolean,
  showRight:boolean,
  leftWidth:number,
  rightWidth:number,
  dragSide:string,
}
export class GridEditorApp extends Component<{},GridEditorAppState> {
  constructor(props:{}) {
    super(props)
    this.state = {
      showLeft: true,
      showRight: true,
      leftWidth:250,
      rightWidth:250,
      dragSide:'none'
    }
  }
  // toggleLeftPane = () => this.setState({showLeft: !this.state.showLeft})
  // toggleRightPane = () => this.setState({showRight: !this.state.showRight})
  onMouseDownLeft = (e:MouseEvent):void => {
    e.preventDefault()
    e.stopPropagation()
    this.setState({dragSide:'left'})
    window.addEventListener('mousemove',this.onMouseMove)
    window.addEventListener('mouseup',this.onMouseUp)
  }
  onMouseDownRight = (e:Event) => {
    e.preventDefault()
    e.stopPropagation()
    this.setState({dragSide:'right'})
    window.addEventListener('mousemove',this.onMouseMove)
    window.addEventListener('mouseup',this.onMouseUp)
  }
  onMouseMove = (e:MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const cursor = makePoint(e.clientX, e.clientY)
    if(this.state.dragSide === 'left')  this.setState({leftWidth:cursor.x})
    if(this.state.dragSide === 'right') this.setState({rightWidth:window.innerWidth-cursor.x})
  }
  onMouseUp = (e:MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
  }
  render() {
    return <GridLayout showLeft={this.state.showLeft}
                       showRight={this.state.showRight}
                       leftWidth={this.state.leftWidth}
                       rightWidth={this.state.rightWidth}
    >

      <div className={'left-resize'}  onMouseDown={()=>{

      }}/>
      <div className={'right-resize'} onMouseDown={()=>{
      }}/>
    <b>grid edit app</b>
      {this.props.children}
    </GridLayout>
  }
}
