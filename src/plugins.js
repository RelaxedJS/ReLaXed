const path = require('path')
const colors = require('colors/safe')
const builtinPlugins = require('./builtin_plugins')
const fs = require('fs')

// TODO: Add dependency system
// TODO: Add priority queueing (after: ['plugin'])
// TODO: Add parser for '//- use-plugin: example' headers

exports.builtinDefaultPlugins = builtinPlugins.defaultPlugins

async function createConfigPlugin(pluginName, parameters, localPath, relaxedGlobals) {
  // for each plugin, look for a local definition, a built-in definition, or
  // a module-provided definition (module relaxed-pluginName)
  var origin
  var plugin
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
  if (plugin.depends_on) {
    for (var depend_plugin of plugin.depends_on) {
      await attemptLoadPlugin(depend_plugin, localPath, relaxedGlobals)
    }
  }
  var configuratedPlugin = await plugin.constructor(parameters)
  configuratedPlugin.origin = origin
  configuratedPlugin.name = pluginName
  return configuratedPlugin
}

function listPluginHooks(pluginList) {
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
            if (typeof pluginHook === 'function'
                || pluginHook.extensions
                || /mixin/g.test(pluginHook)) {
              hookInstances.push({
                instance: pluginHook,
                origin: plugin.origin,
                name: plugin.name
              })
            } else {
              if (typeof pluginHook.handler === 'function') {
                if(pluginHook.after) {
                  hookInstances.push({
                    instance: pluginHook.handler,
                    origin: plugin.origin,
                    name: plugin.name,
                    after: pluginHook.after
                  })
                } else {
                  hookInstances.push({
                    instance: pluginHook.handler,
                    origin: plugin.origin,
                    name: plugin.name
                  })
                }
              }
            }
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

async function attemptLoadPlugin(pluginDefinition, inputDir, relaxedGlobals) {
  var plugin, pluginName, params
  try {
    if (typeof (pluginDefinition) === 'string') {
      [pluginName, params] = [pluginDefinition, {}]
    } else {
      [pluginName, params] = Object.entries(pluginDefinition)[0]
    }
    console.log(colors.magenta(`    - ${pluginName} plugin`))
    plugin = await createConfigPlugin(pluginName, params, inputDir, relaxedGlobals)
    relaxedGlobals.configPlugins.push(plugin)
  } catch (error) {
    console.log(error.message)
    console.error(colors.bold.red(`Could not load plugin ${pluginName}`))
  }
}

async function updateRegisteredPlugins(relaxedGlobals, inputDir) {
  if (relaxedGlobals.config.plugins) {
    console.log(colors.magenta('... Loading config plugins'))
    var plugin, pluginName, params
    for (var pluginDefinition of relaxedGlobals.config.plugins) {
      await attemptLoadPlugin(pluginDefinition, inputDir, relaxedGlobals)
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
    '.flowchart.json'
  ]

  for (var watcher of relaxedGlobals.pluginHooks.watchers) {
    var exts = watcher.instance.extensions
    relaxedGlobals.watchedExtensions = relaxedGlobals.watchedExtensions.concat(exts)
  }
}

exports.updateRegisteredPlugins = updateRegisteredPlugins
exports.listPluginHooks = listPluginHooks
exports.createConfigPlugin = createConfigPlugin
