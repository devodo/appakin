'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var plugins = require('gulp-load-plugins')({config: '../../package.json'});
var path = require('path');
var stylish = require('jshint-stylish');
var fs = require('fs');
var pkg = require('./package.json');

var buildRoot = path.resolve('../../build-output/es.admin');

gulp.task('build', 
    [
        'build:clean',
	    'build:copy',
		'build:version'
	]
);

// http://jshint.com/docs/options/
gulp.task('jshint', function() {
    return gulp
		.src(['./routes/**/*.js', './repos/**/*.js', './domain/**/*.js', './elasticsearch/**/*.js'])
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

gulp.task('build:copy', ['build:clean'], function() {
	var filesToCopy = [
		'./domain/**/*.*',
        './elasticsearch/**/*.*',
        './repos/**/*.*',
        './routes/**/*.*',
		'./*.*',
		'!./gulpfile.js',
        '!./config-local.json'
	];
		
	return gulp
	    .src(filesToCopy, {base: './'})
	    .pipe(gulp.dest(buildRoot))
		.on('end', gutil.log.bind(gutil, 'Files copied'))
		.on('error', handleError);
});

gulp.task('build:version', ['build:copy'], function() {
	fs.writeFileSync(buildRoot + '/version.txt', 'Version: ' + pkg.version + '\n' + new Date().toUTCString());
});

// ----------------
// Helper functions 
// ----------------

var handleError = function(error) {
    gutil.log(error.Message);
};
