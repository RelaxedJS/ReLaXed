#!/usr/bin/env node

const colors = require('colors')
const program = require('commander')
const path = require('path')
const { spawn } = require('child_process')
const version = require('../../package.json').version

var input, output

program
  .version('From ReLaXed ' + version)
  .usage('<input> [output] [options]')
  .arguments('<input> [output] [options]')
  .option('--width, -w', 'width in pixels')
  .option('--delay, -d', 'delay between frames')
  .option('--colors, -c', 'number of colors')
  .action(function (inp, out) {
    input = inp
    output = out
  })
program.parse(process.argv)
output = output || (input.slice(0, input.length - 4) + '.gif')
var width = (program.width || 400).toString()
var delay = (100 * (program.delay || 1.0)).toString()
var ncolors = (program.colors || 256).toString()
var subprocess = spawn('convert', [
  '-delay', delay,
  '-resize', width,
  '-colors', ncolors,
  '-layers', 'optimize',
  input,
  output
])

subprocess
  .on('data', function (data) {
    console.log(data)
  })
  .on('close', async function (code) {
    if (code) {
      console.log(code)
    } else {
      console.log('...done.')
    }
  })
