const jimp = require('jimp')
const SVGO = require('svgo')
const colors = require('colors/safe')
const filesize = require('filesize')
const fs = require('fs')
const path = require('path')

module.exports = async function (svgPath, jpegQuality) {
  var svgData = fs.readFileSync(svgPath, 'utf8')
  var svgDataSize = filesize(svgData.length)
  var re = /(data:image\/png;base64,([^"]*)")/mg
  var pngIndicator = 'data:image/png;base64,'
  svgData = await asyncReplace(svgData, re, async function (match) {
    if (match.length < 5000) {
      return match
    }
    var buffer = Buffer.from(match.slice(pngIndicator.length), 'base64')
    var img = await jimp.read(buffer)
    var newData = await new Promise(resolve => {
      img.quality(jpegQuality).getBase64(jimp.MIME_JPEG, function (err, data) {
        let final = data.length < match.length ? data + '"' : match
        resolve(final)
      })
    })
    return newData
  })
  var svgo = new SVGO({
    plugins: [
      {
        removeNonInheritableGroupAttrs: false
      },
      {
        cleanupAttrs: false
      },
      {
        moveGroupAttrsToElems: false
      },
      {
        collapseGroups: false
      },
      {
        removeUnknownsAndDefaults: false
      },
      {
        cleanupIDs: {
          prefix: path.basename(svgPath)
        }
      }
    ]
  })
  var svgoPath = svgPath.substr(0, svgPath.length - '.o.svg'.length) + '_optimized.svg'
  var svgoData = await svgo.optimize(svgData)
  fs.writeFileSync(svgoPath, svgoData.data)
  let svgoSize = filesize(svgoData.data.length)
  console.log(colors.magenta(`... Optimized SVG file: ${svgDataSize} => ${svgoSize}`))
}


var asyncReplace = async function (string, regexpr, f) {
  var matchPromises = {}
  string.replace(regexpr, function (match) {
    if (!matchPromises[match]) {
      matchPromises[match] = f(match)
    }
  })
  for (var match in matchPromises) {
    matchPromises[match] = await matchPromises[match]
  }
  return string.replace(regexpr, function (match) {
    return matchPromises[match]
  })
}
