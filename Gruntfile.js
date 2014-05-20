module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        preprocess: {
            options: {
                context: {
                    LIGHT: true
                }
            },

            js: {
                src: 'Storer.js',
                dest: 'Storer-light.js'
            }
        },

        uglify: {
            all: {
                files: {
                    'Storer.min.js': 'Storer.js',
                    'Storer-light.min.js': 'Storer-light.js'
                }
            }
        },

        qunit: {
            all: ['tests/qunit.html']
        }
    });

    // Setup
    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Wrap task
    grunt.registerTask('wrap', function () {
        ['Storer.min.js', 'Storer-light.js', 'Storer-light.min.js'].forEach(function (filename) {
            var src = grunt.file.read(filename);

            // Inject header text
            if (filename.match('light')) {
                grunt.file.write(
                    filename,
                    "/** Storer.js (light)\n" +
                        + " * This lightweight version of Storer removes support for userData and window.name storage.\n"
                        + " * It is incompatible with versions of Internet Explorer prior to IE8.\n"
                        + " * @copyright Viafoura, Inc. <viafoura.com>\n"
                        + " * @author Shahyar G <github.com/shahyar> for <github.com/viafoura>\n"
                        + " * @license CC-BY 3.0 <creativecommons.org/licenses/by/3.0>: Keep @copyright, @author intact.\n"
                        + " */"
                        + src.replace(/^\/\*![^]*?\*\//, '').replace(/^\/\*\* Storer\.js[^]*?\*\//, '') // Remove old header
                );
            } else {
                grunt.file.write(
                    filename,
                    "/** Storer.js\n"
                        + " * @copyright Viafoura, Inc. <viafoura.com>\n"
                        + " * @author Shahyar G <github.com/shahyar> for <github.com/viafoura>\n"
                        + " * @license CC-BY 3.0 <creativecommons.org/licenses/by/3.0>: Keep @copyright, @author intact.\n"
                        + " */"
                        + src.replace(/^\/\*![^]*?\*\//, '').replace(/^\/\*\* Storer\.js[^]*?\*\//, '') // Remove old header
                );
            }

            console.log('Wrapped ' + filename);
        });
    });

    // Build task in order
    grunt.registerTask('build', function () {
        grunt.task.run(['preprocess', 'uglify', 'wrap']);
    });

    // Default task builds and runs tests
    grunt.registerTask('default', ['build', 'qunit']);
};
