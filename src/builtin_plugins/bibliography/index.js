const Cite = require('citation-js')
const fs = require('fs')
const path = require('path')

exports.constructor = async function (pluginDefinition) {
  return {
    pugHeaders: [
      fs.readFileSync(path.join(__dirname,'./mixins.pug'), 'utf8')
    ],
    watchers: [
      {
        extensions: ['.bib'],
        handler: extractBibliography
      }
    ],
    pageModifiers: [
      async (page) => { await generateBibliography(page, pluginDefinition) }
    ]
  }
}

var extractBibliography = async function (filepath, browserPage) {
  console.log(`[bibliography] Noticed change in ${filepath}, doing nothing`)
}


var generateBibliography = async function (page, pluginDefinition) {
  // Get all the keys from citations
  console.log("there")
  var citationKeys = await page.$$eval('.citation', nodes => {
    return nodes.map(node => {
      return node.getAttribute('data-key')
    })
    // Error occurs because there are no citations
  }).catch(e => {
    return false
  })

  // No citations
  if (!citationKeys) return false
  const citations = new Cite()
  // Add all keys to citation-js
  citationKeys.forEach(val => citations.add(val))

  // Format the citation spans
  await page.$$eval('.citation', (nodes, data) => {
    for (var element of nodes) {
      let key = element.getAttribute('data-key')
      let page = element.getAttribute('data-page')
      for (var datum of data) {
        if (datum.id === key) {
          if (page !== '') {
            element.innerHTML = `(${datum.author[0].family}, ${datum.issued['date-parts'][0][0]}, p. ${page})`
          } else {
            element.innerHTML = `(${datum.author[0].family}, ${datum.issued['date-parts'][0][0]})`
          }
          break
        }
      }
    }
  }, citations.data)

  const output = citations.get({
    format: 'string',
    type: 'html',
    style: pluginDefinition.style || 'citation-apa',
    lang: 'en-US'
  })

  // Set Bibliography
  await page.$eval('#bibliography', (element, data) => {
    element.innerHTML = data
  }, output)
}
