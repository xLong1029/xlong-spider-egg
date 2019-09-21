/*
 * 功能 : 封装SQLite方法。
 * 作者 : 罗永梅（381612175@qq.com）
 * 日期 : 2019-9-19
 * 版本 : version 1.0
 */
const Service = require('egg').Service;

class SqliteDB_Service extends Service {
    /**
     * [建立SQLite查询]
     * 
     * 根据sql语句查询数据库，并返回记录集
     * 
     * @param {*} sql SQL查询语句
     */
    async SQLiteQuery(sql) {
        return new Promise((resolve, reject) => {
            // console.log('get sql:', sql);
            this.app.db.all(sql, (err, row) => {
                if(err) reject({ code: 404, data: [], msg: err }); 
                else resolve({ code: 200, data: row, msg: 'success' }); 
            });
        });
    }

    /**
     * [获取一条记录]
     * 
     * @param {*} sql SQL查询语句
     */
    async GetRecord(sql) {
        return new Promise((resolve, reject) => {
            this.SQLiteQuery(sql).then(res => {
                if(res.data.length > 0) resolve({ code: 200, data: res.data[0], msg: 'success'});
                else resolve({ code: 404, data: null, msg: 'fail'});
            }).catch(err => reject(err));
        });
    }

    /**
     * [获取记录条数]
     * 
     * @param {*} sql SQL查询语句，select count(*) 才可用
     */
    async GetQueryNum(sql) {
        return new Promise((resolve, reject) => {
            this.SQLiteQuery(sql).then(res => resolve({ code: 200, count: res.data[0]['count(*)'], msg: 'success'})).catch(err => reject(err));
        });
    }

    /**
     * [不存在则新增]
     * 查询记录是否存在，若不存在则新增，并返回该条记录
     * 
     * @param {*} sqlQuery SQL查询语句
     * @param {*} sqlInsert SQL新增语句
     * @param {*} tableName 表名
     */
    async NonExistentInsert(sqlQuery, sqlInsert, tableName) {
        return new Promise((resolve, reject) => {
            // 查询记录是否存在
            this.SQLiteQuery(sqlQuery).then(res => {
                if(res.code == 200){
                    // 若不存在，添加至数据库
                    if(res.data.length === 0){
                        this.Insert(sqlInsert, tableName).then(res => resolve(res)).catch(err => reject(err));
                    }
                    // 存在则返回该记录
                    else resolve({ code: 200, data: res.data[0], msg: 'success'});
                }
                else reject(res);
            }).catch(err => reject(err));
        });
    }

    /**
     * [插入一行记录]
     * 
     * 新增一行记录，并返回该条记录
     * 
     * @param {*} sql SQL查询语句
     * @param {*} tableName 表名
     */
    async Insert(sql, tableName) {
        return new Promise((resolve, reject) => {
            this.SQLiteQuery(sql).then(() => {
                // 插入成功并返回该记录
                this.SQLiteQuery(`SELECT * FROM ${tableName} WHERE rowid = last_insert_rowid()`).then(res => resolve({ code: 200, data: res.data[0], msg: 'success'})).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }
}

module.exports = SqliteDB_Service;