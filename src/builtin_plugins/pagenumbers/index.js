const fs = require('fs')
const path = require('path')

exports.constructor = async function (params) {
  return {
    pugHeaders: [
      fs.readFileSync(path.join(__dirname, 'mixins.pug'), 'utf8')
    ],
    page2ndModifiers: [
      async (page, options) => { await fillNumbers(page, options) }
    ]
  }
}

async function fillNumbers(page, params) {
  var width = params.width
  var height = params.height
  var margins = params.margins

  await page.$eval('body', (body, width, height) => {
    body.width = width
    body.style.width = width + 'px'
    var p = 1
    var newPageError = 0
    for (var element of body.getElementsByTagName("*")) {
      if(/new\-page/g.test(element.className)) {
        newPageError = (p * height) - (element.offsetTop + element.offsetHeight)
        p++
        continue
      }
      while(element.offsetTop + element.offsetHeight + newPageError >= p * height) {
        p++
      }
      element.setAttribute('data-page', p)
    }
  }, width - margins.left - margins.right, height - margins.top - margins.bottom)

  // var info = await page.$eval('body', body => {
  //   var elements = []
  //   for (var element of body.getElementsByTagName("*")) {
  //     elements.push(element.outerHTML)
  //   }
  //   return elements
  // })
  // console.log(info)
}