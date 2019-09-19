'use strict';

const Service = require('egg').Service;
const puppeteer = require('puppeteer');

// 路径操作对象
const path = require('path');

// 加密模块
const crypto = require('crypto');
// 时间处理
const moment = require('moment');

// 跳转等待时间
const timeout = 50000;
// 文档加载完才跳转页面
const waitUntil = 'domcontentloaded';

// 网站地址正则表达式
const regWebsite = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;

// 请求超时返回值
const RES_TIMEOUT = { code: 408 , msg: '请求超时，请重试'};
const RES_ACCESS_DENIED = { code: 404 , msg: '请求失败，无法访问该页面'};
const RES_SERVICE_ERROR = { code: 500 , msg: '服务器出错'};

class SpiderService extends Service {
    /**
     * 获取数据
     * @param {*} type 1.获取截图，2.获取pdf，3.获取页面数据，4.获取小说资源
     */
    async getData(type) {
        let res = RES_SERVICE_ERROR;

        // 获取参数
        const web = this.ctx.query.web;

        if (web && web != '') {
            if (!regWebsite.test(web)) {
                res = { code: 404 , msg: '网站格式不正确，请重新输入'};
            } else {
                switch (type) {
                    // 截图
                    case 1:
                        res = await this.getScreenshot(web);
                        break;
                    // PDF
                    case 2:
                        res = await this.getPDF(web);
                        break;
                    // 页面数据
                    case 3:
                        res = await this.getPageData(web);                    
                        break;
                    // 小说章节
                    case 4:
                        res = await this.getNovelSection(web);                       
                        break;
                    // 小说内容
                    case 5:
                        res = await this.getNovelContent(web);                       
                        break;
                    default:
                        res = { code: 404 , msg: 'type参数错误，请排查'};
                }
            }
        }
        else {
            res = { code: 404 , msg: '缺少web参数'};
        }

        return res;
    }

    /**
     * 设置浏览器信息
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
     * 页面滚动获取数据
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

    /**
     * 获取屏幕截图
     * @param {*} web 站点URL
     */
    async getScreenshot(web) {
        // 返回内容
        let res = RES_SERVICE_ERROR;

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
        const request = await page.goto(web, { timeout, waitUntil }).then(() => true).catch(() => false);

        if(request){
            const scrollRes = await this.pageAutoScroll(page);
            if(scrollRes.code == 200){
                // 获取页面标题
                const title = await page.title();
                const file = `${new Date().getTime() + crypto.createHash('md5').update(title).digest('hex')}.jpg`;
                // 对页面进行截图并保存
                const dir = await this.ctx.service.store.getStoreDir('screenshot');        
                await page.screenshot({ path: `${dir}/${file}`, fullPage: true });

                const data = await this.ctx.service.store.getFile(file, dir);
                res = { code: 200 , data, msg: '请求成功'};
            }
            else{
                res = scrollRes;
            }
        }
        else{
            res = RES_TIMEOUT; 
        }

        // 关闭浏览器
        await browser.close();

        return res;
    }

    /**
     * 获取PDF
     * 在Chrome浏览器下，需要无头浏览器设置，解决“PrintToPDF is not implemented”的问题
     * @param {*} web 站点URL
     */
    async getPDF(web) {
        // 返回内容
        let res = RES_SERVICE_ERROR;

        const browser = await puppeteer.launch();

        const page = await browser.newPage();
        const request = await page.goto(web, { timeout, waitUntil: 'networkidle0' }).then(() => true).catch(() => false);

        if(request){
            const title = await page.title();
            const file = `${new Date().getTime() + crypto.createHash('md5').update(title).digest('hex')}.pdf`;

            const dir = await this.ctx.service.store.getStoreDir('pdf');        
            await page.pdf({ path: `${dir}/${file}`, printBackground: true, width: '1920' });

            const data = await this.ctx.service.store.getFile(file, dir);
            res = { code: 200 , data, msg: '请求成功'}; 
        }
        else{
            res = RES_TIMEOUT; 
        }

        await browser.close();

        return res;              
    }

    /**
     * 获取页面数据
     * @param {*} web 站点URL
     */
    async getPageData(web) {
        const element = this.ctx.query.el;
        if(!element || element == ''){
            return { code: 404 , msg: '缺少el参数'};
        }

        // 返回内容
        let res = RES_SERVICE_ERROR;

        const browser = await puppeteer.launch();

        const page = await browser.newPage();

        // 设置浏览器信息
        await this.setUA(page);

        const request = await page.goto(web).then(() => true).catch(() => false);

        if(request){
            // 通过节点获取数据列表
            const data = await this.getSectionList(page, element);
            res = { code: 200 , data, msg: '请求成功'}; 
        }
        else{
            res = RES_TIMEOUT; 
        }

        await browser.close();

        return res;
    }

    /**
     * 通过浏览器获取章节列表
     * @param {*} page 页面实例
     * @param {*} element 节点元素
     */
    async getSectionList(page, element){
        return page.evaluate((element) => {
            const list = [...document.querySelectorAll(element)];
            return list.map(el => {
                return { url: el.href ? el.href.trim() : null, title: el.innerText ? el.innerText : '该节点元素无innerText属性' };
            })
        }, element);
    }

    /**
     * 获取小说章节列表
     * @param {*} web 站点URL
     */
    async getNovelSection(web) {
        const sectionEl = this.ctx.query.sectionEl;
        if(!sectionEl || sectionEl == ''){
            return { code: 404 , msg: '缺少sectionEl参数'};
        }

        // 返回内容
        let res = RES_SERVICE_ERROR;

        const browser = await puppeteer.launch();
        
        const page = await browser.newPage();

        // 设置浏览器信息
        await this.setUA(page);

        const request = await page.goto(web).then(() => true).catch(() => false);

        if(request){
            const title = await page.title();

            // 查询数据库是否已存在该记录，不存在则新增
            let sqlQuery = `SELECT * FROM T_Novel WHERE title = '${title}' OR url = '${web}'`;
            let sqlInsert = `INSERT INTO T_Novel (title, url, createTime) VALUES ('${title}', '${web}', '${moment().format('YYYY-MM-DD HH:mm:ss')}')`;
            let query = await this.ctx.service.sqliteDB.GetRecord(sqlQuery, sqlInsert, 'T_Novel');
            
            if(query.code == 200){
                const novelId = query.data[0].id;
                const list = await this.getSectionList(page, sectionEl);

                // 章节序号
                let sectionNo = 1;
                // 将章节列表存入数据库
                for(let el of list) {
                    const sqlQuery = `SELECT * FROM T_Content WHERE parentId = ${novelId} AND sectionTitle = '${el.title}' AND sectionNo = ${sectionNo}`;
                    const sqlInsert = `INSERT INTO T_Content (parentId, sectionTitle, sectionNo, url, createTime) VALUES (${novelId}, '${el.title}', ${sectionNo}, '${el.url}', '${moment().format('YYYY-MM-DD HH:mm:ss')}')`;
                    await this.ctx.service.sqliteDB.GetRecord(sqlQuery, sqlInsert, 'T_Content');

                    sectionNo ++;
                }

                res =  { code: 200 , data: list, msg: '请求成功'}; 
            }
            else{
                res = RES_SERVICE_ERROR; 
            }
        }
        else{
            res = RES_TIMEOUT; 
        }

        await browser.close();
        return res;
    }

    /**
     * 获取单一章节内容
     * @param {*} section 章节
     * @param {*} element 节点元素
     * @param {*} novelId 小说ID
     */
    async getOneSectionContent(section, element, novelId){

        // 判断章节是否包含内容
        let sqlQuery = `SELECT * FROM T_Content WHERE parentId = ${novelId} AND sectionNo = ${section.sectionNo}`;
        let query = await this.ctx.service.sqliteDB.SQLiteQuery(sqlQuery);

        if(query.code == 200 && query.data.length > 0){
            if(query.data[0].content && query.data[0].content != ''){
                // txt文本中，换行符使用：\r回车 \n换行
                // window中用 \r\n 
                // Linux中用 \n 
                // Mac中用 \r 
                return `${section.sectionTitle}\r\n\r\n${query.data[0].content}\r\n`;
            }
            else{
                const browser = await puppeteer.launch();
            
                const page = await browser.newPage();

                // 设置浏览器信息
                await this.setUA(page);

                // 跳转到网址
                const respond = await page.goto(section.url, { timeout, waitUntil }).catch(err => console.log(err));
                if (!respond) {   
                    browser.close();
                    return false;
                }

                // 等章节内容加载完
                // await page.waitForSelector('.readAreaBox');

                // 获取章节内容
                const content = await page.evaluate((element) => {
                    // '.readAreaBox > .p p:not([.copy])'
                    const list = [...document.querySelectorAll(element)];

                    let cot = '';
                    list.map(el => cot += `${el.innerText}\n`);

                    return cot;
                }, element);

                browser.close();

                // 更新内容
                sqlQuery = `UPDATE T_Content SET content = '${content}' WHERE parentId = ${novelId} AND sectionNo = ${section.sectionNo};`
                query = await this.ctx.service.sqliteDB.SQLiteQuery(sqlQuery);
               
                return `${section.sectionTitle}\r\n\r\n${content}\r\n`;
            }
        }
        else return false;
    }

    /**
     * 获取小说章节内容
     * @param {*} web 站点URL
     */
    async getNovelContent(web) {
        const contentEl = this.ctx.query.contentEl;
        if(!contentEl || contentEl == ''){
            return { code: 404 , msg: '缺少contentEl参数'};
        }

        // 返回内容
        let res = RES_SERVICE_ERROR;

        // 查询数据库是否已存在该小说
        let sqlQuery = `SELECT * FROM T_Novel WHERE url = '${web}'`;
        let query = await this.ctx.service.sqliteDB.SQLiteQuery(sqlQuery);
        
        if(query.code == 200){
            if(query.data.length > 0){
                // 记录小说ID
                const novelId = query.data[0].id;
                const title = query.data[0].title;

                // 查找是否已有此文件
                const dir = await this.ctx.service.store.getStoreDir('txt');
                const target = path.join(this.config.baseDir, `${dir}/`, `${title}.txt`);
                const isExists = await this.ctx.service.store.fileExists(target);

                // 文件存在则返回文件路径
                if(isExists){
                    // 只取public/upload/xxx路径
                    res =  { code: 200 , data: { list: [], url: `${dir.substring(4,dir.length)}/${title}.txt` }, msg: '请求成功，返回已存在的文件'}; 
                }
                else {
                    // 从数据库获取小说章节
                    sqlQuery = `SELECT * FROM T_Content WHERE parentId = ${novelId}`;
                    query = await this.ctx.service.sqliteDB.SQLiteQuery(sqlQuery);
            
                    if(query.code == 200){
                        const sectionList = query.data;

                        let list = [];
                        let text = '';

                        // 通过章节获取内容
                        for(let section of sectionList){
                            const content = await this.getOneSectionContent(section, contentEl, novelId);
                            if(content){
                                list.push(content);
                                text += content;
                            }
                            else{
                                return RES_ACCESS_DENIED;
                            }
                        }
                        // 获取下载地址
                        const url = await this.ctx.service.store.saveToTxt(`${title}.txt`, text);
                        
                        res =  { code: 200 , data: { list, url }, msg: '请求成功'}; 
                    }
                    else{
                        res = RES_SERVICE_ERROR; 
                    }
                }                
            }
            else{
                res =  { code: 404 , msg: '找不到该小说，请重新获取章节列表'}; 
            }
        }
        else{
            res = RES_SERVICE_ERROR; 
        }
        return res;
    }

    
}

module.exports = SpiderService;