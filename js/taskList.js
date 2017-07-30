	var require = require || window.parent.require;
	var fs = require('fs');
	var shell = require('electron').shell;
	var userName = $('.pf-user-name',window.parent.document).text();
	var datas = {};
	var userData = null;
    var config = null;
    
    Util.loadTaskFile(
		function(err,data){
			data && (datas = JSON.parse(data));
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
				data && (config = JSON.parse(data)[userName]);
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

					    var modjsPath = config.modjs+'/'+$('.in_dir').val()+'/1.0.x';
					    var scssPath = config.scss+'/'+$('.in_dir').val()+'/v1/css';
					    var htmlPath = config.style+'/'+$('.in_dir').val()+'/v1/tpl';

					    Util.createFile(modjsPath+'/index-debug.js','/*\ncreate by qf\ndate: '+new Date().toLocaleString()+'\n*/');
					    Util.createFile(htmlPath+'/index.html','/*\ncreate by qf\ndate: '+new Date().toLocaleString()+'\n*/');
					    Util.createFile(scssPath+'/index.scss','/*\ncreate by qf\ndate: '+new Date().toLocaleString()+'\n*/');
					    Util.mkdirs(config.style+'/'+$('.in_dir').val()+'/v1/css');
					    Util.mkdirs(config.style+'/'+$('.in_dir').val()+'/v1/img');
					    
				    	
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
					var index = $(dom).closest('tr').find('.num').data('index');
					var dir = $(dom).closest('tr').find('.dir').data('dir');
					toDels.push(userData.tasks[index]);
					Util.rmdirs(config.style+'/'+dir);
					Util.rmdirs(config.scss+'/'+dir);
					Util.rmdirs(config.modjs+'/'+dir);
				})
				for(var i=0;i<toDels.length;i++){
					userData.tasks.remove(toDels[i]);
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
					    Util.rename(config.style+'/'+oldTask.dir,config.style+'/'+data.task.dir);
					    console.log('rename',config.style+'/'+oldTask.dir,'->',config.style+'/'+data.task.dir);

						Util.rename(config.scss+'/'+oldTask.dir,config.scss+'/'+data.task.dir);
						console.log('rename',config.scss+'/'+oldTask.dir,'->',config.scss+'/'+data.task.dir);

						Util.rename(config.modjs+'/'+oldTask.dir,config.modjs+'/'+data.task.dir);
						console.log('rename',config.modjs+'/'+oldTask.dir,'->',config.modjs+'/'+data.task.dir);
				    	
				    	layer.close(index);
				    	initData();
					});
		    	}
	    	});
	    	$('.in_title').val(oldTask.title);
			$('.in_dir').val(oldTask.dir);
			$('.in_wiki').val(oldTask.wiki);
	    })
	    //打开
	    $('body').on('click', '.open li', function(){
	    	var dir = $(this).closest('tr').find('.dir').data('dir');
	    	var path = '';
	    	
	    	if($(this).hasClass('op_js')){
	    		path = config.modjs+'/'+dir+'/1.0.x/index-debug.js';
	    		openFile(path);
	    	}else if($(this).hasClass('op_cs')){
	    		path = config.style+'/'+dir+'/v1/css/index.css';
	    		openFile(path);
	    	}
	    	else if($(this).hasClass('op_sc')){
	    		path = config.scss+'/'+dir+'/v1/css/index.scss'
	    		openFile(path);
	    	}
	    	else if($(this).hasClass('op_html')){
	    		path = config.style+'/'+dir+'/v1/tpl/index.html';
	    		openFile(path);
	    	}
	    	else if($(this).hasClass('op_img')){
	    		shell.openItem(config.style+'/'+dir+'/v1/img');
	    	}
	    	//用编辑器打开文件
	    	function openFile(path){
	    		if(!config.openFileCmd){
	    			//如果没有配置命令，则用默认方式打开
	    			shell.openItem(path);
	    			return;
	    		}
	    		var cmd = config.openFileCmd.cmd;
	    		var args = config.openFileCmd.args;
	    		var cwd = config.openFileCmd.cwd;
	    		args = args?args.replace('{file}',path).replace('{dir}',dir).replace('{rootDir}',config.rootDir||''):path;
	    		args = args.indexOf(',')?args.split(','):[args];
	    		Util.spawn(cmd,args,cwd);
	    		addDir();
	    	}
	    	//将目录添加到编辑器
	    	function addDir(){
	    		if(!config.openDirCmd){
	    			//shell.openItem(config.rootDir);
	    			return;
	    		}
	    		var cmd = config.openDirCmd.cmd;
	    		var args = config.openDirCmd.args;
	    		var cwd = config.openDirCmd.cwd;
	    		args = args?args.replace('{file}',path).replace('{dir}',dir).replace('{rootDir}',config.rootDir||''):path;
	    		args = args.indexOf(',')?args.split(','):[args];
	    		Util.spawn(cmd,args,cwd);
	    	}
	    })
	    //命令
	    $('body').on('click', '.cmd li', function(){
	    	var dir = $(this).closest('tr').find('.dir').data('dir');
	    	if($(this).hasClass('watch_cmd')){
	    		spwan('watchCmd');
	    	}else if($(this).hasClass('build_cmd')){
	    		spwan('watchCmd');
	    	}
	    	function spwan(cmd_){
	    		if(!config[cmd_]){
	    			layer.open({
			    		title: '执行失败',
			    		content: '请先配置'+cmd_+'命令',
			    		btn:['确定']
			    	});
	    			return;
	    		}
	    		var cmd = config[cmd_].cmd;
	    		var args = config[cmd_].args;
	    		var cwd = config[cmd_].cwd;
	    		args = args?args.replace('{file}',path).replace('{dir}','').replace('{rootDir}',config.rootDir||''):'';
	    		args = args && (args.indexOf(',')?args.split(','):[args]);
	    		Util.spawn(cmd,args,cwd);
	    	}
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
			userData = datas[userName];
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
		if(userData != null){
			var tasks = userData.tasks;
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
		if(userData != null){
			var tasks = userData.tasks;
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