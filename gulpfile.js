
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var gCheerio = require('gulp-cheerio');
var ngHtml2js = require('gulp-ng-html2js');
var ngAnnotate = require('gulp-ng-annotate');
var htmlmin = require('gulp-htmlmin');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var rev = require('gulp-rev');
var filter = require('gulp-filter');
var gutil = require('gulp-util');
var usemin = require('gulp-usemin');
var sass = require('gulp-sass');
var replace = require('gulp-replace');
var preprocess = require('gulp-preprocess');
var genv = require('gulp-env');
var lint = require('gulp-eslint');
var rimraf = require('rimraf');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync').create();
var _ = require('lodash');
var streamqueue = require('streamqueue');
var fs = require('fs');

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

gulp.task('serve', ['clean', 'html-dev', 'set-env', 'fonts', 'images', 'styles'], function () {
  var routes = {};
  _.set(routes, _.template('/dist/${app}/bower_components')({
    app: gutil.env.app,
  }), 'bower_components');
  _.set(routes, _.template('/dist/${app}')({
    app: gutil.env.app,
  }), 'app');
  browserSync.init({
    host: '0.0.0.0',
    open: true,
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
  gulp.watch('app/**/*.{html,js}', ['lint']).on('change', browserSync.reload);
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
        'bower_components/foundation/scss/',
      ],
    }).on('error', sass.logError))
    .pipe(concat(_.template('${app}.css')({
      app: gutil.env.app,
    })))
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
  return gulp.src('content/img/{,**/}*.*')
    .pipe(imagemin())
    .pipe(gulp.dest(_.template('dist/${app}/img')({
      app: gutil.env.app,
    })));
});

gulp.task('fonts', [], function () {
  return gulp.src(['content/fonts/{,**/}*.*'])
    .pipe(gulp.dest(_.template('dist/${app}/fonts')({
      app: gutil.env.app,
    })));
});

gulp.task('lint', function () {
  gulp.src(['{app,config}/{,**/}*.{js,json}'])
    .pipe(lint())
    .pipe(lint.format());
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

gulp.task('build-all', ['clean'], function (cb) {
  var appList = fs.readdirSync('app')
    .filter(function (file) { return file.substr(-5) === '.html'; })
    .map(function (fileName) { return fileName.slice(0, -5); });
  var taskList = appList.map(function (appName) {
    var taskName = 'build-' + appName;
    gulp.task(taskName, function () {
      gutil.env.app = appName;
      runSequence('build');
    });
    return taskName;
  });
  console.log(taskList);
  runSequence('clean', taskList, cb);
});

gulp.task('build', ['set-env', 'styles', 'images', 'fonts', 'html']);
