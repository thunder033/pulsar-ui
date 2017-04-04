/**
 * Created by Greg on 11/27/2016.
 */
'use strict';

var browserify = {
    files: {
        'pulsar/dist/bundle.js': 'pulsar/app/app.module.js',
        'pulsar/dist/asyncHttpRequest.js': 'pulsar/assets/js/workers/asyncHttpRequest.js',
        'pulsar/dist/generateAudioField.js': 'pulsar/assets/js/workers/generateAudioField.js'
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
            all: ['pulsar/app/**/*.js']
        },
        clean: {
            all: ['pulsar/dist/*', '.tmp/*'],
            pulsarDist: ['pulsar/dist/*'],
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
                    'pulsar/dist/css/release.css': ['pulsar/assets/css/**/*.css', '!pulsar/assets/css/font-awesome.css']
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
                    noProcess: ['pulsar/assets/**/*','pulsar/dist/**/*']
                },
                files: [{expand: true, src: [
                    // Pulsar
                    'pulsar/dist/**/*.gz',
                    'pulsar/dist/fonts/*',
                    'pulsar/index.html',
                    'pulsar/grooveAuthenticate.html',
                    'pulsar/assets/**',
                    'pulsar/views/**',
                    // Prod audio files are stored in an external directory
                    '!pulsar/assets/audio/songs/**',
                    '!pulsar/assets/fonts/**',
                    '!pulsar/assets/css/**',
                    // JS files are embedded in dist bundle
                    '!pulsar/assets/js/**',

                    'drawingApp/**',
                    './home/**',
                    './js/**',
                    './SG1/**',

                    '.htaccess',
                    'index.html',
                    'LICENSE',
                    'package.json'
                ], dest: '.tmp'}]
            },
            pulsarAssets: {
                files: [
                    { expand: true, cwd: 'pulsar/assets/fonts', src: ['*'], dest: 'pulsar/dist/fonts/'}
                ]
            }
        },
        uglify: {
            dist: {
                files: {
                    'pulsar/dist/bundle.min.js': ['pulsar/dist/bundle.js'],
                    'pulsar/dist/asyncHttpRequest.min.js': ['pulsar/dist/asyncHttpRequest.js'],
                    'pulsar/dist/generateAudioField.min.js': ['pulsar/dist/generateAudioField.js']
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
                    cwd: 'pulsar/dist/',
                    src: ['**/*.min.js'],
                    dest: 'pulsar/dist',
                    ext: '.min.js.gz'
                }, {
                    expand: true,
                    cwd: 'pulsar/dist/css',
                    src: ['**/*.css'],
                    dest: 'pulsar/dist/css',
                    ext: '.css.gz'
                }]
            }
        },
        watch: {
            css: {
                files: ['pulsar/assets/css/*.css'],
                tasks: ['cssmin']
            },
            js: {
                files: ['pulsar/app/**/*.js'],
                tasks: ['jshint:all','browserify:dev']
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['build-dev']);

    grunt.registerTask('build-dev', [
        'jshint:all',
        'clean:pulsarDist',
        'browserify:dev',
        'cssmin',
        'copy:pulsarAssets'
    ]);

    grunt.registerTask('build-prod', [
        'jshint:all',
        'clean:pulsarDist',
        'clean:tmp',
        'browserify:dist',
        'uglify:dist',
        'cssmin',
        'compress:prod',
        'copy:pulsarAssets',
        'copy:prod',
        'clean:pulsarDist'
    ]);
};