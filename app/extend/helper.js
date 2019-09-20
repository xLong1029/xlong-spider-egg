
/*
 * 功能 : 封装一些常用方法
 * 作者 : 罗永梅（381612175@qq.com）
 * 日期 : 2019-9-20
 * 版本 : version 1.1
 */

module.exports = {
    /**
     * 休眠时间
     *
     * @param {number} [time=0]
     * @returns
     */
    sleep(time = 0) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, time);
        })
    }
};