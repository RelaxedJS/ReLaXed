const fs = require('fs')
const path = require('path')

var depth = 3

exports.constructor = async function (params) {

  if (params.depth) {
    depth = params.depth
  }

  return {
    pugHeaders: [
      fs.readFileSync(path.join(__dirname, 'mixins.pug'), 'utf8')
    ],
    pageModifiers: [
      async (page, options) => { await generateToC(page, options) }
    ],
    page2ndModifiers: [
      {
        after: [ 'pageNumber' ],
        handler: async (page, options) => { await fillInToC(page, options) }
      }
    ]
  }
}

exports.depends_on = [
  "pageNumber"
]

async function generateToC(page, params) {

}

async function fillInToC(page, params) {
  var data = await page.$$eval('h1, h2, h3', elements => {
    return elements.map(element => {
      return element.getAttribute('data-page')
    })
  })
  console.log(data)
}