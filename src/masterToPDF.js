const pug = require('pug')
const colors = require('colors/safe')
const cheerio = require('cheerio')
const util = require('util')
const fs = require('fs')
const writeFile = util.promisify(fs.writeFile)
const filesize = require('filesize')
const katex = require('katex')
const sass = require('node-sass')
const utils = require('./utils')
const path = require('path')
const { performance } = require('perf_hooks')

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

  html = `<html><body>${html}</body></html>`
  for (var htmlFilter of relaxedGlobals.pluginHooks.htmlFilters) {
    html = await htmlFilter.instance(html)
  }

  await writeFile(tempHTMLPath, html)

  var tHTML = performance.now()
  console.log(colors.magenta(`... HTML generated in ${((tHTML - t0) / 1000).toFixed(1)}s`))

  await page.goto('file:' + tempHTMLPath, {
    waitUntil: ['load', 'domcontentloaded']
  })
  var tLoad = performance.now()
  console.log(colors.magenta(`... Document loaded in ${((tLoad - tHTML) / 1000).toFixed(1)}s`))

  await utils.waitForNetworkIdle(page, 200)
  var tNetwork = performance.now()
  console.log(colors.magenta(`... Network idled in ${((tNetwork - tLoad) / 1000).toFixed(1)}s`))

  // Get header/footer template
  var head = await page.$eval('#page-header', element => element.outerHTML)
    .catch(error => '')
  var foot = await page.$eval('#page-footer', element => element.outerHTML)
    .catch(error => '')

  if (head !== '' && foot === '') {
    foot = '<span></span>'
  }
  if (foot !== '' && head === '') {
    head = '<span></span>'
  }
  var headerTemplate = head
  var footerTemplate = foot

  /*
   *            Create PDF options
   */
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

  for (var pageModifier of relaxedGlobals.pluginHooks.pageModifiers) {
    await pageModifier.instance(page)
  }

  for (pageModifier of relaxedGlobals.pluginHooks.page2ndModifiers) {
    await pageModifier.instance(page)
  }

  // TODO: add option to output full html from page

  await page.pdf(options)

  var tPDF = performance.now()
  let duration = ((tPDF - tNetwork) / 1000).toFixed(1)
  let pdfSize = filesize(fs.statSync(outputPath).size)
  console.log(colors.magenta(`... PDF written in ${duration}s (${pdfSize})`))
}
