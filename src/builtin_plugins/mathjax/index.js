const mjpage = require('mathjax-node-page')

// TODO: would this work better if applied to the page instead of the HTML ?

exports.constructor = async function (params) {
  return {
    htmlModifiers: [ asyncMathjax ]
  }
}

var asyncMathjax = async function (html) {
  return new Promise(resolve => {
    mjpage.mjpage(html, {
      format: ['TeX']
    }, {
      mml: true,
      css: true,
      html: true
    }, response => resolve(response))
  })
}
