const pug = require('pug')
const fs = require('fs')
const path = require('path')

exports.constructor = async function (params) {
  return {
    watchers: [
      {
        extensions: ['.chart.js'],
        handler: chartjsHandler
      }
    ]
  }
}


var chartjsHandler = async function (chartjsPath, page) {
  var chartSpec = fs.readFileSync(chartjsPath, 'utf8')
  var html = pug.renderFile(path.join(__dirname, 'template.pug'), { chartSpec })
  var tempHTML = chartjsPath + '.htm'

  fs.writeFileSync(tempHTML, html)
  await page.setContent(html)
  await page.waitForFunction(() => window.pngData)

  const dataUrl = await page.evaluate(() => window.pngData)
  const { buffer } = parseDataUrl(dataUrl)
  var pngPath = chartjsPath.substr(0, chartjsPath.length - '.chart.js'.length) + '.png'
  fs.writeFileSync(pngPath, buffer, 'base64')
}
// Scrape (pull) images from the web
// from https://intoli.com/blog/saving-images/
var parseDataUrl = function (dataUrl) {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (matches.length !== 3) {
    throw new Error('Could not parse data URL.')
  }
  return {
    mime: matches[1],
    buffer: Buffer.from(matches[2], 'base64')
  }
}
