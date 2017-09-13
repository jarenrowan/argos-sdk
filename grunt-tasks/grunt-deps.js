module.exports = function gruntDeps(grunt) {
  grunt.config('argos-deps', {
    files: '../src/**/*.js',
    cwd: './grunt-tasks',
    template: 'grunt-uglify.tmpl',
    output: 'temp.uglify.js',
    modules: [{
      name: 'argos',
      location: '../src',
    }],
  });

  grunt.loadNpmTasks('grunt-argos-deps');
};
