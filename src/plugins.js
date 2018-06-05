const path = require('path')
const colors = require('colors/safe')
const builtinPlugins = require('./builtin_plugins')
const fs = require('fs')

exports.builtinDefaultPlugins = builtinPlugins.defaultPlugins

var createConfigPlugin = async function (pluginDefinition, localPath) {
  // for each plugin, look for a local definition, a built-in definition, or
  // a module-provided definition (module relaxed-pluginName)
  var origin
  var plugin
  var pluginName = pluginDefinition.plugin
  try {
    var filename = `${pluginName}.plugin.js`
    var filepath = path.join(localPath, filename)
    fs.accessSync(filepath)
    try {
      plugin = require(filepath)
    } catch (error) {
      console.error(error)
    }
    origin = filepath
  } catch (error) {
    try {
      var libname = `relaxed-${pluginName}`
      plugin = require(libname)
      origin = libname
    } catch (error) {
      plugin = builtinPlugins.plugins[pluginName]
      origin = `ReLaXed ${pluginName} built-in plugin`
    }
  }
  if (!plugin) {
    throw Error(`Plugin ${pluginName} not found !`)
  }
  var configuratedPlugin = await plugin.constructor(pluginDefinition)
  configuratedPlugin.origin = origin
  return configuratedPlugin
}

var listPluginHooks = function (pluginList) {
  var pluginHooks = {}
  var hooks = [
    'pugHeaders',
    'watchers',
    'htmlFilters',
    'pageModifiers',
    'page2ndModifiers'
  ]
  for (var hook of hooks) {
    var hookInstances = []
    for (var plugin of pluginList) {
      try {
        if (plugin[hook]) {
          for (var pluginHook of plugin[hook]) {
            hookInstances.push({
              instance: pluginHook,
              origin: plugin.origin
            })
          }
        }
      } catch (error) {
        console.log(`In hook ${hook} of plugin [${plugin.origin}]:`)
        console.log(error.message)
        throw error
      }
    }
    pluginHooks[hook] = hookInstances
  }
  // TODO: order watchers by watched extension inclusion.
  return pluginHooks
}

var updateRegisteredPlugins = async function (relaxedGlobals, inputDir) {
  if (relaxedGlobals.config.plugins) {
    console.log(colors.magenta('... Loading config plugins'))
    var plugin
    for (var pluginDefinition of relaxedGlobals.config.plugins) {
      try {
        console.log(colors.magenta(`    - ${pluginDefinition.plugin} plugin`))
        plugin = await createConfigPlugin(pluginDefinition, inputDir)
        relaxedGlobals.configPlugins.push(plugin)
      } catch (error) {
        console.log(error.message)
        console.error(colors.bold.red(`Could not load plugin ${pluginDefinition.plugin}`))
      }
    }
  }
  var allPlugins = relaxedGlobals.configPlugins.concat(builtinPlugins.defaultPlugins)
  relaxedGlobals.pluginHooks = listPluginHooks(allPlugins)

  // TODO: remove some of these extensions as they get covered by plugins.
  relaxedGlobals.watchedExtensions = [
    '.pug',
    '.md',
    '.html',
    '.css',
    '.scss',
    '.svg',
    '.png',
    '.jpeg',
    '.jpg',
    '.mermaid',
    '.flowchart',
    '.flowchart.json',
    '.vegalite.json',
  ]

  for (var watcher of relaxedGlobals.pluginHooks.watchers) {
    relaxedGlobals.watchedExtensions = relaxedGlobals.watchedExtensions.concat(watcher.instance.extensions)
  }
}

exports.updateRegisteredPlugins = updateRegisteredPlugins
exports.listPluginHooks = listPluginHooks
exports.createConfigPlugin = createConfigPlugin
