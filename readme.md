## 构建自己的前端开发工作流

#### 使用gulp构建一个前端开发的自动化工具，主要实现的功能：
*	开发过程中
	-	`scss`自动编译
	- 	监控静态文件变化进行浏览器自动刷新
*  构建过程
	-	`scss`自动编译
	- 	`css`文件自动压缩和兼容浏览器的前缀自动补全以及自动添加版本号
	-  `js` ES6转ES5，文件自动压缩和添加版本号
	-  图片，字体以及其他资源文件的拷贝等功能
	-  `html`文件自动压缩，重新引入带有版本号的资源文件

*	所需要的插件

```javascript
	let gulp = require('gulp')
	let browserSync = require('browser-sync').create()      //搭建本地服务
	let babel = require('gulp-babel')                       //es6 - es5
	let less = require('gulp-less')                         //less编译
	let minHtml = require('gulp-minify-html')               //压缩html
	let minCss = require('gulp-minify-css')                 //压缩css
	let minJs = require('gulp-uglify')                      //压缩js
	let minImage = require('gulp-imagemin')                 //压缩图片
	let autoprefixer = require('gulp-autoprefixer')         //css自动补全
	let clean = require('gulp-clean')                       //文件清除
	let rename = require('gulp-rename')                     //文件重命名
	let rev = require('gulp-rev')                           //添加hash
	let revCollector = require('gulp-rev-collector')         //替换html中的js,css文件 刷新缓存
	let delLog = require('gulp-strip-debug')                //清楚js的console.log
	let concat = require('gulp-concat')                     //合并文件
	let zip = require('gulp-gzip')                          //打包
	let runSequence = require('run-sequence')               //顺序执行
	let ftp = require('gulp-ftp')                           //自动部署
	let gulpUtil = require('gulp-util')
	let sass = require('gulp-sass')		//scss编译
```

*	开发环境

```javascript
//scss编译
gulp.task('devScss', () => {
    gulp.src('src/sass/**/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('src/css'))
})

//合并css文件
gulp.task('devCss', ['devScss'], () => {
    gulp.src('src/css/*.css')
    .pipe(gulp.dest('test/css/'))
    .pipe(browserSync.reload({stream: true}))
})

//js
gulp.task('devJs', () => {
    gulp.src('src/js/**/*.js')
    .pipe(babel({
        presets: ['es2015']
    }))
    .pipe(gulp.dest('test/js/'))
    .pipe(browserSync.reload({stream: true}))
})

//html
gulp.task('devHtml', () => {
    gulp.src('src/**/*.html')
    .pipe(gulp.dest('test/'))
    .pipe(browserSync.reload({stream: true}))
})

//images
gulp.task('devImg', () => {
    gulp.src('src/images/**')
    .pipe(gulp.dest('test/images/'))
})

//lib
gulp.task('devLib', () => {
    gulp.src('src/lib/**')
    .pipe(gulp.dest('test/lib/'))
})

//fonts
gulp.task('devFont', () => {
    gulp.src('src/font/**')
    .pipe(gulp.dest('test/font/'))
})

//开发构建
gulp.task('dev', ['devCss', 'devJs', 'devHtml','devImg','devLib', 'devFont'], () => {
    browserSync.init({
        server: {
            baseDir: "test" // 设置服务器的根目录为dist目录
        },
        notify: false // 开启静默模式
    });
    // 我们使用gulp的文件监听功能，来实时编译修改过后的文件
    gulp.watch('src/js/**/*.js', ['devJs']);
    gulp.watch('src/sass/**/*.scss', ['devScss']);
    gulp.watch('src/css/**/*.css', ['devCss']);
    gulp.watch('src/*.html', ['devHtml']);
    gulp.watch('src/fonts/**', ['devFont']);
    gulp.watch('src/images/**', ['devImg']);
    gulp.watch('src/lib/**', ['devLib']);
});
```

*	生产环境

```javascript
//清空dist文件夹
gulp.task('clean', function () {
    return gulp.src(['dist', 'rev'])
    .pipe(clean())
})

//less编译, 前缀自动补全， 添加hash值版本号
gulp.task('buildSass', function () {
    return gulp.src('src/sass/**/*.scss')
    .pipe(sass())
    .pipe(autoprefixer({
        browsers: ['last 2 versions', 'Android >= 4.0'],    //兼容主流浏览器最新两个版本，安卓4.0以上版本
        cascade: true, //是否美化属性值 默认：true 像这样：
        remove:true //是否去掉不必要的前缀 默认：true 
    }))
    .pipe(minCss())
    .pipe(rev())
    .pipe(gulp.dest('dist/css'))
    .pipe(rev.manifest())//给添加哈希值的文件添加到清单中
    .pipe(gulp.dest('rev/css'))
})


//编译压缩js
gulp.task('buildJs', function () {
    return gulp.src('src/js/**/*.js')
    .pipe(babel())
    .pipe(minJs())
    .pipe(rev())
    .pipe(gulp.dest('dist/js'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('rev/js'))
})

//图片增加版本号
gulp.task('buildImg', function () {
    return gulp.src('src/images/**/*.+(ico|png|jpeg|jpg|gif|svg)')
    .pipe(minImage())
    .pipe(rev())
    .pipe(gulp.dest('dist/images'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('rev/images'))
})

//font
gulp.task('buildFont', function () {
    return gulp.src('src/font/**/*')
    .pipe(gulp.dest('dist/font'))
});

//lib
gulp.task('buildLib', function () {
    return gulp.src('src/lib/**/*')
    .pipe(gulp.dest('dist/lib'))
});

//html内重新引入带版本号的css js文件,并压缩html
gulp.task('version', function () {
    return gulp.src(['rev/**/*.json', 'src/**/*.html'])
    .pipe(revCollector())
    .pipe(minHtml())
    .pipe(gulp.dest('dist/')) 
})

//build
gulp.task('build', function (cb) {
    runSequence(
        'clean',
        ['buildSass', 'buildJs', 'buildImg'],
        'buildFont',
        'buildLib',
        'version',
    cb)
})

//自动部署上线
gulp.task('upload', function () {
    gulp.src('dist/**')
    .pipe(ftp({
        host: '', //服务器ip
        port: 22, //端口号
        user: 'username', //帐号
        pass: 'password', //密码
        remotePath: '/' //上传到
    }))
    .pipe(gulpUtil.noop())
})
```