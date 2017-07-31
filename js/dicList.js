var require = require||window.parent.require;
var fs = require('fs');
var shell = require('electron').shell;
var userName = $('.pf-user-name',window.parent.document).text();
var datas = {};
var dicData = parent.mainPlatform.dicData;
var config = parent.mainPlatform.config;


Util.loadDicFile(
	function(err,data){
		data && data.length>4 && (datas = JSON.parse(data));
		console.log('datas',datas);
		initData();
		initConfig();
	},function(){
		initData();
    	initConfig();
	}
)
function initConfig(){
	if(config){
		initEvt();
		return;
	}
	Util.loadConfigFile(
		function(err,data){
			data && data.length>4 && (config = parent.mainPlatform.config = JSON.parse(data)[userName]);
			console.log('config',config);
			initEvt();
		},
		function(){
			initEvt();
		}
	)
}

function initEvt(){
	//添加任务
	$('body').on('click', '.add', function(){
    	layer.open({
    		title: '添加字典',
    		area:['750px'],
    		content: $('#addTpl').html(),
    		btn:['保存','取消'],
    		yes:function(index, layero){
    			Util.writeDicFile(JSON.stringify(getAddData()),function(err) {
				    if(err){
				        layer.open({
				    		title: '错误',
				    		content: ''+err,
				    		btn:['确定']
				    	});
				        return;
				    }
			    	layer.close(index);
			    	initData();
			    	Util.refreshNeedDicWin();
				})
	    	}
    	});
    })
	//删除任务
    $('body').on('click', '.del',function(){
    	var delItems = $('.item_cb:checked');
		layer.confirm('您确定要删除吗？', {
          icon: 4,
		  title: '删除' //按钮
		}, function(index){
			var toDels = [];
			delItems.each(function(index,dom){
				index =  $(dom).closest('tr').find('.num').data('index');
				toDels.push(dicData.dics[index]);
			});
			for(var i=0;i<toDels.length;i++){
				dicData.dics.remove(toDels[i]);
			}
			Util.writeDicFile(JSON.stringify(datas),function(err) {
			    if(err){
			     	layer.open({
			    		title: '错误',
			    		content: ''+err,
			    		btn:['确定']
			    	});
			        return;
			    }
		    	initData();
		    	Util.refreshNeedDicWin();
			});
			layer.close(index);
		})
    })
    //修改任务
    $('body').on('click', '.modify', function(){
    	var oldDic = {};
    	oldDic.key = $(this).closest('tr').find('.key').data('key');
    	oldDic.title = $(this).closest('tr').find('.title').data('title');
    	oldDic.value = $(this).closest('tr').find('.value').data('value');
		if(!config){
			layer.open({
	    		title: '错误',
	    		content: '请先配置目录',
	    		btn:['确定']
	    	});
	    	return;
		}
    	layer.open({
    		title: '修改任务',
    		area:['750px'],
    		content: $('#addTpl').html(),
    		btn:['保存','取消'],
    		yes:function(index, layero){
    			Util.writeDicFile(JSON.stringify(getModifyData(oldDic)),function(err) {
    				if(err){
				     	layer.open({
				    		title: '错误',
				    		content: ''+err,
				    		btn:['确定']
				    	});
				        return;
				    }
			    	layer.close(index);
			    	initData();
			    	Util.refreshNeedDicWin();
				});
	    	}
    	});
    	$('.in_title').val(oldDic.title);
		$('.in_key').val(oldDic.key);
		$('.in_value').val(oldDic.value);
    })
    
    //全选
    $('body').on('click','.all_cb',function(){
    	if($('.all_cb').attr('checked')){
    		$('.item_cb').attr('checked',true);
    	}else{
    		$('.item_cb').attr('checked',false);
    	}
    })
    //单选
    $('body').on('click','.item_cb',function(){
    	if($('.item_cb').length == $('.item_cb:checked').length){
    		$('.all_cb').attr('checked',true);
    	}else{
    		$('.all_cb').attr('checked',false);
    	}
    })
    //value
    $('body').on('click','.value a',function(){
    	var url = $(this).closest('.value').data('value');
    	shell.openExternal(url);
    })
}

function initData(){
	var html = $('#dicItem').html();
	if(datas[userName]){
		var dics = datas[userName].dics;
		dicData = parent.mainPlatform.dicData = datas[userName];
		$('#dicList').html('');
		for(var j = 0; j < dics.length; j++){
			var item = '';
			item = html.replace('<td class="num"></td>','<td data-index="'+j+'" class="num">'+(j+1)+'</td>');
			item = item.replace('<td class="title"></td>','<td data-title="'+dics[j].title+'" class="title">'+dics[j].title+'</td>');
			item = item.replace('<td class="key"></td>','<td data-key="'+dics[j].key+'" class="key">'+dics[j].key+'</td>');
			item = item.replace('<td class="value"></td>','<td data-value="'+dics[j].value+'" class="value">'+dics[j].value+'</td>');
			$('#dicList').append(item);
		} 
	}
	checkBoxReset();
}

//checkbox检测
function checkBoxReset(){
	if($('.item_cb').length == $('.item_cb:checked').length){
		$('.all_cb').attr('checked',true);
	}else{
		$('.all_cb').attr('checked',false);
	}
}
function getAddData(){
	var dic = {};
	//是否存在该任务
	var existDic = false;
	//是否存在该用户的任务列表
	var existUser = false;
	dic.title = $('.in_title').val()||'';
	dic.key = $('.in_key').val()||'';
	dic.value = $('.in_value').val()||''
	if(dicData != null){
		var dics = dicData.dics;
		for(var j = 0; j < dics.length; j++){
			if(dics[j].key == dic.key){
				dics[j].title = dic.title;
				dics[j].value = dic.value;
				existDic = true;
				break;
			}
		}
		if(!existDic){
    		dics.push(dic);
    	}
	}else{
		datas[userName] = {};
		datas[userName].userName = userName;
		datas[userName].dics = [dic];
	}
	return datas;
}
function getModifyData(oldDic){
	var dic = {};
	dic.title = $('.in_title').val()||'';
	dic.key = $('.in_key').val()||'';
	dic.value = $('.in_value').val()||''
	if(dicData != null){
		var dics = dicData.dics;
		for(var j = 0; j < dics.length; j++){
			if(dics[j].key == oldDic.key){
				dics[j].title = dic.title;
				dics[j].value = dic.value;
				dics[j].key = dic.key;
				break;
			}
		}
	}
	return datas;
}
