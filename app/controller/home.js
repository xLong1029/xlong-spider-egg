'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, welcome to xlong-spider-egg.';
  }
}

module.exports = HomeController;
