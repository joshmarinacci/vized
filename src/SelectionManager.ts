export const SELECTION_MANAGER = {
  CHANGED: 'CHANGED',
  DROP_TARGET_CHANGED: 'DROP_TARGET'
}

class SelectionManager {
  private listeners: {}
  private selected: any[]
  private dropTarget: null
  private clip: null
  private dropType: string
  constructor() {
    this.listeners = {}
    this.selected = []
    this.dropTarget = null
    this.clip = null
  }

  on(type: string, cb: any) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(cb)
  }

  off(type: string, cb: any) {
    const index = this.listeners[type].indexOf(cb)
    if (index >= 0) this.listeners[type].splice(index, 1)
  }

  fire(type: string, value: any) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].forEach((cb: any) => cb(value))
  }

  setSelection(node: any) {
    this.selected = [node]
    this.fire(SELECTION_MANAGER.CHANGED, this)
  }

  addToSelection(node: any) {
    this.selected.push(node)
    this.fire(SELECTION_MANAGER.CHANGED, this)
  }

  clearSelection() {
    this.selected = []
    this.fire(SELECTION_MANAGER.CHANGED, this)
  }

  isSelected(node: any) {
    return this.selected.some((n) => {
      if (n.id && node.id) return n.id === node.id
      return n === node
    })
  }

  getSelection() {
    if (this.selected.length === 0) return null
    return this.selected[0]
  }

  isEmpty() {
    return this.selected.length === 0
  }

  getFullSelection() {
    return this.selected
  }

  setDropTarget(node: any) {
    if (this.dropTarget !== node) {
      this.dropTarget = node
      this.fire(SELECTION_MANAGER.DROP_TARGET_CHANGED, this.dropTarget)
    }
  }

  getDropTarget() {
    return this.dropTarget
  }

  setDropType(type: string) {
    this.dropType = type
  }

  getDropType() {
    return this.dropType
  }

  setClipboard(clip: any) {
    this.clip = clip
  }

  getClipboard() {
    return this.clip
  }
}

export default new SelectionManager()
