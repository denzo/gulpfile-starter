/*!
 * gulpfile-starter - v0.0.4
 * http://github.com/s1985/gulpfile-starter
 *
 * Copyright (c) 2014 Steven Ewing
 * Dual licensed under the MIT and GPL licenses.
 */

// Dependencies
var browserSync = require('browser-sync'),
    gulp = require('gulp'),
    rimraf = require('gulp-rimraf'),
    inject = require('gulp-inject'),
    minifyCss = require('gulp-minify-css'),
    jsHint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    watch = require('gulp-watch');

// Configuration
var BUILD_DIR = 'build',
    BUILD_JS_APP_DIR = BUILD_DIR + '/app',
    BUILD_JS_LIB_DIR = BUILD_DIR + '/lib',
    BUILD_CSS_DIR = BUILD_DIR + '/css',
    BUILD_FILES_DIR = BUILD_DIR + '/files',
    BUILD_IMAGES_DIR = BUILD_CSS_DIR + '/images',

    BUILD_COMPILED_CSS_FILE = 'app.min.css',
    BUILD_COMPILED_JS_LIB_FILE = 'lib.min.js',
    BUILD_COMPILED_JS_APP_FILE = 'app.min.js',

    BUILD_DEPENDENCIES_ORDER = [
        BUILD_JS_LIB_DIR + '/**/jquery*.js',
        BUILD_JS_LIB_DIR + '/**/*.js'
    ],

    SOURCE_DIR = 'src',
    SOURCE_INDEX_HTML_FILE = 'index.html',
    SOURCE_JS_LIB_DIR = SOURCE_DIR + '/lib',
    SOURCE_JS_APP_DIR = SOURCE_DIR + '/app',
    SOURCE_CSS_DIR = SOURCE_DIR + '/css',
    SOURCE_FILES_DIR = 'files',
    SOURCE_IMAGES_DIR = SOURCE_CSS_DIR + '/images',

    SERVER_HOST = 'localhost',
    SERVER_HTTP_PORT = '8000';

// Variables
var firstRun = true;

//-------------------//
// LOCAL BUILD TASKS //
//-------------------//

// Shortcut for `gulp local:watch`
gulp.task('default', function () {
    gulp.start('local:watch');
});

// Alias for `gulp local:watch`
gulp.task('watch', function () {
    gulp.start('local:watch');
});

// Copies javascript library dependencies from source to build.
gulp.task('local:js-lib', function () {
    return gulp.src(SOURCE_JS_LIB_DIR + '/**/*.js')
               .pipe(gulp.dest(BUILD_JS_LIB_DIR));
});

// Copies the javascript application from source to build.
gulp.task('local:js-app', function () {
    return gulp.src(SOURCE_JS_APP_DIR + '/**/*.js')
               .pipe(jsHint())
               .pipe(jsHint.reporter('jshint-stylish'))
               .pipe(gulp.dest(BUILD_JS_APP_DIR));
});

// Copies stylesheet dependencies from source to build.
gulp.task('local:css', function () {
    return gulp.src(SOURCE_CSS_DIR + '/**/*.css')
               .pipe(gulp.dest(BUILD_CSS_DIR));
});

// Watch for changes to source through browser-sync.
gulp.task('local:server', function () {
    browserSync.init(null, {
        server: {
            baseDir: BUILD_DIR
        },
        proxy: {
            host: SERVER_HOST,
            port: SERVER_HTTP_PORT
        }
    });
});

// Refreshes the browser.
gulp.task('local:reload', function () {
   browserSync.reload({
       stream: true
   });
});

// Copies all dependencies from source to build.
gulp.task('local:build', [
        'copy:files',
        'copy:images',
        'local:js-lib',
        'local:js-app',
        'local:css'
    ], function () {
        return gulp.src(SOURCE_DIR + '/' + SOURCE_INDEX_HTML_FILE)
            .pipe(
                inject(
                    gulp.src(BUILD_DEPENDENCIES_ORDER, {
                        read: false
                    }), {
                        starttag: '<!-- inject:js-lib -->',
                        ignorePath: BUILD_DIR,
                        addRootSlash: false
                    }
                )
            )
            .pipe(
                inject(
                    gulp.src(BUILD_JS_APP_DIR + '/**/*.js'), {
                        starttag: '<!-- inject:js-app -->',
                        ignorePath: BUILD_DIR,
                        addRootSlash: false
                    }
                )
            )
            .pipe(
                inject(
                    gulp.src(BUILD_CSS_DIR + '/**/*.css', {
                        read: false
                    }), {
                        starttag: '<!-- inject:css -->',
                        ignorePath: BUILD_DIR,
                        addRootSlash: false
                    }
                )
            )
            .pipe(gulp.dest(BUILD_DIR));
    }
);

// Performs the first build.
gulp.task('local:first-build', [
    'local:build'
], function () {
    gulp.start('local:server');
});

// Performs builds when the watch task is active.
gulp.task('local:watch-build', [
    'local:build'
], function () {
    gulp.start('local:reload');
});

// Watches for changes in source.
gulp.task('local:watch', [
    'clean',
], function () {
    watch({
        glob: SOURCE_DIR + '/**/*.*'
    }, function () {
        if (firstRun) {
            gulp.start('local:first-build');
            firstRun = false;
        } else {
            gulp.start('local:watch-build');
        }
    });
});

//--------------------------------//
// PRODUCTION/STAGING BUILD TASKS //
//--------------------------------//

// Shortcut for `gulp remote:build`
gulp.task('compile', function () {
    gulp.start('remote:build');
});

// Compiles javascript library dependencies from source.
gulp.task('remote:js-lib', function () {
    return gulp.src(BUILD_DEPENDENCIES_ORDER)
               .pipe(concat(BUILD_COMPILED_JS_LIB_FILE))
               .pipe(uglify())
               .pipe(gulp.dest(BUILD_JS_LIB_DIR));
});

// Compiles the javascript application from source.
gulp.task('remote:js-app', function () {
    return gulp.src(SOURCE_JS_APP_DIR + '/**/*.js')
               .pipe(concat(BUILD_COMPILED_JS_APP_FILE))
               .pipe(uglify())
               .pipe(gulp.dest(BUILD_JS_APP_DIR));
});

// Compiles stylesheet dependencies from source.
gulp.task('remote:css', function () {
    return gulp.src(SOURCE_CSS_DIR + '/**/*.css')
               .pipe(concat(BUILD_COMPILED_CSS_FILE))
               .pipe(minifyCss({
                   keepSpecialComments: 0
               }))
               .pipe(gulp.dest(BUILD_CSS_DIR));
});

// Compiles all dependencies from source.
gulp.task('remote:compile', [
    'copy:files',
    'copy:images',
    'remote:js-lib',
    'remote:js-app',
    'remote:css'
], function () {
    gulp.src(SOURCE_DIR + '/' + SOURCE_INDEX_HTML_FILE)
        .pipe(
            inject(
                gulp.src(BUILD_JS_LIB_DIR + '/' + BUILD_COMPILED_JS_LIB_FILE, {
                    read: false
                }), {
                    starttag: '<!-- inject:js-lib -->',
                    ignorePath: BUILD_DIR,
                    addRootSlash: false
                }
            )
        )
        .pipe(
            inject(
                gulp.src(BUILD_JS_APP_DIR + '/' + BUILD_COMPILED_JS_APP_FILE), {
                    starttag: '<!-- inject:js-app -->',
                    ignorePath: BUILD_DIR,
                    addRootSlash: false
                }
            )
        )
        .pipe(
            inject(
                gulp.src(BUILD_CSS_DIR + '/' + BUILD_COMPILED_CSS_FILE, {
                    read: false
                }), {
                    starttag: '<!-- inject:css -->',
                    ignorePath: BUILD_DIR,
                    addRootSlash: false
                }
            )
        )
        .pipe(gulp.dest(BUILD_DIR));
});

// Performs a new production/staging build.
gulp.task('remote:build', [
    'clean'
], function () {
    gulp.start('remote:compile');
});

//-----------------------------------------//
// LOCAL & STAGING/PRODUCTION BUILD TASKS //
//-----------------------------------------//

// Removes all previous build artifacts.
gulp.task('clean', function () {
    return gulp.src([
               BUILD_DIR
           ], {
               read: false
           }).pipe(rimraf());
});

// Copies files from source to build.
gulp.task('copy:files', function () {
    return gulp.src(SOURCE_FILES_DIR + '/**/*')
               .pipe(gulp.dest(BUILD_FILES_DIR));
});

// Copies images from source to build.
gulp.task('copy:images', function () {
    return gulp.src(SOURCE_IMAGES_DIR + '/**/*')
               .pipe(gulp.dest(BUILD_IMAGES_DIR));
});