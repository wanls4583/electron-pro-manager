	var require = require || window.parent.require;
	var fs = require('fs');
	var shell = require('electron').shell;
	var userName = $('.pf-user-name',window.parent.document).text();
	var datas = {};
	var taskData = parent.taskData;
    var config = parent.config;
    var cmdData = parent.cmdData;
    var dicData = parent.dicData;

    Util.loadTaskFile(
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
		Util.loadConfigFile(
			function(err,data){
				data && data.length>4 && (config = parent.config = JSON.parse(data)[userName]);
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
			if(!config){
				layer.open({
		    		title: '错误',
		    		content: '请先配置目录',
		    		btn:['确定']
		    	});
		    	return;
			}
	    	layer.open({
	    		title: '添加任务',
	    		area:['750px'],
	    		content: $('#addTpl').html(),
	    		btn:['保存','取消'],
	    		yes:function(index, layero){
	    			Util.writeTaskFile(JSON.stringify(getAddData()), function(err) {
					    if(err) {
					        layer.open({
					    		title: '错误',
					    		content: ''+err,
					    		btn:['确定']
					    	});
					        return;
					    }
				    	layer.close(index);
				    	initData();
					});
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
					toDels.push(taskData.tasks[index]);
				})
				for(var i=0;i<toDels.length;i++){
					taskData.tasks.remove(toDels[i]);
				}
				Util.writeTaskFile(JSON.stringify(datas), function(err) {
				    if(err) {
				     	layer.open({
				    		title: '错误',
				    		content: ''+err,
				    		btn:['确定']
				    	});
				        return;
				    }
			    	initData();
				});	
				layer.close(index);
    		})
	    })
	    //修改任务
	    $('body').on('click', '.modify', function(){
	    	var oldTask = {};
	    	oldTask.dir = $(this).closest('tr').find('.dir').data('dir');
	    	oldTask.title = $(this).closest('tr').find('.title').data('title');
	    	oldTask.wiki = $(this).closest('tr').find('.wiki').data('wiki');
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
	    			var data = getModifyData(oldTask);
	    			Util.writeTaskFile(JSON.stringify(data.datas), function(err) {
				    	layer.close(index);
				    	initData();
					});
		    	}
	    	});
	    	$('.in_title').val(oldTask.title);
			$('.in_dir').val(oldTask.dir);
			$('.in_wiki').val(oldTask.wiki);
	    })
	    //打开命令面板
	    $('body').on('click', '.open_cmd', function(){
	    	var tpl = $('#cmdTpl');
	    	if(!cmdData){
	    		Util.loadCmdFile(function(err,data){
	    			data && data.length>4 && (cmdData = parent.cmdData = JSON.parse(data)[userName]);
	    			dicData && createCmdPanel();
	    		})
	    	}
	    	if(!dicData){
	    		Util.loadCmdFile(function(err,data){
	    			data && data.length>4 && (dicData = parent.dicData = JSON.parse(data)[userName]);
	    			cmdData && createCmdPanel();
	    		})
	    	}
	    	if(cmdData && dicData){
	    		createCmdPanel()
	    	}

	    	function createCmdPanel(){
	    		var cmdItemHtml = '<div class="button">i class="iconfont">&#xe628;</i><span class="button-label"></span></div>';
	    		var cmdItem = null;
	    		var html = '';
	    		for(var i=0; i<cmdData.cmds.length; i++){
	    			cmdItem = cmdData.cmds[i];
	    			html += '<div data-key="'+cmdItem.key+'" class="cmd button"><i class="iconfont">&#xe628;</i><span class="button-label">'+cmdItem.title+'</span></div>'
	    		}
	    		layer.open({
		    		title: '命令',
		    		area:['500px'],
		    		content: html,
		    		btn:['取消']
		    	});
	    	}
	    })
	    //命令
	    $('body').on('click', '.cmd', function(){
	    	var key = $(this).data('key');
	    	cmdData.cmds.forEach(function(item){
	    		if(item.key == key){
	    			try{
	    				eval(item.code.replace(/\\/g,'\\\\'));
	    				layer.close(layer.open())
	    			}catch(e){
	    				layer.open({
				    		title: '错误',
				    		content: e.message,
				    		btn:['确定']
				    	});
	    			}
	    			
	    		}
	    	})
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
	    //wiki
	    $('body').on('click','.wiki a',function(){
	    	var url = $(this).closest('.wiki').data('wiki');
	    	shell.openExternal(url);
	    })
	}

	function initData(){
		var html = $('#taskItem').html();
		if(datas[userName]){
			var tasks = datas[userName].tasks;
			taskData = parent.taskData = datas[userName];
			$('#taskList').html('');
			for(var j = 0; j < tasks.length; j++){
				var item = '';
				item = html.replace('<td class="num"></td>','<td data-index="'+j+'" class="num">'+(j+1)+'</td>');
				item = item.replace('<td class="title"></td>','<td data-title="'+tasks[j].title+'" class="title">'+tasks[j].title+'</td>');
				item = item.replace('<td class="dir"></td>','<td data-dir="'+tasks[j].dir+'" class="dir">'+tasks[j].dir+'</td>');
				item = item.replace('<td class="wiki"></td>','<td data-wiki="'+tasks[j].wiki+'" class="wiki"><a href="javascript:void(0)">'+tasks[j].wiki+'</a></td>');
				$('#taskList').append(item);
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
		var task = {};
		//是否存在该任务
		var existTask = false;
		//是否存在该用户的任务列表
		var existUser = false;
		task.title = $('.in_title').val()||'';
		task.dir = $('.in_dir').val()||'';
		task.wiki = $('.in_wiki').val()||''
		if(taskData != null){
			var tasks = taskData.tasks;
			for(var j = 0; j < tasks.length; j++){
				if(tasks[j].dir == task.dir){
					tasks[j].title = task.title;
					tasks[j].wiki = task.wiki;
					existTask = true;
					break;
				}
			}
			if(!existTask){
	    		tasks.push(task);
	    	}
		}else{
    		datas[userName] = {};
    		datas[userName].userName = userName;
    		datas[userName].tasks = [task];
		}
    	return datas;
	}
	function getModifyData(oldTask){
		var task = {};
		task.title = $('.in_title').val()||'';
		task.dir = $('.in_dir').val()||'';
		task.wiki = $('.in_wiki').val()||''
		if(taskData != null){
			var tasks = taskData.tasks;
			for(var j = 0; j < tasks.length; j++){
				if(tasks[j].dir == oldTask.dir){
					tasks[j].title = task.title;
					tasks[j].wiki = task.wiki;
					tasks[j].dir = task.dir;
					break;
				}
			}
		}
    	return {datas:datas,task:task};
	}
