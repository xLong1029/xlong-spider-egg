'use strict';

const Service = require('egg').Service;
const puppeteer = require('puppeteer');

// 加密模块
const crypto = require('crypto');

// 跳转等待时间
const timeout = 20000;
// 文档加载完才跳转页面
const waitUntil = 'domcontentloaded';

class SpiderService extends Service {
    /**
     * 获取数据
     * @param {*} type 1获取截图，2获取pdf文件，3获取页面数据
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
                switch (type) {
                    case 1:
                        res = await this.getScreenshot(web);
                        break;
                    case 2:
                        res = await this.getPDF(web);
                        break;
                    case 3:
                        res = await this.getInfo(web);
                        break;
                    default:
                        res = { code: 404 , msg: 'type参数错误，请排查'};
                }

            }
        } else {
            res.code = 404;
            res.msg = '缺少参数';
        }

        return res;
    }

    // 页面滚动获取数据
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
    /**
     * 获取屏幕截图
     * @param {*} web 站点URL
     */
    async getScreenshot(web) {
        // 创建一个浏览器实例 Browser 对象
        const browser = await puppeteer.launch({
            defaultViewport: { width: 1920, height: 1080 }, // 默认视图大小
            ignoreHTTPSErrors: true, // 使用忽略 HTTPS 错误
            // 浏览器配置
            args: [
                '--no-sandbox',
                '--disable-infobars ', // 不显示信息栏
                '--window-size=1920,1080', // 窗体大小
                '--lang=zh-CN',
                '--disable-dev-shm-usage'
            ],
        });

        // 创建页面 Page 对象
        const page = await browser.newPage();
        // 跳转到指定的页面
        await page.goto(web, { timeout, waitUntil}).catch(err => console.log(err));

        const res = await this.pageAutoScroll(page);
        if(res.code == 200){
            // 获取页面标题
            const title = await page.title();
            const fileName = `${new Date().getTime() + crypto.createHash('md5').update(title).digest('hex')}.jpg`;
            // 对页面进行截图并保存
            const dir = await this.ctx.service.store.getStoreDir('screenshot');        
            await page.screenshot({ path: `${dir}/${fileName}`, fullPage: true });

            // 关闭浏览器
            await browser.close();

            const data = await this.ctx.service.store.getFile(fileName, dir);
            return { code: 200 , data, msg: '请求成功'};
        }
        else return res;
    }

    /**
     * 获取PDF
     * PDF在Chrome浏览器下，需要无头浏览器设置，解决“PrintToPDF is not implemented”的问题
     * @param {*} web 站点URL
     */
    async getPDF(web) {
        const browser = await puppeteer.launch();

        const page = await browser.newPage();
        await page.goto(web, { timeout, waitUntil: 'networkidle0' }).catch(err => console.log(err));

        const title = await page.title();
        const fileName = `${new Date().getTime() + crypto.createHash('md5').update(title).digest('hex')}.pdf`;

        const dir = await this.ctx.service.store.getStoreDir('pdf');        
        await page.pdf({ path: `${dir}/${fileName}`, printBackground: true, width: '1920' });

        await browser.close();

        const data = await this.ctx.service.store.getFile(fileName, dir);
        return { code: 200 , data, msg: '请求成功'};        
    }

    /**
     * 获取章节内容
     * @param {*} browser 浏览器实例
     * @param {*} element 章节元素
     */
    async getContent(browser, element){

    }

    /**
     * 获取信息
     * 这里需要根据个人对抓取的数据需求进行节点分析和代码修改
     * @param {*} web 站点URL
     */
    async getInfo(web) {
        const browser = await puppeteer.launch();

        const page = await browser.newPage();

        // 设置浏览器信息
        const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/63.0.3239.84 Chrome/63.0.3239.84 Safari/537.36";

        await Promise.all([
            page.setUserAgent(UA),
            // 允许运行js
            page.setJavaScriptEnabled(true),
            // 设置页面视口的大小
            page.setViewport({ width: 1920, height: 1080 }),
        ]);

        await page.goto(web);

        // 通过节点获取章节列表
        const sectionList = await page.evaluate(() => {
            const list = [...document.querySelectorAll('.Volume > dd a')];
            return list.map(el => {
                return { url: el.href.trim(), title: el.innerText };
            })
        })

        // console.log('章节列表：', sectionList);

        const data = [];

        // 通过章节获取内容
        for (let i = 0; i < sectionList.length; i ++) {
            const section = sectionList[i];

            //跳转到网址
            const respond = await page.goto(section.url, { timeout, waitUntil }).catch(err => console.log(err));
            if (!respond) {   
                browser.close();
                return { code: 404 , msg: '请求失败，无法访问该页面'};
            }

            // 等章节内容加载完
            await page.waitForSelector('.readAreaBox');

            // 获取章节内容
            const content = await page.evaluate(() => {
                const list = [...document.querySelectorAll('.readAreaBox > .p p')];

                let cot = '';
                list.map(el => cot += `${el.innerText}<br/>`);

                return cot;
            })

            data.push(`<h4>${section.title}</h4><br/>${content}<br/>`);
        }

        // console.log(data);
        return { code: 200 , data, msg: '请求成功'}; 
    }

}

module.exports = SpiderService;