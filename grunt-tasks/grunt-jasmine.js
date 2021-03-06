module.exports = function gruntJasmine(grunt) {
  grunt.config('jasmine', {
    coverage: {
      src: ['src-out/**/*.js'],
      options: {
        specs: 'tests/**/*.js',
        host: 'http://127.0.0.1:8001/',
        template: require('grunt-template-jasmine-istanbul'),
        templateOptions: {
          coverage: 'coverage/coverage.json',
          report: [{
            type: 'text',
          }, {
            type: 'html',
            options: {
              dir: 'coverage',
            },
          }],
          template: 'GruntRunner.tmpl',
        },
      },
    },
    basic: {
      src: ['src-out/**/*.js'],
      options: {
        specs: 'tests/**/*.js',
        host: 'http://127.0.0.1:8001/',
        template: 'GruntRunnerBasic.tmpl',
        summary: true,
        display: 'full',
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
};
