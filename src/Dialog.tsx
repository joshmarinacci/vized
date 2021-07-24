import React, { useState } from 'react'
import '../css/dialogs.css'

export function Dialog(props: {
  height: number
  width: number
  visible: boolean
  children: any
  onScrimClick: any
}) {
  const [scrim, setScrim] = useState(null as any)
  const clickedScrim = (e: any) => {
    if (e.target !== scrim) return
    if (props.onScrimClick) props.onScrimClick(e)
  }

  if (!props.visible) return <div />
  const bodyStyle = {
    width: 'auto',
    height: 'auto'
  }
  if (props.width) bodyStyle.width = props.width + ''
  if (props.height) bodyStyle.height = props.height + ''
  return (
    <div
      className='dialog-scrim'
      ref={(scrim) => setScrim(scrim)}
      onClick={clickedScrim}
    >
      <div className='dialog-body' style={bodyStyle}>
        {props.children}
      </div>
    </div>
  )
}
