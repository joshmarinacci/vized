// import { setQuery } from './utils'
// import Selection from './SelectionManager'

import { PropCluster } from "./PropSheet";

export const TREE_ITEM_PROVIDER = {
  EXPANDED_CHANGED: 'EXPANDED_CHANGED',
  STRUCTURE_CHANGED: 'STRUCTURE_CHANGED',
  STRUCTURE_ADDED: 'STRUCTURE_ADDED',
  STRUCTURE_REMOVED: 'STRUCTURE_REMOVED',
  PROPERTY_CHANGED: 'PROPERTY_CHANGED',
  CLEAR_DIRTY: 'CLEAR_DIRTY',
  SAVED: 'SAVED',
  DOCUMENT_SWAPPED: 'DOCUMENT_SWAPPED'
}

const URLS = {
  BASE: 'https://vr.josh.earth/generaled/api/'
  // BASE:'https://buttered-elk.glitch.me/'
  // BASE:'http://localhost:1234/'
}
export function getDocsURL() {
  return URLS.BASE + 'doc/'
}
export function getAssetsURL() {
  return URLS.BASE + 'asset/'
}
export function getScriptsURL() {
  return URLS.BASE + 'scripts/'
}
export function getLoginURL() {
  return URLS.BASE + 'auth/github/login'
}
export function getInfoURL() {
  return URLS.BASE + 'info'
}
export function getUserURL() {
  return URLS.BASE + 'userinfo'
}

// export const SERVER_URL = "http://localhost:30065/doc/"
// export const SERVER_URL_ASSETS = "http://localhost:30065/asset/"
// export const SERVER_URL = "http://localhost:55555/doc/"
// export const SERVER_URL = "https://vr.josh.earth/generaled/api/doc/"
// export const BASE_URL = "http://localhost:55555/"
// export const BASE_URL = "https://vr.josh.earth:55555/"
// export const SERVER_URL_ASSETS = "http://localhost:55555/asset/"
// export const SERVER_URL_ASSETS = "https://vr.josh.earth/generaled/api/asset/"
// export const SERVER_URL_ASSETS = "http://josh.earth:30068/asset/"
// export const LOGIN_URL = "http://localhost:55555/auth/github/login"
// export const LOGIN_URL = "https://vr.josh.earth/generaled/api/auth/github/login"


type Callback = (obj:any) => void;
export type TreeItem = {
  id:string,
  type:string,
  children:TreeItem[],
}


interface TreeItemProviderInterface {
  on(type: string, cb: Callback): void
  off(type: string, cb: Callback): void
  fire(type: string, value: any): void

  // ============== tree interface
  getSceneRoot(): TreeItem
  deleteChild(child: TreeItem): void
  appendChild(parent: TreeItem, child: TreeItem): void
  insertNodeBefore(node: TreeItem, sibling: TreeItem): void
  findNodeById(id: string): TreeItem | undefined
  findParent(node: TreeItem): TreeItem
  hasChildren(node: TreeItem): boolean
  getChildren(node: TreeItem): TreeItem[]

  // ========= Tree View support =========
  isExpanded(item: TreeItem): boolean
  calculateContextMenu(item:TreeItem): void
  toggleItemCollapsed(item:TreeItem): void
  getRendererForItem(item:TreeItem): any

  // ================ properties ==================
  setPropertyValue(item:TreeItem, def:any, value:any): void
  setPropertyValueByName(child:TreeItem, name:string, value:any): void
  // getProperties(item:TreeItem): void
  getPropertyClusters(item:TreeItem):PropCluster

  // ================ doc def stuff
  getDocId(): string
  getDocType(): string
  getApp(): any
  getTitle(): string
}

const AUTO_DETECT_GLITCH = true
function calculateServerUrl(SERVER_URL:string) {
  if (SERVER_URL) {
    return `https://${SERVER_URL}/`
  }

  if (AUTO_DETECT_GLITCH) {
    console.log('no server url, checking the document')
    const host = document.location.host
    if (host.endsWith('.glitch.me')) {
      console.log('this is a glitch. using autodetected server')
      return `https://${host}/`
    }
  }
  return URLS.BASE
}

// class DummyAuthModule {
//   init() {
//     console.log('dummy auth init()')
//   }
// }
export class TreeItemProvider implements TreeItemProviderInterface {
  private docid: string;
  private listeners: Map<String, Callback[]>;
  protected root: TreeItem;
  private expanded_map: {};
  constructor(options:any) {
    this.listeners = new Map<String,Callback[]>()
    this.expanded_map = {}
    this.docid = ""
    URLS.BASE = calculateServerUrl(options.SERVER_URL)
    // this.AuthModule = options.AuthModule || new DummyAuthModule()
    // this.AuthModule.init()
  }

  deleteChild(child: TreeItem): void {
        throw new Error("Method not implemented.")
    }
    appendChild(parent: TreeItem, child: TreeItem): void {
        throw new Error("Method not implemented.")
    }
    insertNodeBefore(node: TreeItem, sibling: TreeItem): void {
        throw new Error("Method not implemented.")
    }
    findNodeById(id: string): TreeItem | undefined {
        throw new Error("Method not implemented.")
    }
    findParent(node: TreeItem): TreeItem {
        throw new Error("Method not implemented.")
    }
    calculateContextMenu(item: TreeItem): void {
        throw new Error("Method not implemented.")
    }
    getRendererForItem(item: TreeItem) {
        throw new Error("Method not implemented.")
    }
    setPropertyValue(item: TreeItem, def: any, value: any): void {
        throw new Error("Method not implemented.")
    }
    setPropertyValueByName(child: TreeItem, name: string, value: any): void {
        throw new Error("Method not implemented.")
    }
    getProperties(item: TreeItem): void {
        throw new Error("Method not implemented.")
    }
    getDocType(): string {
        throw new Error("Method not implemented.")
    }
    getApp() {
        throw new Error("Method not implemented.")
    }
    getTitle(): string {
        throw new Error("Method not implemented.")
    }

  on(type: string, cb: Callback) {
    if(!this.listeners.has(type)) this.listeners.set(type,[])
    this.listeners.get(type)?.push(cb)
  }

  fire(type:string, value:any) {
    if(!this.listeners.has(type)) this.listeners.set(type,[])
    this.listeners.get(type)?.forEach((cb) => cb(value))
  }

  off(type:string, cb:Callback) {
    if(this.listeners.has(type)) {
      let cbs = this.listeners.get(type)?.filter(l => l !== cb)
      this.listeners.set(type, cbs as Callback[])
    }
  }

  isExpanded(item:TreeItem):boolean {
    if (!item.id) item.id = '' + Math.random()
    if (typeof this.expanded_map[item.id] === 'undefined')
      this.expanded_map[item.id] = true
    return this.expanded_map[item.id]
  }

  toggleItemCollapsed(item:TreeItem) {
    const current = this.isExpanded(item)
    console.log("current is",current)
    this.expanded_map[item.id] = !current
    this.fire(TREE_ITEM_PROVIDER.EXPANDED_CHANGED, item)
  }

  // setPropertyValue(item:any, def:any, value:any):void {
  //   throw new Error(
  //     'subclass of TreeItemProvider must implement setPropertyValue'
  //   )
  // }

  genID = (prefix:string) => {
    return `${prefix}_${Math.floor(Math.random() * 1000 * 1000 * 1000)}`
  }

  setDocument(doc:any, docid:string) {
    this.root = doc
    this.docid = docid
    this.fire(TREE_ITEM_PROVIDER.STRUCTURE_CHANGED, {
      provider: this
    })
  }

  getDocId() {
    return this.docid
  }

  save = () => {
    const payload_obj = {
      doc: this.getSceneRoot(),
      type: this.getDocType(),
      id: this.getDocId()
    }
    return payload_obj
    // const payload_string = JSON.stringify(payload_obj, (key, value) => {
    //   if (key === 'parent') return undefined
    //   return value
    // })
    // console.info('doc is', payload_string)
    // return AuthModule.fetch(getDocsURL() + this.docid, {
    //   method: 'POST',
    //   body: payload_string,
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // })
    //   .then((res) => res.json())
    //   .then((res) => {
    //     console.log('Success result is', res)
    //     setQuery({ mode: 'edit', doc: this.docid, doctype: this.getDocType() })
    //     this.fire(TREE_ITEM_PROVIDER.SAVED, true)
    //   })
    //   .catch((e) => console.log('error', e))
  }

  load(obj:any) {
    this.setDocument(obj.doc,obj.id)
  }

  // @ts-ignore
  loadDoc(docid:string) {
    // console.log('need to load the doc', docid)
    // AuthModule.getJSON(getDocsURL() + docid)
    //   .then((payload) => {
    //     console.log('got the doc', payload)
    //     if (payload.type !== this.getDocType())
    //       throw new Error('incorrect doctype for this provider', payload.type)
    //     this.setDocument(payload.doc, payload.id)
    //   })
    //   .catch((e) => {
    //     console.warn('missing doc', e)
    //     this.setDocument(this.makeEmptyRoot(), this.genID('doc'))
    //     setQuery({ mode: 'edit', doc: this.docid, doctype: this.getDocType() })
    //   })
  }

  reloadDocument() {
    // const spath = this.generateSelectionPath(Selection.getSelection())
    // console.log('got the path', spath)
    // AuthModule.getJSON(getDocsURL() + this.docid)
    //   .then((payload) => {
    //     if (payload.type !== this.getDocType())
    //       throw new Error('incorrect doctype for this provider', payload.type)
    //     this.setDocument(payload.doc, payload.id)
    //     this.fire(TREE_ITEM_PROVIDER.CLEAR_DIRTY, true)
    //     const newsel = this.findNodeFromSelectionPath(
    //       this.getSceneRoot(),
    //       spath
    //     )
    //     console.log('set new selection to ', newsel)
    //     Selection.setSelection(newsel)
    //   })
    //   .catch((e) => {
    //     console.warn("couldn't reload the doc", e)
    //   })
  }

  /* required functions for subclasses */

  // generateSelectionPath() {
  //   throw new Error('generateSelectionPath not implemented')
  // }

  // findNodeFromSelectionPath() {
  //   throw new Error('findNodeFromSelectionPath not implemented')
  // }

  // makeEmptyRoot() {
  //   throw new Error('makeEmptyRoot() not implemented')
  // }

  getSceneRoot():TreeItem {
    return this.root
  }

  // uploadFile(file:any) {
  //   return new Promise((res:any, rej:any) => {
  //     const fd = new FormData()
  //     fd.append('file', file)
  //     console.info('filesize is', file.size, file.name)
  //     const xml = new XMLHttpRequest()
  //     xml.onreadystatechange = () =>
  //       console.log(`ready state = ${xml.readyState} status ${xml.status}`)
  //     xml.addEventListener('progress', (e) => console.log(`progress`))
  //     xml.addEventListener('load', (e) => res(xml.response))
  //     xml.addEventListener('error', (e) => console.log(`error`))
  //     xml.addEventListener('abort', (e) => console.log(`abort`))
  //     const url = getAssetsURL() + file.name
  //     console.info('uploading to ', url)
  //     xml.responseType = 'json'
  //     xml.open('POST', url)
  //     xml.setRequestHeader('access-key', AuthModule.getAccessToken())
  //     xml.send(file)
  //   })
  // }

  hasChildren(item:TreeItem):boolean {
    return (item && item.children && item.children.length>0)
  }
  getChildren = (item:TreeItem) => item.children

  getPropertyClusters(item: TreeItem):PropCluster {
    throw new Error("getPropertyClusters not defined")
  }
}
