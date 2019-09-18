/*
 * 功能 : 首页方法
 * 作者 : 罗永梅（381612175@qq.com）
 * 日期 : 2019-09-18
 * 版本 : version 1.0
 */

var $inputImg = $('#inputImg');
var $inputPdf = $('#inputPdf');

// 获取截图或PDF
function getImgOrPdf(type){
    var value = '';
    switch(type){
        case 1: value = $inputImg.val(); break;
        case 2: value = $inputPdf.val(); break;
        default: console.log('获取数据传参类型不正确'); return false;
    }

    if(!value || value === ''){
        showAlertMsg('warning','请输入网址');
    }
    else{
        console.log('开始获取数据');
        showLoading('正在获取数据，请稍后...');
        
        $.ajax({
            type:'GET',
            url: `/spider/${type}?web=${value}`,
            success: function(res) {
                console.log(res);
                hideLoading();

                if(res.code == 200){
                    window.open(res.data);
                    showAlertMsg('success','数据获取成功');
                }
                else{                    
                    showAlertMsg('error', res.msg);
                }
            },
            error: function(err){
               console.log('数据获取出错:', err);
            }
        });
    }
}

// 重置输入框
function reset(e){
    e.val('');
}

var $inputData = $('#inputData');
var $inputElement = $('#inputElement');

var $dataContent = $('#dataContent');
var $dataList = $('#dataList');

// 获取页面数据
function getPageData(){    
    $dataContent.hide();
    $dataList.empty();

    var value = $inputData.val();
    var element = $inputElement.val();
    
    if(!value || value === ''){
        showAlertMsg('warning','请输入网址');
    }
    else if(!element || element === ''){
        showAlertMsg('warning','请输入节点元素');
    }
    else{
        console.log('开始获取数据');
        showLoading('正在获取数据，请稍后...');

        $.ajax({
            type:'GET',
            url: `/spider/3?web=${value}&el=${element}`,
            success: function(res) {
               console.log(res);

                if(res.code == 200){
                    console.log('数据获取结束');
                    hideLoading();

                    if(res.data && res.data.length > 0){
                        $dataContent.show();
                        var content = '';                                        
                        res.data.forEach(el => {
                            content += el.url ? `<li><a href="${el.url}" target="blank">${el.title}</a></li>` : `<li>${el.title}</li>`;
                        });
                        $dataList.append(content);
                        // $dataList.append(res.data);
                        showAlertMsg('success','数据获取成功');
                    }
                    else{
                        showAlertMsg('warning','数据为空，请检查获取的数据网址是否正确');
                    }                    
                }
                else{
                    hideLoading();
                    showAlertMsg('error', res.msg);
                }
            },
            error: function(err){
               console.log('数据获取出错:', err);
            }
        });
    }
}

// 重置获取页面数据
function resetPageData(){
    $inputData.val('');
    $inputElement.val('');

    $dataList.empty();
    $dataContent.hide();
}

var $inputNovel = $('#inputNovel');
var $sectionElement = $('#sectionElement');

var $seticonContent = $('#seticonContent');
var $sectionList = $('#sectionList');

var $getSectionCont = $('#getSectionCont');

// 获取小说章节
function getNovelSection(){
    $seticonContent.hide();
    $sectionList.empty();

    // 隐藏内容节点
    $getSectionCont.hide();

    var value = $inputNovel.val();
    var section = $sectionElement.val();
    
    if(!value || value === ''){
        showAlertMsg('warning','请输入网址');
    }
    else if(!section || section === ''){
        showAlertMsg('warning','请输入章节节点');
    }
    else{
        console.log('开始获取数据');
        showLoading('正在获取数据，请稍后...');

        $.ajax({
            type:'GET',
            url: `/spider/4?web=${value}&sectionEl=${section}`,
            success: function(res) {
               console.log(res);

                if(res.code == 200){
                    console.log('数据获取结束');
                    hideLoading();

                    if(res.data && res.data.length > 0){
                        $seticonContent.show();
                        $getSectionCont.show();

                        var content = '';                                        
                        res.data.forEach((el, index) => {
                            content += el.url ? `<li><a href="${el.url}" target="blank">${index + 1}.${el.title}</a></li>` : `<li>${index + 1}.${el.title}</li>`;
                        });
                        $sectionList.append(content);

                        showAlertMsg('success','数据获取成功');
                    }
                    else{
                        showAlertMsg('warning','数据为空，请检查获取的数据网址是否正确');
                    }                    
                }
                else{
                    hideLoading();
                    showAlertMsg('error', res.msg);
                }
            },
            error: function(err){
               console.log('数据获取出错:', err);
            }
        });
    }
}

var $contentElement = $('#contentElement');

var $setcionStart = $('#setcionStart');
var $setcionEnd = $('#setcionEnd');

var $contentCont = $('#contentCont');
var $contentList = $('#contentList');

// 获取通过章节获取小说内容
function getNovelContentBySection(){
    $seticonContent.hide();
    $sectionList.empty();

    $contentCont.hide();
    $contentList.empty();

    var value = $inputNovel.val();
    var content = $contentElement.val();

    if(!value || value === ''){
        showAlertMsg('warning','请输入网址');
    }
    else if(!content || content === ''){
        showAlertMsg('warning','请输入内容节点');
    }
    else{
        console.log('开始获取数据');
        showLoading('正在获取数据，请稍后...');

        $.ajax({
            type:'GET',
            url: `/spider/4?web=${value}&contentEl=${content}`,
            success: function(res) {
               console.log(res);

                if(res.code == 200){
                    console.log('数据获取结束');
                    hideLoading();

                    if(res.data && res.data.length > 0){
                        $contentCont.show();

                        showAlertMsg('success','数据获取成功');
                    }
                    else{
                        showAlertMsg('warning','数据为空，请检查获取的数据网址是否正确');
                    }                    
                }
                else{
                    hideLoading();
                    showAlertMsg('error', res.msg);
                }
            },
            error: function(err){
               console.log('数据获取出错:', err);
            }
        });
    }
}

// 下载资源
function download(){

}