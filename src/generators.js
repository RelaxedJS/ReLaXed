/**
 * Generate a bibliography from <span class='citation'>
 * @param {puppeteer.page} page
 */
exports.bibliography = async function(page) {

  // Get all the keys from citations
  var values = await page.$$eval('.citation', nodes => {
    return nodes.map(node => {
      return node.getAttribute('data-key')
    })
  }).catch(e => {
    // Error occurs because there are no citations
    return false
  })

  // No citations
  if (values == false) return false

  const Cite = require('citation-js')
  const data = new Cite()

  // Add all keys to citation-js
  values.forEach(val => data.add(val))

  // Format the citation spans
  var result = await page.$$eval('.citation', (nodes, data) => {
    for (var element of nodes) {
      let key = element.getAttribute('data-key')
      let page = element.getAttribute('data-page')
      for (var datum of data) {
        if (datum.id == key) {
          if (page != '') {
            element.innerHTML = `(${datum.author[0].family}, ${datum.issued['date-parts'][0][0]}, p. ${page})`
          } else {
            element.innerHTML = `(${datum.author[0].family}, ${datum.issued['date-parts'][0][0]})`
          }
          break
        }
      }
    }
  }, data.data)

  // Get the bibliography style
  // TODO: remove with plugin system: define with [//- use-plugin: bibliography <style>] or config.json
  var style = await page.$eval('#bibliography', element => {
    return element.getAttribute('data-style')
  }).catch(e => {
    // Error occurs because there is no bibliography
    return false
  })

  // No style because no bibliography
  if (style == false) return false

  // Format html output for bibliography
  const output = data.get({
    format: 'string',
    type: 'html',
    style: style,
    lang: 'en-US'
  })

  // Set Bibliography
  await page.$eval('#bibliography', (element, data) => {
    element.innerHTML = data
  }, output)

  return true
}