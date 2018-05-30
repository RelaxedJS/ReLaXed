const fs = require('fs')
const path = require('path')

/*
 * ========================================================
 *                       Plugin Lists
 * ========================================================
 */
var plugins = {}
/*
@struct plugin = {
    'watcher': integer,
    'prePug': integer,
    'postPug': integer,
    'pageFirst': integer,
    'pageSecond': integer
}
*/

var watchers = []
/*
@struct watcher = {
    plugin: string,
    ext: [string],
    handler: function(file: URL string)
}
*/

var prePugs = []
/*
@struct prePug = {
    plugin: string,
    handler: function(
        master: URL string,
        children: [URL string]
    )
}
*/

// Pre and Post pug manipulation is not recommended. Google Chrome puppeteer's
//   page manipulation is faster

var postPugs = []
/*
@struct postPug = {
    plugin: string,
    handler: function(HTML: string)
}
*/


var pageFirsts = []
/*
@struct pageFirst = {
    plugin: string,
    handler: function(page)
}
*/

var pageSeconds = []
/*
@struct pageSecond = {
    plugin: string,
    handler: function(page)
}
*/


/*
 * ========================================================
 *                       Plugin functions
 * ========================================================
 */

/**
 * Get a list of active plugins (names only)
 */
function _getPlugins() {
    return Object.keys(plugins)
},

/**
 * Get a specific plugin by name
 * @param {string} key - The name of the plugin to obtain
 */
async function _getPlugin(key) {
    return new Promise((resolve, reject) => {
        if (!plugins[key]) {
            reject(new Error('Plugin is not registered'))
        }

        var plugin = plugins[key]

        if(plugin['watcher']) { plugin[watcher] = watchers[plugin[watcher]]}
        if(plugin['prePug']) { plugin[prePug] = prePugs[plugin[prePug]]}
        if(plugin['postPug']) { plugin[postPug] = postPugs[plugin[postPug]]}

        resolve(plugin)
    })
},

/**
 * Register a new file watcher
 * @param {watcher} watch - The object describing the file to watch for and handle
 */
async function _registerWatcher(watch) {
    return new Promise((resolve, reject) => {
        if (typeof watch.plugin !== 'string') {
            reject(new Error('No plugin name provided'))
        }

        // Example: ['.custom.ext.file']
        if (watch.ext == []) {
            reject(new Error('No extensions given'))
        }

        for (var ext of watch.ext) {
            if (!/\.[\w\.\d]+/g.test(ext)) {
                reject(new Error(`String: '${ext}' is not a valid extension`))
            }
        }

        if (typeof watch.handler !== 'function') {
            reject(new Error('No handler provided'))
        }

        watcher.push(watch)

        _addPlugin(watch.plugin, 'watcher', watcher.length-1)

        resolve(true)
    })
},

/**
 * Register a pre pug handler (for manipulating pug files before rendering)
 * @param {prePug} pre - The object for handling pre pug processing (raw pug files)
 */
async function _registerPrePug(pre) {
    return new Promise((resolve, reject) => {
        if (typeof pre.plugin !== 'string') {
            reject(new Error('No plugin name provided'))
        }

        if (typeof pre.handler !== 'function') {
            reject(new Error('No handler provided'))
        }

        prePugs.push(pre)

        _addPlugin(pre.plugin, 'prePug', prePugs.length-1)

        resolve(true)
    })
},

/**
 * Register a post pug handler (for manipulating the rendered HTML string)
 * @param {postPug} post - The object for handling post pug processing (raw HTML string)
 */
async function _registerPostPug(post) {
    return new Promise((resolve, reject) => {
        if (typeof post.plugin !== 'string') {
            reject(new Error('No plugin name provided'))
        }

        if (typeof post.handler !== 'function') {
            reject(new Error('No handler provided'))
        }

        postPugs.push(post)

        _addPlugin(post.plugin, 'postPug', postPugs.length-1)

        resolve(true)
    })
},

/**
 * Register a first pass page handler (generate place holder content)
 * @param {pageFirst} first - The object for manipulating page, first pass
 */
async function _registerPageFirst(first) {
    return new Promise((resolve, reject) => {
        if (typeof first.plugin !== 'string') {
            reject(new Error('No plugin name provided'))
        }

        if (typeof first.handler !== 'function') {
            reject(new Error('No handler provided'))
        }

        pageFirsts.push(first)

        _addPlugin(first.plugin, 'pageFirst', pageFirsts.length-1)

        resolve(true)
    })
},

/**
 * Register a first pass page handler (generate place holder content)
 * @param {pageFirst} second - The object for manipulating page, second pass
 */
async function _registerPageSecond(second) {
    return new Promise((resolve, reject) => {
        if (typeof second.plugin !== 'string') {
            reject(new Error('No plugin name provided'))
        }

        if (typeof second.handler !== 'function') {
            reject(new Error('No handler provided'))
        }

        pageSeconds.push(second)

        _addPlugin(second.plugin, 'pageSecond', pageSeconds.length-1)

        resolve(true)
    })
}

/**
 * Add a plugin to global list of plugins
 * @param {string} name - The name of the plugin
 * @param {string} type - The type of register
 * @param {integer} id - The index of the registered handler
 */
async function _addPlugin(name, type, id) {
    return new Promise((resolve, reject) => {
        if (plugins[name]) {
            if (plugins[name][type]) {
                reject(new Error(`Plugin already registered: ${type}`))

            } else {
                plugins[name][type] = id
            }

        } else {
            plugins[name] = {}
            plugins[name][type] = id
        }

        resolve(true)

    })
}


async function _handlePluginsJSON(file) {
    var config = require(file)
    var plugs = []

    if (config.plugins) {
        for (var plugin of config.plugins) {
            plugs.push(new Promise((resolve, reject) => {
                var loadedPlug
                try {
                    loadedPlug = require(plugin.name)

                } catch (error) {
                    reject(error)
                }

                await loadedPlug.activate(public)
                resolve(true)
            }))
        }
    }

    return Promise.all(plugs)
}

async function _handlePluginsComments(file) {

    var variables = function(string) {
        var settings = {}
        var re = /(\w+)](\w+|['"][\w\s]+['"])/g
        var match

        while(match = re.exec(string)) {
            settings[match[1]] = match[2]
        }

        return settings
    }

    return new Promise((resolve, reject) => {
        fs.readFile(file, (error, data) => {
            if (error) { reject(error) }

            var list = []

            data = data.toString()

            var re = /\/\/-\suse-plugin:\s((\w+)(\([\w,\s]+\)){0,1}(.*))/gm
            var match

            while(match = re.exec(data)) {
                list.push({
                    name: match[1],
                    dependencies: match[2].split(', '),
                    settings: variables(match[3])
                })
            }

        })
    })
}

_loadPlugins = async function(dir, master) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(path.join(dir, '.relaxed.json'))) {
            resolve(_handlePluginsJSON(path.join(dir, '.relaxed.json')))

        } else {
            resolve(_handlePluginsComments(path.join(dir, master)))
        }
    })
}

const public = {
    getPlugins        : _getPlugins,
    getPlugin         : _getPlugin,
    registerWatcher   : _registerWatcher,
    registerPrePug    : _registerPrePug,
    registerPostPug   : _registerPostPug,
    registerPageFirst : _registerPageFirst,
    registerPageSecond: _registerPageSecond
}

exports.public = public