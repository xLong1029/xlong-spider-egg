'use strict';

const Service = require('egg').Service;

class IndexService extends Service {

    // 获取通用内容：关键词、描述内容、头部、底部信息
    async getCommonInfo() {
        let data = {};
        data.logo = '/public/images/logo.jpg';
        data.companyName = 'XLONGJIALIDUN';
        data.keywords = 'xlong, 家里蹲, 测试, 爬虫, Node, Egg.js';
        data.description = 'xlong-spider-egg，基于Egg.js开发的爬虫测试项目';

        return data;
    }
    // 首页
    async getIndex() {
        let data = await this.getCommonInfo();
        data.title = "XLONG家里蹲爬虫测试项目";

        return data;
    }
}

module.exports = IndexService;