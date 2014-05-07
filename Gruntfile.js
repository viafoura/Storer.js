module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        preprocess: {
            options: {
                context: {
                    IELESS: true
                }
            },

            js: {
                src: 'Storer.js',
                dest: 'Storer-ieless.js'
            }
        },

        uglify: {
            all: {
                files: {
                    'Storer.min.js': 'Storer.js',
                    'Storer-ieless.min.js': 'Storer-ieless.js'
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
        ['Storer.min.js', 'Storer-ieless.js', 'Storer-ieless.min.js'].forEach(function (filename) {
            var src = grunt.file.read(filename);

            // Inject header text
            grunt.file.write(
                filename,
                "/** Storer.js" + (filename.match('ieless') ? " (IEless)" : "") + "\n" +
                    "* @copyright Viafoura, Inc. <viafoura.com>\n" +
                    "* @author Shahyar G <github.com/shahyar> for <github.com/viafoura>\n" +
                    "* @license CC-BY 3.0 <creativecommons.org/licenses/by/3.0>: Keep @copyright, @author intact.\n" +
                    "*/" +
                    src.replace(/^\/\*![^]*?\*\//, '').replace(/^\/\*\* Storer\.js[^]*?\*\//, '') // Remove old header
            );

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
