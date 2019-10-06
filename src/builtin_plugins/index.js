const chartjs = require('./chartjs')
const table = require('./table')
const mathjax = require('./mathjax')
const markdown = require('./markdown')
const vegalite = require('./vegalite')
const mermaid = require('./mermaid')
const flowchart = require('./flowchart')
const scss = require('./scss')
const katex = require('./katex')
// THESE ARE PLUGINS THAT CAN BE LOADED VIA CONFIG.PY
// WE WILL CERTAINLY TAKE OUT MOST OF THEM, AS SEPARATE PLUGINS

exports.plugins = {
  mathjax,
  katex
}

// THESE ARE PLUGINS ADDING NO OVERHEAD, SO SAFE TO BE USED BY DEFAULT
// WE WILL ALSO CERTAINLY TAKE OUT MOST OF THEM, AS SEPARATE PLUGINS,
// TO AVOID TOO MANY DEPENDENCIES

exports.defaultPlugins = [
  table,
  chartjs,
  vegalite,
  flowchart,
  mermaid,
  scss,
  markdown
]
