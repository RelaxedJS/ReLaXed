const pug = require('pug')
const fs = require('fs')
const path = require('path')

exports.constructor = async function (params) {
  return {
    watchers: [
      {
        extensions: ['.flowchart', '.flowchart.json'],
        handler: flowchartHandler
      }
    ]
  }
}

var flowchartHandler = async function (flowchartPath, page) {
  if (flowchartPath.endsWith('.flowchart.json')) {
    flowchartPath = flowchartPath.substr(0, flowchartPath.length - 5)
  }
  var flowchartSpec = fs.readFileSync(flowchartPath, 'utf8')
  var flowchartConf = '{}'

  var possibleConfs = [
    path.join(path.resolve(flowchartPath, '..'), 'flowchart.default.json'),
    flowchartPath + '.json'
  ]

  for (var myPath of possibleConfs) {
    if (fs.existsSync(myPath)) {
      flowchartConf = fs.readFileSync(myPath, 'utf8')
    }
  }

  var html = pug.renderFile(path.join(__dirname, 'template.pug'), {
    flowchartSpec,
    flowchartConf
  })

  await page.setContent(html)
  await page.waitForSelector('#chart svg')

  var svg = await page.evaluate(function () {
    var el = document.querySelector('#chart svg')
    el.removeAttribute('height')
    el.removeAttribute('width')
    el.classList.add('flowchart-svg')
    return el.outerHTML
  })
  var svgPath = flowchartPath.substr(0, flowchartPath.lastIndexOf('.')) + '.svg'
  fs.writeFileSync(svgPath, svg)
}
