var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var reactify = require('reactify');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var notify = require('gulp-notify');
var gutil = require('gulp-util');
var shell = require('gulp-shell');
//var eslint = require('gulp-eslint');


var appOptions = {

  /*
   * DIRECTORIES
   */

  // Where your app lives
  appDir: './src/react2/app',

  // Where your production version is deployed
  distDir: './dist/js',

  // Where you bundled development version will run from
  buildDir: './build/js',

  /*
   * BUNDLE FILES
   */

  // The name of your main app file
  entryFile: 'main.js',

  // The name of your bundled vendors
  vendorsFile: 'vendors.js',

  /*
   * VENDORS
   */

  // Add other vendors here, if any
  vendors: [
    'jquery',
    'hammerjs',
    'pubsub-js',
    'velocity-animate'
    //'react', //todo fix this, so React goes into vendor.js file => faster compile times, etc.
    //'react-router',
    //'flux-react',
    //'jquery',
    // 'underscore',
    // 'Backbone'
  ]

};

// The task that handles both development and deployment
var browserifyTask = function (bundleOptions) {

  // This bundle only runs when you start to develop,
  // it is needed to prevent rebundling external deps
  // on project changes
  var vendorBundler = browserify({
    debug: bundleOptions.debug,
    require: appOptions.vendors
  });

  // This bundle is for the application
  var appBundler = browserify({
    entries: [appOptions.appDir + '/' + appOptions.entryFile],
    debug: bundleOptions.debug,

    // These options are needed by Watchify
    cache: {},
    packageCache: {},
    fullPaths: true
  });

  // Add reactify transformer
  appBundler.transform(reactify);

  // Add vendors as externals
  appOptions.vendors.forEach(function (vendor) {
    appBundler.external(vendor);
  });

  // The rebundle process
  var rebundle = function () {

    var start = Date.now();
    appBundler.bundle()
      .on('error', gutil.log)
      .pipe(source(appOptions.entryFile))
      .pipe(gulpif(bundleOptions.uglify, streamify(uglify())))
      .pipe(gulp.dest(bundleOptions.dest))
      .pipe(notify(function () {
        console.log('Built in ' + (Date.now() - start) + 'ms');
      }));

  };

  // Fire up Watchify when developing
  if (bundleOptions.watch) {
    appBundler = watchify(appBundler);
    appBundler.on('update', rebundle);
  }

  // Run the vendor bundle when the default Gulp task starts
  vendorBundler.bundle()
    .on('error', gutil.log)
    .pipe(source(appOptions.vendorsFile))
    .pipe(gulpif(bundleOptions.uglify, streamify(uglify())))
    .pipe(gulp.dest(bundleOptions.dest));

  return rebundle();

};

var backendTask = function (bundleOptions) {
  //copy what needs to be coppied

  //etc.js
  gulp.src(appOptions.appDir + '/etc/en.js')
    .pipe(gulp.dest(appOptions.buildDir));
  gulp.src(appOptions.appDir + '/etc/Intl.min.js')
    .pipe(gulp.dest(appOptions.buildDir));

  // css
  gulp.src(['./src/css/**/*.css'])
    .pipe(gulp.dest("./build/css"));

  // css
  gulp.src(['./src/fonts/**/*.*'])
    .pipe(gulp.dest("./build/fonts"));

  // css
  gulp.src(['./src/html/**/*.*'])
    .pipe(gulp.dest("./build/html"));

  // yaml
  gulp.src(['./src/*.yaml'])
    .pipe(gulp.dest("./build"));

  // root .py
  gulp.src(['./src/*.py'])
    .pipe(gulp.dest("./build"));

  // rest of the .py
  //gulp.src(['./src/py/**/.*'], { base: '.' })
  //  .pipe(gulp.dest("./build/py"));

  gulp.src(['./src/py/**/*'])
    .pipe(gulp.dest('./build/py'));

};



gulp.task('default', function () {

  browserifyTask({
    watch: true,
    dest: appOptions.buildDir,
    uglify: false,
    debug: true
  });

  backendTask();

});

gulp.task('be', function () {

  backendTask();

});

gulp.task('deploy', function () {

  browserifyTask({
    watch: false,
    dest: appOptions.distDir,
    uglify: true,
    debug: false
  });

});

gulp.task('gae deploy', shell.task([
  'echo start gae deploy',
  '"c:\\Program Files (x86)\\Google\\google_appengine\\appcfg.py" --oauth2 update  build/mblrdr.yaml',
  'echo finished gae deploy',
]));


gulp.task('lint', function () {
    // Note: To have the process exit with an error code (1) on
    //  lint error, return the stream and pipe to failOnError last.
    return gulp.src(['./src/react2/app/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
}); 