/**
 * Created by Greg on 11/27/2016.
 */
'use strict';

const browserify = {
    files: {
        'dist/bundle.js': 'app/app.module.js',
        'dist/asyncHttpRequest.js': 'assets/js/workers/asyncHttpRequest.js',
        'dist/generateAudioField.js': 'assets/js/workers/generateAudioField.js'
    },
    options: {
        alias: {
            'angular': './scripts/angular.min.proxy.js',
            'angular-ui-router': './node_modules/angular-ui-router/release/angular-ui-router.min.js',
            'event-types': './node_modules/pulsar-lib/dist/src/event-types',
            'game-params': './node_modules/pulsar-lib/dist/src/game-params',
            'entity-types': './node_modules/pulsar-lib/dist/src/entity-types',
        }
    }
};

module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dev: {
                files: browserify.files,
                options: {
                    alias: browserify.options.alias,
                    browserifyOptions: {
                        debug: true
                    }
                }
            },
            dist: browserify
        },
        jshint: {
            options: {
                jshintrc: true,
                reporter: require('jshint-stylish')
            },
            all: ['app/**/*.js']
        },
        clean: {
            all: ['dist/*', '.tmp/*'],
            dist: ['dist/*'],
            tmp: ['.tmp/*']
        },
        cssmin: {
            options: {
                sourceMap: true,
                report: 'min'
            },
            target: {
                files: {
                    //Only include font-awesome.min
                    'dist/css/release.css': ['assets/css/**/*.css', '!assets/css/font-awesome.css']
                }
            }
        },
        copy: {
            prod: {
                options: {
                    process: function (content, srcpath) {
                        if(srcpath.indexOf('index.html') > -1){
                            content = content.replace('bundle.js', 'bundle.min.js');
                        }
                        return content;
                    },
                    noProcess: ['assets/**/*','dist/**/*']
                },
                files: [{expand: true, src: [
                    // Pulsar
                    'dist/**/*.gz',
                    'dist/fonts/*',
                    'index.html',
                    'grooveAuthenticate.html',
                    'assets/**',
                    'views/**',
                    // Prod audio files are stored in an external directory
                    '!assets/audio/songs/**',
                    '!assets/fonts/**',
                    '!assets/css/**',
                    // JS files are embedded in dist bundle
                    '!assets/js/**',

                    'LICENSE',
                    'package.json'
                ], dest: '.tmp'}]
            },
            assets: {
                files: [
                    { expand: true, cwd: 'assets/fonts', src: ['*'], dest: 'dist/fonts/'}
                ]
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/bundle.min.js': ['dist/bundle.js'],
                    'dist/asyncHttpRequest.min.js': ['dist/asyncHttpRequest.js'],
                    'dist/generateAudioField.min.js': ['dist/generateAudioField.js']
                }
            }
        },
        compress: {
            prod: {
                options: {
                    mode: 'gzip'
                },
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**/*.min.js'],
                    dest: 'dist',
                    ext: '.min.js.gz'
                }, {
                    expand: true,
                    cwd: 'dist/css',
                    src: ['**/*.css'],
                    dest: 'dist/css',
                    ext: '.css.gz'
                }]
            }
        },
        watch: {
            css: {
                files: ['assets/css/*.css'],
                tasks: ['cssmin']
            },
            js: {
                files: ['app/**/*.js'],
                tasks: ['jshint:all','browserify:dev']
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['build-dev']);

    grunt.registerTask('build-dev', [
        'jshint:all',
        'clean:dist',
        'browserify:dev',
        'cssmin',
        'copy:assets'
    ]);

    grunt.registerTask('build-prod', [
        'jshint:all',
        'clean:dist',
        'clean:tmp',
        'browserify:dist',
        'uglify:dist',
        'cssmin',
        'compress:prod',
        'copy:assets',
        'copy:prod',
        'clean:dist'
    ]);
};