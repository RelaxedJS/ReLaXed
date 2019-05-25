const fs = require('fs')
const path = require('path')
const colors = require('colors/safe')

let lastLocalJsonPath

function logError(error, message) {
  console.error(error)
  console.error(colors.red(message))
}

function readJsonFileAsString(jsonPath) {
  try {
    return fs.readFileSync(jsonPath, { encoding: 'utf-8' })
  } catch (error) {
    logError(error, `ReLaXed error: Could not read .json file at: ${jsonPath}`)
  }
}

function parseJson(str) {
  try {
    return JSON.parse(str)
  } catch (error) {
    logError(error, 'ReLaXed error: Could not parse locals JSON, see error above.')
  }
}

function isPathToJsonFile(filePath) {
  return path.extname(filePath) === ".json"
}

function isLastLocalJsonPath(filePath) {
  return lastLocalJsonPath === filePath
}

function parseLocals(locals, inputDir) {
  if (!locals) {
    return
  }

  jsonString = locals

  if (isPathToJsonFile(locals)) {
    lastLocalJsonPath = path.join(inputDir, locals)
    jsonString = readJsonFileAsString(lastLocalJsonPath)
  }

  return parseJson(jsonString)
}

exports.isLastLocalJsonPath = isLastLocalJsonPath
exports.parseLocals = parseLocals
