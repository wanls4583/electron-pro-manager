var require = require||window.parent.require;
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var remote = require('electron').remote
var dialog = remote.dialog;
var path = require("path"); 
var shell = require('electron').shell; 
var fs = require('fs');
var globalDatas = remote.getGlobal('datas');
var ipcRenderer = require('electron').ipcRenderer;
var Util = {
	init: function(){
		//初始化弹框皮肤
		layer && layer.config({
		    extend: ['skin/osa/style.css'], //加载新皮肤
		    skin: 'layer-ext-osa' //一旦设定，所有弹层风格都采用此主题。
		});
		//初始化数组函数
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
		this.initApi();
	},
	//初始化对外接口
	initApi:function(){
		var self = this;
		window.exec = function(){
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
		window.msgTip = function(){
			self.msgTip.apply(self,arguments);
		}
	},
	replaceReturn : function(str){
		return str.replace(/\r\n|\r|\n/g,'<br/>')
	},
	spawn : function(cmd,arg,cwd,$dom){
		ipcRenderer.send('spawn',[cmd,arg,cwd,$dom]);
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
		var exists = fs.existsSync(path.dirname(filePath));

		if(!exists){
			This.mkdirs(path.dirname(filePath),function(){
				writeContnet(content);
			});
		}else{
			// writeContnet(content);
		}

		function writeContnet(content){
			if(fs.existsSync(content) && fs.statSync(content).isFile()){
				This.loadFile(content,function(err,data){
					if(err){
						This.msgTip('创建失败',err)
						return;
					}
					This.writeFile(filePath,data, function(err) {
					    if(err) {
					     	This.msgTip('创建失败',err)
					        return;
					    }
					    if(typeof fn === 'function'){
					    	console.log('new file:'+filePath);
					    	fn();
					    }
					});	
				})
			}else{
				This.writeFile(filePath,content, function(err) {
				    if(err) {
				     	This.msgTip('创建失败',err)
				        return;
				    }
				    if(typeof fn === 'function'){
				    	console.log('new file:'+filePath);
				    	fn();
				    }
				});	
			}
			
		}
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
		
		this.parseCmd();
		
		ipcRenderer.send('refresh-need-cmd-win');
	},
	refreshNeedDicWin: function(){

		this.parseDic();
		
		ipcRenderer.send('refresh-need-dic-win');
	},
	parseDic: function(){
		
        globalDatas.dicKeyMap = {};
        globalDatas.dicData.dics.forEach(function(item){
            globalDatas.dicKeyMap[item.key] = item.value;
        })

    },
    parseCmd: function(){

        globalDatas.cmdKeyMap = {};
        globalDatas.cmdData.cmds.forEach(function(item){
            globalDatas.cmdKeyMap[item.key] = item.code;
        })

    },
	msgTip:function(title,err){
		layer.open({
    		title: title,
    		content: ''+err,
    		btn:['确定']
    	});
	},
	getValue: function(key){
		var value = '';
		var matche = key.match(/task\.([\s\S]+)/);
		if(matche){
			value = globalDatas.currentTask[matche[1]];
		}else if(globalDatas.dicKeyMap[key]){
			for(key1 in globalDatas.dicKeyMap){
				if(globalDatas.dicKeyMap[key].indexOf('{'+key1+'}')!=-1 && globalDatas.dicKeyMap[key1].indexOf('{'+key+'}')==-1){
					globalDatas.dicKeyMap[key] = globalDatas.dicKeyMap[key].replace('{'+key1+'}',globalDatas.dicKeyMap[key1]);
				}
			}
			value = globalDatas.dicKeyMap[key];
		}else{
			throw new Error('字典:'+key+' 不存在');
		}
		return value;
	}
}
Util.init();
