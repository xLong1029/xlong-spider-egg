'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const data = await this.ctx.service.index.getIndex();
    await this.ctx.render('index.html', data);
  }

  // 爬取数据
  async spider() {
    const type = parseInt(this.ctx.params.type);
    this.ctx.body = await this.ctx.service.spider.getData(type);
  }

  // 获取代理服务器IP
  async proxy() {
    if(!this.app.proxyList){      
      this.app.proxyList = await this.ctx.service.proxy.getProxyList();
    }
    if(!this.app.proxyList) this.ctx.body = { code: 404, msg: '请求失败，无法获取代理服务器列表'};
    else this.ctx.body = { code: 200, data: this.app.proxyList, msg:'请求成功' };
  }
}

module.exports = HomeController;