// plumber info: http://cameronspear.com/blog/how-to-handle-gulp-watch-errors-with-plumber/

'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var plugins = require('gulp-load-plugins')({config: '../../package.json'});
var path = require('path');
var templateCache = require('gulp-angular-templatecache');
var stylish = require('jshint-stylish');
var pkg = require('./package.json');
var fs = require('fs');

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
	    .src(buildRoot, { read: false })
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
            constants: { webApiUrl: 'http://aws/api/' },
            wrap: ''
        }))
        .pipe(gulp.dest(buildTempRoot))
        .on('error', handleError);
});

gulp.task('build:scripts', ['build:clean', 'build:config'], function() {
    return gulp
        .src(['./public/scripts/**/module.js',
            './public/scripts/**/*.js',
            './.tmp/configModule.js',
            '!./public/scripts/appakin/configModule.js'])
        .pipe(plugins.concat('app-scripts.js'))
        .pipe(plugins.ngAnnotate())
        .pipe(plugins.uglify())
        .pipe(plugins.rev())
        .pipe(gulp.dest(buildRoot + '/public/scripts/'))
        .on('error', handleError);
});

gulp.task('build:stylesheets', ['build:clean', 'build:config'], function () {
    return gulp
        .src(['./public/stylesheets/main.scss'])
        .pipe(plugins.sass())
        .pipe(plugins.rename(
            function(path) {
                path.basename = 'app-styles';
            }))
        .pipe(plugins.minifyCss())
        .pipe(plugins.size({ showFiles: true }))
        .pipe(plugins.rev())
        .pipe(gulp.dest(buildRoot + '/public/stylesheets/'))
        .on('error', handleError);
});

gulp.task('build:index-html', ['build:scripts', 'build:stylesheets', 'build:templates'], function() {
    return gulp
	    .src(indexHtmlPath)
        .pipe(inject('./public/stylesheets/app-styles*.css', buildRoot, 'appakin-styles'))
        .pipe(inject('./public/scripts/app-scripts*.js', buildRoot, 'appakin-scripts'))
        .pipe(inject('./public/templates/app-templates*.js', buildRoot, 'appakin-templates'))
        .pipe(gulp.dest(buildRoot))
		.on('error', handleError);
});

gulp.task('build:templates', ['build:clean'], function() {
	return gulp
	    .src(['./public/scripts/**/*.html'])
        .pipe(plugins.minifyHtml({quotes: true}))
		.pipe(templateCache('app-templates.js', {module: 'appAkin'}))
        .pipe(plugins.size({ showFiles: true }))
        .pipe(plugins.rev())
        .pipe(gulp.dest(buildRoot + '/public/templates/'))
		.on('error', handleError);		
});

gulp.task('build:minify-images', ['build:clean'], function() {
    return gulp
	    .src('./public/images/**/*.*')
        .pipe(plugins.imagemin())
        .pipe(plugins.size({ showFiles: true }))
        .pipe(gulp.dest(buildRoot + '/public/images'))
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
                        file: '/bower_components/angular-resource/angular-resource.js',
                        package: 'angular-resource',
                        cdn: '//ajax.googleapis.com/ajax/libs/angularjs/${ version }/angular-resource.min.js'
                    },
                    {
                        file: '/bower_components/angular-cookies/angular-cookies.js',
                        package: 'angular-cookies',
                        cdn: '//ajax.googleapis.com/ajax/libs/angularjs/${ version }/angular-cookies.min.js'
                    },
                    {
                        file: '/bower_components/html5shiv/dist/html5shiv.js',
                        package: 'html5shiv',
                        cdn: '//cdnjs.cloudflare.com/ajax/libs/html5shiv/${ version }/html5shiv.min.js'
                    }
                ]
			}))
        .pipe(gulp.dest(buildRoot))
		.on('error', handleError);
});

gulp.task('build:version', ['build:clean'], function() {
    fs.mkdirSync(buildRoot);
    fs.writeFileSync(buildRoot + '/version.txt', 'Version: ' + pkg.version);
});

gulp.task('dev:watch', ['dev:stylesheets', 'dev:templates', 'dev:scripts'], function() {
	plugins.livereload.listen();

	gulp.watch(['./public/stylesheets/**/*.scss'], ['dev:stylesheets']);
	gulp.watch(['./public/scripts/**/*.html'], ['dev:templates']);
	gulp.watch(['./public/scripts/**/*.js'], ['dev:scripts']);
	gulp.watch(['./index.html']).on('change', plugins.livereload.changed);
});

gulp.task('dev:stylesheets', function () {
    return gulp
        .src(['./public/stylesheets/main.scss'])
        .pipe(plugins.plumber({errorHandler: handleError}))
        .pipe(plugins.sass()) //({errLogToConsole: true}))
        .pipe(plugins.rename(
            function(path) {
                path.basename = 'app-styles';
            }))
        .pipe(gulp.dest(publicGeneratedRoot + '/public/stylesheets/'))
        .on('end', plugins.livereload.changed);
});

gulp.task('dev:templates', function() {
	return gulp
	    .src(['./public/scripts/**/*.html'])
        .pipe(plugins.plumber({errorHandler: handleError}))
		.pipe(templateCache('app-templates.js', {module: 'appAkin'}))
        .pipe(gulp.dest(publicGeneratedRoot + '/public/templates/'))
		.on('end', plugins.livereload.changed)
		.on('error', handleError);		
});

gulp.task('dev:scripts', function() {
    return gulp
        .src(['./public/scripts/**/module.js', './public/scripts/**/*.js'])
        .pipe(plugins.plumber({errorHandler: handleError}))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('app-scripts.js'))
        .pipe(plugins.ngAnnotate())
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest(publicGeneratedRoot + '/public/scripts/'))
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

function inject(glob, path, tag) {
    return plugins.inject(
        gulp.src(glob, {cwd: path, read: false}),
        {starttag: '<!-- inject:' + tag + ' -->'}
    );
}
