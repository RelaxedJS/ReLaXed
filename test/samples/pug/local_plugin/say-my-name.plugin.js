const fs = require('fs')

exports.constructor = async function (pluginDefinition) {
  return {
    pugHeaders: [
      `- var name = "${pluginDefinition.name}"`
    ],
    htmlFilters: [
      function (html) {
        return html.replace('INSERT_NAME_HERE', pluginDefinition.name)
      }
    ]
  }
}
