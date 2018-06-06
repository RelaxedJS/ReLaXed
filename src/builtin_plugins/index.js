const bibliography = require('./bibliography')
const chartjs = require('./chartjs')
const svg = require('./svg')
const table = require('./table')
const mathjax = require('./mathjax')
const vegalite = require('./vegalite')
const mermaid = require('./mermaid')
const flowchart = require('./flowchart')

// THESE ARE PLUGINS THAT CAN BE LOADED VIA CONFIG.PY
// WE WILL CERTAINLY TAKE OUT MOST OF THEM, AS SEPARATE PLUGINS

exports.plugins = {
  bibliography,
  mathjax,
  svg
}

// THESE ARE PLUGINS ADDING NO OVERHEAD, SO SAFE TO BE USED BY DEFAULT
// WE WILL ALSO CERTAINLY TAKE OUT MOST OF THEM, AS SEPARATE PLUGINS,
// TO AVOID TOO MANY DEPENDENCIES

exports.defaultPlugins = [
  table,
  chartjs,
  vegalite,
  flowchart,
  mermaid
]
