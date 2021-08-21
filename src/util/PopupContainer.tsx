import React, { useContext, useEffect, useRef, useState } from "react";
import {PopupManagerContext} from './PopupManager';
import { Point } from "../utils";

export function PopupContainer({}) {
  console.log("making a popup container")
  const PM = useContext(PopupManagerContext)
  const wrapper = useRef<HTMLDivElement>(null)

  const [comp, setComp] = useState(null)
  const [showing, setShowing] = useState(false)
  const [owner, setOwner] = useState(null)
  const [offset, setOffset] = useState(new Point(0,0))

  useEffect(() => {
    // @ts-ignore
    PM.onShow((comp:any, owner:any, off?:Point)=>{
      setComp(comp)
      setShowing(true)
      setOwner(owner)
      if(off) setOffset(off)
      setTimeout(()=>{
        const rect = wrapper.current?.getBoundingClientRect();
        if(!rect) return
        let extent = rect.top + rect.height;
        if(off) {
          extent += off.x
        }
        const max = window.innerHeight;
        if(extent > max) {
              console.log("too far, move it up");
              setOffset(new Point(0,extent-max))
        }
      },25);
    });
    PM.onHide(()=>{
      setComp(null)
      setShowing(false)
    });
  })

  const clickScrim = () =>{
    setComp(null)
    setShowing(false)
    setOffset(new Point(0,0))
  }

  let x = 200;
  let y = 200;
  if(owner) {
    // @ts-ignore
    const rect = owner.getBoundingClientRect();
    x = rect.left + offset.x;
    y = rect.top + rect.height + offset.y;
  }
  return <div style={{
    position:'fixed',
    top:0,
    bottom:0,
    left:0,
    right:0,
    zIndex:100,
    display:showing?'block':'none'
  }}><div
    onClick={clickScrim}
    style={{
      backgroundColor:'red',
      opacity:0.0,
      position:'absolute',
      left:0, right:0, top:0, bottom:0
    }}
  >scrim</div>

    <div
      ref={wrapper}
      id='popup-wrapper'
      style={{
        position: 'absolute',
        left: x+'px',
        top: y+'px',
        border:'0px solid black',
        backgroundColor:'white',
        display:'inline-block'
      }}
    >{comp!==null?comp:'nothing' }</div>
  </div>
}
