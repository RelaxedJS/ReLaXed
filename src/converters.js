const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)
const path = require('path')
const csv = require('csvtojson')
const html2jade = require('html2jade')
const SVGO = require('svgo')
const utils = require('./utils')
// const generate = require('./generators')
/*
 * ==============================================================
 *                      Mermaid
 * ==============================================================
 */
exports.mermaidToSvg = async function(mermaidPath, page) {
  var mermaidSpec = fs.readFileSync(mermaidPath, 'utf8')
  var html = utils.formatTemplate('mermaid', {
    mermaidSpec
  })

  await page.setContent(html)
  await page.waitForSelector('#graph svg')

  var svg = await page.evaluate(function() {
    var el = document.querySelector('#graph svg')
    el.removeAttribute('height')
    el.classList.add('mermaid-svg')
    return el.outerHTML
  })

  var svgPath = mermaidPath.substr(0, mermaidPath.lastIndexOf('.')) + '.svg'

  await writeFile(svgPath, svg)
}

/*
 * ==============================================================
 *                     Flowchart
 * ==============================================================
 */
exports.flowchartToSvg = async function(flowchartPath, page) {
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

  var html = utils.formatTemplate('flowchart', {
    flowchartSpec,
    flowchartConf
  })

  await page.setContent(html)
  await page.waitForSelector('#chart svg')

  var svg = await page.evaluate(function() {
    var el = document.querySelector('#chart svg')

    el.removeAttribute('height')
    el.removeAttribute('width')
    el.classList.add('flowchart-svg')

    return el.outerHTML
  })

  var svgPath = flowchartPath.substr(0, flowchartPath.lastIndexOf('.')) + '.svg'

  await writeFile(svgPath, svg)
}

/*
 * ==============================================================
 *                    Vegalite
 * ==============================================================
 */
exports.vegaliteToSvg = async function(vegalitePath, page) {
  var vegaliteSpec = fs.readFileSync(vegalitePath, 'utf8')
  var html = utils.formatTemplate('vegalite', {
    vegaliteSpec
  })

  await page.setContent(html)
  await page.waitForSelector('#vis svg')

  var svg = await page.evaluate(function() {
    var el = document.querySelector('#vis svg')

    el.removeAttribute('height')
    el.removeAttribute('width')

    return el.outerHTML
  })

  var svgPath = vegalitePath.substr(0, vegalitePath.length - '.vegalite.json'.length) + '.svg'

  await writeFile(svgPath, svg)
}

/*
 * ==============================================================
 *                    CSV Table
 * ==============================================================
 */
exports.tableToPug = function(tablePath) {
  var extension, header
  var rows = []

  csv({
      noheader: true
    })
    .fromFile(tablePath)
    .on('csv', (csvRow) => {
      rows.push(csvRow)
    })
    .on('done', (error) => {
      if (error) {
        console.log('error', error)
      } else {
        if (tablePath.endsWith('.htable.csv')) {
          extension = '.htable.csv'
          header = rows.shift()
        } else {
          extension = '.table.csv'
          header = null
        }

        var html = utils.formatTemplate('table', {
          header: header,
          tbody: rows
        })
        var pugPath = tablePath.substr(0, tablePath.length - extension.length) + '.pug'

        html2jade.convertHtml(html, {
          bodyless: true
        }, function(err, jade) {
          if (err) {
            console.log(err)
          }

          writeFile(pugPath, jade)
        })
      }
    })
}

/*
 * ==============================================================
 *                         Chart.js
 * ==============================================================
 */
exports.chartjsToPNG = async function(chartjsPath, page) {
  var chartSpec = fs.readFileSync(chartjsPath, 'utf8')
  var html = utils.formatTemplate('chartjs', {
    chartSpec
  })
  var tempHTML = chartjsPath + '.htm'

  await writeFile(tempHTML, html)
  await page.setContent(html)
  await page.waitForFunction(() => window.pngData)

  const dataUrl = await page.evaluate(() => window.pngData)
  const {
    buffer
  } = utils.parseDataUrl(dataUrl)
  var pngPath = chartjsPath.substr(0, chartjsPath.length - '.chart.js'.length) + '.png'

  await writeFile(pngPath, buffer, 'base64')
}

/*
 * ==============================================================
 *                          Master
 * ==============================================================
 */
