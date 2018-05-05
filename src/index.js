#!/usr/bin/env node
const colors = require('colors')
const program = require('commander')
const chokidar = require('chokidar')
const puppeteer = require('puppeteer')
const { performance } = require('perf_hooks')
const path = require('path')
const fs = require('fs')
const converters = require('./converters.js')

var input, output

program
  .version('0.0.1')
  .usage('<input> [output] [options]')
  .arguments('<input> [output] [options]')
  .option('--no-sandbox', 'disable puppeteer sandboxing')
  .option('-w, --watch <locations>', 'Watch other locations', [])
  .option('-t, --temp [location]', 'Directory for temp file')
  .action(function (inp, out) {
    input = inp
    output = out
  })

program.parse(process.argv)

if (!input) {
  console.error('Please specifiy an input file');
  process.exit(1)
}

const inputPath = path.resolve(input)
const inputDir = path.resolve(inputPath, '..')
const inputFilenameNoExt = path.basename(input, path.extname(input))

if (!output) {
  output = path.join(inputDir, inputFilenameNoExt + '.pdf')
}

const outputPath = path.resolve(output)

var tempDir
if (program.temp) {
  var validTempPath = fs.existsSync(program.temp) && fs.statSync(program.temp).isDirectory()
  if (validTempPath) {
    tempDir = path.resolve(program.temp)
  } else {
    console.error('Could not find specified --temp directory: ' + program.temp)
    process.exit(1)
  }
} else {
  tempDir = inputDir
}

const tempHTMLPath = path.join(tempDir, inputFilenameNoExt + '_temp.htm')

let watchLocations = [inputDir]
if (program.watch) {
  watchLocations = watchLocations.concat(program.watch)
}

const puppeteerConfig = {
  headless: true,
  args: program.sandbox ? ['--no-sandbox'] : []
}

async function main () {
  console.log('Watching ' + input + ' and its directory tree.')
  const browser = await puppeteer.launch(puppeteerConfig);
  const page = await browser.newPage()
  page.on('pageerror', function (err) {
    console.log('Page error: ' + err.toString())
  }).on('error', function (err) {
    console.log('Error: ' + err.toString())
  })

  chokidar.watch(watchLocations, {
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 100
    }
  }).on('change', (filepath) => {
    if (!(['.pug', '.md', '.html', '.css', '.scss', '.svg', '.mermaid',
           '.chart.js', '.png', '.flowchart', '.flowchart.json',
           '.vegalite.json', '.table.csv', 'htable.csv'].some(ext => filepath.endsWith(ext)))) {
      return
    }
    console.log(`\nProcessing detected change in ${filepath.replace(inputDir, '')}...`.magenta.bold)
    var t0 = performance.now()
    var taskPromise = null
    if (['.pug', '.md', '.html', '.css', '.scss', '.svg', '.png'].some(ext => filepath.endsWith(ext))) {
      taskPromise = converters.masterDocumentToPDF(inputPath, page, tempHTMLPath, outputPath)
    } else if (filepath.endsWith('.chart.js')) {
      taskPromise = converters.chartjsToPNG(filepath, page)
    } else if (filepath.endsWith('.mermaid')) {
      taskPromise = converters.mermaidToSvg(filepath, page)
    } else if (filepath.endsWith('.flowchart')) {
      taskPromise = converters.flowchartToSvg(filepath, page)
    } else if (filepath.endsWith('.flowchart.json')) {
      var flowchartFile = filepath.substr(0, filepath.length - 5)
      taskPromise = converters.flowchartToSvg(flowchartFile, page)
    } else if (filepath.endsWith('.vegalite.json')) {
      taskPromise = converters.vegaliteToSvg(filepath, page)
    } else if (['.table.csv', '.htable.csv'].some(ext => filepath.endsWith(ext))) {
      converters.tableToPug(filepath)
    }
    if (taskPromise) {
      taskPromise.then(function () {
        var duration = ((performance.now() - t0) / 1000).toFixed(2)
        console.log(`... done in ${duration}s`.magenta.bold)
      })
    }
  })
}

main()
