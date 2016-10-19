'use strict';

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
var preprocess = require('gulp-preprocess');
var genv = require('gulp-env');
var lint = require('gulp-eslint');
var rimraf = require('rimraf');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync').create();
var _ = require('lodash');
var streamqueue = require('streamqueue');
var fs = require('fs');
var exec = require('child_process').exec;

var vars = {
  dirApp: 'app',
  dirFont: 'content/fonts',
  dirImg: 'content/img',
  dirDist: 'dist',
  dirConfig: 'config',
  dirBowerComponents: 'bower_components',
};

gulp.task('set-env', [], function () {
  var envFile = gutil.env.envFile;
  var envApp = gutil.env.name;
  if (!envApp) {
    gutil.log(gutil.colors.red(_.template('option "--name" is missing')({

    })));
    process.exit(0);
  } else {
    genv({
      file: envFile,
    });
  }
  // ADD HERE new env vars
  return gulp.src([vars.dirConfig + '/env.js'])
    .pipe(preprocess({
      dirConfig: vars.dirConfig,
      context: _.merge({}, gutil.env),
    }))
    .pipe(
    gulp.dest(
      _.template('${dirDist}/${app}')({
        dirDist: vars.dirDist,
        app: gutil.env.name,
      })
    ));
});

gulp.task('serve', ['clean', 'html-dev', 'set-env', 'fonts', 'images', 'styles'], function () {
  var routes = {};
  _.set(routes, _.template('/${dirDist}/${app}/${bower_components}')({
    dirDist: vars.dirDist,
    bower_components: vars.dirBowerComponents,
    app: gutil.env.name,
  }), vars.dirBowerComponents);
  _.set(routes, _.template('/${dirDist}/${app}')({
    dirDist: vars.dirDist,
    app: gutil.env.name,
  }), vars.dirApp);
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

  gulp.watch(_.template('{${dirApp}/,content/}{,**/}*.{less,scss,sass,css}')({
    dirApp: vars.dirApp,
  }), ['styles', 'set-env']);
  gulp.watch('content/{,**/}*.json').on('change', browserSync.reload);
  gulp.watch(vars.dirApp + '/**/*.{html,js}', ['lint']).on('change', browserSync.reload);
  gulp.watch(vars.dirApp + '/*.html', ['html-dev']).on('change', browserSync.reload);
});

gulp.task('clean', function () {
  rimraf.sync(vars.dirDist);
  rimraf.sync('.sass-cache');
});

gulp.task('styles', [], function () {
  return gulp.src(_.template('{content,${dirApp}}/{,**/}${app}.scss')({
    dirApp: vars.dirApp,
    app: gutil.env.name,
  }))
    .pipe(sass({
      outputStyle: 'nested',
      includePaths: [
        // Include foundation or bootstrap
        // 'bower_components/foundation/scss/',
      ],
    }).on('error', sass.logError))
    .pipe(concat(_.template('style.css')({
      app: gutil.env.name,
    })))
    .pipe(gulp.dest(_.template('${dirDist}/${app}/styles')({
      dirDist: vars.dirDist,
      app: gutil.env.name,
    })))
    .pipe(browserSync.stream());
});

gulp.task('html-dev', [], function () {
  return gulp.src([_.template('${dirApp}/${app}.html')({
    dirApp: vars.dirApp,
    app: gutil.env.name,
  })])
    .pipe(rename(
      'index.html'
    ))
    .pipe(gulp.dest(_.template('${dirDist}/${app}')({
      dirDist: vars.dirDist,
      app: gutil.env.name,
    })));
});

gulp.task('html', [], function () {
  var templateStream = gulp.src(['!' + vars.dirApp + '/*.html', vars.dirApp + '/**/*.html'])
    .pipe(htmlmin({
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      removeAttributeQuotes: true,
      removeComments: true,
      removeEmptyAttributes: true,
      // removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
    }))
    .pipe(ngHtml2js({
      moduleName: gutil.env.name,
    }))
    .pipe(rev())
    .pipe(concat('scripts/templates.js'));

  var htmlFilter = filter('*.html', {
    restore: true,
  });

  var depsFiles = gulp.src(_.template('${dirApp}/${app}.html')({
    dirApp: vars.dirApp,
    app: gutil.env.name,
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
    .pipe(gulp.dest(_.template('${dirDist}/${app}')({
      dirDist: vars.dirDist,
      app: gutil.env.name,
    })));
});
gulp.task('images', [], function () {
  return gulp.src(vars.dirImg + '/{,**/}*.*')
    .pipe(imagemin())
    .pipe(gulp.dest(_.template('${dirDist}/${app}/img')({
      dirDist: vars.dirDist,
      app: gutil.env.name,
    })));
});

gulp.task('fonts', [], function () {
  return gulp.src(['content/fonts/{,**/}*.*'])
    .pipe(gulp.dest(_.template('${dirDist}/${app}/font')({
      dirDist: vars.dirDist,
      app: gutil.env.name,
    })));
});

gulp.task('lint', function () {
  gulp.src([_.teamplate('{${dirApp},${dirConfig}}/{,**/}*.{js,json}')({
    dirApp: vars.dirApp,
    dirConfig: vars.dirConfig,
  })])
    .pipe(lint())
    .pipe(lint.format());
});

gulp.task('optimize', function () {
  var jsFiles = gulp.src([vars.dirDist + '/{,**/}*.js'])
    .pipe(ngAnnotate())
    .pipe(uglify({}))
    .pipe(gulp.dest(vars.dirDist));

  var cssFiles = gulp.src([vars.dirDist + '/{,**/}*.css'])
    .pipe(cssmin())
    .pipe(gulp.dest(vars.dirDist));

  var combined = streamqueue({
    objectMode: true,
  });

  combined.queue(jsFiles);
  combined.queue(cssFiles);

  return combined.done();
});

gulp.task('build-all', ['clean'], function (cb) {
  var appList = fs.readdirSync(vars.dirApp)
    .filter(function (file) { return file.substr(-5) === '.html'; })
    .map(function (fileName) { return fileName.slice(0, -5); });
  var taskList = appList.map(function (appName) {
    var taskName = 'build-' + appName;
    gulp.task(taskName, function (cbTask) {
      exec('gulp build --name=' + appName, function (err) {
        if (err) return cbTask(err); // return error
        return cbTask(); // finished task
      });
    });
    return taskName;
  });
  return runSequence(taskList, cb);
});

gulp.task('build', function (cb) {
  return runSequence(['set-env', 'styles', 'images', 'fonts', 'html'], ['optimize'], cb);
});
