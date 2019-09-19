'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/index', controller.home.index);
  router.get('/spider/:type', controller.home.spider);
  /* 路由重定向 */
  router.redirect('/', '/index', 302);
};
