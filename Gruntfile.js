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
                    'public/app.js': ['client/app.js'],
                    'public/speakerview.js': ['client/speakerview.js']
                },
                options: {
                    debug: true,
                    shim: {
                        draggable: {
                            path: './components/draggable/draggable.js',
                            exports: 'draggable'
                        }
                    }
                }
            }
        },

        uglify: {
            all: {
                files: {
                    'public/app.js': 'public/app.js',
                    'public/speakerview.js': 'public/speakerview.js'
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

        sass: {
            dist: {
                options: {
                    style: 'compressed',
                    sourcemap: true
                },
                files: {
                    'public/presentr.css': 'core/styles/presentation.scss',
                    'public/speakerview.css': 'core/styles/speakerview.scss',
                    'public/app.css': 'core/styles/main.scss'
                }
            }
        },

        autoprefixer: {
            all: {
                src: 'public/presentr.css'
            }
        },

        watch: {
            js: {
                files: ['core/**/*.js', 'app.js', 'client/**/*.js'],
                tasks: ['jshint', 'browserify']
            },
            css: {
                files: ['core/styles/**/*.scss'],
                tasks: ['sass', 'autoprefixer']
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
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-express-server');

    grunt.registerTask('default', ['jshint', 'browserify', 'uglify', 'sass', 'autoprefixer', 'express:dev', 'watch']);

};