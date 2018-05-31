const fs      = require('fs')
const path    = require('path')
const DepTree = require('deptree')

/*
 * ========================================================
 *                          Errors
 * ========================================================
 */
function NoNameError(message) {
    this.name = 'NoNameError'
    this.message = message || ''
}
NoNameError.prototype = Error.prototype

function NoOptionError(message) {
    this.name = 'NoOptionError'
    this.message = message || ''
}
NoOptionError.prototype = Error.prototype

function NoPluginError(message) {
    this.name = 'NoPluginError'
    this.message = message || ''
}
NoPluginError.prototype = Error.prototype

function PluginExistsError(message) {
    this.name = 'PluginExistsError'
    this.message = message || ''
}
PluginExistsError.prototype = Error.prototype

/*
 * ========================================================
 *                       Plugin Lists
 * ========================================================
 */

var masterPluginList = []
var plugins = {}
/*
@struct plugin = {
    'watcher': integer,
    'pug': integer,
    'html': integer,
    'pageFirst': integer,
    'pageSecond': integer
}
*/

var mixins = []
/*
@struct mixin = {
    plugin: string,
    mixin: string
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

var pugs = []
/*
@struct pug = {
    plugin: string,
    handler: function(
        master: URL string,
        children: [URL string]
    )
}
*/

// Pre and Post pug manipulation is not recommended. Google Chrome puppeteer's
//   page manipulation is faster

var htmls = []
/*
@struct html = {
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
}

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

        if(plugin['mixin'])      {      plugin['mixin'] = mixins[plugin['mixin']]           }
        if(plugin['watcher'])    {    plugin['watcher'] = watchers[plugin['watcher']]       }
        if(plugin['pug'])        {        plugin['pug'] = pugs[plugin['pug']]               }
        if(plugin['html'])       {       plugin['html'] = htmls[plugin['html']]             }
        if(plugin['pageFirst'])  {  plugin['pageFirst'] = pageFirsts[plugin['pageFirst']]   }
        if(plugin['pageSecond']) { plugin['pageSecond'] = pageSeconds[plugin['pageSecond']] }

        resolve(plugin)
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

/**
 * Deactivate all the plugins
 */
async function _unloadPlugins() {
    return new Promise((resolve, reject) => {
        for (var plugin of masterPluginList.reverse()) {
            plugin.deactivate(public)
        }
        resolve(true)
    })
}

/**
 * Loads and activates the list of plugins
 * @param {array} list - The list of plugins to load
 */
async function _requirePlugins(list) {
    return new Promise((resolve, reject) => {
        var depTree = new DepTree()
        for (var plugin of list) {
            if (plugin.dependencies) {
                depTree.add(plugin.name, plugin.dependencies)
            } else {
                depTree.add(plugin.name)
            }
        }
        var depList = depTree.resolve()
        for (var plugin of depList) {
            try {
                let plug = require(`relaxed-${plugin}`)
                masterPluginList.push(plug)
                plug.activate(public)
            } catch (error) {
                if (/Cannot find module/g.test(error.message)) {
                    reject(new Error(`Plugin relaxed-${plugin} not found, try installing with 'npm i -g relaxed-${plugin}'`))
                }
                reject(error)
            }
        }
    })
}

/**
 * Load plugin data from a json file
 * @param {string} file - The file URL of the json file with plugin data
 */
async function _handlePluginsJSON(file) {
    var config = require(file)

    return new Promise((resolve, reject) => {
        if (!config.plugins) {
            resolve(false)
        }
        resolve(_requirePlugins(config.plugins))
    })
}

/**
 * Load plugin data by reading the comments
 * @param {string} file - The file URL of the master pug file
 */
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
                let obj = {}
                obj.name = match[2]
                if (match[3]) {
                    obj.dependencies = match[3].split(', ')
                }
                if (match[4] && match[4] != '') {
                    obj.settings = variables(match[4])
                }
                list.push(obj)
            }
            if (list.length == 0) {
                resolve(false)
            }
            resolve(_requirePlugins(list))

        })
    })
}

/**
 * Load plugins from a json file or the pug file via comments
 * @param {string} master - The URL of the file to load plugin data from
 */
async function _loadPlugins(master) {
    return new Promise((resolve, reject) => {
        if (path.extname(master) == 'json') {
            resolve(_handlePluginsJSON(master))

        } else {
            resolve(_handlePluginsComments(master))
        }
    })
}

/**
 * Expose plugin variables for other plugins
 * @param {string} name - The name of the plugin
 * @param {object} settings - The plugins settings to expose publicly
 */
async function _expose(name, settings) {
    return new Promise((resolve, reject) => {
        if (!plugins[name]) {
            plugins[name] = {}
        }
        plugins[name].settings = settings
        resolve(true)
    })
}

/**
 * Check a list of plugin managers to find plugin
 * @param {string} name - The name of the plugin to check for
 * @param {array} list - The list of items to check a plugin for
 */
function _inList(name, list) {
    for (var item of list) {
        if (item.name) {
            return true
        }
    }
    return false
}


/*
 * ========================================================
 *                Plugin Registers
 * ========================================================
 */
async function _registerMixin(mixin) {
    return new Promise((resolve, reject) => {
        if (!mixin) {
            reject(new NoPluginError('No mixin given'))
        }

        if (typeof mixin.plugin !== 'string') {
            reject(new NoNameError('No plugin name provided'))
        }

        if (typeof mixin.mixin !== 'string') {
            reject(new NoOptionError('No mixin provided'))
        }

        if (_inlist(mixin.plugin, mixins)) {
            reject(new PluginExistsError('Mixin already registered'))
        }

        if (!/mixin/g.test(mixin.mixin) && !fs.existsSync(mixin.mixin)) {
            reject(new Error('Mixin is not a valid pug, or pug file'))
        }

        if(fs.existsSync(mixin.mixin)) {
            mixin.mixin = fs.readFileSync(mixin.mixin)
        }

        mixins.push(mixin)

        _addPlugin(mixin.plugin, 'mixin', mixins.length-1)

        resolve(true)
    })
}

/**
 * Register a new file watcher
 * @param {watcher} watch - The object describing the file to watch for and handle
 */
async function _registerWatcher(watch) {
    return new Promise((resolve, reject) => {
        if (!watch) {
            reject(new NoPluginError('No watch given'))
        }

        if (typeof watch.plugin !== 'string') {
            reject(new NoNameError('No plugin name provided'))
        }

        // Example: ['.custom.ext.file']
        if (watch.ext == []) {
            reject(new NoOptionError('No extensions given'))
        }

        for (var ext of watch.ext) {
            if (!/\.[\w\.\d]+/g.test(ext)) {
                reject(new Error(`String: '${ext}' is not a valid extension`))
            }
        }

        if (typeof watch.handler !== 'function') {
            reject(new NoOptionError('No handler provided'))
        }

        if (_inlist(watch.plugin, watchers)) {
            reject(new PluginExistsError('Watcher already registered'))
        }

        watcher.push(watch)

        _addPlugin(watch.plugin, 'watcher', watcher.length-1)

        resolve(true)
    })
}

/**
 * Register a pre pug handler (for manipulating pug files before rendering)
 * @param {pug} pug - The object for handling pre pug processing (raw pug files)
 */
async function _registerPug(pug) {
    return new Promise((resolve, reject) => {
        if (!pug) {
            reject(new NoPluginError('No pug given'))
        }

        if (typeof pug.plugin !== 'string') {
            reject(new NoNameError('No plugin name provided'))
        }

        if (typeof pug.handler !== 'function') {
            reject(new NoOptionError('No handler provided'))
        }

        if (_inlist(pug.plugin, pugs)) {
            reject(new PluginExistsError('Pre pug handler already registered'))
        }

        pugs.push(pug)

        _addPlugin(pug.plugin, 'pug', pugs.length-1)

        resolve(true)
    })
}

/**
 * Register a post pug (html) handler (for manipulating the rendered HTML string)
 * @param {html} html - The object for handling post pug processing (raw HTML string)
 */
async function _registerHTML(html) {
    return new Promise((resolve, reject) => {
        if (!html) {
            reject(new NoPluginError('No html given'))
        }

        if (typeof html.plugin !== 'string') {
            reject(new NoNameError('No plugin name provided'))
        }

        if (typeof html.handler !== 'function') {
            reject(new NoOptionError('No handler provided'))
        }

        if (_inlist(html.plugin, htmls)) {
            reject(new PluginExistsError('HTML handler already registered'))
        }

        htmls.push(html)

        _addPlugin(html.plugin, 'html', htmls.length-1)

        resolve(true)
    })
}

/**
 * Register a first pass page handler (generate place holder content)
 * @param {pageFirst} first - The object for manipulating page, first pass
 */
async function _registerPageFirst(first) {
    return new Promise((resolve, reject) => {
        if (!first) {
            reject(new NoPluginError('No page first pass given'))
        }

        if (typeof first.plugin !== 'string') {
            reject(new NoNameError('No plugin name provided'))
        }

        if (typeof first.handler !== 'function') {
            reject(new NoOptionError('No handler provided'))
        }

        if (_inlist(first.plugin, pageFirsts)) {
            reject(new PluginExistsError('Page first pass handler already registered'))
        }

        pageFirsts.push(first)

        _addPlugin(first.plugin, 'pageFirst', pageFirsts.length-1)

        resolve(true)
    })
}

/**
 * Register a first pass page handler (generate place holder content)
 * @param {pageFirst} second - The object for manipulating page, second pass
 */
async function _registerPageSecond(second) {
    return new Promise((resolve, reject) => {
        if (!second) {
            reject(new NoPluginError('No page second pass given'))
        }

        if (typeof second.plugin !== 'string') {
            reject(new NoNameError('No plugin name provided'))
        }

        if (typeof second.handler !== 'function') {
            reject(new NoOptionError('No handler provided'))
        }

        if (_inlist(second.plugin, pageSeconds)) {
            reject(new PluginExistsError('Page second pass handler already registered'))
        }

        pageSeconds.push(second)

        _addPlugin(second.plugin, 'pageSecond', pageSeconds.length-1)

        resolve(true)
    })
}


/*
 * ========================================================
 *                Plugin gets
 * ========================================================
 */
function _getMixins() { return mixins }

function _getWatchers() { return watchers }

function _getPugs() { return pugs }

function _getHTMLs() { return htmls }

function _getPageFirsts() { return pageFirsts }

function _getPageSeconds() { return pageSeconds }

const public = {
    getPlugins        : _getPlugins,
    getPlugin         : _getPlugin,
    registerWatcher   : _registerWatcher,
    registerPug       : _registerPug,
    registerHTML      : _registerHTML,
    registerPageFirst : _registerPageFirst,
    registerPageSecond: _registerPageSecond,
    expose            : _expose
}

exports.public = public

const private = {
    getMixins     : _getMixins,
    getWatchers   : _getWatchers,
    getPugs       : _getPugs,
    getHTMLs      : _getHTMLs,
    getPageFirsts : _getPageFirsts,
    getPageSeconds: _getPageSeconds,
    loadPlugins   : _loadPlugins,
    unloadPlugins : _unloadPlugins
}

exports.private = private