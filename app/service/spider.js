'use strict';

const Service = require('egg').Service;
const puppeteer = require('puppeteer');
// 文件操作对象
const fs = require('fs');
// 路径操作对象
const path = require('path');
// 加密模块
const crypto = require('crypto');


// 跳转等待时间
const timeout = 10000;
// 文档加载完才跳转页面
const waitUntil = 'domcontentloaded';

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

    // 读取路径信息 
    async getStat(path) {
        return new Promise((resolve, reject) => {
            fs.stat(path, (err, stats) => {
                if (err) resolve(false);
                else resolve(stats);
            })
        })
    }

    // 创建路径
    async mkdir(dir) {
        return new Promise((resolve, reject) => {
            fs.mkdir(dir, err => {
                if (err) resolve(false);
                else resolve(true);
            })
        })
    }

    // 路径是否存在，不存在则创建
    async dirExists(dir) {
        let isExists = await this.getStat(dir);
        // 如果该路径且不是文件，返回true
        if (isExists && isExists.isDirectory()) {
            return true;
        }
        // 如果该路径存在但是文件，返回false
        else if (isExists) {
            return false;
        }
        // 如果该路径不存在
        let tempDir = path.parse(dir).dir; // 拿到上级路径
        // 递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
        let status = await this.dirExists(tempDir);
        let mkdirStatus;
        if (status) {
            mkdirStatus = await this.mkdir(dir);
        }
        return mkdirStatus;
    }

    // 获取文件存储路径
    async getStoreDir(dir) {
        if (dir) {
            await this.dirExists(`app/public/upload/${dir}`);
            return `app/public/upload/${dir}`;
        } else {
            return 'app/public/upload';
        }
    }

    // 查找文件是否存在
    async fileExists(dir) {
        return new Promise((resolve, reject) => {
            // 判断文件是否存在
            fs.exists(dir, (exists) => {
                if(exists) resolve(true);
                else reject(false);
            });
        });
    }

    // 获取文件路径
    async getFile(fileName, dir) {
        if(!fileName || !dir) return null;

        // 找到存放的位置
        const target = path.join(this.config.baseDir, `${dir}/`, fileName);
        const isExists = await this.fileExists(target);

        // 文件存在则返回文件路径
        if(isExists){
            // 只取public/upload/xxx路径
            return `${dir.substring(4,dir.length)}/${fileName}`;
        }
        else return null;
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

    // 获取屏幕截图
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
        await page.goto(web, { timeout, waitUntil}).catch(err => { console.log(err) });

        const res = await this.pageAutoScroll(page);
        if(res.code == 200){
            // 获取页面标题
            const title = await page.title();
            const fileName = `${new Date().getTime() + crypto.createHash('md5').update(title).digest('hex')}.jpg`;
            // 对页面进行截图并保存
            const dir = await this.getStoreDir('screenshot');        
            await page.screenshot({ path: `${dir}/${fileName}`, fullPage: true });

            // 关闭浏览器
            await browser.close();

            const data = await this.getFile(fileName, dir);
            return { code: 200 , data, msg: '请求成功'};
        }
        else return res;
    }

    // 获取PDF
    // PDF在Chrome浏览器下，需要无头浏览器设置，解决“PrintToPDF is not implemented”的问题
    async getPDF(web) {
        const browser = await puppeteer.launch();

        const page = await browser.newPage();
        await page.goto(web, { timeout, waitUntil: 'networkidle0' }).catch(err => { console.log(err) });

        const title = await page.title();
        const fileName = `${new Date().getTime() + crypto.createHash('md5').update(title).digest('hex')}.pdf`;

        const dir = await this.getStoreDir('pdf');        
        await page.pdf({ path: `${dir}/${fileName}`, printBackground: true, width: '1920' });

        await browser.close();

        const data = await this.getFile(fileName, dir);
        return { code: 200 , data, msg: '请求成功'};        
    }

    // 获取信息
    async getInfo(web) {
        return 'info';
    }

}

module.exports = SpiderService;