/* eslint valid-jsdoc: "off" */

'use strict';

const isProduction = process.env.NODE_ENV === 'production';

console.log(`isProduction is ${isProduction}`);

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1566206139404_9719';

  config.view = {
		defaultViewEngine: 'nunjucks',
		noCache: isProduction, // 仅在生产环境下开启
		mapping: {
			'.html': 'nunjucks',
		}
	};

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
