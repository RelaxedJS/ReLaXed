const mjpage = require('mathjax-node-page')
const pug    = require('pug')
const path   = require('path')

// Templates for chart.js, vegalite, table, htable, and flowchart
exports.formatTemplate = function (tempName, data) {
    return pug.renderFile(path.join(__dirname, 'templates', tempName + '.pug'), data)
}

// Wait for all the content on the page to finish loading
exports.waitForNetworkIdle = function(page, timeout, maxInflightRequests = 0) {
    page.on('request', onRequestStarted);
    page.on('requestfinished', onRequestFinished);
    page.on('requestfailed', onRequestFinished);

    let inflight = 0
    let fulfill
    let promise = new Promise(x => fulfill = x)
    let timeoutId = setTimeout(onTimeoutDone, timeout)
    return promise

    function onTimeoutDone () {
        page.removeListener('request', onRequestStarted)
        page.removeListener('requestfinished', onRequestFinished)
        page.removeListener('requestfailed', onRequestFinished)
        fulfill()
    }

    function onRequestStarted () {
        ++inflight
        if (inflight > maxInflightRequests)
            clearTimeout(timeoutId)
    }

    function onRequestFinished () {
        if (inflight === 0) return
        --inflight
        if (inflight === maxInflightRequests) {
            timeoutId = setTimeout(onTimeoutDone, timeout)
        }
    }
}

exports.asyncMathjax = function (html, options) {
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

exports.getMatch = function (string, query) {
    var result = string.match(query)
    if (result) {
        result = result[1]
    }
    return result
}

// Scrape (pull) images from the web
exports.parseDataUrl = function (dataUrl) {
    // from https://intoli.com/blog/saving-images/
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (matches.length !== 3) {
        throw new Error('Could not parse data URL.');
    }
    return { mime: matches[1], buffer: Buffer.from(matches[2], 'base64') };
};
