#!/usr/bin/env node

const program = require('commander')
const chokidar = require('chokidar')
const puppeteer = require('puppeteer')
const { performance } = require('perf_hooks')
const path = require('path')
const converters = require('./converters.js')

var input, output

program
  .version('0.0.1')
  .usage('<input> [output] [options]')
  .arguments('<input> [output] [options]')
  .option('-w, --watch', 'option description')
  .action(function (inp, out) {
    input = inp
    output = out
  })

program.parse(process.argv)
if (!output) {
  output = input.substr(0, input.lastIndexOf('.')) + '.pdf'
}
const inputPath = path.resolve(input)
const outputPath = path.resolve(output)
const inputDir = path.resolve(inputPath, '..')
const tempHTML = path.join(inputDir, '_temp.htm')

async function main () {
  console.log('Watching ' + input + ' and its directory tree.')
  const browser = await puppeteer.launch({
    headless: true
  })
  const page = await browser.newPage()
  page.on('pageerror', function (err) {
    console.log('Page error: ' + err.toString())
  }).on('error', function (err) {
    console.log('Error: ' + err.toString())
  })

  chokidar.watch(inputDir, {
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 100
    }
  }).on('change', (filepath) => {
    var t0 = performance.now()
    var taskPromise = null
    if (['.pug', '.md', '.html', '.css', '.scss', '.svg'].some(ext => filepath.endsWith(ext))) {
      taskPromise = converters.masterDocumentToPDF(inputPath, page, tempHTML, outputPath)
    } else if (filepath.endsWith('.mermaid')) {
      taskPromise = converters.mermaidToSvg(filepath, page)
    } else if (filepath.endsWith('.flowchart')) {
      taskPromise = converters.flowchartToSvg(filepath, page)
    } else if (filepath.endsWith('.flowchart.json')) {
      var flowchartFile = filepath.substr(0, filepath.length - 5)
      taskPromise = converters.flowchartToSvg(flowchartFile, page)
    } else if (filepath.endsWith('.vegalite.json')) {
      taskPromise = converters.vegaliteToSvg(filepath, page)
    }
    if (taskPromise) {
      taskPromise.then(function () {
        var duration = ((performance.now() - t0) / 1000).toFixed(2)
        console.log(`Processed change in ${filepath} in ${duration}s`)
      })
    }
  })
}

main()
