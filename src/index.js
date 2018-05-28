#!/usr/bin/env node
// Standard NPM requirements
const colors          = require('colors/safe')
const program         = require('commander')
const chokidar        = require('chokidar')
const puppeteer       = require('puppeteer')
const { performance } = require('perf_hooks')
const path            = require('path')
const fs              = require('fs')

const converters      = require('./converters.js')

var input, output
const version = require('../package.json').version

program
    .version(version)
    .usage('<input> [output] [options]')
    .arguments('<input> [output] [options]')
    .option('--no-sandbox', 'disable puppeteer sandboxing')
    .option('-w, --watch <locations>', 'Watch other locations', [])
    .option('-t, --temp [location]', 'Directory for temp file')
    .option('--build-once', 'Build only, do not watch')
    .action(function (inp, out) {
        input = inp
        output = out
    })
    .parse(process.argv)

if (!input) {
    console.error('ReLaXed error: no input file specified'.red);
    process.exit(1)
}


/*
 * ==============================================================
 *                      Variable Setting
 * ==============================================================
 */
// Input file data: {name} (master), {ext} (pug|html),
//   {path} (path/to), {fullPath} (/home/user/relaxed/full/path/to),
//   {file} (/home/user/relaxed/full/path/to/master.pug)
const IN = {
    name    : path.basename(input, path.extname(input)),
    ext     : path.extname(input),
    path    : path.dirname(input),
    fullPath: path.resolve(input, '..'),
    file    : path.resolve(input)
}
/*
    inputPath          -> IN.file
    inputDir           -> IN.fullPath
    inputFilenameNoExt -> IN.name
*/

// User configuration file
/* Comment out until ready
if (fs.existsSync(path.join(IN.fullPath, '.relaxed.json'))) {
    const config = require(path.join(IN.fullPath, '.relaxed.json'))
}
*/

// User global configuration data
//  TODO: Add configuration to master.pug for using a template: (paper|report|slide|novel|summary|etc)
//        //- use-template: paper -> include /home/user/.relaxed/templates/paper.pug
//        User definable templates. Plugins mixins are templates themselves
//  TODO: Correct home directory for Windows, os.homedir() goes to C:\Users\username, not to C:\Users\username\AppData like it should
//  TODO: Apples equivalent? (never touched apple, would not know)
/* Comment out until ready
var user = {
    home: path.join(os.homedir(), '.relaxed'),
    templates: path.join(user.home, 'templates')
}

if (fs.existsSync(path.join(user.home, 'relaxed.json'))) {
    user.config = require(path.join(user.home, 'relaxed.json'))
}
*/

// Supported file extensions to watch for changes
//  TODO: Add a means for a plugin to watch for custom extensions
const extList = [
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
    '.htable.csv'
]


// Output file, path, and temp html file
if (!output) output = path.join(IN.fullPath, IN.name + '.pdf')
const outputPath    = path.resolve(output)

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

const tempHTML      = path.join(tempDir, IN.name + '_temp.htm')

// Default and additional watch locations
let watchLocations = [IN.fullPath]
if (program.watch) watchLocations = watchLocations.concat(program.watch)

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
async function main () {
    console.log(colors.magenta.bold('Launching ReLaXed...'))
    const browser = await puppeteer.launch(puppeteerConfig);
    const page    = await browser.newPage()

    page.on('pageerror', function (err) {
        console.log(colors.red(`Page error: ${err.toString()}`))

    }).on('error', function (err) {
        console.log(colors.red(`Error: ${err.toString()}`))

    })

    if (program.buildOnce) convert(page)
    else watch(page)
}

/**
 * Perform one time build on master document
 *
 * @param {puppeteer.Page} page
 */
async function convert (page) {
    console.log(colors.magenta.bold('Building the document...'))

    await converters.masterDocumentToPDF(IN.file, page, tempHTML, outputPath).catch(error => {
        console.log(error.toString())
        process.exit(1)
    })

    console.log(colors.magenta.bold('... Done !'))
    process.exit(0)
}

/**
 * Watch `watchLocations` paths for changes and continuously rebuild
 *
 * @param {puppeteer.Page} page
 */

function watch (page) {
    // Changed 'watching file and directory' to 'watching directory'
    console.log(colors.magenta(`\nNow waiting for changes in ${colors.underline(IN.path)}`))

    var globals = {
        busy: false
    }

    chokidar.watch(watchLocations, {
        awaitWriteFinish: {
            stabilityThreshold: 50,
            pollInterval      : 100
        }
    })
    .on('change', (filepath) => {

        if (!(extList.some(ext => filepath.endsWith(ext)))) {
            return
        }

        var fileName = filepath.replace(IN.fullPath, '')
        if (globals.busy) {
            console.log(colors.yellow(`( detected change in ${fileName}, but too busy right now )`))
            return
        }

        console.log(colors.magenta.bold(`\nProcessing detected change in ${fileName}...`))
        globals.busy = true

        var t0 = performance.now()
        var taskPromise = null
        if (filepath.endsWith('.chart.js')) {
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
            taskPromise = converters.masterDocumentToPDF(IN.file, page, tempHTML, outputPath)
        }

        if (taskPromise) {
            taskPromise.then(function () {
                var duration = ((performance.now() - t0) / 1000).toFixed(2)
                console.log(colors.magenta.bold(`... Done in ${duration}s`))
                globals.busy = false
            })

        } else globals.busy = false

    })

}

main()
