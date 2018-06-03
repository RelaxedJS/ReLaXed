/**
 * Generate a bibliography from <span class='citation'>
 * @param {puppeteer.page} page
 */
exports.bibliography = async function (page) {
  // Get all the keys from citations
  var values = await page.$$eval('.citation', nodes => {
    return nodes.reduce((acc, node) => {
      const keys = node.getAttribute('data-keys')

      if (keys) {
        keys.split(';;').forEach(k => acc[k] = true)
      } else {
        acc[node.getAttribute('data-key')] = true
      }

      return acc
    }, {})

    // Error occurs because there are no citations
  }).catch(e => {
    return false
  })

  // No citations
  if (!values) return false

  const Cite = require('citation-js')
  const data = new Cite()

  // Add all keys to citation-js
  Object.keys(values).forEach(val => {
    data.add(val)
  })

  // Format the citation spans
  await page.$$eval('.citation', (nodes, data) => {
    for (var element of nodes) {
      const keys = element.getAttribute('data-keys')
      const key = element.getAttribute('data-key')
      const page = element.getAttribute('data-page')

      let citation

      if (keys) {
        citation = keys.split(';;').reduce((acc, k) => {
          const datum = data.find(d => d.id === k)
          if (datum) acc.push(`${datum.author[0].family}, ${datum.issued['date-parts'][0][0]}`)
          return acc
        }, []).join('; ')
      } else {
        const datum = data.find(d => d.id === key)
        if (datum) {
          citation = `${datum.author[0].family}, ${datum.issued['date-parts'][0][0]}`
          if (page !== '') citation += `, p. ${page}`
        }
      }

      if (citation.length) element.innerHTML = `(${citation})`
    }
  }, data.data)

  // Get the bibliography style
  // TODO: remove with plugin system: define with [//- use-plugin: bibliography <style>] or [config.json]
  var style = await page.$eval('#bibliography', element => {
    return element.getAttribute('data-style')
    // Error occurs because there is no bibliography
  }).catch(e => {
    return false
  })

  // No style because no bibliography
  if (!style) return false

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
