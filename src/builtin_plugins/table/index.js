
const pug = require('pug')
const fs = require('fs')
const path = require('path')
const csv = require('csvtojson')
const html2jade = require('html2jade')

exports.constructor = async function (pluginDefinition) {
  return {
    watchers: [
      {
        extensions: ['.table.csv', '.htable.csv'],
        async handler (tablePath, page) {
          await csvTtableToPug(tablePath)
        }
      }
    ]
  }
}

var csvTtableToPug = async function (tablePath) {
  var extension, header
  var rows = []
  var csvPromise = new Promise(resolve => {
    csv({ noheader: true })
      .fromFile(tablePath)
      .on('csv', (csvRow) => {
        rows.push(csvRow)
      })
      .on('done', (error) => {
        if (error) {
          console.log('error', error)
          resolve(false)
        } else {
          resolve(true)
        }
      })
  })
  await csvPromise
  if (tablePath.endsWith('.htable.csv')) {
    extension = '.htable.csv'
    header = rows.shift()
  } else {
    extension = '.table.csv'
    header = null
  }
  var html = await pug.renderFile(path.join(__dirname, 'template.pug'), {
    header: header,
    tbody: rows
  })
  var pugPath = tablePath.substr(0, tablePath.length - extension.length) + '.pug'
  var jade = await new Promise(resolve => {
    html2jade.convertHtml(html, { bodyless: true }, function (err, jade) {
      if (err) {
        console.log('Error:', err)
        resolve(false)
      } else {
        resolve(jade)
      }
    })
  })
  fs.writeFileSync(pugPath, jade)
}
