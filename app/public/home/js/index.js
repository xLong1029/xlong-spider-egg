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
var $chapterElement = $('#chapterElement');

var $chapterContent = $('#chapterContent');
var $chapterList = $('#chapterList');

var $getChapterCont = $('#getChapterCont');

// 获取小说章节
function getNovelSection(){
    $chapterContent.hide();
    $chapterList.empty();

    // 隐藏内容节点
    $getChapterCont.hide();
    $contentCont.hide();

    var value = $inputNovel.val();
    var chapter = $chapterElement.val();
    
    if(!value || value === ''){
        showAlertMsg('warning','请输入网址');
    }
    else if(!chapter || chapter === ''){
        showAlertMsg('warning','请输入章节节点');
    }
    else{
        console.log('开始获取数据');
        showLoading('正在获取数据，请稍后...');

        $.ajax({
            type:'GET',
            url: `/spider/4?web=${value}&chapterEl=${chapter}`,
            success: function(res) {
               console.log(res);

                if(res.code == 200){
                    console.log('数据获取结束');
                    hideLoading();

                    if(res.data && res.data.length > 0){
                        $chapterContent.show();
                        $getChapterCont.show();

                        var content = '';                                        
                        res.data.forEach((el, index) => {
                            content += el.url ? `<li><a href="${el.url}" target="blank">${index + 1}.${el.title}</a></li>` : `<li>${index + 1}.${el.title}</li>`;
                        });
                        $chapterList.append(content);

                        showAlertMsg('success','数据获取成功');
                    }
                    else{
                        $chapterContent.hide();
                        $getChapterCont.hide();
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

var $contentCont = $('#contentCont');
var $downloadBtn = $('#download');

// 获取通过章节获取小说内容
function getNovelContentBySection(){
    $chapterContent.hide();

    $contentCont.hide();

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
            url: `/spider/5?web=${value}&contentEl=${content}`,
            success: function(res) {
               console.log(res);

                if(res.code == 200){
                    console.log('数据获取结束');
                    hideLoading();

                    if(res.data.url){
                        $contentCont.show();
                        $downloadBtn.attr('href', res.data.url);

                        showAlertMsg('success','数据获取成功');
                    }
                    else{
                        $contentCont.hide();
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