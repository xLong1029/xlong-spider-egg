/*
 * 功能 : 通用方法
 * 作者 : 罗永梅（381612175@qq.com）
 * 日期 : 2019-09-17
 * 版本 : version 1.0
 */

// 设置默认图片
function defaultImg(){
    var img = event.srcElement;
    img.src = "/public/images/default.jpg"; 
    img.onerror = null
}

// 设置默认图片
function showAlertMsg(type, msg){
    var $alert = $('#alert');
    
    $alert.attr('class', `message message-show message--${type}`);
    $alert.find('.message__content').text(msg);

    setTimeout(function(){
        $alert.removeClass(`message-show`);
        $alert.find('.message__content').text('');
    }, 1000);
}