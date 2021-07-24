/**
 * Created by josh on 11/29/16.
 */
import React from 'react'

export class PopupManager {
  private shows: any[];
  private hides: any[];
  // @ts-ignore
  private id:string
  constructor() {
    this.shows = []
    this.hides = []
    this.id = "id_"+Math.floor(Math.random()*100000)
  }
  show(comp:any, owner:any) {
    this.shows.forEach(cb=>cb(comp,owner));
  }
  hide() {
    this.hides.forEach(cb=>cb());
  }
  onShow(cb:any) {
    this.shows.push(cb);
  }
  onHide(cb:any) {
    this.hides.push(cb);
  }
}

export const PopupManagerContext = React.createContext(new PopupManager())
