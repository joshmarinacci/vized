/*

storage system

Native JSON graph for persistence.
store in local storage
store at remote DB once logged in
provide an auth button for remote DB storage
provide a loader button using file input to load from JSON
export and import to clean JSON
export canvas to PNG

provide a serializer that does an in order tree traversal of the graph

 */

import React from "react";

export class StorageManager {
  constructor() {
  }
  public forceJSONDownload(obj:object,filename:string):void {
    let str = JSON.stringify(obj,null,'   ')
    this.forceDownloadJson(str,filename)
  }
  private forceDownloadJson(str: string, name:string) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(str)
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", name + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
  public saveToLocalStorage(obj:object, filename:string) {
    localStorage.setItem(filename, JSON.stringify(obj))
  }
  public loadFromLocalStorage(filename:string):object|null {
    let json = localStorage.getItem(filename)
    if (json) {
      return JSON.parse(json)
    }
    return null
  }

  public async canvasToPNGBlob(canvas:HTMLCanvasElement) {
    return new Promise<Blob>((res,rej)=>{
      canvas.toBlob((blob) => {
        return blob ? res(blob):rej()
      })
    })
  }
  public forcePNGDownload(blob,filename) {
    let url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute("href",     url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

}

export const StorageManagerContext = React.createContext(new StorageManager())
/*
save() {
  // this.dump()
  localStorage.setItem('SCHEMA',JSON.stringify(this.schema))
  localStorage.setItem('QUERIES',JSON.stringify(this.queries))

  let out_objs = this.data.map(r => this.prep_record_for_export(r))
  // console.log("generated",JSON.stringify(out_objs,null, '   '))

  localStorage.setItem('DATA',JSON.stringify(out_objs, null, '   '))
}
export_json() {
  let obj = {
    schema:this.schema,
    queries:this.queries,
    data:this.data.map((r)=>this.prep_record_for_export(r))
  }
  let str = JSON.stringify(obj,null,'   ')
  forceDownloadJson(str,'database')
}

private prep_record_for_export(record:Record) {
  // console.log("scanning data",record)
  let ent = this.lookup_entity(record.type)
  // console.log("entity is",ent)
  let obj = {
    id:record.id,
    type:record.type,
    _type_name:ent.name,
    fields:{}
  }
  ent.fields.forEach(field => {
    // console.log("field is",field)
    if(field.type === 'datetime') {
      // @ts-ignore
      obj.fields['-datetime-'+field.name] = record.fields[field.name].toJSON()
    } else {
      // @ts-ignore
      obj.fields[field.name] = record.fields[field.name]
    }
  })
  return obj
}
}


function forceDownloadJson(str: string, name:string) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(str)
  const downloadAnchorNode = document.createElement('a')
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", name + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

export function force_blob_download(blob:Blob, filename:string) {
  let url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute("href",     url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

load() {
  // this.clear()
  let schema = localStorage.getItem('SCHEMA')
  if(schema) {
    try {
      this.schema = JSON.parse(schema)
      // console.log("loaded schema",this.schema)
    } catch(e) {
      console.error(e)
      this.schema = SCHEMA
    }
  } else {
    this.schema = SCHEMA
  }

  let queries = localStorage.getItem('QUERIES')
  if(queries) {
    try {
      this.queries = JSON.parse(queries)
      this.queries = this.queries.map(q => {
        if(!q.hasOwnProperty('limit')) q.limit = -1
        return q
      })
    } catch (e) {
      console.error(e)
      this.queries = []
    }
  } else {
    this.queries = []
  }


  let data = localStorage.getItem("DATA")
  if(data) {
    try {
      // console.log("parsing the data")
      // console.log(data)
      let raw_data = JSON.parse(data)
      // console.log("got raw data",raw_data)
      let cooked_data = raw_data.map((rec:any) => {
        // console.log("processing raw record",rec)
        let fields = {}
        Object.entries(rec.fields).forEach(([key,value])=>{
          // console.log("parse field",key,'value',value)
          if(key.startsWith('-datetime')) {
            // console.log("its a date-time", new Date(value as string))
            // @ts-ignore
            fields[key.substring('-date-time'.length)] = new Date(value as string)
          } else {
            // @ts-ignore
            fields[key] = value
          }
        })
        return {
          id:rec.id,
          type:rec.type,
          fields:fields,
        }
      })
      // console.log("final cooked data is",cooked_data)
      this.data = cooked_data
      // this.clear()
      // this.load()
    } catch(e) {
      console.error(e)
      this.data = DATA
    }
  } else {
    this.data = DATA
  }
  // this.dump()
}

function screenshot_desktop() {
  if(canvas.current) {
    let data = canvas.current.toDataURL('image/png')
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href",     data);
    downloadAnchorNode.setAttribute("download", 'screenshot.png');
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}

<button onClick={()=>{
  let json = datastore.export_to_json()
  download(JSON.stringify(json,null,'   '),datastore.get_name())
}}>export</button>
<input type="file" onChange={(e)=>{
  if(!e.target.files[0]) return
  let name = e.target.files[0].name
  fetch(URL.createObjectURL(e.target.files[0]))
    .then(res=>res.json())
    .then(data=> {
      console.log('data is',data)
      datastore.import_from_json(data)
    }).catch(e => {
    console.log("error",e)
  })
}}/>
*/
