'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util')
var plugins = require('gulp-load-plugins')({config: '../../package.json'});
var path = require('path');
var del = require('del');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var templateCache = require('gulp-angular-templatecache');
var minifyHtml = require('gulp-minify-html');
var stylish = require('jshint-stylish');

var publicGeneratedRoot = path.resolve('./public-generated');
var buildRoot = path.resolve('../../build-output/web.public');
var indexHtmlPath = path.resolve('./index.html');

gulp.task('build', 
    [
    'build:clean',
	'build:copy',
	'build:javascripts',
	'build:stylesheets',
	'build:templates',
	'build:minify-images',
	'build:index-html',
	'build:cdnify'
	]
);

gulp.task('dev', 
    [
	'dev:stylesheets',
	'dev:templates', 
	'dev:javascripts', 
	'dev:watch'
	]
);

// http://jshint.com/docs/options/
gulp.task('jshint', function() {
    return gulp
	    .src(['./public/javascripts/**/*.js', './routes/**/*.js'])
	    .pipe(plugins.jshint({ globalstrict: true, node: true }))
		.pipe(plugins.jshint.reporter(stylish))
		.pipe(plugins.jshint.reporter('fail'))
		.on('end', gutil.log.bind(gutil, 'JSHint was happy'))
		.on('error', handleError);
});

gulp.task('build:clean', ['jshint'], function() {
    return gulp
	    .src(buildRoot, { read: false })
        .pipe(plugins.rimraf({ force: true }))
		.on('end', gutil.log.bind(gutil, 'Build cleaned'))
		.on('error', handleError);
});

gulp.task('build:javascripts', ['build:clean'], function() {
    return browserify('./public/javascripts/main.js', { debug: false })
        .bundle()
        .pipe(source('app-scripts.js'))
        .pipe(plugins.streamify(plugins.uglify({ mangle: true })))
        .pipe(plugins.streamify(plugins.size({ showFiles: true })))
        .pipe(plugins.buffer())
        .pipe(plugins.rev())
        .pipe(gulp.dest(buildRoot + '/public/javascripts/'))
		.on('end', gutil.log.bind(gutil, 'Scripts built'))
		.on('error', handleError);
});

gulp.task('build:stylesheets', ['build:clean'], function() {
    return gulp
	    .src('./public/stylesheets/main.css')
	    .pipe(plugins.rename('app-styles.css'))
		.pipe(plugins.minifyCss())
		.pipe(plugins.size({ showFiles: true }))
        .pipe(plugins.rev())
        .pipe(gulp.dest(buildRoot + '/public/stylesheets/'))
		.on('end', gutil.log.bind(gutil, 'Styles built'))
		.on('error', handleError);
});

gulp.task('build:index-html', ['build:javascripts', 'build:stylesheets', 'build:templates'], function() {
    return gulp
	    .src(indexHtmlPath)
        .pipe(inject('./public/stylesheets/app-styles*.css', buildRoot, 'app-styles'))
        .pipe(inject('./public/javascripts/app-scripts*.js', buildRoot, 'app-scripts'))
        .pipe(inject('./public/templates/app-templates*.js', buildRoot, 'app-templates'))
        .pipe(gulp.dest(buildRoot))
		.on('end', gutil.log.bind(gutil, 'index.html built'))
		.on('error', handleError);
});

gulp.task('build:templates', ['build:clean'], function() {
	return gulp
	    .src(['./public/templates/**/*.html'])
        .pipe(minifyHtml({quotes: true}))
		.pipe(templateCache('app-templates.js', {module: 'appAkin'}))
        .pipe(plugins.size({ showFiles: true }))
        .pipe(plugins.rev())
        .pipe(gulp.dest(buildRoot + '/public/templates/'))
        .on('end', gutil.log.bind(gutil, 'Templates built'))
		.on('error', handleError);		
});

gulp.task('build:minify-images', ['build:clean'], function() {
    return gulp
	    .src('./public/images/**/*.*')
        .pipe(plugins.imagemin())
        .pipe(plugins.size({ showFiles: true }))
        .pipe(gulp.dest(buildRoot + '/public/images'))
		.on('end', gutil.log.bind(gutil, 'Images minified'))
		.on('error', handleError);
});

gulp.task('build:copy', ['build:clean'], function() {
	var filesToCopy = 
	    [
	    './node_modules/**/*.*',
		'./routes/**/*.*',
		'./views/**/*.*',
		'./*.*',
		'!./bower.json', '!./gulpfile.js', '!./index.html'
		];
		
	return gulp
	    .src(filesToCopy, {base: './'})
	    .pipe(gulp.dest(buildRoot))
		.on('end', gutil.log.bind(gutil, 'Files copied'))
		.on('error', handleError);
});

gulp.task('build:cdnify', ['build:index-html', 'build:stylesheets'], function() {
    return gulp
	    .src(buildRoot + '/index.html')
        .pipe(plugins.cdnizer(
		    {
		        files: ['google:angular']
			}))
        .pipe(gulp.dest(buildRoot))
		.on('end', gutil.log.bind(gutil, 'index.html cdnified'))
		.on('error', handleError);
});

gulp.task('dev:watch', ['dev:stylesheets', 'dev:templates', 'dev:javascripts'], function() {
	plugins.livereload.listen();
	
	// javascripts don't need to be gulp.watch'ed as they are watched using watchify.
	gulp.watch(['./public/stylesheets/**/*'], ['dev:stylesheets']);
	gulp.watch(['./public/templates/**/*'], ['dev:templates']);
	gulp.watch(['./index.html']).on('change', plugins.livereload.changed);
});

gulp.task('dev:stylesheets', function() {
    return gulp
	    .src('./public/stylesheets/main.css')
		.pipe(plugins.rename('app-styles.css'))
        .pipe(gulp.dest(publicGeneratedRoot + '/public/stylesheets/'))
		.on('end', gutil.log.bind(gutil, 'Styles rebuild for dev'))
		.on('end', plugins.livereload.changed)
		.on('error', handleError);
});

gulp.task('dev:templates', function() {
	return gulp
	    .src(['./public/templates/**/*.html'])
		.pipe(templateCache('app-templates.js', {module: 'appAkin'}))
        .pipe(gulp.dest(publicGeneratedRoot + '/public/templates/'))
        .on('end', gutil.log.bind(gutil, 'Templates built for dev'))
		.on('end', plugins.livereload.changed)
		.on('error', handleError);		
});

gulp.task('dev:javascripts', function() {
	watchify.args.debug = true;
	
	var bundler = watchify(
	    browserify('./public/javascripts/main.js', watchify.args));
		
	bundler.on('update', rebundle);
	
	function rebundle() {
	    return bundler
		    .bundle()
			.pipe(source('app-scripts.js'))
            .pipe(gulp.dest(publicGeneratedRoot + '/public/javascripts/'))
			.on('end', gutil.log.bind(gutil, 'Scripts built (watchify) for dev'))
			.on('end', plugins.livereload.changed)
			.on('error', handleError);
	};
	
    return rebundle();
});

// ----------------
// Helper functions 
// ----------------

function handleError(error) {
    gutil.log(error.Message);
};

function inject(glob, path, tag) {
    return plugins.inject(
        gulp.src(glob, {cwd: path}),
        {starttag: '<!-- inject:' + tag + ':{{ext}} -->'}
    );
}
