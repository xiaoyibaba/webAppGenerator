// 引入依赖
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const runSequence = require('gulp-sequence').use(gulp);
const rev = require('gulp-rev');  //添加hash值

// 项目的目录结构
const dirs = {
  dist:'./dist/',
  rev: './rev/',
  src: './src/',
  html: './src/html/',
  css: './src/css/',
  less: './src/less/',
  js: './src/js/',
  img: './src/img/',
  lib: './src/lib',
  font: './src/font'
}

// 要处理的文件
const files = {
  htmlFiles: './src/**/*.html',
  lessFiles: './src/less/**/*.less',
  cssFiles: './src/css/**/*.css',
  jsFiles: './src/js/**/*.js',
  imgFiles: './src/img/**/*',
  jsonFiles: './rev/**/*.json'
}

// ------------------------ 开发环境  -----------------------------

// 生成项目目录
gulp.task('init', () => {
  const mkdirp = require('mkdirp');
  for(let i in dirs) {
    mkdirp(dirs[i], err => {
      err ? console.log(err) : console.log('mkdir--->' + dirs[i]);
    })
  }
})

// 编译less
gulp.task('less', () => {
  const less = require('gulp-less');
  const plumber = require('gulp-plumber');
  const notify = require('gulp-notify');
  return gulp.src(files.lessFiles)
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
    .pipe(less())
    .pipe(gulp.dest(dirs.css))
    .pipe(reload({stream: true}))
})

// 开发环境服务器
gulp.task('dev', ['less'],()=>{
  browserSync.init({
    server: './src'
  });
  gulp.watch(files.lessFiles, ['less']);
  gulp.watch(files.htmlFiles).on('change', reload);
  gulp.watch(files.jsFiles).on('change', reload);
});


// ------------------------生产环境--------------------------------

// 清除dist文件夹
gulp.task('clean', () => {
  const clean = require('gulp-clean');
  return gulp.src('./dist/**/*', {read: false})
    .pipe(clean());
})

// css-autoprefixer
gulp.task('autoprefixer', () => {
  const postcss = require('gulp-postcss');
  const sourcemaps = require('gulp-sourcemaps');
  const autoprefixer = require('autoprefixer');
  return gulp.src(files.cssFiles)
    .pipe(sourcemaps.init())
    .pipe(postcss([ autoprefixer({
      browsers: ['last 2 version', 'Android >= 4.0']
    }) ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dirs.css))
})

// 压缩css
gulp.task('cssMin', () => {
  const minifyCss = require('gulp-minify-css');
  return gulp.src(files.cssFiles)
    .pipe(minifyCss({}))
    .pipe(rev())
    .pipe(gulp.dest('./dist/css/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./rev/css'));
})

// 压缩合并js
gulp.task('jsMin', () => {
  const uglify = require('gulp-uglify');
  return gulp.src(files.jsFiles)
    .pipe(uglify())
    .pipe(rev())
    .pipe(gulp.dest('./dist/js/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./rev/js'));
})

// 压缩图片
gulp.task('imgMin', () => {
  const imageMin = require('gulp-imagemin');
  return gulp.src(files.imgFiles)
    .pipe(imageMin())
    .pipe(gulp.dest('./dist/img/'))
})

// lib&font copy to dist
gulp.task('copyLib', () => {
  return gulp.src(dirs.lib + '/**/*')
    .pipe(gulp.dest('./dist/lib/'));
});
gulp.task('copyFont', () => {
  return gulp.src(dirs.font + '/**/*')
    .pipe(gulp.dest('./dist/font/'));
})

gulp.task('version', () => {
  const revCollector = require('gulp-rev-collector');
  const htmlMin = require('gulp-minify-html');
  return gulp.src([files.jsonFiles, files.htmlFiles])
    .pipe(revCollector())
    .pipe(htmlMin())
    .pipe(gulp.dest('./dist/'));
})

// 项目生产
//gulp.task('build', runSequence('clean', 'less', 'autoprefixer', 'cssMin', 'jsMin', 'imgMin', 'copyLib', 'copyFont', 'version'));
gulp.task('build', (cb) => {
  runSequence(
    'clean',
    ['less', 'autoprefixer', 'cssMin', 'jsMin', 'imgMin'],
    'copyLib',
    'copyFont',
    'version',
    cb
  )
})

// 项目打包
gulp.task('zip', () => {
  const zip = require('gulp-zip');
  return gulp.src('./dist/**/*')
    .pipe(zip('project.zip'))
    .pipe(gulp.dest('./'))
})

