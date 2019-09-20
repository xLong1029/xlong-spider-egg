'use strict';

const Service = require('egg').Service;

// 文件操作对象
const fs = require('fs');
// 路径操作对象
const path = require('path');

class StoreService extends Service {
    /**
     * 读取路径信息
     * 判断路径是否存在，不存在返回false
     * @param {*} path 路径地址
     */
    async getStat(path) {
        return new Promise(resolve => {
            fs.stat(path, (err, stats) => {
                err ? resolve(false) : resolve(stats);
            })
        })
    }

    /**
     * 根据dir创建路径
     * @param {*} dir 路径地址
     */
    async mkdir(dir) {
        return new Promise(resolve => {
            fs.mkdir(dir, err => {
                err ? resolve(false) : resolve(true);
            })
        })
    }

    /**
     * 根据路径地址，判断路径是否存在，不存在则创建
     * @param {*} dir 路径地址
     */
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

    /**
     * 根据配置的dir返回文件存储路径
     * @param {*} dir 路径地址
     */
    async getStoreDir(dir) {
        if (dir) {
            await this.dirExists(`app/public/upload/${dir}`);
            return `app/public/upload/${dir}`;
        } else {
            return 'app/public/upload';
        }
    }
 
    /**
     * 根据路径地址，判断文件是否存在
     * @param {*} dir 路径地址
     */
    async fileExists(dir) {
        return new Promise(resolve => {
            // 判断文件是否存在
            fs.exists(dir, exists => {
                exists ? resolve(true) : resolve(false);
            });
        });
    }

    /**
     * 返回文件存储路径
     * @param {*} file 文件名(包含后缀名)
     * @param {*} dir 路径地址
     */
    async getFile(file, dir) {
        if(!file || !dir) return null;

        // 找到存放的位置
        const target = path.join(this.config.baseDir, `${dir}/`, file);
        const isExists = await this.fileExists(target);

        // 文件存在则返回文件路径
        if(isExists){
            // 只取public/upload/xxx路径
            return `${dir.substring(4,dir.length)}/${file}`;
        }
        else return null;
    }

    /**
     * 存储为txt文件，并返回文件存储路径
     * @param {*} dir 路径地址
     * @param {*} file 文件(包含后缀名)
     * @param {*} content 文本内容
     */
    async saveToTxt(dir, file, content){
        if(!file || !content) return null;
        return new Promise((resolve, reject) => {
            // 写入文件
            fs.writeFile(`${dir}/${file}`, content, err => {
                err ? reject(err) : resolve(`${dir.substring(4,dir.length)}/${file}`);    
            });
        });
    }
}

module.exports = StoreService;