const { spawn } = require( 'child_process' )
const path = require('path')
// const { pdfToPngThumbnail } = require('./pdf2png.js')
const PDFImage = require("pdf-image").PDFImage;
const PixelDiff = require('pixel-diff')

var assert = require('assert');
describe('Sample tests', function() {
  var tests = [
    {
      sampleName: 'basic_example',
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
        pdf: path.join(basedir, 'master.pdf')
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
