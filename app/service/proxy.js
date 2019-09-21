'use strict';

const Service = require('egg').Service;
const puppeteer = require('puppeteer');

// 跳转等待时间
const timeout = 3000;
// 文档加载完才跳转页面
const waitUntil = 'domcontentloaded';

// 获取资源地址
const url = 'https://www.xicidaili.com/wt/5';
// 可获取数据的元素选择器
const selecter = '#ip_list tr';

class ProxyService extends Service {
    /**
     * 获取代理服务ip列表
     */
    async getProxyList() {
        return new Promise(async (resolve, reject) => {
            const browser = await this.ctx.service.browser.initBrowser({
                // headless: false
            });
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
            const ipList = await page.evaluate((selecter) => {
                let list = document.querySelectorAll(selecter);
                if (!list) return false;

                let result = [];

                for (let i = 1; i < list.length; i++) {
                    let cells = list[i].querySelectorAll('td');

                    let host = cells[1].innerText;
                    let port = cells[2].innerText;
                    let scheme = cells[5].innerText; 

                    // -proxy-server 地址格式：[<proxy-scheme>://]<proxy-host>[:<proxy-port>]
                    result.push({
                        url: `${scheme.toLowerCase()}://${host}:${port}`,
                        scheme,
                        host,
                        port
                    });           
                }
                return result;
            }, selecter);

            await this.ctx.service.browser.closeBrowser(browser);

            if(!ipList || ipList.length === 0){
                console.log('代理服务IP列表获取失败！');
                resolve(false);
                return;
            }

            console.log('代理服务IP列表已获取完成！');

            let proxyList = await this.getUseableProxyList(ipList);

            resolve(proxyList);
        });
    }

    /**
     * 筛选可用的代理服务IP并存入数据库
     * 
     * @param {*} ipList IP列表
     */
    async getUseableProxyList(ipList){
        return new Promise(async (resolve, reject) => {
            console.log('开始筛选可用服务IP：');

            let useableList = [];
            // 代理服务器序号
            let proxyNo = 1;

            while(true) {
                const proxy = ipList[proxyNo - 1];

                // 查询数据库是否已存在该记录
                const query = await this.ctx.service.sqliteDB.SQLiteQuery(`SELECT * FROM T_Proxy WHERE url = '${proxy.url}'`);

                let isExist = false;
                // 地址已存在
                if(query && query.data.length > 0){
                    console.log(`数据库已存在该记录IP地址：${proxy.url}`);
                    isExist = true;
                }

                console.log(`开始测试IP地址：${proxy.url}`);

                // 创建一个浏览器实例 Browser 对象
                const browser = await puppeteer.launch({
                    // headless: false,
                    args: ['--no-sandbox','--proxy-server=' + proxy.url]
                }).catch(() => browser.close());

                const page = await browser.newPage();

                // 筛选访问速度在3秒内的IP并保存该浏览器
                const respond = await page.goto('https://www.baidu.com', { timeout, waitUntil }).catch(async() => {
                    browser.close();
                    if(isExist){
                        // 从数据库中删除该记录
                        console.log(`IP地址: ${proxy.url} 不可用！即将从数据库中移除...`);
                        console.log(query.data[0].id);
                        await this.ctx.service.sqliteDB.SQLiteQuery(`DELETE FROM T_Proxy WHERE id = ${query.data[0].id}`);
                    }
                });

                if(respond){
                    if(!isExist){
                        console.log(`IP地址: ${proxy.url} 可用！即将存入数据库...`);
                        await this.ctx.service.sqliteDB.SQLiteQuery(`INSERT INTO T_Proxy (url, scheme, host, port) VALUES ('${proxy.url}', '${proxy.scheme}', '${proxy.host}', '${proxy.port}')`);
                    }

                    useableList.push(proxy);
                }

                browser.close();
                proxyNo ++;

                if(proxyNo <= ipList.length){
                    continue;
                }
                else{
                    console.log('可用服务IP已筛选完成！');
                    resolve(useableList);
                    break;
                }                
            }
        });
    }
}

module.exports = ProxyService;