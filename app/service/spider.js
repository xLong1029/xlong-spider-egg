'use strict';

const Service = require('egg').Service;
const puppeteer = require('puppeteer');
// 文件操作对象
const fs = require('fs');
// 路径操作对象
const path = require('path');
// 加密模块
const crypto = require('crypto');

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

    // 获取屏幕截图
    async getScreenshot(web) {
        // 创建一个浏览器实例 Browser 对象
        const browser = await puppeteer.launch({
            defaultViewport: {width: 1920, height: 1080},
            ignoreHTTPSErrors: true,
        });
        // 创建页面 Page 对象
        const page = await browser.newPage();
        // 跳转到指定的页面
        await page.goto(web);
        
        // 获取页面标题
        const title = await page.title();
        const fileName = new Date().getTime() + crypto.createHash('md5').update(title).digest('hex') + '.jpeg';
        // 对页面进行截图并保存
        const dir = await this.getStoreDir('screenshot');        
        await page.screenshot({ path: `${dir}/${fileName}` });

        // 关闭浏览器
        await browser.close();

        return await this.getFile(fileName, dir);
    }

    // 获取PDF
    async getPDF(web) {
        // 创建一个浏览器实例 Browser 对象
        const browser = await puppeteer.launch({
            defaultViewport: {width: 1920, height: 1080},
            ignoreHTTPSErrors: true,
        });
        // 创建页面 Page 对象
        const page = await browser.newPage();
        // 跳转到指定的页面
        await page.goto(web);
        
        // 获取页面标题
        const title = await page.title();
        const fileName = new Date().getTime() + crypto.createHash('md5').update(title).digest('hex') + '.pdf';
        // 对页面进行截图并保存
        const dir = await this.getStoreDir('pdf');        
        await page.pdf({ path: `${dir}/${fileName}` });

        // 关闭浏览器
        await browser.close();

        return await this.getFile(fileName, dir);  
    }



    // 获取信息
    async getInfo(web) {
        return 'info';
    }

}

module.exports = SpiderService;