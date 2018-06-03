#!/usr/bin/env node

const colors = require('colors/safe')
const program = require('commander')
const chokidar = require('chokidar')
const puppeteer = require('puppeteer')
const { performance } = require('perf_hooks')
const path = require('path')
const fs = require('fs')

const converters = require('./converters.js')
const plugins = require('./plugins')

var input, output
const version = require('../package.json').version

program
  .version(version)
  .usage('<input> [output] [options]')
  .arguments('<input> [output] [options]')
  .option('--no-sandbox', 'disable puppeteer sandboxing')
  .option('-w, --watch <locations>', 'Watch other locations', [])
  .option('-t, --temp [location]', 'Directory for temp file')
  .option('--bo, --build-once', 'Build once only, do not watch')
  .action(function (inp, out) {
    input = inp
    output = out
  })

program.parse(process.argv)

if (!input) {
  console.error('ReLaXed error: no input file specified'.red)
  process.exit(1)
}

/*
 * ==============================================================
 *                      Variable Setting
 * ==============================================================
 */
const inputPath = path.resolve(input)
const inputDir = path.resolve(inputPath, '..')
const inputFilenameNoExt = path.basename(input, path.extname(input))
var configPath
for (filename in ['config.yaml', 'config.json']) {
  let path = path.join(inputDir, filename
  if fs.existsSync(filename) {
    configPath = path
  }
}


// Output file, path, and temp html path
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
    console.error(colors.red('ReLaXed error: Could not find specified --temp directory: ' +
      program.temp))
    process.exit(1)
  }

} else {
  tempDir = inputDir
}

const tempHTMLPath = path.join(tempDir, inputFilenameNoExt + '_temp.htm')

// Default and additional watch locations
let watchLocations = [inputDir]
if (program.watch) {
  watchLocations = watchLocations.concat(program.watch)
}

// Google Chrome headless configuration
const puppeteerConfig = {
  headless: true,
  args: (program.sandbox ? ['--no-sandbox'] : []).concat([
    '--disable-translate',
    '--disable-extensions',
    '--disable-sync'
  ])
}


/*
 * ==============================================================
 *                         Functions
 * ==============================================================
 */

const relaxedGlobals = {
  busy: false,
  config: {}
}

async function main () {
  console.log(colors.magenta.bold('Launching ReLaXed...'))
  if (configPath) {

    console.log(colors.magenta.bold('Loading config plugins...'))
    relaxedGlobals.configPlugins = await plugins.loadConfigPlugins(configPath)
  }

  const browser = await puppeteer.launch(puppeteerConfig);
  const page = await browser.newPage()
  relaxedGlobals.puppeteerPage = browser.newPage()

  page.on('pageerror', function (err) {
    console.log(colors.red('Page error: ' + err.toString()))
  }).on('error', function (err) {
    console.log(colors.red('Error: ' + err.toString()))
  })
  if (program.buildOnce) {
    await build(page, inputPath, {busy: false})
    process.exit(0)
  } else {
    watch(page)
  }
}

async function build (filepath) {
  // Ignore the call if ReLaXed is already busy processing other files.
  if (relaxedGlobals.busy) {
    console.log(colors.grey(`File ${shortFileName}: ignoring trigger, too busy.`))
    return
  }


  var allPlugins = relaxedGlobals.configPlugins.concat(plugins.builtinDefaultPlugins)
  // TODO: these should disappear, either plugined-away or part of the
  // "default" plugin

  var watchedExtensions = [
    '.pug',
    '.md',
    '.html',
    '.css',
    '.scss',
    '.svg',
    '.mermaid',
    '.chart.js',
    '.png',
    '.flowchart',
    '.flowchart.json',
    '.vegalite.json',
    '.table.csv',
    'htable.csv'
  ]

  var watchers = []
  for (var plugin of allPlugins) {
    if (plugin.watchers) {
      watchers = watchers.concat(plugin.watchers)
    }
  }
  // TODO: order watchers by watched extension inclusion.

  for (var watcher of watchers) {
     watchedExtensions= watchedExtensions.concat(watcher.extensions)
  }


  if (!(extlist.some(ext => filepath.endsWith(ext)))) {
    if (!(['.pdf', '.htm'].some(ext => filepath.endsWith(ext)))) {
      console.log(colors.grey(`No process defined for file ${shortFileName}.`))
    }
    return
  }

  var shortFileName = filepath.replace(inputDir, '')
  console.log(colors.magenta.bold(`\nProcessing triggered for ${shortFileName}...`))
  relaxedGlobals.busy = true
  var t0 = performance.now()

  // TODO: plugin-away these different hooks.
  var taskPromise = null

  for (watcher of watchers) {
    if (watcher.extensions.some(ext => filepath.endsWith(ext))) {
      taskPromise watcher.handler(filepath, page)
    }
  }
  if (taskPromise) {
    // do nothing (this is a temporary cosmetic hack until everything below)
    // gets plugined away
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
  } else if (filepath.endsWith('.o.svg')) {
    taskPromise = converters.svgToOptimizedSvg(filepath)
  } else if (['.pug', '.md', '.html', '.css', '.scss', '.svg', '.png'].some(ext => filepath.endsWith(ext))) {
    taskPromise = converters.masterDocumentToPDF(inputPath, page, tempHTMLPath, outputPath)
  }

  if (taskPromise) {
    await taskPromise
    var duration = ((performance.now() - t0) / 1000).toFixed(2)
    console.log(colors.magenta.bold(`... Done in ${duration}s`))
    globals.busy = false
  } else {
    globals.busy = false
  }
}

/**
 * Watch `watchLocations` paths for changes and continuously rebuild
 *
 * @param {puppeteer.Page} page
 */
function watch() {
  console.log(colors.magenta(`\nNow waiting for changes in ${colors.underline(input)} and its directory`))
  chokidar.watch(watchLocations, {
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 100
    }
  }).on('change', (filepath) => {
    build(filepath)
  })
}

main()
