// ctrl shift p => grunt => deploy
// wrapper function
module.exports = function(grunt){
	// load all our Grunt plugins
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-gae');
  //grunt.loadNpmTasks('grunt-appengine');  

  grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        // task configuration goes here
 
        clean: {
          all: ["build"],
          temp: ["build/temp"],
          js: ["build/js"]
        },
        
        copy: {
          main: {
            files: [ 
              {
                expand: true, flatten: true, src: ['src/js/*'], dest: 'build/js/', filter: 'isFile'
              },
              {
                expand: true, flatten: true, src: ['src/js/ext/*'], dest: 'build/js/ext/', filter: 'isFile'
              },
              {
                expand: true, flatten: true, src: ['src/js/ext/cultures/*'], dest: 'build/js/ext/cultures', filter: 'isFile'
              },
              {
                expand: true, flatten: true, src: ['src/css/**'], dest: 'build/css/', filter: 'isFile'
              },
              {
                expand: true, flatten: true, src: ['src/fonts/**'], dest: 'build/fonts/', filter: 'isFile'
              },
              {
                expand: true, flatten: true, src: ['src/html/**'], dest: 'build/html/', filter: 'isFile'
              },
              {
                expand: true, flatten: true, src: ['src/*.py', 'src/*.yaml'], dest: 'build/', filter: 'isFile'
              },
             ]
          },        
        },
        
        uglify: {
            options: {
                mangle: false
            },
            my_target: {
                files: [{
                    expand: true,
                    flatten: true, 
                    cwd: 'temp/js',
                    src: '**/*.js',
                    dest: 'temp/js'
                }]
            },
        },
        
        concat: {
          options: {
            separator: ';',
          },
          dist: {
            src: ['temp/**/*.js'],
            dest: 'build/js/<%= pkg.name %>.js'
          },
        },
        
        gae: {
            deploy_default: {
                action: 'update',
                options: {
                    path: 'build/'
                }
            }
        }
    });
 
    // define the default task that executes when we run 'grunt' from inside the project
    grunt.registerTask('dev', ['clean:all', 'copy', 'gae']);
    grunt.registerTask('release', ['clean:all', 'copy', 'uglify', 'clean:js', 'concat', 'clean:temp', 'gae']);
    
    grunt.registerTask('default', ['dev']);
};