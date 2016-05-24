module.exports = function(grunt) {
  "use strict";
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %> */'
      },
      main: {
        files: {
          'js/sequenx.min.js': ['js/sequenx.js']
        }
      },
    },
      ts: {
        application: {
            src: ["src/**/*.ts", "!node_modules/**/*.ts"],
            out: "js/sequenx.js"
        },
        options: {
            sourceMap: false,
            declaration: true,
            fast: 'never',
            verbose: false,
            noLib: false
        }
      },
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-ts');

  grunt.registerTask('release', ['ts', 'uglify']);

};
