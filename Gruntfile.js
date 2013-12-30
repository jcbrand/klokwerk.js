module.exports = function(grunt) {
    var cfg = require('./package.json');
    grunt.initConfig({
        jshint: {
            options: {
                trailing: true
            },
            target: {
                src : [
                    'klokwerk.js',
                    'mock.js',
                    'main.js',
                    'tests_main.js',
                    'spec/*.js'
                ]
            }
        },
        cssmin: {
            options: {
                banner: "/*"+
                        "* Klokwerk Timetracker \n"+
                        "* http://klokwerk.net \n"+
                        "* Copyright (c) 2013, Jan-Carel Brand <jc@opkode.com> \n"+
                        "* All rights reserved  \n"+
                        "*/"
            },
            minify: {
                dest: 'klokwerk.min.css',
                src: ['klokwerk.css']
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    grunt.registerTask('test', 'Run Tests', function () {
        var done = this.async();
        var child_process = require('child_process');
        var exec = child_process.exec;
        exec('./node_modules/.bin/phantomjs '+
             'node_modules/jasmine-reporters/test/phantomjs-testrunner.js '+
             __dirname+'/tests.html',
             function (err, stdout, stderr) {
                if (err) {
                    grunt.log.write('Tests failed with error code '+err.code);
                    grunt.log.write(stderr);
                }
                grunt.log.write(stdout);
                done();
        });
    });

    grunt.registerTask('jsmin', 'Create a new release', function () {
        var done = this.async();
        var child_process = require('child_process');
        var exec = child_process.exec;
        var callback = function (err, stdout, stderr) {
            if (err) {
                grunt.log.write('build failed with error code '+err.code);
                grunt.log.write(stderr);
            }
            grunt.log.write(stdout);
            done();
        };
        exec('./node_modules/requirejs/bin/r.js -o src/build.js && ' +
             './node_modules/requirejs/bin/r.js -o src/build-no-locales-no-otr.js && ' +
             './node_modules/requirejs/bin/r.js -o src/build-no-otr.js', callback);
    });

    grunt.registerTask('minify', 'Create a new release', ['cssmin', 'jsmin']);

    grunt.registerTask('check', 'Perform all checks (e.g. before releasing)', function () {
        grunt.task.run('jshint', 'test');
    });
};
