'use strict';

const Service = require('egg').Service;
const puppeteer = require('puppeteer');

// 跳转等待时间
const timeout = 3000;
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

            console.log('开始获取代理服务IP列表');

            // 获取有效ip(这部分需根据不同的地址进行修改)
            const proxyList = await page.evaluate((selecter) => {
                let list = document.querySelectorAll(selecter);
                if (!list) return false;

                let result = [];

                for (let i = 1; i < list.length; i++) {
                    let row = list[i];
                    let cells = row.querySelectorAll('td');

                    let ip = cells[1].innerText;
                    let port = cells[2].innerText;
                    let host = cells[5].innerText; 

                    result.push({
                        server: `${host.toLowerCase()}://${ip}:${port}`,
                        host,
                        ip,
                        port
                    });           
                }
                return result;
            }, selecter);

            await this.ctx.service.browser.closeBrowser(browser);

            if(!proxyList || proxyList.length === 0){
                console.log('代理服务IP列表获取失败！');
                resolve(false);
                return;
            }

            console.log('代理服务IP列表已获取完成！');

            /** */
            console.log('开始筛选可用服务IP：');

            let useableProxyList = await new Promise(async (resolve, reject) => {
                // let browserList = [];
                let useableList = [];
                // 代理服务器序号
                let proxyNo = 1;

                while(true) {
                    console.log(`开始测试IP：${proxyList[proxyNo - 1].server}`);
                    // 创建一个浏览器实例 Browser 对象
                    const browser = await puppeteer.launch({
                        // headless: false,
                        args: ['--no-sandbox','--proxy-server=' + proxyList[proxyNo - 1].server]
                    }).catch(() => browser.close());

                    const page = await browser.newPage();

                    // 筛选访问速度在3秒内的IP并保存该浏览器
                    const respond = await page.goto('https://www.baidu.com', { timeout, waitUntil }).catch(err => {
                        browser.close();
                    });
    
                    if(respond){
                        console.log(`IP: ${proxyList[proxyNo - 1].server}可用！`);
                        useableList.push(proxyList[proxyNo - 1]);
                        // browserList.push(browser);
                    }

                    browser.close();
                    proxyNo ++;
    
                    if(proxyNo < proxyList.length){
                        continue;
                    }
                    else{
                        console.log('可用服务IP已筛选完成！');
                        resolve(useableList);
                        break;
                    }                
                }
            });

            // this.app.browserList = browserList;
            // this.app.proxyList = useableProxyList;            
            /** */

            resolve(useableProxyList);
        });
    }
}

module.exports = ProxyService;