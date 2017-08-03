layer && layer.config({
    extend: ['skin/osa/style.css'], //加载新皮肤
    skin: 'layer-ext-osa' //一旦设定，所有弹层风格都采用此主题。
});
Array.prototype.indexOf = function(val) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == val) return i;
	}
	return -1;
};
Array.prototype.remove = function(val) {
	var index = this.indexOf(val);
	if (index > -1) {
		this.splice(index, 1);
	}
};
var globalDatas = {};
var require = require||window.parent.require;
var child_process = require('child_process');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var remote = require('electron').remote
var dialog = remote.dialog;
var path = require("path"); 
var shell = require('electron').shell; 
var fs = require('fs');
globalDatas.configFilePath = "data/config.txt";
globalDatas.taskFilePath = "data/task.txt";
globalDatas.dicFilePath = "data/dic.txt";
globalDatas.cmdFilePath = 'data/cmd.txt';
var Util = {
	dicKeyMap: null,
	cmdKeyMap: null,
	currentTask: null,
	//初始化对外接口
	init:function(){
		var self = this;
		window.exec = function(cmdKey){
			var code = self.importCode(cmdKey);
			if(code && arguments.length==1){
				eval(code);
			}else
				self.spawn.apply(self,arguments);
		}
		window.createFile = function(){
			self.createFile.apply(self,arguments);
		}
		window.mkdirs = function(){
			self.mkdirs.apply(self,arguments);
		}
		window.getValue = function(){
			return self.getValue.apply(self,arguments);
		}
	},
	replaceReturn : function(str){
		return str.replace(/\r\n|\r|\n/g,'<br/>')
	},
	spawn : function(cmd,arg,cwd,$dom){
		console.log('spawn:',cmd,arg,cwd)
		var self = this;
		var resultCwd = '';
		
		if($dom===true){
			var menu = {
                cwd: cwd||window.process&&process.cwd()||parent.process&&parent.process.cwd(),
                title: '',
                icon: 'imgs/main/l03.png',
                href: 'open_cmd',
                isCurrent: true
            }
            // if(fs.existsSync(cmd)){
            // 	menu.cwd = cmd;
            // }else{
            // 	var index = cmd.lastIndexOf('\\');
            // 	index = index > cmd.lastIndexOf('/') ? index : cmd.lastIndexOf('/');
            // 	if(index>0 && fs.existsSync(cmd.substring(0,index))){
            // 		menu.cwd = cmd.substring(0,index);
            // 	}
            // }
			window.mainPlatform && mainPlatform.addMenu(menu) || parent.mainPlatform && parent.mainPlatform.addMenu(menu);
			$dom = $('.current_win',parent.document).find('.out');
			cwd = menu.cwd;
		}
		cwd = cwd && cwd.replace(/\\/g,'/').replace(/[\/]+$/,'');
		if(cwd && !fs.existsSync(cwd)){
	    	throw new Error('运行目录'+cwd+'不存在');
		}
		
		// 切换目录命令特殊处理
		if(cmd=='cd'){
			resultCwd = this.parsePathForWin32(cwd,arg[0]);
			if(resultCwd){
				$('.current_menu').find('.current').data('cwd',resultCwd);
				$dom.closest('.opened_cmd').data('cwd',resultCwd);
			}
			
		}else if(cmd=='cd.'||cmd=='cd..'){
			resultCwd = this.parsePathForWin32(cwd,cmd.substr(2));
			if(resultCwd){
				$('.current_menu').find('.current').data('cwd',resultCwd);
				$dom.closest('.opened_cmd').data('cwd',resultCwd);
			}
		}else if(cmd=='debug'){
			remote.getCurrentWindow().toggleDevTools();
		}else if(cmd=='exit'){
			var title = $('.current_win',parent.document).attr('title');
			this.exec('taskkill /F /T /pid '+parent.mainPlatform.process[title].pid);
			return;
		}

		
		var $openedCmd = null;
		var workerProcess = null;

		if($dom){
			var msg = '<span>'+cwd + '> '+'</span>'+cmd;
			$openedCmd = $dom.closest('.opened_cmd');
			arg ? (msg = msg+' '+arg.join(' ')+'<br/>'):(msg = msg+'<br/>');
			$dom.append(self.replaceReturn(msg));
			if(fs.existsSync(resultCwd)){
				resultCwd && $openedCmd.find('.wrap').find('span').html(resultCwd+'> ') && removeChoke();
			}
			$openedCmd.find('.wrap')[0].scrollIntoView(true);
			addChoke();
		}

		if(cmd==='cd'||cmd==='cd.'||cmd==='cd..'||cmd=='debug'){
			removeChoke();
			return;
		}
		//去除双引号和单引号，使用nodejs子进程不会有空格目录的情况
		for(var i=0 ;arg && i<arg.length; i++){
			arg[i] = arg[i].replace(/"([\s\S]*?)"/g,'$1').replace(/'([\s\S]*?)'/g,'$1');
		}

		workerProcess = child_process.spawn(cmd,arg||[],(cwd&&{cwd:cwd})||{});

		parent.mainPlatform.process[$('.current_win',parent.document).attr('title')] = workerProcess;

		workerProcess.on('error',function(){
			// self.exec(cmd+' '+(arg&&arg.join(' ')),$dom);
			var msg = '命令'+cmd+'执行失败';
			if($dom){
				msg = msg+'<br/>';
				$dom.append(self.replaceReturn(msg));
				$openedCmd.find('.wrap')[0].scrollIntoView(true);
				removeChoke();
			}
		})

		workerProcess.stdout.on('data',function (data) {
			var bufferHelper = new BufferHelper();
			var msg = iconv.decode(bufferHelper.concat(data).toBuffer(),'gbk');
			console.log(cmd+' stdout: ' +msg);
			if($dom){
				msg = msg+'<br/>';
				$dom.append(self.replaceReturn(msg));
				$openedCmd.find('.wrap')[0].scrollIntoView(true);
				addChoke();
			}
		});
		workerProcess.stdout.on('end',function(){
			if($dom){
				removeChoke();
			}
		})
		workerProcess.stderr.on('data', function (data) {
			var bufferHelper = new BufferHelper();
			var msg = iconv.decode(bufferHelper.concat(data).toBuffer(),'gbk');
			console.log(cmd+' stderr: ' +msg);
			if($dom){
				msg = cwd+'> '+msg+'<br/>';
				$dom.append(self.replaceReturn(msg));
				$dom.closest('.opened_cmd').find('input')[0].scrollIntoView(true);
				removeChoke();
			}
		});
		workerProcess.on('close', function (code) {
		    console.log('spawn子进程'+cmd+'程已退出，退出码 '+code);
		});
		workerProcess.on('exit', function (code) {
		    console.log('spawn子进程'+cmd+'结束，结束码:'+code);
		});
		function addChoke(){
			$openedCmd.find('.wrap').addClass('choke');
			$openedCmd.find('.wrap').find('input').css('padding-left','0px');
		}
		function removeChoke(){
			$openedCmd.find('.wrap').removeClass('choke');
			$openedCmd.find('.wrap').find('input').css('padding-left',$openedCmd.find('.wrap').find('span').width()+5+'px');
		}
		return workerProcess;
	},
	exec: function(cmd,$dom,cwd){
		var self = this;
		var workerProcess = child_process.exec(cmd,(cwd&&{cwd:cwd})||{},function(error, stdout, stderr){
			if (error) {
				appendMsg(cmd+'命令执行失败');
				return;
			}
			if(stdout){
				appendMsg(stdout);
			}
			if(stderr){
				appendMsg(stderr);
			}
			console.log(cmd+' stdout:',stdout);
			console.log(cmd+' stderr:',stderr);
			function appendMsg(msg){
				if($dom){
					var $openedCmd = $dom.closest('.opened_cmd');
					msg = msg+'<br/>';
					$dom.append(self.replaceReturn(msg));
					$openedCmd.find('.wrap')[0].scrollIntoView(true);
				}
			}
		});
		workerProcess.on('close', function (code) {
		  console.log('exec子进程'+cmd+'程已退出，退出码 '+code);
		});
		workerProcess.on('exit', function (code) {
		  console.log('exec子进程'+cmd+'结束，结束码:'+code);
		});
		return workerProcess;
	},
	parsePathForWin32: function(cwd,arg){
		var resultCwd = '';
		//去除引号
		arg = arg.replace(/"([\s\S]*?)"/g,'$1').replace(/'([\s\S]*?)'/g,'$1');
		//反斜杠换成斜杠，去除最后一个斜杠
		arg = arg.replace(/\\/g,'/').replace(/[\/]+$/,'');

		//处理./和../
		if(arg.slice(0,2) == '..' || arg.slice(0,3) == '../'){
			while(arg.slice(0,2) == '..' || arg.slice(0,3) == '../'){
				var separator = cwd.lastIndexOf('/');
				arg = arg.replace(/^(\.\.\/|\.\.)/,'');
				cwd = cwd.substring(0,separator);
			}
			resultCwd = cwd ? cwd+'/'+arg : '';
		}else if(arg.slice(0,1) == '.' || arg.slice(0,2) == './'){
			while(arg.slice(0,1) == '.' || arg.slice(0,2) == './'){
				arg = arg.replace(/^(\.\/|\.)/,'');
			}
			resultCwd = cwd + '/' +arg;
		}else if(fs.existsSync(cwd + '/' +arg)) {
			resultCwd = cwd + '/' +arg;
		}else{
			resultCwd = arg;
		}

		resultCwd = resultCwd.replace(/\\/g,'/').replace(/[\/]+$/,'');

		if(fs.existsSync(resultCwd) && fs.statSync(resultCwd).isDirectory())
			return resultCwd;
		else
			return '';
	},
	//创建文件
	createFile: function (filePath,content,fn){
		var This = this;
		fs.exists(filePath, function(exists) { 
			if(!exists){
				This.mkdirs(path.dirname(filePath),function(){
					This.writeFile(filePath, function(err) {
					    if(err) {
					     	layer.open({
					    		title: '创建失败',
					    		content: ''+err,
					    		btn:['确定']
					    	});
					        return;
					    }
					    if(typeof fn === 'function'){
					    	fn();
					    }
					});	
				});
			}
		})
		
	},
	//创建目录
	mkdirs :function (dirname,callback) {
		var This = this;
		fs.exists(dirname,function(exists){
			if(!exists) {
		    	This.mkdirs(path.dirname(dirname),function(){
		    		fs.mkdir(dirname,function(){
		    			console.log('mk dir',dirname);
		    			typeof callback=== 'function' && callback();
		    		});  
		    	});
		    }else{
		    	typeof callback=== 'function' && callback();
		    }
		});
		
	},
	//删除目录 
	rmdirs :function(dirname,callback) {
		var This = this;
		fs.exists(dirname,function(exists){
			if (!exists) {
				return;
			}else{
				fs.stat(dirname,function(err, stat){
					if(stat && stat.isDirectory()){
				    	fs.readdir(dirname,function(err, arr){
				    		if(arr.length>0){
					    		for(var i=0; i<arr.length; i++){
						    		arr[i] = dirname+'/'+arr[i];
						    		(function(num){
						    			This.rmdirs(arr[num],function(){
					    					if(num==arr.length-1){
						    					console.log('rm dir',dirname);
												fs.rmdir(dirname,callback);
						    				}
						    			});
						    		})(i)	
						    	}
					    	}else{
					    		console.log('rm dir',dirname);
								fs.rmdir(dirname,callback);
					    	}
				    	});
						
				    }else if(stat.isFile()){
				    	console.log('rm file',dirname);
				    	fs.unlink(dirname,function(){
				    		typeof callback==='function' && callback();
				    	});
				    }
				});
			    
			}
		});		
	},
	rename: function(oldname,newname){
		this.exec('ren '+oldname+' '+newname);
	},
	loadFile: function(path,callback1,callback2){
		var This = this;
		fs.exists(path, function(exists) {
			if(exists){
				typeof callback1 ==='function' && This.readFile(path,callback1);
			}else{
				typeof callback2 ==='function' && callback2(exists);
			} 
		}); 
	},
	loadTaskFile : function(callback1,callback2){
		this.loadFile(globalDatas.taskFilePath,callback1,callback2);
	},
	loadConfigFile: function(callback1,callback2){
		this.loadFile(globalDatas.configFilePath,callback1,callback2);
	},
	loadDicFile: function(callback1,callback2){
		this.loadFile(globalDatas.dicFilePath,callback1,callback2);
	},
	loadCmdFile: function(callback1,callback2){
		this.loadFile(globalDatas.cmdFilePath,callback1,callback2);
	},
	readFile: function(path,callback){
		fs.readFile(path,function(err,data){
			typeof callback ==='function' && callback(err,data);
		})
	},
	writeFile: function(path,data,callback){
		fs.writeFile(path, data, function(err){
			typeof callback ==='function' && callback(err);
		});
	},
	writeDicFile: function(data,callback){
		this.writeFile(globalDatas.dicFilePath,data,callback);
	},
	writeTaskFile: function(data,callback){
		this.writeFile(globalDatas.taskFilePath,data,callback);
	},
	writeCmdFile: function(data,callback){
		this.writeFile(globalDatas.cmdFilePath,data,callback);
	},
	refreshNeedCmdWin: function(){
		$('.need_cmd',parent.document).each(function(index,item){
			item.contentWindow.location.reload(true);
		})
		
	},
	refreshNeedDicWin: function(){
		$('.need_dic',parent.document).each(function(index,item){
			item.contentWindow.location.reload(true);
		})
	},
	getValue: function(key){
		if(!this.dicKeyMap){
			this.dicKeyMap = {};
			parent.mainPlatform.dicData.dics.forEach(function(item){
				this.dicKeyMap[item.key] = item.value;
			})
			for(key1 in this.dicKeyMap){
				for(key2 in this.dicKeyMap){
					if(this.dicKeyMap[key1].indexOf('{'+key2+'}')!=-1 && this.dicKeyMap[key2].indexOf('{'+key1+'}')==-1){
						this.dicKeyMap[key1] = this.dicKeyMap[key1].replace('{'+key2+'}',this.dicKeyMap[key2]);
					}
				}
			}
		}
		var value = '';
		var matche = key.match(/task\.([\s\S])+?/);
		if(matche){
			value = this.currentTask[matche[1]];
		}else if(this.dicKeyMap[key]){
			value = this.dicKeyMap[key];
		}else{
			throw new Error('字典:'+key+' 不存在');
		}
		return value;
	},
	importCode: function(key){
		if(!this.cmdKeyMap){
			this.cmdKeyMap = {};
			parent.mainPlatform.cmdData.cmds.forEach(function(item){
				this.cmdKeyMap[item.key] = item.code;
			})
		}
		if(!this.cmdKeyMap[key]){
			return false;
		}
		return this.cmdKeyMap[key].replace(/\\/g,'\\\\');
	}
}
Util.init();
