const gulp = require('gulp')
// const rename = require('gulp-rename')
const del = require('del')
const run = require('run-sequence')
const babel = require('gulp-babel')
const mini = require('gulp-minify')
const pkgjson = require('./package.json')

const mainJs = pkgjson.main || './src/index.js'

gulp.task('clean', () => del(['./dist']))

gulp.task('js', () => {
  gulp.src([mainJs])
    .pipe(babel({
      presets: ['@babel/env'],
    }))
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
    .pipe(gulp.dest('./dist'))
})

gulp.task('build', ['clean'], () => {
  run('miniJs')
})

gulp.task('default', ['clean'], () => {
  run('js')
  gulp.watch('./src/*.js', ['js'])
})
