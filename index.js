'use strict';

var through = require('through2');
var gutil = require('gulp-util');
var compiler = require('vue-template-compiler')
var path = require('path');

var PluginError = gutil.PluginError;
var PLUGIN_NAME = 'gulp-vue-template-compiler';

function gulpVueTemplateCompiler(options) {
    return through.obj(function(file, encode, callback) {
        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported'));
            return callback();
        }

        var tpl = compiler.compile(file.contents.toString(), options);
        if (tpl.errors.length > 0) {
            var msg = 'In file ' + path.relative(process.cwd(), file.path) + ':\n';
            msg += tpl.errors.toString();
            this.emit('error', new PluginError(PLUGIN_NAME, msg));
            return callback();
        }

        var renderFunc = 'function() {' + tpl.render.toString() + '}';
        var staticRenderFns = []
        for (var idx = 0; idx < tpl.staticRenderFns.length; idx++) {
            staticRenderFns[idx] = 'function() {' + tpl.staticRenderFns[idx] + '}';
        }
        var staticRenderFns = '[' + staticRenderFns.join(', ') + ']';

        var compiled;
        if (options && options.registerFunc) {
            var name = path.basename(file.path, path.extname(file.path));
            compiled = options.registerFunc + '(\'' + name + '\', ' + renderFunc + ', ' + staticRenderFns + ')';
        } else {
            compiled = '{ render: ' + renderFunc + ', staticRenderFns: ' + staticRenderFns + ' }';
        }
        
        file.path = gutil.replaceExtension(file.path, '.js');
        file.contents = new Buffer(compiled);
        callback(null, file);
    });
}

module.exports = gulpVueTemplateCompiler;
