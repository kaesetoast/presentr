module.exports = function(grunt) {

    'use strict';

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: ['src/**/*.js']
        },

        browserify: {
            dist: {
                files: {
                    'dist/app.js': ['src/app.js']
                },
                options: {
                    debug: true
                }
            }
        },

        uglify: {
            all: {
                files: {
                    'dist/app.js': 'dist/app.js'
                }
            }
        },

        watch: {
            js: {
                files: ['src/**/*.js'],
                tasks: ['jshint', 'browserify']
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

    grunt.registerTask('default', ['jshint', 'browserify', 'uglify', 'watch']);

};