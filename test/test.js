const { spawn } = require( 'child_process' )
const path = require('path')
const fs = require('fs')
// const { pdfToPngThumbnail } = require('./pdf2png.js')
const PDFImage = require("pdf-image").PDFImage
const PixelDiff = require('pixel-diff')

var assert = require('assert');

describe('Sample tests', function () {
  var tests = [
    {
      sampleName: 'basic_example',
      timeout: 10000
    },
    {
      sampleName: 'bibliography_example',
      timeout: 10000
    },
    {
      sampleName: 'letter_example',
      timeout: 10000
    }, {
      sampleName: 'data_require_example',
      timeout: 10000
    }
  ]
  tests.forEach(function(test) {
    it('renders sample "' + test.sampleName + '" correctly', function (done) {
      this.timeout(test.timeout);
      var basedir = path.join(__dirname, 'samples', test.sampleName)
      var paths = {
        master: path.join(basedir, 'master.pug'),
        expected: path.join(basedir, 'expected.png'),
        diff: path.join(basedir, 'diff.png'),
        pdf: path.join(basedir, 'master.pdf'),
        lastTestPNG: path.join(basedir, 'last_test_result.png'),
        html: path.join(basedir, 'master_temp.htm')
      }
      var process = spawn('relaxed', [ paths.master, '--build-once' ])
      process.on('close', async function (code) {
        assert.equal(code, 0)
        var pdfImage = new PDFImage(paths.pdf, { combinedImage: true })
        var imgPath = await pdfImage.convertFile()
        let diff = new PixelDiff({
          imageAPath: paths.expected,
          imageBPath: imgPath,
          thresholdType: PixelDiff.THRESHOLD_PERCENT,
          threshold: 0.01, // 1% threshold
          imageOutputPath: paths.diff
        })
        diff.run((error, result) => {
          fs.unlinkSync(paths.pdf)
          fs.unlinkSync(paths.html)
          fs.renameSync(imgPath, paths.lastTestPNG)
          if (error) {
            throw error
          } else {
            assert(diff.hasPassed(result.code))
          }
          done()
        })
      })
    })
  })
})

describe('Interactive tests', function () {
  var basedir = path.join(__dirname, 'samples', 'interactive_sample')
  var paths = [
    {
      diagramData: 'diagram.mermaid',
      output: ['diagram.svg'],
      timeout: 10000
    },
    {
      diagramData: 'plot.vegalite.json',
      output: ['plot.svg'],
      timeout: 10000
    }
  ]
  // var process = spawn('relaxed', [ path.join(basedir, 'master.pug') ])
  it('renders mermaid diagram correctly' , function (done) {
    // TODO: Implement tests
    done()
  })
})
