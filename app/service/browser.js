'use strict';

const Service = require('egg').Service;
const puppeteer = require('puppeteer');

// 页面访问最大重试次数
const MAX_RT = 3;

class SpiderService extends Service {
    /**
     * 初始化浏览器实例
     * 
     * @param {*} config puppeteer.launch的配置
     */
    async initBrowser(config = {}) {
        return new Promise(async (resolve, reject) => {
            let browser;

            for (let i = MAX_RT; i > 0; i--) {

                if (browser) break;

                console.log('开始初始化浏览器...');

                // 创建一个浏览器实例 Browser 对象
                browser = await puppeteer.launch(config).catch(() => {
                    i-1 > 0 ? console.log('浏览器启动失败，准备重试') : console.log('浏览器启动失败！');				
                });
            }

            if (!browser) {
                console.log('无法启动浏览器！');
                
                reject(false);
                return;
            }

            resolve(browser);
        });
    }

    /**
     * 关闭浏览器
     * 
     * @param {*} browser 浏览器实例
     */
    async closeBrowser(browser) {
        return await browser.close().then(() => console.log('浏览器已关闭')).catch(() => console.log('关闭浏览器失败！'));
    }

    /**
     * 初始化页面实例
     * 
     * @param {*} browser 浏览器实例
     */
    async initPage(browser) {
        return new Promise(async (resolve, reject) => {
            console.log('开始打开新页面');

            // 创建页面 Page 对象
            const page = await browser.newPage().catch(ex => console.log(ex));

            if (!page) {
                console.log('打无法打开新页面！即将关闭浏览器...');

                await this.closeBrowser(browser);

                reject(false);
                return;
            }

            resolve(page);
        });
    }

    /**
     * 浏览器页面跳转
     * 
     * @param {*} browser 浏览器实例
     * @param {*} page 页面实例
     * @param {*} url 链接地址
     * @param {*} config page.goto配置
     */
    async gotoPage(browser, page, url, config) {
        return new Promise(async (resolve, reject) => {
            let respond;
            for (let i = MAX_RT; i > 0; i--) {

                if (respond) break;
                
                console.log(`跳转至链接: ${url}`);

                // 跳转到指定的页面
                respond = await page.goto(url, config).catch(err => {
                    i-1 > 0 ? console.log('页面跳转失败，准备重试') : console.log(err);	
                });
            }
            if (!respond) {
                console.log('无法跳转至该链接！即将关闭浏览器...');

                await this.closeBrowser(browser);

                reject(false);
                return;
            }
            resolve(true);
        });
    }

    /**
     * 查找节点元素
     * 
     * @param {*} browser 浏览器实例
     * @param {*} page 页面实例
     * @param {*} selecter 元素选择器
     */
    async findSelector(browser, page, selecter) {
        return new Promise(async (resolve, reject) => {
            console.log(`开始在页面中查找元素选择器：'${selecter}'`);

            const find = await page.waitForSelector(selecter).catch(err => console.log(err));
            if (!find) {
                console.log('找不到该元素！即将关闭浏览器...');

                await this.closeBrowser(browser);

                reject(false);
                return;
            }

            console.log('已找到元素选择器，即将通过该选择器获取信息...');
            resolve(true);
        });
    }

    /**
     * 设置浏览器信息
     * 
     * @param {*} page 页面实例
     */
    async setUA(page) {
        const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/63.0.3239.84 Chrome/63.0.3239.84 Safari/537.36";
        return Promise.all([
            page.setUserAgent(UA),
            // 允许运行js
            page.setJavaScriptEnabled(true),
            // 设置页面视口的大小
            page.setViewport({ width: 1920, height: 1080 }),
        ]);
    }

    /**
     * 页面开启自动滚动，以获取尾部未加载的数据
     * 
     * @param {*} page 页面实例
     */
    async pageAutoScroll(page) {
        return page.evaluate(() => {
            return new Promise((resolve, reject) => {
                // 限制最大高度
                const MAX_HEIGHT = 100000;

                let totalHeight = 0;
                let distance = 100;    

                let timer = setInterval(() => {
                    let scrollHeight = document.body.scrollHeight;

                    // 滚动到指定位置
                    window.scrollBy(0, distance);

                    totalHeight += distance;
                    if (totalHeight > MAX_HEIGHT){
                        clearInterval(timer);
                        resolve({ code: 404100, msg: '高度超过 100000px ，无法获取数据' });
                    }
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve({ code: 200, msg: '滚屏截取数据成功' });
                    }
                }, 100);
            })
        });
    }
}

module.exports = SpiderService;