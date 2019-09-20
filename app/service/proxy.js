'use strict';

const Service = require('egg').Service;
const puppeteer = require('puppeteer');

// 跳转等待时间
const timeout = 120000;
// 文档加载完才跳转页面
const waitUntil = 'domcontentloaded';

// 获取资源地址
const url = 'https://www.xicidaili.com/wt/';
// 可获取数据的元素选择器
const selecter = '#ip_list tr';

class ProxyService extends Service {
    /**
     * 获取代理服务ip列表
     */
    async getProxyList() {
        return new Promise(async (resolve, reject) => {
            const browser = await this.ctx.service.browser.initBrowser();
            if(!browser) return false;

            const page = await this.ctx.service.browser.initPage(browser);
            if(!page) return false;

            // 设置浏览器信息
            await this.ctx.service.browser.setUA(page);

            const respond = await this.ctx.service.browser.gotoPage(browser, page, url, { timeout, waitUntil });
            if(!respond) return false;

            const findSelecter = await this.ctx.service.browser.findSelector(browser, page, selecter);
            if(!findSelecter) return false;

            console.log('开始获取代理服务ip列表');

            // 获取有效ip(这部分需根据不同的地址进行修改)
            const proxyList = await page.evaluate((selecter) => {
                let list = document.querySelectorAll(selecter);
                if (!list) return false;

                let result = [];

                for (let i = 1; i < list.length; i++) {
                    let row = list[i];
                    let cells = row.querySelectorAll('td');

                    // 去除单位“秒”
                    let speed = parseFloat(cells[6].querySelector('div').getAttribute('title'));
                    if(speed <= 1){
                        let ip = cells[1].innerText;
                        let port = cells[2].innerText;
                        let host = cells[5].innerText; 

                        result.push({
                            server: `${host.toLowerCase()}://${ip}:${port}`,
                            host,
                            ip,
                            port,
                            speed: speed + '秒'
                        });
                    }            
                }
                return result;
            }, selecter);

            await this.ctx.service.browser.closeBrowser(browser);

            if(!proxyList || proxyList.length === 0){
                console.log('代理服务获取失败！');
                resolve(false);
                return;
            }

            console.log('代理服务已获取完成');
            resolve(proxyList);
        });
    }
}

module.exports = ProxyService;