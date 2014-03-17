module.exports = function(grunt) {

    'use strict';

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: ['core/**/*.js', 'app.js']
        },

        browserify: {
            dist: {
                files: {
                    'public/app.js': ['core/client.js']
                },
                options: {
                    debug: true
                }
            }
        },

        uglify: {
            all: {
                files: {
                    'public/app.js': 'public/app.js'
                }
            }
        },

        express: {
            dev: {
                options: {
                    script: 'app.js'
                }
            }
        },

        watch: {
            js: {
                files: ['core/**/*.js', 'app.js'],
                tasks: ['jshint', 'browserify']
            },
            express: {
                files: ['**/*.js'],
                tasks: ['express:dev'],
                options: {
                    spawn: false
                }
            },
            options: {
                livereload: 35729
            }
        }

    });


    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-express-server');

    grunt.registerTask('default', ['jshint', 'browserify', 'uglify', 'express:dev', 'watch']);

};