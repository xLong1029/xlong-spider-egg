/*
 * 功能 : 通用方法
 * 作者 : 罗永梅（381612175@qq.com）
 * 日期 : 2019-09-17
 * 版本 : version 1.0
 */

var $alert = $('#alert');
var $loading = $('#loading');

// 显示弹窗
function showAlertMsg(type, msg){
    $alert.attr('class', `message message-show message--${type}`);
    $alert.find('.message__content').text(msg);

    setTimeout(function(){
        $alert.removeClass(`message-show`);
        $alert.find('.message__content').text('');
    }, 1500);
}

// 显示Loading
function showLoading(msg){
    var h = Math.max($(document.body).height(), $(window).height());
    $loading.height(h);
    $loading.find('.loading-spinner__text').text(msg);
    $loading.fadeIn();
}

// 隐藏Loading
function hideLoading(){
    $loading.find('.loading-spinner__text').text('');
    $loading.fadeOut();
}

// 设置默认图片
function defaultImg(){
    var img = event.srcElement;
    img.src = "/public/images/default.jpg"; 
    img.onerror = null;
}