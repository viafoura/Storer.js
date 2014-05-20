module.exports = function(grunt) {
    var SRCPATH      = 'src/Storer.js';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        preprocess: {
            base: {
                src: SRCPATH,
                dest: 'release/Storer.js'
            },

            light: {
                src: SRCPATH,
                dest: 'release/Storer-light.js',
                options: {
                    context: {
                        LIGHT: true
                    }
                }
            }
        },

        uglify: {
            all: {
                files: {
                    'release/Storer.min.js': 'release/Storer.js',
                    'release/Storer-light.min.js': 'release/Storer-light.js'
                }
            }
        },

        qunit: {
            all: ['tests/qunit.html']
        },

        jshint: {
            base: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: [SRCPATH]
            }
        }
    });

    // Setup
    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Wrap task
    grunt.registerTask('wrap', function () {
        ['release/Storer-light.js', 'release/Storer.min.js', 'release/Storer-light.min.js'].forEach(function (filename) {
            var src = grunt.file.read(filename),
                output;

            // Change top of header for light version
            if (filename.match('light')) {
                output = "/** Storer.js (light)\n" +
                    + " * This light version removes userData and window.name storage. It is incompatible Internet Explorer prior to IE8.\n"
            } else {
                output = "/** Storer.js\n";
            }

            // Inject header text
            grunt.file.write(
                filename,
                output
                    + " * @copyright Viafoura, Inc. <viafoura.com>\n"
                    + " * @author Shahyar G <github.com/shahyar> for <github.com/viafoura>\n"
                    + " * @license CC-BY 3.0 <creativecommons.org/licenses/by/3.0>: Keep @copyright, @author intact.\n"
                    + " */"
                    + src.replace(/^\/\*![^]*?\*\//, '').replace(/^\/\*\* Storer\.js[^]*?\*\//, '') // Remove old header
            );

            console.log('Wrapped ' + filename);
        });
    });

    // Build task in order
    grunt.registerTask('build', function () {
        grunt.task.run(['preprocess', 'uglify', 'wrap']);
    });

    // Run tests
    grunt.registerTask('test', ['jshint', 'qunit']);

    // Default task builds and runs tests
    grunt.registerTask('default', ['build', 'test']);
};
