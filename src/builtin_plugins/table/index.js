
const pug = require('pug')
const fs = require('fs')
const path = require('path')
const csv = require('csvtojson')
const html2jade = require('html2jade')

exports.constructor = async function (params) {
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
  const rows = await csv({output: 'csv', noheader: true}).fromFile(tablePath)
  console.log(rows)
  var extension, header
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
  console.log(tablePath, header, rows)
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
