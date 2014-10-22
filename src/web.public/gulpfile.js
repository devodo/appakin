// plumber info: http://cameronspear.com/blog/how-to-handle-gulp-watch-errors-with-plumber/

// TODO: Look into using gulp-if-else plugin to reduce repetition in the tasks.

'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var plugins = require('gulp-load-plugins')({config: '../../package.json'});
var path = require('path');
var templateCache = require('gulp-angular-templatecache');
var stylish = require('jshint-stylish');
var pkg = require('./package.json');
var fs = require('fs');
var sass = require('gulp-ruby-sass');
var fsSync = require('fs-sync');

var publicGeneratedRoot = path.resolve('./public-generated');
var buildRoot = path.resolve('../../build-output/web.public');
var buildTempRoot = path.resolve('./.tmp');
var indexHtmlPath = path.resolve('./index.html');

gulp.task('build', 
    [
        'build:clean',
        'build:copy',
        'build:scripts',
        'build:stylesheets',
        'build:templates',
        'build:minify-images',
        'build:index-html',
        'build:cdnify',
        'build:version'
	]
);

gulp.task('dev', 
    [
        'dev:stylesheets',
        'dev:templates',
        'dev:scripts',
        'dev:watch'
	]
);

// http://jshint.com/docs/options/
gulp.task('jshint', function() {
    return gulp
	    .src([
            './public/scripts/**/*.js',
            './routes/**/*.js',
            '!./public/scripts/angular-ui/**/*',
            '!./public/scripts/vendor/**/*'
        ])
	    .pipe(plugins.jshint({ globalstrict: true, node: true }))
		.pipe(plugins.jshint.reporter(stylish))
		.pipe(plugins.jshint.reporter('fail'))
		.on('error', handleError);
});

gulp.task('build:clean', ['jshint'], function() {
    return gulp
	    .src([buildRoot, buildTempRoot], { read: false })
        .pipe(plugins.rimraf({ force: true }))
		.on('error', handleError);
});

gulp.task('build:config', ['build:clean'], function() {
    if (!fs.existsSync(buildTempRoot)) {
        fs.mkdirSync(buildTempRoot);
    }

    fs.writeFileSync(buildTempRoot + '/configModule.js', '{}');

    return gulp
        .src(buildTempRoot + '/configModule.js')
        .pipe(plugins.ngConstant({
            name: 'appAkin.config',
            deps: [],
            constants: {
                webApiUrl: 'http://127.0.0.1:3002/',
                cacheApiRequests: false
            },
            wrap: ''
        }))
        .pipe(gulp.dest(buildTempRoot))
        .on('error', handleError);
});

gulp.task('build:templates', ['build:clean', 'build:config'], function() {
    // Note: html minification removed as it caused errors.

    return gulp
        .src([
            './public/scripts/**/*.html',
            '!./public/scripts/appakin/pages/terms/terms.html',
            '!./public/scripts/appakin/pages/privacy/privacy.html'
        ])
        .pipe(templateCache('appTemplates.js', {module: 'appAkin', root: '/public/templates'}))
        .pipe(plugins.size({ showFiles: true }))
        .pipe(gulp.dest(buildTempRoot))
        .on('error', handleError);
});

gulp.task('build:scripts', ['build:clean', 'build:config', 'build:templates'], function() {
    return gulp
        .src(['./public/scripts/**/module.js',
            './public/scripts/**/*.js',
            buildTempRoot + '/configModule.js',
            buildTempRoot + '/appTemplates.js',
            '!./public/scripts/appakin/configModule.js'
        ])
        .pipe(plugins.concat('app-scripts.js'))
        .pipe(plugins.ngAnnotate())
        .pipe(plugins.uglify())
        .pipe(plugins.rev())
        .pipe(gulp.dest(buildRoot + '/scripts/'))
        .on('error', handleError);
});

gulp.task('build:stylesheets', ['build:clean', 'build:config'], function () {
    return gulp
        .src(['./public/stylesheets/main.scss'])
        .pipe(sass())
        .pipe(plugins.rename(
            function(path) {
                path.basename = 'app-styles';
            }))
        .pipe(plugins.minifyCss({noAdvanced:true}))
        .pipe(plugins.size({ showFiles: true }))
        .pipe(plugins.rev())
        .pipe(gulp.dest(buildRoot + '/stylesheets/'))
        .on('error', handleError);
});

gulp.task('build:index-html', ['build:scripts', 'build:stylesheets', 'build:templates'], function() {
    return gulp
	    .src(indexHtmlPath)
        .pipe(inject('./stylesheets/app-styles*.css', buildRoot, 'appakin-styles'))
        .pipe(inject('./scripts/app-scripts*.js', buildRoot, 'appakin-scripts'))
        .pipe(gulp.dest(buildRoot))
		.on('error', handleError);
});

gulp.task('build:minify-images', ['build:clean'], function() {
    return gulp
	    .src('./public/images/**/*.*')
        .pipe(plugins.imagemin())
        .pipe(plugins.size({ showFiles: true }))
        .pipe(gulp.dest(buildRoot + '/images'))
		.on('error', handleError);
});

gulp.task('build:copy', ['build:clean'], function() {
	var filesToCopy =
	    [
            './public/fonts/*.*',
            './public/stylesheets/vendor/*.css',
            '!./bower.json', '!./gulpfile.js', '!./index.html'
		];

    fsSync.copy('./public/scripts/appakin/pages/terms/terms.html',
        buildRoot + '/templates/appakin/pages/terms/terms.html');

    fsSync.copy('./public/scripts/appakin/pages/privacy/privacy.html',
            buildRoot + '/templates/appakin/pages/privacy/privacy.html');

	return gulp
	    .src(filesToCopy, {base: './public'})
	    .pipe(gulp.dest(buildRoot))
		.on('error', handleError);
});

gulp.task('build:cdnify', ['build:index-html', 'build:stylesheets'], function() {
    return gulp
	    .src(buildRoot + '/index.html')
        .pipe(plugins.cdnizer(
		    {
		        files: [
                    {
                        file: '/bower_components/angular/angular.js',
                        package: 'angular',
                        cdn: '//ajax.googleapis.com/ajax/libs/angularjs/${ version }/angular.min.js'
                    },
                    {
                        file: '/bower_components/angular-route/angular-route.js',
                        package: 'angular-route',
                        cdn: '//ajax.googleapis.com/ajax/libs/angularjs/${ version }/angular-route.min.js'
                    },
                    {
                        file: '/bower_components/angular-touch/angular-touch.js',
                        package: 'angular-touch',
                        cdn: '//ajax.googleapis.com/ajax/libs/angularjs/${ version }/angular-touch.min.js'
                    },
                    {
                        file: '/bower_components/angular-cookies/angular-cookies.js',
                        package: 'angular-cookies',
                        cdn: '//ajax.googleapis.com/ajax/libs/angularjs/${ version }/angular-cookies.min.js'
                    },
                    {
                        file: '/bower_components/angular-sanitize/angular-sanitize.js',
                        package: 'angular-sanitize',
                        cdn: '//ajax.googleapis.com/ajax/libs/angularjs/${ version }/angular-sanitize.min.js'
                    },
                    {
                        file: '/bower_components/angular-cache/dist/angular-cache.js',
                        package: 'angular-cache',
                        cdn: '//cdn.jsdelivr.net/angular.angular-cache/${ version }/angular-cache.min.js'
                    }
                ]
			}))
        .pipe(gulp.dest(buildRoot))
		.on('error', handleError);
});

gulp.task('build:version', ['build:copy'], function() {
    fs.writeFileSync(buildRoot + '/version.txt', 'Version: ' + pkg.version);
});

gulp.task('dev:watch', ['dev:stylesheets', 'dev:templates', 'dev:scripts'], function() {
	plugins.livereload.listen();

	gulp.watch(['./public/stylesheets/**/*.scss'], ['dev:stylesheets'])
        .on('error', handleError);

	gulp.watch(['./public/scripts/**/*.js', './public/scripts/**/*.html'], ['dev:scripts'])
        .on('error', handleError);

	gulp.watch(['./index.html'])
        .on('change', plugins.livereload.changed)
        .on('change', beep)
        .on('error', handleError);
});

gulp.task('dev:stylesheets', function () {
    return gulp
        .src(['./public/stylesheets/main.scss'])
        .pipe(plugins.plumber({errorHandler: handleError}))
        .pipe(sass())
        .pipe(plugins.rename(
            function(path) {
                path.basename = 'app-styles';
            }))
        .pipe(gulp.dest(publicGeneratedRoot + '/public/stylesheets/'))
        .on('end', beep)
        .on('end', plugins.livereload.changed);
});

gulp.task('dev:templates', function() {
    // Note: html minification removed as it caused errors.

	return gulp
	    .src([
                './public/scripts/**/*.html',
                '!./public/scripts/appakin/pages/terms/terms.html',
                '!./public/scripts/appakin/pages/privacy/privacy.html'
            ])
        .pipe(plugins.plumber({errorHandler: handleError}))
		.pipe(templateCache('appTemplates.js', {module: 'appAkin', root: '/public/templates'}))
        .pipe(gulp.dest(publicGeneratedRoot + '/public/templates/'))
		.on('error', handleError);		
});

gulp.task('dev:scripts', ['dev:templates'], function() {
    return gulp
        .src([
                './public/scripts/**/module.js',
                './public/scripts/**/*.js',
                publicGeneratedRoot + '/public/templates/appTemplates.js'
            ])
        .pipe(plugins.plumber({errorHandler: handleError}))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('app-scripts.js'))
        .pipe(plugins.ngAnnotate())
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest(publicGeneratedRoot + '/public/scripts/'))
        .on('end', beep)
        .on('end', plugins.livereload.changed)
        .on('error', handleError);
});

// ----------------
// Helper functions 
// ----------------

function handleError(error) {
    gutil.beep();
    gutil.beep();
    gutil.beep();
    gutil.log(gutil.colors.red(error.message));
    this.emit('end');
}

function beep() {
    gutil.beep();
}

function inject(glob, path, tag) {
    return plugins.inject(
        gulp.src(glob, {cwd: path, read: false}),
        {starttag: '<!-- inject:' + tag + ' -->'}
    );
}
