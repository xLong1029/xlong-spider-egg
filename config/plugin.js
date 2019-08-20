'use strict';

/** @type Egg.EggPlugin */
module.exports = {
  // had enabled by egg
  // static: {
  //   enable: true,
  // }

  // 启用 nunjucks 插件
  nunjucks: {
    enable: true,
    package: 'egg-view-nunjucks',
  }
};