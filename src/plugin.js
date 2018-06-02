const fs = require('fs')
const path = require('path')
const yaml = require('yaml')
const chokidar = require('chokidar')
// const depTree = require('deptree')

var plugins = []
/*
@struct plugin = {
  name: 'relaxed-example-plugin',
  mixin: 'path/to/file' | 'mixin ...',
  watch: {
    priority: 0, // optional, not implemented
    before: [],  // optional, not implemented
    after: [],   // optional, not implemented
    extensions: ['.example.txt'],
    handler: async function(path, file) {...}
  },
  htmlFilter: {
    priority: 0,
    before: [],
    after: [],
    handler: async function(html) {...}
  },
  page1stPassFilter: {
    priority: 0,
    before: [],
    after: [],
    handler: async function(page) {...}
  },
  page2ndPassFilter: {
    priority: 0,
    before: [],
    after: [],
    handler: async function(page) {...}
  }
*/

function _requirePlugins(list) {
  for (var plugin of list) {
    // Not sure how I am going to pass settings for plugins
    // Need to figure out how to do dependencies with plugin package.json
    try {
      let alreadyPresent = false
      for (var p of plugins) {
        if (p.name == plugin.name) {
          alreadyPresent = true
          break
        }
      }
      if (alreadyPresent) {
        continue
      }
      var loaded = require(`relaxed-${plugin.name}`)
      loaded.name = plugin.name
      loaded.settings = plugin.settings
      plugins.push(loaded)
    } catch(error) {
      console.log(error)
    }
  }
  for (var loadedPlugin of plugins) {
    let present = false
    for(var item of list) {
      if (item.name == loadedPlugin.name) {
        present = true
        break
      }
    }
    if (present) {
      continue
    } else {
      delete plugins[plugins.indexOf(loadedPlugin)]
    }
  }
}

function _handleComments(file) {
  var variables = function(string) {

    var settings = {}
    var re = /([\w-_]+)=([\w-_]+)/gm
    var match

    while(match = re.exec(string)) {
      settings[match[1]] = match[2]
    }

    return settings
  }

  var data = fs.readFileSync(file)

  var re = /\/\/-\suse-plugin:\s([\w-_]+)(.*)/gm
  var match

  var list = []
  while(match = re.exec(data)) {
    let obj = {}
    if (match[2]) {
      obj.settings = variables(match[2])
    }
    
    obj.name = match[1]
    list.push(obj)
    
  }
  return _requirePlugins(list)
}

function _handleConfig(file) {
  var config
  switch(path.extname(file)) {
  case 'yml':
    config = yaml.eval(fs.readFileSync(file))
    break
  case 'yaml':
    config = yaml.eval(fs.readFileSync(file))
    break
  case 'json':
    config = require(file)
    break
  }

  if (!config.plugins) {
    return false
  }

  var list = []

  for (var plugin in config.plugins) {
    list.push(plugin)
  }
  return _requirePlugins(list)

}

function _activatePlugins() {
  for (var plugin of plugins) {
    if(plugin.activate) {
      plugin.activate(plugin.settings, plugins)
    }
  }
}

function _loadPlugins(file) {
  if (['yml', 'yaml', 'json'].indexOf(path.extname(file)) != -1) {
    _handleConfig(file)

  } else {
    _handleComments(file)
  }
  _activatePlugins()
}

exports.loadPlugins = function(file, watch=false) {
  if (watch) {
    chokidar.watch(file, {
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 100
      }
    })
    .on('change', filepath => {
      _loadPlugins(filepath)
    })
  } else {
    _loadPlugins(file)
  }
}

exports.get = function(type) {
  if (type == 'mixin') {
    var mixins = ''

    for (var plugin of plugins) {
      if (plugin[type]) {
        if (/mixin/gm.test()) {
          mixins += plugin[type] + '\n'

        } else {
          mixins += fs.readFileSync(plugin[type]) + '\n'
        }
      }
    }

    return mixins

  } else {
    var list = []
    for(var plugin of plugins) {
      if (plugin[type]) {
        list.push(plugin[type])
      }
    }

    return list
  }
}