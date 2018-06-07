const pug = require('pug')
const colors = require('colors/safe')
const cheerio = require('cheerio')
const fs = require('fs')
const filesize = require('filesize')
const katex = require('katex')
const sass = require('node-sass')
const path = require('path')
const css = require('css')
const { performance } = require('perf_hooks')

function convertSizeFormat(size) {
  const ppi = 96
  const ppc = 2.54 * ppi
  if(typeof size === 'number') {
    return size
  }
  var num = Number(size.match(/[0-9.]+/g)[0])
  switch(size.match(/[a-zA-Z]+/g)[0]) {
    case 'in':
      return num * ppi
      break
    case 'cm':
      return num * ppc
      break
    case 'mm':
      return num * ppc * 10
      break
    default:
      return num
      break
  }
}

exports.masterToPDF = async function (masterPath, relaxedGlobals, tempHTMLPath, outputPath) {
  var t0 = performance.now()
  var page = relaxedGlobals.puppeteerPage
  /*
   *            Generate HTML
   */
  var html
  if (masterPath.endsWith('.pug')) {
    var pluginPugHeaders = []
    for (var pugHeader of relaxedGlobals.pluginHooks.pugHeaders) {
      pluginPugHeaders.push(pugHeader.instance)
    }
    pluginPugHeaders = pluginPugHeaders.join('\n\n')
    try {
      var masterPug = fs.readFileSync(masterPath, 'utf8')

      html = pug.render(pluginPugHeaders + '\n' + masterPug, {
        filename: masterPath,
        fs: fs,
        cheerio: cheerio,
        basedir: path.dirname(masterPath),
        path: path,
        require: require,
        performance: performance,
        filters: {
          katex: (text, options) => katex.renderToString(text),
          scss: function (text, options) {
            var file = options.filename
            options = file.endsWith('scss') ? { file } : { data: text }
            return sass.renderSync(options).css.toString('utf8')
          }
        }
      })
    } catch (error) {
      console.log(error.message)
      console.error(colors.red('There was a Pug error (see above)'))
      return
    }
  } else if (masterPath.endsWith('.html')) {
    html = fs.readFileSync(masterPath, 'utf8')
  }

  /*
   *            MODIFY HTML
   */
  html = `<html><body>${html}</body></html>`
  for (var htmlFilter of relaxedGlobals.pluginHooks.htmlFilters) {
    html = await htmlFilter.instance(html)
  }

  var margins

  var match = css.parse(html.match(/\@page\s+\{[\w\W]*\}/g)[0]).stylesheet.rules[0].declarations

  for (var m of match) {
    if (m.property == 'margin') {
      margins = {}
      var top = m.value
      var left = m.value
      var bottom = m.value
      var right = m.value
      if (/\s/g.test(m.value)) {
        var properties = m.value.split(' ')
        if (properties.length == 2) {
          top = properties[0]
          bottom = properties[0]
          left = properties[1]
          right = properties[1]
        } else if (properties.length == 3) {
          top = properties[0]
          left = properties[1]
          right = properties[1]
          bottom = properties[2]
        } else {
          top = properties[0]
          right = properties[1]
          bottom = properties[2]
          left = properties[3]
        }
      }
      margins = {
        top: top,
        left: left,
        bottom: bottom,
        right: right
      }
      break
    }
    if (m.property == 'margin-top') {
      if (!margins) { margins = {} }
      margins.top = m.value
    }
    if (m.property == 'margin-left') {
      if (!margins) { margins = {} }
      margins.left = m.value
    }
    if (m.property == 'margin-right') {
      if (!margins) { margins = {} }
      margins.right = m.value
    }
    if (m.property == 'margin-bottom') {
      if (!margins) { margins = {} }
      margins.bottom = m.value
    }
  }

  margins.top = convertSizeFormat(margins.top)
  margins.bottom = convertSizeFormat(margins.bottom)
  margins.left = convertSizeFormat(margins.left)
  margins.right = convertSizeFormat(margins.right)

  fs.writeFileSync(tempHTMLPath, html)

  var tHTML = performance.now()
  console.log(colors.magenta(`... HTML generated in ${((tHTML - t0) / 1000).toFixed(1)}s`))

  /*
   *            LOAD HTML
   */
  await page.goto('file:' + tempHTMLPath, {
    waitUntil: ['load', 'domcontentloaded']
  })
  var tLoad = performance.now()
  console.log(colors.magenta(`... Document loaded in ${((tLoad - tHTML) / 1000).toFixed(1)}s`))

  await waitForNetworkIdle(page, 200)
  var tNetwork = performance.now()
  console.log(colors.magenta(`... Network idled in ${((tNetwork - tLoad) / 1000).toFixed(1)}s`))

  // Get header/footer template
  var head = await page.$eval('#page-header', element => element.innerHTML)
    .catch(error => '')
  var foot = await page.$eval('#page-footer', element => element.innerHTML)
    .catch(error => '')

  if (head !== '' && foot === '') {
    foot = '<span></span>'
  }
  if (foot !== '' && head === '') {
    head = '<span></span>'
  }
  /*
   *            Create PDF options
   */
  var options = {
    path: outputPath,
    displayHeaderFooter: head || foot,
    headerTemplate: head,
    footerTemplate: foot,
    printBackground: true
  }

  function getMatch (string, query) {
    var result = string.match(query)
    if (result) {
      result = result[1]
    }
    return result
  }

  var width = getMatch(html, /-relaxed-page-width: (\S+);/m)
  if (width) {
    options.width = width
  }
  var height = getMatch(html, /-relaxed-page-height: (\S+);/m)
  if (height) {
    options.height = height
  }
  var size = getMatch(html, /-relaxed-page-size: (\S+);/m)
  if (size) {
    options.size = size
  }

  var pluginParams = {}
  pluginParams.margins = margins ? margins : null
  pluginParams.width = width ? width : convertSizeFormat('8.5in')
  pluginParams.height = height ? height : convertSizeFormat('11in')

  for (var pageModifier of relaxedGlobals.pluginHooks.pageModifiers) {
    await pageModifier.instance(page, pluginParams)
  }

  for (pageModifier of relaxedGlobals.pluginHooks.page2ndModifiers) {
    await pageModifier.instance(page, pluginParams)
  }

  // TODO: add option to output full html from page

  /*
   *            PRINT PAGE TO PDF
   */
  await page.pdf(options)

  var tPDF = performance.now()
  let duration = ((tPDF - tNetwork) / 1000).toFixed(1)
  let pdfSize = filesize(fs.statSync(outputPath).size)
  console.log(colors.magenta(`... PDF written in ${duration}s (${pdfSize})`))
}

// Wait for all the content on the page to finish loading
function waitForNetworkIdle (page, timeout, maxInflightRequests = 0) {
  page.on('request', onRequestStarted)
  page.on('requestfinished', onRequestFinished)
  page.on('requestfailed', onRequestFinished)

  let inflight = 0
  let fulfill
  let promise = new Promise(x => fulfill = x)
  let timeoutId = setTimeout(onTimeoutDone, timeout)
  return promise

  function onTimeoutDone () {
    page.removeListener('request', onRequestStarted)
    page.removeListener('requestfinished', onRequestFinished)
    page.removeListener('requestfailed', onRequestFinished)
    fulfill()
  }

  function onRequestStarted () {
    ++inflight
    if (inflight > maxInflightRequests) {
      clearTimeout(timeoutId)
    }
  }

  function onRequestFinished () {
    if (inflight === 0) {
      return
    }
    --inflight
    if (inflight === maxInflightRequests) {
      timeoutId = setTimeout(onTimeoutDone, timeout)
    }
  }
}
