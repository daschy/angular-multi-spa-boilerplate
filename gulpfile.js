
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var gCheerio = require('gulp-cheerio');
var ngHtml2js = require('gulp-ng-html2js');
var ngAnnotate = require('gulp-ng-annotate');
var htmlmin = require('gulp-htmlmin');
var cssmin = require('gulp-cssmin');
var streamqueue = require('streamqueue');
var rimraf = require('rimraf');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var browserSync = require('browser-sync').create();

var filter = require('gulp-filter');
var gutil = require('gulp-util');
var usemin = require('gulp-usemin');
var sass = require('gulp-sass');
var replace = require('gulp-replace');
var preprocess = require('gulp-preprocess');
var genv = require('gulp-env');
var runSequence = require('run-sequence');
var _ = require('lodash');
var nodeBourbon = require('node-bourbon');

var rev = require('gulp-rev');

var htmlminOptions = {
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeEmptyAttributes: true,
  // removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
};

gulp.task('set-env', [], function () {
  var envFile = gutil.env.envFile;
  var envApp = gutil.env.app;
  if (!envApp)
  {
    gutil.log(gutil.colors.red('option "--app" is missing'));
    // gutil.beep();
    // this.emit('end');
    process.exit(0);
  } else
  {
    genv({
      file: envFile,
    });
  }
  // ADD HERE new env vars
  return gulp.src(['config/config.js'])
    .pipe(preprocess({
      context: _.merge({}, gutil.env),
    }))
    .pipe(
    gulp.dest(
      _.template('dist/${app}')({
        app: gutil.env.app,
      })
    ));
});

gulp.task('serve', ['clean', 'translations', 'html-dev', 'set-env', 'fonts', 'images', 'styles'], function () {
  var routes = {};
  _.set(routes, _.template('/dist/${app}/bower_components')({
    app: gutil.env.app,
  }), 'bower_components');
  _.set(routes, _.template('/dist/${app}')({
    app: gutil.env.app,
  }), 'app');
  browserSync.init({
    host: '0.0.0.0',
    port: 8081,
    open: false,
    server: {
      baseDir: '.',
      index: 'index.html',
      routes: routes,
    },
    ghostMode: {
      clicks: true,
      forms: {
        submit: false,
        inputs: true,
        toggles: true,
      },
      scroll: false,
    },
  });

  gulp.watch('{app/,content/,styleguide/}{,**/}*.{less,scss,sass,css}', ['styles', 'set-env']);
  gulp.watch('content/{,**/}*.json').on('change', browserSync.reload);
  gulp.watch('app/**/*.{html,js}', ['jshint']).on('change', browserSync.reload);
  gulp.watch('app/*.html', ['html-dev']).on('change', browserSync.reload);
});

gulp.task('clean', function () {
  rimraf.sync('dist');
  rimraf.sync('.sass-cache');
});

gulp.task('styles', [], function () {
  return gulp.src(_.template('{content,app}/{,**/}${app}.scss')({
    app: gutil.env.app,
  }))
    .pipe(sass({
      outputStyle: 'nested',
      includePaths: [
        nodeBourbon.includePaths,
        'bower_components/foundation/scss/',
      ],
    }).on('error', sass.logError))
    .pipe(concat(_.template('${app}.css')({
      app: gutil.env.app,
    })))
    .pipe(replace('portalserver/static/com.peermatch.backbase.portal/media/', gutil.env.app + '/images/'))
    .pipe(gulp.dest(_.template('dist/${app}/styles')({
      app: gutil.env.app,
    })))
    .pipe(browserSync.stream());
});

gulp.task('html-dev', [], function () {
  return gulp.src([_.template('app/${app}.html')({
    app: gutil.env.app,
  })])
    .pipe(rename(
      'index.html'
    ))
    .pipe(gulp.dest(_.template('dist/${app}')({
      app: gutil.env.app,
    })));
});

gulp.task('html', [], function () {
  var templateStream = gulp.src(['!app/*.html', 'app/**/*.html'])
    .pipe(htmlmin(htmlminOptions))
    .pipe(ngHtml2js({
      moduleName: gutil.env.app,
    }))
    .pipe(rev())
    .pipe(concat('scripts/templates.js'));

  var htmlFilter = filter('*.html', {
    restore: true,
  });

  var depsFiles = gulp.src(_.template('app/${app}.html')({
    app: gutil.env.app,
  }))
    .pipe(usemin({
      appJS: [rev()],
      vendorsJS: [rev()],
      vendorsCSS: [rev()],
    }));

  var combined = streamqueue({
    objectMode: true,
  });

  combined.queue(depsFiles);
  combined.queue(templateStream);

  return combined.done()

    .pipe(htmlFilter)
    .pipe(
    gCheerio(function ($) {
      $('body').append('<script src="scripts/templates.js"></script>');
    }))
    .pipe(rename(
      'index.html'
    ))
    .pipe(htmlFilter.restore)
    .pipe(gulp.dest(_.template('dist/${app}')({
      app: gutil.env.app,
    })));
});
gulp.task('images', [], function () {
  return gulp.src('content/images/{,**/}*')
    .pipe(imagemin())
    .pipe(gulp.dest(_.template('dist/${app}/img')({
      app: gutil.env.app,
    })));
});

gulp.task('fonts', [], function () {
  return gulp.src(['content/fonts/{,**/}*.*', 'styleguide/src/app/fonts/{,**/}*.*'])
    .pipe(gulp.dest(_.template('dist/${app}/fonts')({
      app: gutil.env.app,
    })));
});

gulp.task('jshint', function () {
  gulp.src(['{app,config}/{,**/}*.{js,json}'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});


gulp.task('optimize', function () {
  var jsFiles = gulp.src(['dist/{,**/}*.js'])
    .pipe(ngAnnotate())
    .pipe(uglify({}))
    .pipe(gulp.dest('dist'));

  var cssFiles = gulp.src(['dist/{,**/}*.css'])
    .pipe(cssmin())
    .pipe(gulp.dest('dist'));

  var combined = streamqueue({
    objectMode: true,
  });

  combined.queue(jsFiles);
  combined.queue(cssFiles);

  return combined.done();
});

gulp.task('build-spa1', function (cb) {
  gutil.env.app = 'spa1';
  runSequence('build', cb);
});

gulp.task('build-spa2', function (cb) {
  gutil.env.app = 'spa2';
  runSequence('build', cb);
});

gulp.task('build-all', function (cb) {
  runSequence('clean', 'build-spa1', 'build-spa2', cb);
});

gulp.task('build', ['set-env', 'translations', 'styles', 'images', 'fonts', 'html']);