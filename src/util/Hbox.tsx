import React, {Component} from 'react'

export function HBox(props:{children, onClick?:any}) {
  let style = {
    display:'flex',
    direction:'row',
  }
  // @ts-ignore
  return <div style={style} onClick={props.onClick}>{props.children}</div>
}

export function VBox(props:{children, className?:string}) {
  let style = {
    display:'flex',
    direction:'column'
  }
  // @ts-ignore
  return <div style={style} className={props.className}>{props.children}</div>
}
