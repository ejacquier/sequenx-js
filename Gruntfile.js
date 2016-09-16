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
          src: ["src/**/*.ts","typings/**/*.ts", "!node_modules/**/*.ts"],
          out: "js/sequenx.js"
        },
        options: {
          sourceMap: true,
          /*inlineSources: true,
          inlineSourceMap: true,*/
          declaration: true,
          fast: 'never',
          verbose: false,
          noLib: false
        }
    },
    mochacli: {
        options: {
            bail: false,
            colors: true,
            //reporter:"nyan"
        },
        all: ['test/*test.js']
    },
    mocha_istanbul: {
        src: 'test',
        options:{
          excludes:["rx.lite.js"]
        }
    },
    concat: {
        options: {
            separator: '\n',
            sourceMap:true,
            //sourceMapStyle:"inline" 
        },
        node: {
            src: ['js/sequenx.js', 'src/nodejs.js'],
            dest: 'js/sequenx.node.js',
        },
    },
   
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('release', ['ts', 'uglify']);
  grunt.registerTask('node', ['ts','concat:node', 'uglify']);
  grunt.registerTask('dev', ['ts']);
  grunt.registerTask('test', ['ts','concat:node', 'mochacli']);
  grunt.registerTask('test_coverage', ['ts','concat:node', 'mocha_istanbul']);

};
