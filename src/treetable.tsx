import React, { useContext, useEffect, useState } from "react";
import { SELECTION_MANAGER, SelectionManagerContext } from "./SelectionManager";
// @ts-ignore
import { PopupManagerContext, VBox } from 'appy-comps'
import { Spacer } from './GridEditorApp'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  IconName,
  IconPrefix,
  faCaretDown,
  faCaretRight
} from "@fortawesome/free-solid-svg-icons";

import './css/treetable.css'
import { TREE_ITEM_PROVIDER, TreeItem, TreeItemProvider } from "./TreeItemProvider";

const ContextMenu = (props: { menu: any }) => {
  return (
    <PopupManagerContext.Consumer>
      {(pm: any) => (
        <VBox className='popup-menu'>
          {props.menu.map((item: any, i: number) => {
            if (item.divider) return <div className='divider' key={i} />
            let enabled = false
            if (typeof item.enabled === 'undefined') enabled = true
            if (item.enabled === true) enabled = true
            return (
              <button
                key={i}
                disabled={!enabled}
                onClick={() => {
                  pm.hide()
                  if (item.fun) item.fun()
                }}
              >
                <i className={item.icon} /> {item.title}
              </button>
            )
          })}
        </VBox>
      )}
    </PopupManagerContext.Consumer>
  )
}

function DragBars(props: {
  onDragEnd: any
  onDragStart: any
  provider: any
  node: any
}): JSX.Element {
  if (props.provider.canBeMoved && !props.provider.canBeMoved(props.node))
    return <div />
  return (
    <span
      className='drag fa fa-bars'
      draggable
      onDragStart={props.onDragStart}
      onDragEnd={props.onDragEnd}
    />
  )
}

function TreeTableItem(props: {
  depth: number
  node: TreeItem
  provider: TreeItemProvider
  // onDragStart: any
  // onDragOver: any
  // onDragEnd: any
  // onDrop: any
}) {
  const selMan = useContext(SelectionManagerContext)
  const onSelect = (e: any) => {
    if (e.shiftKey) {
      selMan.addToSelection(props.node)
    } else {
      selMan.setSelection(props.node)
    }
  }

  const onContextMenu = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    selMan.setSelection(props.node)
    if (props.provider.calculateContextMenu) {
      const menu = props.provider.calculateContextMenu(props.node)
      // context.show(<ContextMenu menu={menu} />, e.target)
    }
  }

  const toggleItemCollapsed = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    props.provider.toggleItemCollapsed(props.node)
  }

  const onDragStart = (e: any) => {
    // props.onDragStart(e, props.node)
  }

  const onDragOver = (e: any) => {
    // props.onDragOver(e, props.node)
  }

  const onDragEnd = (e: any) => {
    // props.onDragEnd(e, props.node)
  }

  const onDrop = (e: any) => {
    // props.onDrop(e, props.node)
  }

  let cls = 'tree-node'
  const node = props.node
  if (selMan.isSelected(node)) cls += ' selected'
  if (selMan.getDropTarget() === node) {
    cls += ' drop-target'
    if (selMan.getDropType() === 'parent') cls += ' drop-parent'
  }
  let arrow = <span />
  const prov = props.provider
  if (prov.hasChildren(node)) {
    const expanded = prov.isExpanded(node)
    if (expanded) {
      arrow = (
        <button
          className='fa fa-caret-down fa-fw'
          onClick={toggleItemCollapsed}
        >
          <FontAwesomeIcon icon={faCaretDown}/>
        </button>
      )
    } else {
      arrow = (
        <button
          className='fa fa-caret-right fa-fw'
          onClick={toggleItemCollapsed}
        >
          <FontAwesomeIcon icon={faCaretRight}/>
        </button>
      )
    }
  } else {
    arrow = <span className='fa fa-fw borderless' />
  }

  return (
    <div
      className={cls}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      data-nodeid={node.id}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span
        style={{
          width: props.depth * 2.5 + 'em'
        }}
      />
      {arrow}
      {prov.getRendererForItem(node)}
      <Spacer />
      <DragBars
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        provider={props.provider}
        node={node}
      />
    </div>
  )
}

export function TreeTable(props: { provider: TreeItemProvider; root: TreeItem }): JSX.Element {
  const [dropTarget] = useState(null as any)
  const [selection] = useState(null as any)
  const [dragTarget] = useState(null as any)
  const [internalDrag] = useState(false)
  const [root, setRoot] = useState(props.root)
  const [count, setCount] = useState(0)
  // console.log('tree table root is',props.root)
  let selman = useContext(SelectionManagerContext)

  useEffect(() => {
    let listener = (item:TreeItem) => {
      setRoot(props.provider.getSceneRoot())
      setCount(count+1)
    }
    props.provider.on(TREE_ITEM_PROVIDER.EXPANDED_CHANGED,listener)
    selman.on(SELECTION_MANAGER.CHANGED,listener)
    return () => {
        props.provider.off(TREE_ITEM_PROVIDER.EXPANDED_CHANGED, listener)
      selman.off(SELECTION_MANAGER.CHANGED,listener)
    }
  })
  // componentDidMount() {
  //   this.listener = this.props.provider.on(
  //     TREE_ITEM_PROVIDER.EXPANDED_CHANGED,
  //     (item) => this.setState({ root: this.props.provider.getSceneRoot() })
  //   )
  //   this.props.provider.on(TREE_ITEM_PROVIDER.STRUCTURE_ADDED, (item) =>
  //     this.setState({ root: this.props.provider.getSceneRoot() })
  //   )
  //   this.props.provider.on(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, (item) =>
  //     this.setState({ root: this.props.provider.getSceneRoot() })
  //   )
  //
  //   this.other_listener = selMan.on(SELECTION_MANAGER.CHANGED, (sel) =>
  //     this.setState({ selection: sel })
  //   )
  //   selMan.on(SELECTION_MANAGER.DROP_TARGET_CHANGED, (sel) =>
  //     this.setState({ dropTarget: selMan.getDropTarget() })
  //   )
  // }

  // componentWillUnmount() {
  //   this.props.provider.off(TREE_ITEM_PROVIDER.EXPANDED_CHANGED, this.listener)
  //   selMan.off(SELECTION_MANAGER.CHANGED, this.other_listener)
  // }
  //
  // componentWillReceiveProps(newProps) {
  //   if (newProps.root) this.setState({ root: newProps.root })
  // }

  // onDragStart = (e, item) => {
  //   console.log('starting to drag the item', item)
  //   e.dataTransfer.effectAllowed = 'move'
  //   e.dataTransfer.setData('text/html', e.target.parentNode)
  //   e.dataTransfer.setDragImage(e.target.parentNode, 20, 20)
  //   e.dataTransfer.dropEffect = 'move'
  //   this.setState({ dragTarget: item, internalDrag: true })
  // }

  // onDragOver = (e, item) => {
  //   if (!this.state.internalDrag) {
  //     e.preventDefault()
  //     if (this.props.provider.canAddExternalChild(item, e.dataTransfer)) {
  //       selMan.setDropTarget(item)
  //       selMan.setDropType('parent')
  //     } else {
  //       selMan.setDropType(null)
  //       selMan.setDropTarget(null)
  //     }
  //     return
  //   }
  //   const prov = this.props.provider
  //   if (prov.canAddChild(item, this.state.dragTarget)) {
  //     // use the rop target as a parent
  //     selMan.setDropTarget(item)
  //     selMan.setDropType('parent')
  //   } else if (prov.canBeSibling(item, this.state.dragTarget)) {
  //     // use the drop target as a sibling
  //     selMan.setDropType('sibling')
  //     selMan.setDropTarget(item)
  //   } else {
  //     // no valid target
  //     selMan.setDropType(null)
  //     selMan.setDropTarget(null)
  //   }
  // }
  //
  // onDragEnd = (e, item) => {
  //   // handle external case
  //   if (!this.state.internalDrag) {
  //     this.setState({ dragTarget: null, internalDrag: false })
  //     e.preventDefault()
  //     e.stopPropagation()
  //     return
  //   }
  //
  //   if (!this.state.dragTarget) return
  //   if (!this.state.dropTarget) return
  //   const src = this.state.dragTarget
  //   const dst = this.state.dropTarget
  //
  //   // can't drop onto self
  //   if (dst === src) {
  //     this.setState({ dragTarget: null, internalDrag: false })
  //     selMan.setDropTarget(null)
  //     return
  //   }
  //
  //   // move to new location
  //   const prov = this.props.provider
  //
  //   const dt = selMan.getDropType()
  //   if (dt === 'parent') {
  //     prov.moveChildToNewParent(src, dst)
  //   } else {
  //     prov.moveChildAfterSibling(src, dst)
  //   }
  //   this.setState({ dragTarget: null })
  //   selMan.setDropTarget(null)
  // }
  //
  // const onDrop = (e:Event, item:any) => {
  //   if (!this.state.internalDrag) {
  //     e.stopPropagation()
  //     e.preventDefault()
  //     props.provider.acceptDrop(e, item)
  //     this.setState({ internalDrag: false, dragTarget: null })
  //   }
  //   // var data = e.dataTransfer.getData("text/html");
  //   // console.log('the dropped data is',data)
  // }


  const generateChildren = (root, chs, depth) => {
    const prov = props.provider
    chs.push({ node: root, depth: depth })
    if (!prov.hasChildren(root)) return
    if (!prov.isExpanded(root)) return
    prov.getChildren(root).forEach((child) => {
      generateChildren(child, chs, depth + 1)
    })
  }

  // if (!this.state.root) return <ul>no root yet</ul>
  const children: any[] = []
  generateChildren(props.root, children, 0)
  // console.log("rendered children are",children)
  // return <div>tree table here</div>
  return (
    <ul className='tree-table'>
      {children.map((info, i) => {
        return (
          <TreeTableItem
            key={i}
            node={info.node}
            depth={info.depth}
            provider={props.provider}
            // selection={selection}
            // onDragStart={onDragStart}
            // onDragOver={onDragOver}
            // onDragEnd={onDragEnd}
            // onDrop={onDrop}
          />
        )
      })}
    </ul>
  )
}
