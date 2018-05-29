#!/usr/bin/env node

const colors = require('colors')
const program = require('commander')
const path = require('path')
const { spawn } = require('child_process')
const version = require('../../package.json').version

var input, output

program
  .version(version)
  .usage('<input> [output] [options]')
  .arguments('<input> [output] [options]')
  .option('--width, -w', 'width in pixels')
  .option('--shadow, -s', 'shadow size in pixels', [])
  .action(function (inp, out) {
    input = inp
    output = out
  })

program.parse(process.argv)

program.shadow = program.shadow || 15
var subprocess = spawn('convert', [
  '-density', '300',
  input + '[0]',
  '-resize', ((program.size || 600) - 4 * program.shadow).toString(),
  `(`, '+clone', '-background', 'black',
  '-shadow', `${program.shadow}x${program.shadow}+1+1`, `)`,
  '+swap',
  '-background', 'white',
  '-layers', 'merge',
  '+repage',
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
