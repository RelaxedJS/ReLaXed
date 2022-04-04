const mjpage = require('mathjax-node-page')

// TODO: would this work better if applied to the page instead of the HTML ?

exports.constructor = async function (params) {
  return {
    htmlModifiers: [asyncMathjax(params)]
  }
}

var asyncMathjax =
  (params) => {
    console.log(params);
    return async (html) => {
      return new Promise(resolve => {
        mjpage.mjpage(html, {
          format: ['TeX'],
          ...params
        }, {
          mml: true,
          css: true,
          html: true,
        }, response => resolve(response))
      })
    }
  }
