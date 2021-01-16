const { src, dest, parallel, series, watch } = require("gulp");
const cwd = process.cwd(); //返回当前命令行所在工作目录
const del = require("del");
const browserSync = require("browser-sync");
const loadPlugins = require("gulp-load-plugins");
const { use } = require("browser-sync");
const plugins = loadPlugins();
const bs = browserSync.create(); //创建服务器
let config = {
  //默认情况
  build: {
    src: "src",
    dist: "dist",
    temp: "temp",
    public: "public",
    paths: {
      styles: "assets/styles/*.scss",
      scripts: "assets/scripts/*.js",
      pages: "*.html",
      images: "assets/images/**",
      font: "assets/fonts/**",
    },
  },
};
try {
  const loadConfig = require(`${cwd}/pages.config.js`);
  config = Object.assign({}, config, loadConfig);
} catch (e) {}

//自定义clean任务
const clean = () => {
  return del([config.build.dist, config.build.temp]);
};
//编译样式
const style = () => {
  //样式编译
  return src(config.build.paths.styles, {
    base: config.build.src,
    cwd: config.build.src,
  }) //base指定原始目录
    .pipe(plugins.sass({ outputStyle: "expanded" }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
};
//编译脚本
const script = () => {
  return src(config.build.paths.scripts, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.babel({ presets: [require("@babel/preset-env")] })) //转换es6新特性
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
};
//编译页面
const page = () => {
  //src任意子目录下的html
  return src(config.build.paths.pages, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // 防止模板缓存导致页面不能及时更新
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
};
// //图片和字体文件转换
const image = () => {
  return src(config.build.paths.images, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist));
};
const font = () => {
  return src(config.build.paths.font, {
    base: config.build.src,
    cwd: config.build.src,
  })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist));
};
//处理public
const extra = () => {
  return src("**", {
    base: config.build.public,
    cwd: config.build.public,
  }).pipe(dest(config.build.dist));
};
//整合js css 压缩
const useref = () => {
  return src(config.build.paths.pages, {
    base: config.build.temp,
    cwd: config.build.temp,
  })
    .pipe(plugins.useref({ searchPath: [config.build.temp, "."] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify())) //分别处理不同文件
    .pipe(plugins.if(/\.css$/, plugins.cleanCss())) //分别处理不同文件
    .pipe(
      plugins.if(
        /\.html$/,
        plugins.htmlmin({
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
        })
      )
    ) //分别处理不同文件
    .pipe(dest(config.build.dist));
};
//启动服务器
const serve = () => {
  //修改文件。执行相应任务 修改dist
  watch(config.build.paths.styles, { cwd: config.build.src }, style);
  watch(config.build.paths.scripts, { cwd: config.build.src }, script);
  watch(config.build.paths.pages, { cwd: config.build.src }, page);
  // watch("src/assets/images/**", image)
  // watch("src/assets/fonts/**", font)
  // watch("public/**", extra)
  watch(
    [config.build.paths.images, config.build.paths.font],
    {
      cwd: config.build.src,
    },
    bs.reload
  );
  watch("**", { cwd: config.build.public }, bs.reload);
  bs.init({
    notify: false, //关闭提示
    port: 2080, //修改端口号
    // open: false,
    // files: "dist/**", //被监听的路径通配符
    server: {
      baseDir: [config.build.temp, config.build.dist, config.build.public], //指定根目录,数组依次查找
      routes: {
        //优先于baseDir
        "/node_modules": "node_modules",
      },
    },
  });
};
//组合任务
const compile = parallel(style, script, page);
const build = series(
  clean,
  parallel(series(compile, useref), extra)
); //自动清除dist下的文件
const develop = series(compile, serve);
module.exports = {
  clean,
  build,
  develop,
};
