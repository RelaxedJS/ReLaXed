const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
// const { pdfToPngThumbnail } = require('./pdf2png.js')
const PDFImage = require('pdf-image').PDFImage
const PixelDiff = require('pixel-diff')
const JsDiff = require('diff')
const assert = require('assert')

fs.writeFileSync("/tmp/absolute_path_test.scss", "h1 {color: red; font-size: 140px; text-align:center;}")

const relaxed = path.join(__dirname, './../src/index.js')

describe('Sample tests', function () {
  var tests = [
    {
      sampleName: 'basic_example',
      timeout: 10000
    },
    {
      sampleName: 'local_plugin',
      timeout: 10000
    },
    {
      sampleName: 'data_locals',
      timeout: 10000,
      cmdOptions: ['--locals', '{ "name": "Harry", "occupation": "Wazzzard" }']
    },
    {
      sampleName: 'data_locals_file',
      timeout: 10000,
      cmdOptions: ['--locals', './data.json']
    },
    {
      sampleName: 'data_require',
      timeout: 10000
    },
    {
      sampleName: 'mathjax',
      timeout: 10000
    }, {
      sampleName: 'katex',
      timeout: 10000
    },
    {
      sampleName: 'header_and_footer',
      timeout: 10000
    },
    {
      sampleName: 'utf8-characters',
      timeout: 10000
    },
    {
      sampleName: 'absolute_path',
      timeout: 10000,
      cmdOptions: ['--basedir', '/']
    }
  ]
  tests.forEach(function (test) {
    it('renders sample "' + test.sampleName + '" correctly', function (done) {
      this.timeout(test.timeout)
      var basedir = path.join(__dirname, 'samples', 'pug', test.sampleName)
      var paths = {
        master: path.join(basedir, 'master.pug'),
        expected: path.join(basedir, 'expected.png'),
        diff: path.join(basedir, 'diff.png'),
        pdf: path.join(basedir, 'master.pdf'),
        lastTestPNG: path.join(basedir, 'last_test_result.png'),
        html: path.join(basedir, 'master_temp.htm')
      }

      var process = spawn(
        relaxed,
        [paths.master, '--build-once', '--no-sandbox'].concat(test.cmdOptions || [])
      )
      process.on('close', async function (code) {
        assert.equal(code, 0)
        var pdfImage = new PDFImage(paths.pdf, {
          combinedImage: true,
          graphicsMagick: true
        })
        try {
          var imgPath = await pdfImage.convertFile()
        } catch (error) {
          done(error)
        }


        var diff = new PixelDiff({
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
            console.error(error)
          } else {
            assert(diff.hasPassed(result.code))
          }
          done()
        })
      })
    })
  })
})

describe('Error tests', function () {
  var tests = [
    {
      sampleName: 'error',
      timeout: 10000
    },
  ]
  tests.forEach(function (test) {
    it('fails to render sample "' + test.sampleName + '"', function (done) {
      this.timeout(test.timeout)
      var basedir = path.join(__dirname, 'samples', 'pug', test.sampleName)
      var process = spawn(
        relaxed,
        [path.join(basedir, 'master.pug'), '--build-once', '--no-sandbox'].concat(test.cmdOptions || [])
      )
      process.on('close', function (code) {
        assert.equal(code, 1)
        done()
      })
    })
  })
})

describe('Special rendering tests', function () {
  var tests = [
    {
      sampleName: 'table_csv',
      master: 'sample.md.table.csv',
      output: 'sample.pug',
      expected: 'expected.pug',
      outputType: 'text',
      timeout: 10000
    },
    {
      sampleName: 'htable_csv',
      master: 'sample.md.htable.csv',
      output: 'sample.pug',
      expected: 'expected.pug',
      outputType: 'text',
      timeout: 10000
    },
    {
      sampleName: 'chartjs',
      master: 'donut.chart.js',
      output: 'donut.png',
      expected: 'expected.png',
      outputType: 'image',
      timeout: 10000
    }
  ]
  tests.forEach(function (test) {
    it('renders sample "' + test.sampleName + '" correctly', function (done) {
      this.timeout(test.timeout)
      var basedir = path.join(__dirname, 'samples', 'special_renderings', test.sampleName)
      var extensions = {
        text: 'txt',
        image: 'png'
      }
      var diffExtension = extensions[test.outputType]
      var paths = {
        master: path.join(basedir, test.master),
        expected: path.join(basedir, test.expected),
        output: path.join(basedir, test.output),
        diff: path.join(basedir, 'diff.' + diffExtension),
        lastOutput: path.join(basedir, 'last_test_' + test.output)
      }
      var process = spawn(relaxed, [ paths.master, '--build-once' ])
      process.on('close', async function (code) {
        assert.equal(code, 0)
        if (test.outputType === 'text') {
          var expected = fs.readFileSync(paths.expected, 'utf8')
          var output = fs.readFileSync(paths.output, 'utf8')
          var isDifferent = (output !== expected)
          if (isDifferent) {
            var diff = JsDiff.diffChars(expected, output)
            var parts = []
            diff.forEach(function (part) {
              if (part.added) {
                parts.push(`[[${part.value}]]`)
              } else if (part.removed) {
                parts.push(`<<${part.value}>>`)
              } else {
                parts.push(part.value)
              }
            })
            fs.writeFileSync(paths.diff, parts.join())
            fs.renameSync(paths.output, paths.lastOutput)
            done(Error('Output differs from expectations'))
          } else {
            fs.renameSync(paths.output, paths.lastOutput)
            done()
          }
        } else if (test.outputType === 'image') {
          let diff = new PixelDiff({
            imageAPath: paths.expected,
            imageBPath: paths.output,
            thresholdType: PixelDiff.THRESHOLD_PERCENT,
            threshold: 0.01, // 1% threshold
            imageOutputPath: paths.diff
          })
          diff.run((error, result) => {
            fs.renameSync(paths.output, paths.lastOutput)
            if (error) {
              done(error)
            } else {
              assert(diff.hasPassed(result.code))
              done()
            }
          })
        }
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
  it('renders mermaid diagram interactively correctly (STUB)' , function (done) {
    // TODO: Implement tests
    done()
  })
})
