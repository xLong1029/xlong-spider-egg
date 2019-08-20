'use strict';

const Service = require('egg').Service;

class IndexService extends Service {
    // 获取数据
    async getData() {
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
            if(!regWebsite.test(web)){
                res.code = 404;
                res.msg = '网站格式不正确，请重新输入';
            }
            else{
                res.code = 200;
                res.msg = '请求成功';
                res.data = '测试数据';
            }            
        } else {
            res.code = 404;
            res.msg = '缺少参数';
        }

        return res;
    }
}

module.exports = IndexService;