import './index.css'

import React from 'react'
import ReactDOM from 'react-dom'
import { RectDocApp } from "./App";
import {RectDocEditor} from "./ReactDocEditor";

let provider = new RectDocEditor({})

ReactDOM.render(<RectDocApp  provider={provider}/>, document.getElementById('root'))
