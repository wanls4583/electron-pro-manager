var require = require||window.parent.require;
var fs = require('fs');
var shell = require('electron').shell;
var userName = $('.pf-user-name',window.parent.document).text();
var datas = {};
var cmdData = parent.mainPlatform.cmdData;
var editor = null;
Util.loadCmdFile(
	function(err,data){
		data && data.length>4 && (datas = JSON.parse(data));
		console.log('datas',datas);
		initData();
		initEvt();
	},function(){
		initData();
    	initEvt();
	}
)

function initEvt(){
	setCompleteData(['spawn','createFile','mkdirs']);
	//添加任务
	$('body').on('click', '.add', function(){
    	layer.open({
    		title: '添加命令',
    		area:['750px'],
    		content: $('#addTpl').html(),
    		btn:['保存','取消'],
    		yes:function(index, layero){
    			Util.writeCmdFile(JSON.stringify(getAddData()),function(err) {
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
			    	Util.refreshNeedCmdWin();
				})
	    	}
    	});
    	editor = ace.edit("in_code");
	    editor.setTheme("ace/theme/clouds");
	    editor.session.setMode("ace/mode/javascript");
	    editor.setOptions({
	        enableBasicAutocompletion: true,
	        enableSnippets: true,
	        enableLiveAutocompletion: true
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
				toDels.push(cmdData.cmds[index]);
			});
			for(var i=0;i<toDels.length;i++){
				cmdData.cmds.remove(toDels[i]);
			}
			Util.writeCmdFile(JSON.stringify(datas),function(err) {
			    if(err){
			     	layer.open({
			    		title: '错误',
			    		content: ''+err,
			    		btn:['确定']
			    	});
			        return;
			    }
		    	initData();
		    	Util.refreshNeedCmdWin();
			});
			layer.close(index);
		})
    })
    //修改任务
    $('body').on('click', '.modify', function(){
    	var oldCmd = {};
    	oldCmd.key = $(this).closest('tr').find('.key').data('key');
    	oldCmd.title = $(this).closest('tr').find('.title').data('title');
    	oldCmd.code = $(this).closest('tr').find('.code').html();
    	layer.open({
    		title: '修改命令',
    		area:['750px'],
    		content: $('#addTpl').html(),
    		btn:['保存','取消'],
    		yes:function(index, layero){
    			Util.writeCmdFile(JSON.stringify(getModifyData(oldCmd)),function(err) {
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
			    	Util.refreshNeedCmdWin();
				});
	    	}
    	});
    	$('.in_title').val(oldCmd.title);
		$('.in_key').val(oldCmd.key);
		$('.in_code').html(oldCmd.code);
		editor = ace.edit("in_code");
	    editor.setTheme("ace/theme/clouds");
	    editor.session.setMode("ace/mode/javascript");
	    editor.setOptions({
	        enableBasicAutocompletion: true,
	        enableSnippets: true,
	        enableLiveAutocompletion: true
	    });
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
}
//设置自定义代码提示
function setCompleteData(data) {
    var langTools = ace.require("ace/ext/language_tools");
    langTools.addCompleter({
        getCompletions: function(editor, session, pos, prefix, callback) {
            if (prefix.length === 0) {
                return callback(null, []);
            } else {
                return callback(null, data);
            }
        }
    });
}
function initData(){
	var html = $('#cmdItem').html();
	if(datas[userName]){
		var cmds = datas[userName].cmds;
		cmdData = parent.mainPlatform.cmdData = datas[userName];
		$('#cmdList').html('');
		for(var j = 0; j < cmds.length; j++){
			var item = '';
			item = html.replace('<td class="num"></td>','<td data-index="'+j+'" class="num">'+(j+1)+'</td>');
			item = item.replace('<td class="title"></td>','<td data-title="'+cmds[j].title+'" class="title">'+cmds[j].title+'</td>');
			item = item.replace('<td class="code"></td>','<td class="code">'+cmds[j].code+'</td>');
			item = item.replace('<td class="key"></td>','<td data-key="'+cmds[j].key+'" class="key">'+cmds[j].key+'</td>');
			$('#cmdList').append(item);
			$('#cmdList').find('.code').last().data('code',cmds[j].code);
		}
		//代码高亮
		var highlight = ace.require("ace/ext/static_highlight")
	    var dom = ace.require("ace/lib/dom")
	    $('.code').each(function(index,dom){
			highlight(dom, {
	            mode: 'ace/mode/javascript',
	            theme: 'ace/theme/clouds',
	            // startLineNumber: 1,
	            // showGutter: true,
	            trim: true
	        });
	    })
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
	var cmd = {};
	//是否存在该任务
	var existCmd = false;
	//是否存在该用户的任务列表
	var existUser = false;
	cmd.title = $('.in_title').val()||'';
	cmd.key = $('.in_key').val()||'';
	cmd.code = editor.getValue()||''
	if(cmdData != null){
		var cmds = cmdData.cmds;
		for(var j = 0; j < cmds.length; j++){
			if(cmds[j].key == cmd.key){
				cmds[j].title = cmd.title;
				cmds[j].code = cmd.code;
				existCmd = true;
				break;
			}
		}
		if(!existCmd){
    		cmds.push(cmd);
    	}
	}else{
		datas[userName] = {};
		datas[userName].userName = userName;
		datas[userName].cmds = [cmd];
	}
	return datas;
}
function getModifyData(oldCmd){
	var cmd = {};
	cmd.title = $('.in_title').val()||'';
	cmd.key = $('.in_key').val()||'';
	cmd.code = editor.getValue()||''
	if(cmdData != null){
		var cmds = cmdData.cmds;
		for(var j = 0; j < cmds.length; j++){
			if(cmds[j].key == oldCmd.key){
				cmds[j].title = cmd.title;
				cmds[j].code = cmd.code;
				cmds[j].key = cmd.key;
				break;
			}
		}
	}
	return datas;
}
