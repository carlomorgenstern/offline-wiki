'use strict';
var gulp = require('gulp');

// utilities
var concat = require('gulp-concat');
var del = require('del');
var flatmap = require('gulp-flatmap');
var gutil = require('gulp-util');
var merge = require('merge-stream');
var sourcemaps = require('gulp-sourcemaps');

// needed for auto-refresh and browser syncing
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;

// minify html
var htmlmin = require('gulp-htmlmin');

// minify javascript
var uglify = require('gulp-uglify');

// minify css
var cleancss = require('gulp-clean-css');

// source folders
var src = {
    root: 'src',
    html: 'src/*.html',
    js: 'src/js/**',
    SWjs: 'src/serviceworker.js',
    css: 'src/css/**',
    other: ['src/**', '!src/*.html', '!src/serviceworker.js',
        '!src/js', '!src/js/**',
        '!src/css', '!src/css/**'
    ]
};

// destination folders
var dest = {
    root: 'dist/',
    js: 'dist/js',
    css: 'dist/css',
    sourcemaps: 'maps'
};

// libraries
var libs = [{
    name: 'jquery',
    files: [
        'node_modules/jquery/dist/jquery.js'
    ]
}, {
    name: 'materialize-css',
    files: [
        'node_modules/materialize-css/dist/css/materialize.css',
        'node_modules/materialize-css/dist/js/materialize.js',
        'node_modules/materialize-css/dist/+(fonts)/**'
    ]
}, {
    name: 'material-design-icons',
    files: [
        'node_modules/material-design-icons-iconfont/dist/+(fonts)/MaterialIcons-Regular.+(ttf|woff|woff2)',
    ]
}];

// gulp tasks
gulp.task('clean', function() {
    return del.sync('dist/');
});

gulp.task('updateLibs', function() {
    // hardcoding subdirectories here, not good
    var libTasks = libs.map(function(lib) {
        return gulp.src(lib.files)
            .pipe(flatmap(function(stream, file) {
                var destDir = src.root;
                var path = file.path.toString();
                if (path.endsWith('.js')) {
                    destDir = destDir + '/js/' + lib.name;
                } else if (file.path.toString().endsWith('.css')) {
                    destDir = destDir + '/css/' + lib.name;
                }
                return stream.pipe(gulp.dest(destDir));
            }));
    });

    return merge(libTasks);
});

gulp.task('copyLibs', ['updateLibs'], function() {
    return gulp.src(src.other)
        .pipe(gulp.dest(dest.root));
});

gulp.task('html', function() {
    return gulp.src(src.html)
        .pipe(gutil.env.type === 'prod' ? htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            conservativeCollapse: true,
            keepClosingSlash: true
        }) : gutil.noop())
        .pipe(gulp.dest(dest.root));
});

gulp.task('js', ['copyLibs'], function() {
    // including jquery manually to guarantee that it shows up first in the bundle (which we need for the app.js)
    return gulp.src(['src/js/jquery/jquery.js', src.js])
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(concat('bundle.js'))
        .pipe(gutil.env.type === 'prod' ? uglify().on('error', gutil.log) : gutil.noop())
        .pipe(sourcemaps.write(dest.sourcemaps))
        .pipe(gulp.dest(dest.js))
        .pipe(browserSync.stream());
});

gulp.task('SWjs', function() {
    return gulp.src(src.SWjs)
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(gutil.env.type === 'prod' ? uglify().on('error', gutil.log) : gutil.noop())
        .pipe(sourcemaps.write(dest.sourcemaps))
        .pipe(gulp.dest(dest.root))
        .pipe(browserSync.stream());
});

gulp.task('css', ['copyLibs'], function() {
    return gulp.src(src.css)
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(concat('styles.css'))
        .pipe(gutil.env.type === 'prod' ? cleancss() : gutil.noop())
        .pipe(sourcemaps.write(dest.sourcemaps))
        .pipe(gulp.dest(dest.css))
        .pipe(browserSync.stream());
});

gulp.task('build', ['clean', 'updateLibs', 'copyLibs', 'html', 'js', 'SWjs', 'css']);

gulp.task('serve', ['build'], function() {
    browserSync.init({
        server: './dist'
    });

    gulp.watch(src.html, ['html', reload]);
    gulp.watch(src.js, ['js']);
    gulp.watch(src.SWjs, ['SWjs']);
    gulp.watch(src.css, ['css']);
});

gulp.task('default', ['serve']);