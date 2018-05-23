const fs = require('fs')
const util = require('util')
const pug = require('pug')
const writeFile = util.promisify(fs.writeFile)
const cheerio = require('cheerio')
const path = require('path')
const csv = require('csvtojson')
const html2jade = require('html2jade')
const colors = require('colors')
const { performance } = require('perf_hooks')
const katex = require('katex')
const sass = require('node-sass')
const SVGO = require('svgo')
const utils = require('./utils.js')
const Cite = require('citation-js')
const { JSDOM } = require('jsdom')

exports.mermaidToSvg = async function (mermaidPath, page) {
  var mermaidSpec = fs.readFileSync(mermaidPath, 'utf8')
  var html = utils.formateTemplate('mermaid', { mermaidSpec })
  await page.setContent(html)
  await page.waitForSelector('#graph svg')
  var svg = await page.evaluate(function () {
    var el = document.querySelector('#graph svg')
    el.removeAttribute('height')
    el.classList.add('mermaid-svg')
    return el.outerHTML
  })
  var svgPath = mermaidPath.substr(0, mermaidPath.lastIndexOf('.')) + '.svg'
  await writeFile(svgPath, svg)
}

exports.flowchartToSvg = async function (flowchartPath, page) {
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
  var html = utils.formateTemplate('flowchart', { flowchartSpec, flowchartConf })
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
  await writeFile(svgPath, svg)
}


exports.vegaliteToSvg = async function (vegalitePath, page) {
  var vegaliteSpec = fs.readFileSync(vegalitePath, 'utf8')
  var html = utils.formateTemplate('vegalite', { vegaliteSpec })
  await page.setContent(html)
  await page.waitForSelector('#vis svg')
  var svg = await page.evaluate(function () {
    var el = document.querySelector('#vis svg')
    el.removeAttribute('height')
    el.removeAttribute('width')
    return el.outerHTML
  })
  var svgPath = vegalitePath.substr(0, vegalitePath.length - '.vegalite.json'.length) + '.svg'
  await writeFile(svgPath, svg)
}

exports.svgToOptimizedSvg = async function (svgPath) {
  var svgdata = fs.readFileSync(svgPath, 'utf8')
  var svgo = new SVGO({
    plugins: [{
      removeNonInheritableGroupAttrs: false
    }, {
      cleanupAttrs: false
    }, {
      moveGroupAttrsToElems: false
    }, {
      collapseGroups: false
    }, {
      removeUnknownsAndDefaults: false
    }, {
      cleanupIDs: {
        prefix: path.basename(svgPath)
      }
    }
  ]
  })
  var svgoPath = svgPath.substr(0, svgPath.length - '.o.svg'.length) + '_optimized.svg'
  var svgoData = await svgo.optimize(svgdata)
  await writeFile(svgoPath, svgoData.data)
}

exports.tableToPug = function (tablePath) {
  var extension, header
  var rows = []
  csv({noheader: true})
    .fromFile(tablePath)
    .on('csv', (csvRow) => { rows.push(csvRow) })
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
        var html = utils.formatTemplate('table', { header: header, tbody: rows })
        var pugPath = tablePath.substr(0, tablePath.length - extension.length) + '.pug'
        html2jade.convertHtml(html, {bodyless: true}, function (err, jade) {
          if (err) {
            console.log(err)
          }
          writeFile(pugPath, jade)
        })
      }
    })
}

exports.chartjsToPNG = async function (chartjsPath, page) {
  var chartSpec = fs.readFileSync(chartjsPath, 'utf8')
  var html = utils.formateTemplate('chartjs', { chartSpec })
  var tempHTML = chartjsPath + '.htm'
  await writeFile(tempHTML, html)
  await page.setContent(html)
  await page.waitForFunction(() => window.pngData)
  const dataUrl = await page.evaluate(() => window.pngData)
  const { buffer } = utils.parseDataUrl(dataUrl)
  var pngPath = chartjsPath.substr(0, chartjsPath.length - '.chart.js'.length) + '.png'
  await writeFile(pngPath, buffer, 'base64')
}

const builtinMixins = fs.readFileSync(path.join(__dirname, 'builtin_mixins.pug'))

exports.masterDocumentToPDF = async function (masterPath, page, tempHTML, outputPath) {
  var html
  var t0 = performance.now()

  if (masterPath.endsWith('.pug')) {
    try {
      var masterPug = fs.readFileSync(masterPath, 'utf8')

      html = pug.render(builtinMixins + '\n' + masterPug, {
        filename: masterPath,
        fs: fs,
        cheerio: cheerio,
        basedir: path.resolve(masterPath, '..') + '/',
        filters: {
          katex: (text, options) => katex.renderToString(text),
          scss: function (text, options) {
            var file = options.filename
            options = file.endsWith('scss') ? { file } : {data: text}
            return sass.renderSync(options).css.toString('utf8')
          }
        }
      })
    } catch (error) {
      console.log(error.message)
      console.error('There was a Pug error (see above)'.red)
      return
    }
  } else {
    html = fs.readFileSync(masterPath, 'utf8')
  }
  if (html.indexOf("-relaxed-mathjax-everywhere") >= 0) {
    html = await utils.asyncMathjax(html)
  }

  html = renderBibliography(html).replace('<html><head></head><body>', '').replace('</body></html>', '')

  var headerTemplate = ''
  var footerTemplate = ''
  var pageHeaderIndex = html.indexOf('id="page-header"')
  var pageFooterIndex = html.indexOf('id="page-footer"')
  if ((pageHeaderIndex > -1) || (pageFooterIndex > -1)) {
    var minIndex = Math.min([pageHeaderIndex, pageFooterIndex].filter(c => c > -1))
    var parsedHtml = cheerio.load(html.slice(minIndex - 20, html.length))
    headerTemplate = parsedHtml('#page-header').html() || '<span></span>'
    footerTemplate = parsedHtml('#page-footer').html() || '<span></span>'
  }
  html = `<html><body>${html}</body></html>`

  await writeFile(tempHTML, html)

  var tHTML = performance.now()
  console.log(`... HTML generated in ${((tHTML - t0) / 1000).toFixed(1)}s`.magenta)

  await page.goto('file:' + tempHTML, {waitUntil: ['load', 'domcontentloaded']})
  var tLoad = performance.now()
  console.log(`... Document loaded in ${((tLoad - tHTML) / 1000).toFixed(1)}s`.magenta)

  await utils.waitForNetworkIdle(page, 200)
  var tNetwork = performance.now()
  console.log(`... Network idled in ${((tNetwork - tLoad) / 1000).toFixed(1)}s`.magenta)

  var options = {
    path: outputPath,
    displayHeaderFooter: headerTemplate || footerTemplate,
    headerTemplate,
    footerTemplate,
    printBackground: true
  }
  var width = utils.getMatch(html, /-relaxed-page-width: (\S+);/m)
  if (width) {
    options.width = width
  }
  var height = utils.getMatch(html, /-relaxed-page-height: (\S+);/m)
  if (height) {
    options.height = height
  }
  var size = utils.getMatch(html, /-relaxed-page-size: (\S+);/m)
  if (size) {
    options.size = size
  }
  await page.pdf(options)

  var tPDF = performance.now()
  console.log(`... PDF written in ${((tPDF - tLoad) / 1000).toFixed(1)}s`.magenta)
}

function renderBibliography(html) {
  const dom = new JSDOM(html)

  const window = dom.window
  const document = dom.window.document
  
  var citations = document.getElementsByClassName('citation')
  var bibliography = document.getElementById('bibliography')

  if(bibliography) {
    console.log(true)
  } else {
    console.log(false)
  }

  if (citations.length > 0) {
    const data = new Cite()
    for(var cite of citations) {
      let key = cite.getAttribute('data-key')
      let page = cite.getAttribute('data-key')
      data.add(key)
      for(var datum of data.data) {
        if (datum.id == key) {
          if(page != '') {
            cite.innerHTML = `(${datum.author[0].family}, ${datum.issued['date-parts'][0][0]}, p. ${page})`
          } else {
            cite.innerHTML = `(${datum.author[0].family}, ${datum.issued['date-parts'][0][0]})`
          }
          break
        }
      }
    }
    if (bibliography) {
      const output = data.get({
        format: 'string',
        type: 'html',
        style: bibliography.getAttribute('data-style'),
        lang: 'en-US'
      })
      bibliography.innerHTML = output
    }
    html = dom.serialize()
  }

  return html
}