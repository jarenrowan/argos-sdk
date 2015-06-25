module.exports = function(grunt) {
    grunt.config('babel', {
        options: {
            sourceMap: false,
            modules: 'amd',
            moduleIds: true,
            moduleRoot: 'argos',
            sourceRoot: 'src',
            blacklist: [
            ]
        },
        dist: {
            files: [{
                expand: true,
                cwd: 'src',
                src: ['**/*.js'],
                dest: 'src-out'
            }]
        }
    });

    grunt.loadNpmTasks('grunt-babel');
};
