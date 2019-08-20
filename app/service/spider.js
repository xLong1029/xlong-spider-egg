'use strict';

const Service = require('egg').Service;
const puppeteer = require('puppeteer');

class SpiderService extends Service {
    /**
     * 获取数据
     * @param {*} type 1获取截图，2获取pdf文件
     */
    async getData(type) {
        let res = {
            code: 500,
            data: null,
            msg: '服务器出错'
        };

        // 获取参数
        const web = this.ctx.query.web;
        // 网站地址正则表达式
        const regWebsite = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
        // console.log(`传递的参数web:${web}`);

        if (web && web != '') {
            if (!regWebsite.test(web)) {
                res.code = 404;
                res.msg = '网站格式不正确，请重新输入';
            } else {
                res.code = 200;
                res.msg = '请求成功';

                switch (type) {
                    case 1:
                        res.data = await this.getScreenshot(web);
                        break;
                    case 2:
                        res.data = await this.getPDF(web);
                        break;
                    case 3:
                        res.data = await this.getInfo(web);
                        break;
                    default:
                        res.msg = 'type参数错误，请排查';
                }

            }
        } else {
            res.code = 404;
            res.msg = '缺少参数';
        }

        return res;
    }

    // 获取屏幕截图
    async getScreenshot(web) {
        // const browser = await puppeteer.launch();
        // const page = await browser.newPage();
        // await page.goto(web);
        // await page.screenshot({path: 'example.png'});

        // await browser.close();

        return 'png';
    }

    // 获取PDF
    async getPDF(web) {
        return 'pdf';
    }

    // 获取信息
    async getInfo(web) {
        return 'info';
    }
}

module.exports = SpiderService;