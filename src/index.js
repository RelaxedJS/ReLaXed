#!/usr/bin/env node
const colors = require('colors')
const program = require('commander')
const chokidar = require('chokidar')
const puppeteer = require('puppeteer')
const { performance } = require('perf_hooks')
const path = require('path')
const fs = require('fs')
const converters = require('./converters.js')

program
  .version('0.0.1')
  .usage('<input> [output] [temp] [options]')
  .arguments('<input> [output] [temp] [options]')
  .option('--no-sandbox', 'disable puppeteer sandboxing')
  .action(async function(input, output, temp) {
    var argsObj = argsParser(input, output, temp)
    var inputPath = argsObj.inputPath
    var inputDir = argsObj.inputDir
    var outputPath = argsObj.outputPath
    var tempHTMLPath = argsObj.tempHTMLPath

    console.log('converting' + input + ' to pdf...')
    const browser = await puppeteer.launch(puppeteerConfig)
    const page = await browser.newPage()
    page
      .on('pageerror', function(err) {
        console.log('Page error: ' + err.toString())
      })
      .on('error', function(err) {
        console.log('Error: ' + err.toString())
      })
    await handleFileChange(inputPath, inputPath, tempHTMLPath, outputPath, page)
    process.exit(1)
  })

program
  .command('watch <input> [output] [locations] [temp]')
  .action(function(input, output, locations, temp) {
    console.log(`watch${input}`)
    var argsObj = argsParser(input, output, temp)
    var inputPath = argsObj.inputPath
    var inputDir = argsObj.inputDir
    var outputPath = argsObj.outputPath
    var tempHTMLPath = argsObj.tempHTMLPath
    var watchLocations = [inputDir]
    watchLocations = locations
      ? watchLocations.concat(program.watch)
      : watchLocations
    main(input, inputDir, watchLocations, inputPath, tempHTMLPath, outputPath)
  })

program.parse(process.argv)

var puppeteerConfig = {
  headless: true,
  args: program.sandbox ? ['--no-sandbox'] : []
}

async function main(
  input,
  inputDir,
  watchLocations,
  inputPath,
  tempHTMLPath,
  outputPath
) {
  console.log('Watching ' + input + ' and its directory tree.')
  const browser = await puppeteer.launch(puppeteerConfig)
  const page = await browser.newPage()
  page
    .on('pageerror', function(err) {
      console.log('Page error: ' + err.toString())
    })
    .on('error', function(err) {
      console.log('Error: ' + err.toString())
    })

  chokidar
    .watch(watchLocations, {
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 100
      }
    })
    .on('change', filepath => {
      if (
        ![
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
        ].some(ext => filepath.endsWith(ext))
      ) {
        return
      }
      console.log(
        `\nProcessing detected change in ${filepath.replace(inputDir, '')}...`
          .magenta.bold
      )
      handleFileChange(filepath, inputPath, tempHTMLPath, outputPath, page)
    })
}

/**
 * handle file change.
 *
 * @param {String} filepath changed file's path
 */

async function handleFileChange(
  filepath,
  inputPath,
  tempHTMLPath,
  outputPath,
  page
) {
  var t0 = performance.now()
  var taskPromise = null
  if (
    ['.pug', '.md', '.html', '.css', '.scss', '.svg', '.png'].some(ext =>
      filepath.endsWith(ext)
    )
  ) {
    taskPromise = converters.masterDocumentToPDF(
      inputPath,
      page,
      tempHTMLPath,
      outputPath
    )
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
  } else if (
    ['.table.csv', '.htable.csv'].some(ext => filepath.endsWith(ext))
  ) {
    converters.tableToPug(filepath)
  }
  if (taskPromise) {
    await taskPromise
    var duration = ((performance.now() - t0) / 1000).toFixed(2)
    console.log(`... done in ${duration}s`.magenta.bold)
  }
}

function argsParser(input, output, temp) {
  if (!input) {
    console.error('Please specifiy an input file')
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
    var validTempPath =
      fs.existsSync(program.temp) && fs.statSync(program.temp).isDirectory()
    if (validTempPath) {
      tempDir = path.resolve(program.temp)
    } else {
      console.error(
        'Could not find specified --temp directory: ' + program.temp
      )
      process.exit(1)
    }
  } else {
    tempDir = inputDir
  }

  const tempHTMLPath = path.join(tempDir, inputFilenameNoExt + '_temp.htm')
  var argsObj = {
    inputPath: inputPath,
    inputDir: inputDir,
    outputPath: outputPath,
    tempHTMLPath: tempHTMLPath
  }
  return argsObj
}
