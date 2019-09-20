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
const timeout = 120000;
// 文档加载完才跳转页面
const waitUntil = 'domcontentloaded';

// 分界线，默认使用txt文本中换行符
// window中用 \r\n 
// Linux中用 \n 
// Mac中用 \r 
const line= '\r\n';

// 请求超时返回值
const RES_TIMEOUT = { code: 504 , msg: '请求超时，请重试'};
const RES_ACCESS_DENIED = { code: 404 , msg: '请求失败，无法访问该页面'};
const RES_NO_SELECTER = { code: 404 , msg: '请求失败，无法通过该元素获取信息！请检查节点元素是否正确'};
const RES_SERVICE_ERROR = { code: 500 , msg: '服务器出错'};
const RES_DATABASE_ERROR = { code: 501 , msg: '数据库操作失败'};
const RES_PARAMETER_ERROR = { code: 400 , msg: '缺少参数或者参数无效'};

// 网站地址正则表达式
const regWebsite = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;

class SpiderService extends Service {
    /**
     * 获取数据
     * 
     * @param {*} type 1.获取截图，2.获取pdf，3.获取页面数据，4.获取小说资源
     */
    async getData(type) {
        // 获取参数
        const web = this.ctx.query.web;

        if(!web || web === '') return { code: 400 , msg: '缺少web参数'};

        if (!regWebsite.test(web)) return { code: 400 , msg: '网站格式不正确，请重新输入'};

        let res = RES_SERVICE_ERROR;
                
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
                res = await this.getNovelChapter(web);                       
                break;
            // 小说内容
            case 5:
                res = await this.getNovelContent(web);                       
                break;
            default:
                res = { code: 400 , msg: 'type参数错误，请排查'};
        }

        return res;
    }

    /**
     * 获取屏幕截图
     * 
     * @param {*} web 站点URL
     */
    async getScreenshot(web) {
        const browser = await this.ctx.service.browser.initBrowser({
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
        if(!browser) return RES_SERVICE_ERROR;

        const page = await this.ctx.service.browser.initPage(browser);
        if(!page) return RES_SERVICE_ERROR;

        const respond = await this.ctx.service.browser.gotoPage(browser, page, web, { timeout, waitUntil });
        if(!respond) return RES_ACCESS_DENIED;

        // 返回内容
        let res = RES_TIMEOUT;

        const scrollRes = await this.ctx.service.browser.pageAutoScroll(page);
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
        else res = scrollRes;

        // 关闭浏览器
        await this.ctx.service.browser.closeBrowser(browser);

        return res;
    }

    /**
     * 获取PDF
     * 在Chrome浏览器下，需要无头浏览器设置，解决“PrintToPDF is not implemented”的问题
     * 
     * @param {*} web 站点URL
     */
    async getPDF(web) {
        const browser = await this.ctx.service.browser.initBrowser();
        if(!browser) return RES_SERVICE_ERROR;

        const page = await this.ctx.service.browser.initPage(browser);
        if(!page) return RES_SERVICE_ERROR;

        const respond = await this.ctx.service.browser.gotoPage(browser, page, web,  { timeout, waitUntil: 'networkidle0' });
        if(!respond) return RES_ACCESS_DENIED;

        const title = await page.title();
        const file = `${new Date().getTime() + crypto.createHash('md5').update(title).digest('hex')}.pdf`;

        const dir = await this.ctx.service.store.getStoreDir('pdf');        
        await page.pdf({ path: `${dir}/${file}`, printBackground: true, width: '1920' });

        const data = await this.ctx.service.store.getFile(file, dir);

        await this.ctx.service.browser.closeBrowser(browser);

        return { code: 200 , data, msg: '请求成功'};              
    }

    /**
     * 获取页面节点数据
     * 
     * @param {*} web 站点URL
     */
    async getPageData(web) {
        const selecter = this.ctx.query.el;
        if(!selecter || selecter == '') return { code: 400 , msg: '缺少el参数'};

        const browser = await this.ctx.service.browser.initBrowser();
        if(!browser) return RES_SERVICE_ERROR;

        const page = await this.ctx.service.browser.initPage(browser);
        if(!page) return RES_SERVICE_ERROR;

        // 设置浏览器信息
        await this.ctx.service.browser.setUA(page);

        const respond = await this.ctx.service.browser.gotoPage(browser, page, web, { timeout, waitUntil });
        if(!respond) return RES_ACCESS_DENIED;

        const findSelecter = await this.ctx.service.browser.findSelector(browser, page, selecter);
        if(!findSelecter) return RES_NO_SELECTER;

        // 通过节点获取数据列表
        const data = await this.ctx.service.browser.getListBySelecter(page, selecter);
        
        console.log('信息已获取成功！');

        await this.ctx.service.browser.closeBrowser(browser);

        return { code: 200 , data, msg: '请求成功'};
    }

    /**
     * 获取小说章节列表
     * 
     * @param {*} web 站点URL
     */
    async getNovelChapter(web) {
        const chapterEl = this.ctx.query.chapterEl;
        if(!chapterEl || chapterEl == '') return { code: 400 , msg: '缺少chapterEl参数'};


        // const browser = await this.ctx.service.browser.initBrowser({
        //     headless: false,
        //     args: ['--no-sandbox','--proxy-server=http://182.88.164.61:8123']
        // });
        // return {code: 400, msg:'eee'};

        const browser = await this.ctx.service.browser.initBrowser();
        if(!browser) return RES_SERVICE_ERROR;

        const page = await this.ctx.service.browser.initPage(browser);
        if(!page) return RES_SERVICE_ERROR;

        await this.ctx.service.browser.setUA(page);

        const respond = await this.ctx.service.browser.gotoPage(browser, page, web, { timeout, waitUntil })
        if(!respond) return RES_ACCESS_DENIED;

        const findSelecter = await this.ctx.service.browser.findSelector(browser, page, chapterEl);
        if(!findSelecter) return RES_NO_SELECTER;

        // 获取页面标题
        const title = await page.title();

        // 查询数据库是否已存在该小说，不存在则新增
        let sqlQuery = `SELECT * FROM T_Novel WHERE title = '${title}' OR url = '${web}'`;
        let sqlInsert = `INSERT INTO T_Novel (title, url, createTime) VALUES ('${title}', '${web}', '${moment().format('YYYY-MM-DD HH:mm:ss')}')`;
        let query = await this.ctx.service.sqliteDB.GetRecord(sqlQuery, sqlInsert, 'T_Novel');

        if(query.code !== 200) return RES_DATABASE_ERROR;

        const list = await this.ctx.service.browser.getListBySelecter(page, chapterEl);

        const novelId = query.data[0].id;

        const save = await this.saveChapterList(list, novelId);
        if(!save) return RES_DATABASE_ERROR;

        await this.ctx.service.browser.closeBrowser(browser);
        return { code: 200 , data: list, msg: '请求成功'};
    }

    /**
     * 获取小说章节内容
     * @param {*} web 站点URL
     */
    async getNovelContent(web) {
        const contentEl = this.ctx.query.contentEl;
        if(!contentEl || contentEl == '') return { code: 404 , msg: '缺少contentEl参数'}; 

        // 查询数据库是否已存在该小说
        let sqlQuery = `SELECT * FROM T_Novel WHERE url = '${web}'`;
        let query = await this.ctx.service.sqliteDB.SQLiteQuery(sqlQuery);

        if(query.code !== 200) return RES_DATABASE_ERROR;
        if(query.data.length <= 0) return { code: 404 , msg: '找不到该小说，请重新获取章节列表'};

        // 记录小说ID
        const novelId = query.data[0].id;
        const title = query.data[0].title;

        // 查找是否已有此文件
        const dir = await this.ctx.service.store.getStoreDir('txt');
        const target = path.join(this.config.baseDir, `${dir}/`, `${title}.txt`);
        // 文件存在则返回文件路径
        const isExists = await this.ctx.service.store.fileExists(target);
        if(isExists) return { code: 200 , data: { list: [], url: `${dir.substring(4,dir.length)}/${title}.txt` }, msg: '请求成功，返回已存在的文件'};
        
        // 若文件不存在则从数据库获取小说章节和内容
        sqlQuery = `SELECT * FROM T_Content WHERE parentId = ${novelId}`;
        query = await this.ctx.service.sqliteDB.SQLiteQuery(sqlQuery);

        if(query.code !== 200 || query.data.length <= 0) return { code: 404 , msg: '找不到该小说章节列表，请重新获取章节列表'};

        const browser = await this.ctx.service.browser.initBrowser();
        if(!browser) return RES_SERVICE_ERROR;

        return await this.loopGetChapterContent(browser, query.data, contentEl, novelId, title, dir);
    }

    /**
     * 将数据列表存入数据库
     * 
     * @param {*} dataList 通过浏览器获取的数据列表
     * @param {*} novelId 小说ID
     */
    async saveChapterList(dataList, novelId){
        return new Promise(async (resolve, reject) => {
            console.log('开始获取章节列表：');

            // 章节序号
            let chapterNo = 1;

            for(let el of dataList) {
                try{
                    console.log(`正在获取章节《${el.title}》...`);
                    const sqlQuery = `SELECT * FROM T_Content WHERE parentId = ${novelId} AND chapterTitle = '${el.title}' AND chapterNo = ${chapterNo}`;
                    const sqlInsert = `INSERT INTO T_Content (parentId, chapterTitle, chapterNo, url, createTime) VALUES (${novelId}, '${el.title}', ${chapterNo}, '${el.url}', '${moment().format('YYYY-MM-DD HH:mm:ss')}')`;
                    await this.ctx.service.sqliteDB.GetRecord(sqlQuery, sqlInsert, 'T_Content');
                    
                    chapterNo ++;
                }
                catch(err){
                    console.log(err);
                    resolve(false);
                    return;
                }
            }

            console.log('章节列表已全部获取完成！');
            resolve(true);
        })
    }

    /**
     * 通过浏览器，获取单一章节内容
     * 
     * @param {*} browser 浏览器实例
     * @param {*} chapter 单一章节
     * @param {*} selecter 元素选择器
     * @param {*} novelId 小说ID
     */
    async getOneChapterContent(browser, chapter, selecter, novelId){
        return new Promise(async(resolve, reject) => {

            // 判断数据库中章节是否包含内容，若有内容则返回
            let sqlQuery = `SELECT * FROM T_Content WHERE parentId = ${novelId} AND chapterNo = ${chapter.chapterNo} AND contentIsNull = 0`;
            let query = await this.ctx.service.sqliteDB.SQLiteQuery(sqlQuery);
            if(query.code == 200 && query.data.length > 0){
                console.log(`记录已存在，即将从数据库读取《${chapter.chapterTitle}》的内容...`);
                resolve(chapter.chapterTitle + line + line + query.data[0].content + line);
                return;
            }

            console.log(`数据库无此记录，正在获取《${chapter.chapterTitle}》的内容...`);

            const page = await this.ctx.service.browser.initPage(browser);
            if(!page){
                resolve(false);
                return;
            }

            await this.ctx.service.browser.setUA(page);

            const respond = await this.ctx.service.browser.gotoPage(browser, page, chapter.url, { timeout, waitUntil })
            if(!respond){
                await this.ctx.service.browser.closeBrowser(browser);
                resolve(false);
                return;
            }

            // 等章节内容加载完
            // await page.waitForSelector('.readAreaBox');

            let content = '';

            // 获取章节内容
            content = await page.evaluate((selecter) => {
                // '.readAreaBox > .p p:not([.copy])'
                const list = [...document.querySelectorAll(selecter)];

                let cot = '';
                list.map(el => cot += `${el.innerText}\n`);

                return cot;
            }, selecter);
            
            if(!content || content == ''){
                page.close();
                resolve(false);
                return;
            }

            // 更新内容
            sqlQuery = `UPDATE T_Content SET content = '${content}', contentIsNull = 0 WHERE parentId = ${novelId} AND chapterNo = ${chapter.chapterNo} AND contentIsNull = 1;`
            query = await this.ctx.service.sqliteDB.SQLiteQuery(sqlQuery);

            await this.ctx.helper.sleep(1000);

            page.close();
            resolve(chapter.chapterTitle + line + line + content + line);
        });
    }

    /**
     * 循环获取章节内容
     * 
     * @param {*} browser 浏览器实例
     * @param {*} chapterList 章节列表
     * @param {*} contentEl 元素选择器
     * @param {*} novelId 小说ID
     * @param {*} title 小说名称
     * @param {*} dir 存储路径
     */
    async loopGetChapterContent(browser, chapterList, contentEl, novelId, title, dir){
        return new Promise(async(resolve, reject) => {
            console.log('开始获取章节内容：');

            const chapterLength = chapterList.length;
            let list = [];
            let text = '';

            let recordNum = 0;

            while(true) {
                const content = await this.getOneChapterContent(browser, chapterList[recordNum], contentEl, novelId);
                if(content){
                    list.push(content);
                    text += content;
    
                    recordNum ++;
                    await this.ctx.helper.sleep(2000);
                }

                if(recordNum < chapterLength){
                    continue;
                }
                else{
                    const url = await this.ctx.service.store.saveToTxt(dir, `${title}.txt`, text);
                    console.log('章节内容已全部获取完成！');
                    await this.ctx.service.browser.closeBrowser(browser);
                    resolve({ code: 200 , data: { list, url }, msg: '请求成功'});
                    break;
                }
            }
        });
    }
}

module.exports = SpiderService;