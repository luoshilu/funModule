const gulp = require('gulp')
const rename = require('gulp-rename')
const del = require('del')
const run = require('run-sequence')
const babel = require('gulp-babel')
const mini = require('gulp-minify')
const pkgjson = require('./package.json')
const stripDebug = require('gulp-strip-debug');

const mainJs = pkgjson.main || './src/index.js'

gulp.task('clean', () => del(['./dist']))

gulp.task('js', () => {
  gulp.src([mainJs])
    .pipe(babel({
      presets: ['@babel/env'],
    }))
    .pipe(stripDebug())
    .pipe(gulp.dest('./dist'))
})

gulp.task('miniJs', () => {
  gulp.src([mainJs])
    .pipe(babel({
      presets: ['@babel/env'],
    }))
    .pipe(mini({
      ext: {
        min: '.min.js',
      },
    }))
    .pipe(stripDebug())
    .pipe(gulp.dest('./dist'))
})

gulp.task('es6Js', () => {
  gulp.src([mainJs])
    .pipe(stripDebug())
    .pipe(rename({
      prefix: 'es6',
    }))
    .pipe(gulp.dest('./dist'))
})

gulp.task('build', ['clean'], () => {
  run('miniJs', 'es6Js')
})

gulp.task('default', ['clean'], () => {
  run('js')
  gulp.watch('./src/*.js', ['js'])
})
