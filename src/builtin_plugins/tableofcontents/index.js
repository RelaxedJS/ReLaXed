const fs = require('fs')
const path = require('path')

var depth = 3
var search_string = ''
var id_pre = 'table-of-contents-anchor-'
var anchors

exports.constructor = async function (params) {

  if (params.depth) {
    depth = params.depth
  }
  for (var i=1; i<depth; i++) {
    search_string += `h${i}, `
  }
  search_string += `h${depth}`

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

function generateList(list) {
  var dep = 1
  var string = '<ul class="table-of-contents-list">'
  for (var item of list) {
    while (item.depth > dep) {
      string += '<ul>'
      dep++
    }
    while (item.depth < dep) {
      string += '</ul>'
      dep--
    }
    string += `
      <li class='table-of-contents-item'><a href='#${item.id}'>
        <span class='table-of-contents-item-name'>${item.name}</span>
        <span class='table-of-contents-item-dots'></span>
        <span class='table-of-contents-item-page'>{{PLACEHOLDER}}</span>
      </a></li>
    `
  }
  return string + '</ul>'
}

async function generateToC(page, params) {
  var result = await page.$eval('#table-of-contents', element => element)
    .catch(error => false)
    
  if (!result) { return }

  var data = await page.$$eval(search_string, (elements, id) => {
    var list = []
    var i = 1
    for (var element of elements) {
      var el_id
      if(/toc-ignore/.test(element.className)) {
        continue
      }
      if (element.id) {
        el_id = element.id
      } else {
        el_id = id + i
        element.id = el_id
        i++
      }
      list.push({
        name: element.innerText,
        id: el_id,
        depth: Number(element.tagName.match(/\d+/)[0])
      })
    }
    return list
  }, id_pre)

  var toc = generateList(data)

  await page.$eval('#table-of-contents', (toc, list) => {
    toc.innerHTML = list
  }, toc)

  anchors = data

}

async function fillInToC(page, params) {
  for (var anchor of anchors) {
    var pos = await page.$eval(`#${anchor.id}`, element => {
      return element.getAttribute('data-page')
    })
    await page.$$eval('.table-of-contents-item', (elements, href, page) => {
      for(var element of elements) {
        let el = element.firstChild
        if(el.href && el.href.endsWith(href)) {
          el.innerHTML = el.innerHTML.replace('{{PLACEHOLDER}}', page)
          break
        }
      }
    }, anchor.id, pos)
  }
}