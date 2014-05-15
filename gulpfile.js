var gulp = require('gulp'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    notify = require('gulp-notify'),
    expressService = require('gulp-express-service'),
    livereload = require('gulp-livereload'),
    open = require('gulp-open');

gulp.task('js-frontend', function(){
    gulp.src('./client/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));

    browserify('./client/app.js')
    .bundle({debug: true})
    .pipe(source('app.js'))
    .pipe(gulp.dest('public'));

    browserify('./client/speakerview.js')
    .bundle({debug: true})
    .pipe(source('speakerview.js'))
    .pipe(gulp.dest('public'));
});

gulp.task('js-backend', function(){
    gulp.src(['./core/**/*.js', 'app.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(expressService({file:'./app.js', NODE_ENV:'DEV'}))
    .pipe(notify({message: 'Reload App'}));
});

gulp.task('css', function(){
    return gulp.src('./core/styles/*.scss')
    .pipe(sass({style: 'expanded'}))
    .pipe(autoprefixer())
    .pipe(gulp.dest('public/'));
});

gulp.task('watch', function(){
    gulp.watch('./core/styles/*.scss', ['css']);
    gulp.watch('./client/**/*.js', ['js-frontend']);
    gulp.watch(['./core/**/*.js', 'app.js'], ['js-backend']);
    var server = livereload();
    gulp.watch(['./public/**/*', './core/**/*.js', 'views/**/*']).on('change', function(file){
        if (file.path.indexOf('/core/') > 0 || file.path.indexOf('.jade') > 0) {
            setTimeout(function(){
                server.changed(file.path);
            }, 300);
        } else {
            server.changed(file.path);
        }
    });
});

gulp.task('open', function(){
    gulp.src('app.js')
    .pipe(open('' , {
        url: 'http://localhost:3000' 
    }));
});

gulp.task('default', function(){
    gulp.start('css', 'js-frontend', 'js-backend', 'open',   'watch');
});