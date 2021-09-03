import {
  genID,
  makeFromDef,
  Point,
  PROP_TYPES,
  PropCluster,
  PropDef,
  PropGroup,
  SelectionManager,
  TREE_ITEM_PROVIDER,
  TreeItem,
  TreeItemProvider
} from "vized";
import { ColorValueRenderer, Rect } from "./components";
import { RectDocEditor } from "./RectDocEditor";
import { COLORS, ObjectPowerup } from "./powerups";

export const BoundsDef:PropCluster = new Map<string,PropGroup>()
BoundsDef.set("base",[
  {
    type: PROP_TYPES.STRING,
    name: 'type',
    locked: true,
    key: 'type',
    default:'bounds',
  },
])

const GEOM_GROUP:PropGroup = [
  {
    type:PROP_TYPES.NUMBER,
    key:'x',
    name:'x',
    default:0,
    live:true,
    hints: {
      incrementValue:1,
    }
  },
  {
    key:'y',
    name:'y',
    type:PROP_TYPES.NUMBER,
    live:true,
    default: 0,
    hints:{
      incrementValue:1,
    }
  },
  {
    key:'w',
    name:'width',
    type: PROP_TYPES.NUMBER,
    default: 100,
    live:true,
    hints: {
      incrementValue:1,
      min:1,
    },
  },
  {
    key:'h',
    name:'height',
    type: PROP_TYPES.NUMBER,
    default: 100,
    live:true,
    hints: {
      incrementValue:1,
      min:1,
    }
  },
]
BoundsDef.set("geom",GEOM_GROUP)

const TextboxDef:PropCluster = new Map<string,PropGroup>()
TextboxDef.set("base",[
  {
    type: PROP_TYPES.STRING,
    name:'ID',
    locked:true,
    key: "id",
  },
  {
    type:PROP_TYPES.STRING,
    name:'Title',
    locked:false,
    key:'title',
    default:''
  },
  {
    type: PROP_TYPES.STRING,
    name: 'type',
    locked: true,
    key: 'type',
    default:"textbox",
  },
  {
    type: PROP_TYPES.STRING,
    name:'text',
    locked:false,
    key:'text',
    default:'empty text'
  }
])
TextboxDef.set("geom",[
  {
    key:"bounds",
    name:"bounds",
    type: PROP_TYPES.OBJECT,
    default: {type:"bounds",x:0,y:0,w:100,h:100},
    objectprops:BoundsDef,
  }
])
TextboxDef.set("layout",[
  {
    key:'fontSize',
    name:"font size",
    type:PROP_TYPES.NUMBER,
    live:false,
    default:16,
  },
  {
    key:'horizontalAlign',
    name:'Align H',
    type:PROP_TYPES.ENUM,
    live:false,
    values:["start","center","end"],
    default:"center",
  },
  {
    key:'verticalAlign',
    name:'Align V',
    type:PROP_TYPES.ENUM,
    live:false,
    values:["start","center","end"],
    default:"center",
  },
])
TextboxDef.set("style",[
  {
    key:"color",
    name:'color',
    type:PROP_TYPES.ENUM,
    live:false,
    default: 'white',
    values:COLORS,
    renderer: ColorValueRenderer,
  },
  {
    key:"backgroundColor",
    name:'background color',
    type:PROP_TYPES.ENUM,
    live:false,
    default: 'white',
    values:COLORS,
    renderer: ColorValueRenderer,
  },
  {
    key:"borderColor",
    name:"border color",
    type:PROP_TYPES.ENUM,
    live:false,
    default: 'black',
    values:COLORS,
    renderer: ColorValueRenderer,
  },
  {
    key:"borderWidth",
    name:"border width",
    type:PROP_TYPES.NUMBER,
    live:false,
    default:1,
  },
])

export class TextboxPowerup implements ObjectPowerup {
  def() {
    return TextboxDef
  }

  getBounds(item:TreeItem, provider: RectDocEditor): Rect {
      let bds = provider.getObjectValue(item,'bounds') as any;
      return new Rect(bds.x,bds.y,bds.w,bds.h);
  }

  makeObject() {
      return makeFromDef(TextboxDef, {
        id: genID('textbox'),
        title: 'text box',
        color: 'black',
        backgroundColor: 'green',
        borderColor: 'blue',
        borderWidth: 5,
      })
  }

  treeIcon(): string {
    return "textbox";
  }

  type(): string {
    return "textbox";
  }
}

