const fs = require('fs')
const path = require('path')
const yaml = require('yaml')
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
      for (var p of plugins) {
        if (p.name == plugin.name) {
          continue
        }
      }
      var loaded = require(`relaxed-${plugin.name}`)
      loaded.name = plugin.name
      if(loaded.activate) {
        loaded.activate(plugin, plugins)
      }
      plugins.push(loaded)
    } catch(error) {
      console.log(error)
    }
  }
}

function _handleComments(file) {
    var variables = function(string) {
        var settings = {}
        var re = /(\w+)](\w+|['"][\w\s]+['"])/g
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
        obj = variables(match[2])
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

exports.loadPlugins = async function(file) {
  if (['yml', 'yaml', 'json'].indexOf(path.extname(file)) != -1) {
    _handleConfig(file)

  } else {
    _handleComments(file)
  }
}

exports.get = function(type) {
  if (type == 'mixin') {
    var mixins = ''

    for (var plugin of plugins) {
      console.log(plugin)
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