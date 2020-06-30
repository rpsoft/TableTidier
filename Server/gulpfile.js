var gulp = require('gulp');
var watch = require('gulp-watch');

var concat = require('gulp-concat');
// var uglify = require('gulp-uglify');
var less = require('gulp-less');
var babel = require('gulp-babel');
var sourcemaps = require("gulp-sourcemaps");

gulp.task('babel', () =>
	gulp.src(['src/**/*.js','src/**/*.jsx'])
		.pipe(babel({
			presets: ['@babel/env'],
      plugins: ['@babel/transform-runtime']
		}))
		// .pipe(gulp.dest('dist'))
    .pipe(sourcemaps.write("."))
        //.pipe(uglify())
    .pipe(gulp.dest('./'))
);

gulp.task('less', function () {
 return gulp.src('./src-style/**/*.less')
  .pipe(sourcemaps.init())
  .pipe(less())
  .pipe(concat('app.css'))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./public/css'));
});

gulp.task('jsonData', function () {
    gulp.src(['src/**/*.json'])
        .pipe(gulp.dest('./build/'));
});

var watchTaskList = [
  'babel',
  'less',
  'jsonData'
];

gulp.task('watch', () => {
	return watch('src/**/*.js', { ignoreInitial: false })
	.pipe(babel({
		presets: ['@babel/env'],
		plugins: ['@babel/transform-runtime']
	}))
	.pipe(sourcemaps.write("."))
	.pipe(gulp.dest('./'))
} );
