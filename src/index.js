#!/usr/bin/env node

const colors = require('colors/safe')
const program = require('commander')
const chokidar = require('chokidar')
const puppeteer = require('puppeteer')
const yaml = require('js-yaml')
const { performance } = require('perf_hooks')
const path = require('path')
const fs = require('fs')
const plugins = require('./plugins')
const converters = require('./converters.js')
const { masterToPDF } = require('./masterToPDF.js')

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
for (var filename of ['config.yml', 'config.json']) {
  let possiblePath = path.join(inputDir, filename)
  if (fs.existsSync(possiblePath)) {
    configPath = possiblePath
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
 *                         MAIN
 * ==============================================================
 */

const relaxedGlobals = {
  busy: false,
  config: {},
  configPlugins: []
}

var updateConfig = async function () {
  if (configPath) {
    console.log(colors.magenta('... Reading config file'))
    var data = fs.readFileSync(configPath, 'utf8')
    if (configPath.endsWith('.json')) {
      relaxedGlobals.config = JSON.parse(data)
    } else {
      relaxedGlobals.config = yaml.safeLoad(data)
    }
  }
  await plugins.updateRegisteredPlugins(relaxedGlobals, inputDir)
}



async function main () {
  console.log(colors.magenta.bold('Launching ReLaXed...'))

  // LOAD BUILT-IN "ALWAYS-ON" PLUGINS
  for (var [i, plugin] of plugins.builtinDefaultPlugins.entries()) {
    plugins.builtinDefaultPlugins[i] = await plugin.constructor()
  }
  await updateConfig()
  const browser = await puppeteer.launch(puppeteerConfig)
  relaxedGlobals.puppeteerPage = await browser.newPage()

  relaxedGlobals.puppeteerPage.on('pageerror', function (err) {
    console.log(colors.red('Page error: ' + err.toString()))
  }).on('error', function (err) {
    console.log(colors.red('Error: ' + err.toString()))
  })
  if (program.buildOnce) {
    await build(inputPath)
    process.exit(0)
  } else {
    watch()
  }
}

async function build (filepath) {
  var shortFileName = filepath.replace(inputDir, '')
  var page = relaxedGlobals.puppeteerPage
  // Ignore the call if ReLaXed is already busy processing other files.

  if (!(relaxedGlobals.watchedExtensions.some(ext => filepath.endsWith(ext)))) {
    if (!(['.pdf', '.htm'].some(ext => filepath.endsWith(ext)))) {
      console.log(colors.grey(`No process defined for file ${shortFileName}.`))
    }
    return
  }

  if (relaxedGlobals.busy) {
    console.log(colors.grey(`File ${shortFileName}: ignoring trigger, too busy.`))
    return
  }

  console.log(colors.magenta.bold(`\nProcessing triggered for ${shortFileName}...`))
  relaxedGlobals.busy = true
  var t0 = performance.now()


  var taskPromise = null

  for (var watcher of relaxedGlobals.pluginHooks.watchers) {
    if (watcher.instance.extensions.some(ext => filepath.endsWith(ext))) {
      taskPromise = watcher.instance.handler(filepath, page)
      break
    }
  }

  // TODO: plugin-away all these different hooks.
  if (taskPromise) {
    // do nothing (this is a temporary cosmetic hack until everything below)
    // gets plugined away
  } else if (filepath.endsWith('.mermaid')) {
    taskPromise = converters.mermaidToSvg(filepath, page)
  } else if (filepath.endsWith('.flowchart')) {
    taskPromise = converters.flowchartToSvg(filepath, page)
  } else if (filepath.endsWith('.flowchart.json')) {
    var flowchartFile = filepath.substr(0, filepath.length - 5)
    taskPromise = converters.flowchartToSvg(flowchartFile, page)
  } else if (filepath.endsWith('.vegalite.json')) {
    taskPromise = converters.vegaliteToSvg(filepath, page)
  } else {
    // MAIN HOOK
    taskPromise = masterToPDF(inputPath, relaxedGlobals, tempHTMLPath, outputPath)
  }

  if (taskPromise) {
    await taskPromise
    var duration = ((performance.now() - t0) / 1000).toFixed(2)
    console.log(colors.magenta.bold(`... Done in ${duration}s`))
    relaxedGlobals.busy = false
  } else {
    relaxedGlobals.busy = false
  }
}

/**
 * Watch `watchLocations` paths for changes and continuously rebuild
 *
 * @param {puppeteer.Page} page
 */
function watch () {
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
