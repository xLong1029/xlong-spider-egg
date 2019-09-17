'use strict';

const Service = require('egg').Service;

// 文件操作对象
const fs = require('fs');
// 路径操作对象
const path = require('path');

class StoreService extends Service {

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
}

module.exports = StoreService;