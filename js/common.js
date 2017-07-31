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
		init: function(){
			window.spawn = this.spawn;
			window.createFile = this.createFile;
			window.mkdirs = this.mkdirs;
		},
		replaceReturn : function(str){
			return str.replace(/\r\n|\r|\n/g,'<br/>')
		},
    	spawn : function(cmd,arg,cwd,$dom){
    		console.log(cmd,arg,cwd)
    		var self = this;
    		var resultCwd = '';
    		cwd = cwd && cwd.replace(/\\/g,'/').replace(/[\/]+$/,'');
    		//切换目录命令特殊处理
    		if(cmd=='cd'){
    			resultCwd = this.parsePathForWin32(cwd,arg);
    			$('.current_menu').find('.current').data('cwd',resultCwd);
    			$dom.closest('.opened_cmd').data('cwd',resultCwd);
    		}else if(cmd=='cd.'||cmd=='cd..'){
    			resultCwd = this.parsePathForWin32(cwd,[cmd.substr(2)]);
    			$('.current_menu').find('.current').data('cwd',resultCwd);
    			$dom.closest('.opened_cmd').data('cwd',resultCwd);
    		}else if(cmd=='debug'){
    			remote.getCurrentWindow().toggleDevTools();
    		}

    		
    		var $openedCmd = null;
    		var workerProcess = null;

    		if($dom){
    			var msg = '<span>'+cwd + '> '+'</span>'+cmd;
    			$openedCmd = $dom.closest('.opened_cmd');
    			arg ? (msg = msg+' '+arg.join(' ')+'<br/>'):(msg = msg+'<br/>');
    			$dom.append(self.replaceReturn(msg));
    			resultCwd && $openedCmd.find('.wrap').find('span').html(resultCwd+'> ')
    			&& $openedCmd.find('.wrap').find('input').css('padding-left',$openedCmd.find('.wrap').find('span').width()+'px');
    			$openedCmd.find('.wrap')[0].scrollIntoView(true);
    		}

    		if(cmd==='cd'||cmd==='cd.'||cmd==='cd..'||cmd=='debug'){
    			return;
    		}

    		workerProcess = child_process.spawn(cmd,arg||[],(cwd&&{cwd:cwd})||{});

    		workerProcess.on('error',function(){
				// self.exec(cmd+' '+(arg&&arg.join(' ')),$dom);
				var msg = '命令'+cmd+'执行失败';
				if($dom){
					msg = msg+'<br/>';
					$dom.append(self.replaceReturn(msg));
					$openedCmd.find('.wrap')[0].scrollIntoView(true);
					$openedCmd.find('.wrap').addClass('choke');
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
					$openedCmd.find('.wrap').addClass('choke');
					$openedCmd.find('.wrap').find('input').css('padding-left','0px');
				}
			});
			workerProcess.stdout.on('end',function(){
				if($dom){
					$openedCmd.find('.wrap').removeClass('choke');
					$openedCmd.find('.wrap').find('input').css('padding-left',$openedCmd.find('.wrap').find('span').width()+'px');
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
				}
			});
			workerProcess.on('close', function (code) {
			    console.log('spawn子进程'+cmd+'程已退出，退出码 '+code);
			});
			workerProcess.on('exit', function (code) {
			    console.log('spawn子进程'+cmd+'结束，结束码:'+code);
			});
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
    		//处理./和../
			if(arg[0].slice(0,3) == '..' || arg[0].slice(0,3) == '../'){
				var separator = cwd.lastIndexOf('/');
				resultCwd = arg[0].replace(/^(\.\.|\.\.\/)/,cwd.substring(0,separator))+'/'+arg[0].substr(arg[0].indexOf('../')!=-1?arg[0].indexOf('../')+3:arg.indexOf('..')+2);
			}else if(arg[0].slice(0,2) == './'||arg[0].slice(0,1) =='.'){
				resultCwd = arg[0].replace(/^(\.|\.\/)/,cwd)+'/'+arg[0].substr(arg.indexOf('./')!=-1?arg[0].indexOf('./')+2:arg[0].indexOf('.')+1);
			}else{
				resultCwd = cwd + '/' +arg[0];
			}
			resultCwd = resultCwd.replace(/[\/]+$/,'');
			return resultCwd;
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
		}
    }
    Util.init();
