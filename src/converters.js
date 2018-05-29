const fs              = require('fs')
const util            = require('util')
const pug             = require('pug')
const writeFile       = util.promisify(fs.writeFile)
const cheerio         = require('cheerio')
const path            = require('path')
const csv             = require('csvtojson')
const html2jade       = require('html2jade')
const colors          = require('colors/safe')
const { performance } = require('perf_hooks')
const katex           = require('katex')
const sass            = require('node-sass')
const SVGO            = require('svgo')

const utils           = require('./utils')
const generate        = require('./generators')


/*
 * ==============================================================
 *                      Mermaid
 * ==============================================================
 */
exports.mermaidToSvg = async function (mermaidPath, page) {
    var mermaidSpec = fs.readFileSync(mermaidPath, 'utf8')
    var html = utils.formatTemplate('mermaid', { mermaidSpec })

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

/*
 * ==============================================================
 *                     Flowchart
 * ==============================================================
 */
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

    var html = utils.formatTemplate('flowchart', { flowchartSpec, flowchartConf })

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

/*
 * ==============================================================
 *                    Vegalite
 * ==============================================================
 */
exports.vegaliteToSvg = async function (vegalitePath, page) {
    var vegaliteSpec = fs.readFileSync(vegalitePath, 'utf8')
    var html = utils.formatTemplate('vegalite', { vegaliteSpec })

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

/*
 * ==============================================================
 *                Optimize SVG
 * ==============================================================
 */
exports.svgToOptimizedSvg = async function (svgPath) {
    var svgdata = fs.readFileSync(svgPath, 'utf8')

    var svgo = new SVGO({
        plugins: [{ removeNonInheritableGroupAttrs: false },
            { cleanupAttrs: false },
            { moveGroupAttrsToElems: false },
            { collapseGroups: false },
            { removeUnknownsAndDefaults: false },
            { cleanupIDs:
                { prefix: path.basename(svgPath) }
            }
        ]
    })

    var svgoPath = svgPath.substr(0, svgPath.length - '.o.svg'.length) + '_optimized.svg'
    var svgoData = await svgo.optimize(svgdata)

    await writeFile(svgoPath, svgoData.data)
}

/*
 * ==============================================================
 *                    CSV Table
 * ==============================================================
 */
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
            var pugPath = tablePath.substr(0,tablePath.length - extension.length) + '.pug'

            html2jade.convertHtml(html, {bodyless: true}, function (err, jade) {
                if (err) { console.log(err) }
                
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
exports.chartjsToPNG = async function (chartjsPath, page) {
    var chartSpec = fs.readFileSync(chartjsPath, 'utf8')
    var html      = utils.formatTemplate('chartjs', { chartSpec })
    var tempHTML  = chartjsPath + '.htm'

    await writeFile(tempHTML, html)
    await page.setContent(html)
    await page.waitForFunction(() => window.pngData)

    const dataUrl    = await page.evaluate(() => window.pngData)
    const { buffer } = utils.parseDataUrl(dataUrl)
    var pngPath      = chartjsPath.substr(0, chartjsPath.length - '.chart.js'.length) + '.png'

    await writeFile(pngPath, buffer, 'base64')
}

/*
 * ==============================================================
 *                          Master
 * ==============================================================
 */
const builtinMixins = fs.readFileSync(path.join(__dirname, 'builtin_mixins.pug'))
exports.masterDocumentToPDF = async function (masterPath, page, tempHTML, outputPath) {
    var html
    var t0 = performance.now()

    /*
     *            Generate HTML
     */
    // TODO: Pre-pug hook
    if (masterPath.endsWith('.pug')) {
        try {
            var masterPug = fs.readFileSync(masterPath, 'utf8')

            html = pug.render(builtinMixins + '\n' + masterPug, {
                filename: masterPath,
                fs: fs,
                cheerio: cheerio,
                basedir: path.dirname(masterPath),
                path: path,
                performance: performance,
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
            console.error(colors.red('There was a Pug error (see above)'))
            return
        }

    } else {  html = fs.readFileSync(masterPath, 'utf8') }

    if (html.indexOf("-relaxed-mathjax-everywhere") >= 0) {
        html = await utils.asyncMathjax(html)
    }

    html = `<html><body>${html}</body></html>`

    // TODO: Post-pug hook
    await writeFile(tempHTML, html)

    var tHTML = performance.now()
    console.log(colors.magenta(`... HTML generated in ${((tHTML - t0) / 1000).toFixed(1)}s`))

    await page.goto('file:' + tempHTML, {waitUntil: ['load', 'domcontentloaded']})
    var tLoad = performance.now()
    console.log(colors.magenta(`... Document loaded in ${((tLoad - tHTML) / 1000).toFixed(1)}s`))

    await utils.waitForNetworkIdle(page, 200)
    var tNetwork = performance.now()
    console.log(colors.magenta(`... Network idled in ${((tNetwork - tLoad) / 1000).toFixed(1)}s`))

    var headerFooter = await getHeaderFooter(page)

    var headerTemplate = headerFooter.head
    var footerTemplate = headerFooter.foot

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
    if (width) { options.width = width }

    var height = utils.getMatch(html, /-relaxed-page-height: (\S+);/m)
    if (height) { options.height = height }

    var size = utils.getMatch(html, /-relaxed-page-size: (\S+);/m)
    if (size) { options.size = size }

    // TODO: page-first-pass hook
    await generate.bibliography(page)

    // TODO: page-second-pass hook
    // TODO: add option to output full html from page
    
    await page.pdf(options)

    var tPDF = performance.now()
    console.log(colors.magenta(`... PDF written in ${((tPDF - tLoad) / 1000).toFixed(1)}s`))
}

/*
 *          Get Header and Footer template
 */
async function getHeaderFooter(page) {
    var head = await page.$eval('#page-header', element => element.outerHTML)
        .catch(error => '')
    var foot = await page.$eval('#page-footer', element => element.outerHTML)
        .catch(error => '')

    if(head != '' && foot == '') { foot = '<span></span>' }
    if(foot != '' && head == '') { head = '<span></span>' }

    return new Promise((resolve, reject) => {
        resolve({
            head: head,
            foot: foot
        })
    })
}
