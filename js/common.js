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
globalDatas.configFilePath = "data/config.txt";
globalDatas.taskFilePath = "data/task.txt";

var Util = {
    	spawn : function(cmd,arg,cwd,$dom){
    		var workerProcess = child_process.spawn(cmd,arg||[],(cwd&&{cwd:cwd})||{});
    		var $openedCmd = null;
    		if($dom){
    			var msg = '<span>'+cwd + '> '+'</span>'+cmd;
    			$openedCmd = $dom.closest('.opened_cmd');
    			arg ? (msg = msg+arg.join(' ')+'<br/>'):(msg = msg+'<br/>');
    			$dom.append(msg.replace(/\r\n|\r|\n/g,'<br/>'));
    			$openedCmd.find('.wrap')[0].scrollIntoView(true);
    		}
			workerProcess.stdout.on('data',function (data) {
				var bufferHelper = new BufferHelper();
				var msg = iconv.decode(bufferHelper.concat(data).toBuffer(),'gbk');
				console.log(cmd+' stdout: ' +msg);
				if($dom){
					msg = msg+'<br/>';
					$dom.append(msg.replace(/\r\n|\r|\n/g,'<br/>'));
					$openedCmd.find('.wrap')[0].scrollIntoView(true);
					$openedCmd.find('.wrap').addClass('choke');
				}
			});
			workerProcess.stdout.on('end',function(){
				$openedCmd.find('.wrap').removeClass('choke');
			})
			workerProcess.stderr.on('data', function (data) {
				var bufferHelper = new BufferHelper();
				var msg = iconv.decode(bufferHelper.concat(data).toBuffer(),'gbk');
				console.log(cmd+' stderr: ' +msg);
				if($dom){
					msg = cwd+'> '+msg+'<br/>';
					$dom.append(msg.replace(/\r\n|\r|\n/g,'<br/>'));
					$dom.closest('.opened_cmd').find('input')[0].scrollIntoView(true)
				}
			});
			workerProcess.on('close', function (code) {
			    console.log('子进'+cmd+'程已退出，退出码 '+code);
			});
			workerProcess.on('exit', function (code) {
			    console.log('子进程'+cmd+'结束，结束码:'+code);
			});
			return workerProcess;
    	},
    	exec: function(cmd){
    		var workerProcess = child_process.exec(cmd,{encoding:'gbk'},function(error, stdout, stderr){
    			 if (error) {
				    console.error(cmd+' exec error:',error);
				    return;
				  }
				  console.log(cmd+' stdout:',stdout);
				  console.log(cmd+' stderr:',stderr);
    		});
    		workerProcess.on('close', function (code) {
			  console.log('子进'+cmd+'程已退出，退出码 '+code);
			});
			workerProcess.on('exit', function (code) {
			  console.log('子进程'+cmd+'结束，结束码:'+code);
			});
			return workerProcess;
    	}
    }