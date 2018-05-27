exports.bibliography = async function (page) {
    const data = new Cite()
  
    var values = await page.$$eval('.citation', nodes => {
      return nodes.map(node => {
        return node.getAttribute('data-key')
      })
    }).catch(e => {
      // Error occurs because there are no citations
      return false
    })
  
    if (values == false) {
      return false
    }
  
    values.forEach(val => data.add(val))
  
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
  
    var style = await page.$eval('#bibliography', element => {
      return element.getAttribute('data-style')
    }).catch(e => {
      // Error occurs because there is no bibliography
      return false
    })
  
    if (style == false) { return false }
  
    const output = data.get({
      format: 'string',
      type: 'html',
      style: style,
      lang: 'en-US'
    })
  
    var final = await page.$eval('#bibliography', (element, data) => {
      element.innerHTML = data
    }, output)
  
    return true
  }