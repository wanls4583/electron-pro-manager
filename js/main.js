var remote = require('electron').remote;
var Menu = remote.Menu;
var MenuItem = remote.MenuItem;
var globalDatas = remote.getGlobal('datas');
var ipcRenderer = require('electron').ipcRenderer;
var child_process = require('child_process');

var mainPlatform = {
    menus: [],
	init: function(){

        var self = this;
        var userName = $('.pf-user-name').text();
        globalDatas['userName'] = userName;
        globalDatas['openedWin'] = {};
        globalDatas['process'] = {};
        this.loadDicFile(function(err,data){
            data && data.length>4 && (globalDatas.dicDatas = JSON.parse(data)) && (globalDatas.dicData = globalDatas.dicDatas[userName]);
            Util.parseDic();
            loadDone();
        });
        this.loadTaskFile(function(err,data){
            data && data.length>4 && (globalDatas.taskDatas = JSON.parse(data)) && (globalDatas.taskData = globalDatas.taskDatas[userName]);
            loadDone();
        });
        this.loadCmdFile(function(err,data){
            data && data.length>4 && (globalDatas.cmdDatas = JSON.parse(data)) && (globalDatas.cmdData = globalDatas.cmdDatas[userName]);
            Util.parseCmd();
            loadDone();
        });
        function loadDone(){
            if(globalDatas.dicDatas && globalDatas.taskDatas && globalDatas.cmdDatas){
                self.bindEvent();
                self.render(menu['home']);
                self.initIpc();
            }
        }

	},
    initIpc: function(){
        var self = this;
        ipcRenderer.on('do-spawn', function(event, arg) {
            self.spawn.apply(self,arg);
        });
        ipcRenderer.on('do-refresh-need-cmd-win', function(event, arg) {
            $('.need_cmd').each(function(index,item){
                item.contentWindow.location.reload(true);
            })
        });
        ipcRenderer.on('do-refresh-need-dic-win', function(event, arg) {
            $('.need_dic').each(function(index,item){
                item.contentWindow.location.reload(true);
            })
        });
    },
    loadTaskFile : function(callback1,callback2){
        Util.loadFile(globalDatas.taskFilePath,callback1,callback2);
    },
    loadConfigFile: function(callback1,callback2){
        Util.loadFile(globalDatas.configFilePath,callback1,callback2);
    },
    loadDicFile: function(callback1,callback2){
        Util.loadFile(globalDatas.dicFilePath,callback1,callback2);
    },
    loadCmdFile: function(callback1,callback2){
        Util.loadFile(globalDatas.cmdFilePath,callback1,callback2);
    },
	bindEvent: function(){
        var menuName = $('.pf-nav').find('.current').data('menu');
		var self = this;
        var menus = this.menus;
        var cmdHistory = [];
        var cmdHistoryIndex = 0;
        var dicKeyMap = null;
		// 顶部大菜单单击事件
		$(document).on('click', '.pf-nav-item', function() {
            $('.pf-nav-item').removeClass('current');
            $(this).addClass('current');

            // 渲染对应侧边菜单
            var m = $(this).data('menu');
            self.render(menu[m]);
        });

        $(document).on('click', '.sider-nav li', function() {
        	var src = $(this).data('src');
            cmdHistoryIndex = cmdHistory.length;
            menuName = $('.pf-nav').find('.current').data('menu');
            $('.current_menu').find('.sider-nav li').removeClass('current');
            $(this).addClass('current');
            $('.current_win').removeClass('current_win');
            if(src.indexOf('open_cmd')!=-1){
            	if(src!='open_cmd_' && globalDatas.openedWin[src]){
            		globalDatas.openedWin[src].addClass('current_win');
            	}else{
            		var html = '<div data-cwd="'+$(this).data('cwd')+'" class="opened_cmd current_win"><div class="out"></div><div class="wrap"><span>'+$(this).data('cwd').replace(/\\/g,'/')+'> </span><input type="text"></wrap></div>'
            		var openedCmd = null;
                    $('#pf-page').append(html);
                    openedCmd = $('.current_win');
            		$(this).data('src','open_cmd_'+menuName+'_'+self.menus[menuName].cmdCount);
            		globalDatas.openedWin['open_cmd_'+menuName+'_'+self.menus[menuName].cmdCount] = openedCmd;
            		openedCmd.find('input').focus();
                    openedCmd.find('input').css('padding-left',openedCmd.find('.wrap').find('span').width()+5+'px')
            		if(!$(this).attr('title')){
            			$(this).attr('title','命令窗口'+menuName+'_'+self.menus[menuName].cmdCount);
            			openedCmd.attr('title',menuName+'_'+self.menus[menuName].cmdCount);
            			$(this).find('.sider-nav-title').html('命令窗口'+self.menus[menuName].cmdCount);
            		}
            		self.menus[menuName].cmdCount++;
            	}
            }else{
            	if(src.indexOf('open_iframe')!=-1){
            		globalDatas.openedWin[src]&&globalDatas.openedWin[src].addClass('current_win');
            	}else{
                    var dicClass = $(this).data('dicclass') || '';
                    var cmdClass = $(this).data('cmdclass') || '';
            		var html = '<iframe  class="current_win '+dicClass+' '+cmdClass+'" src="'+src+'" frameborder="no"   border="no" height="100%" width="100%" scrolling="auto" nodeintegration></iframe>'
            		$('#pf-page').append(html);
            		$(this).data('src','open_iframe_'+menuName+'_'+self.menus[menuName].iframeCount);
            		globalDatas.openedWin['open_iframe_'+menuName+'_'+self.menus[menuName].iframeCount] = $('.current_win');
                    self.menus[menuName].iframeCount++;
            	}
            }
        });
        $(document).on('contextmenu', '.sider-nav li', function(){
            var This = this;
            var menu = new Menu();
            menu.append(new MenuItem({ label: '移除命令窗口', click: function(e){
                var src = $(This).data('src');
                if(src.indexOf('open_cmd')!=-1 && globalDatas.openedWin[src]){
                    if($(This).hasClass('current')){
                        $('.sider-nav li').first().trigger('click');
                    }
                    $(This).remove();
                    globalDatas.openedWin[src].remove();
                }
            }}));
            menu.popup(remote.getCurrentWindow());
        })
        $(document).on('click','.opened_cmd',function(){
        	$(this).find('input').focus();
        });
        $(document).on('keydown','.opened_cmd input',function(e){
        	var ev = document.all ? window.event : e;
        	var $openedCmd = $(this).closest('.opened_cmd');
        	var args = null;
        	var cwd = $openedCmd.data('cwd');
            var cmd = '';
            if((ev.keyCode == 'C'.charCodeAt(0)||ev.keyCode == 'c'.charCodeAt(0)) && ev.ctrlKey){
                self.spawn('exit',null,null,$openedCmd.find('.out'));
            }
        	if($openedCmd.find('.wrap').hasClass('choke')){
                return false;
            }
		    if(ev.keyCode==13) {
		        args = parseCmd($(this).val());
                cmd = args.splice(0,1)[0];
		        self.spawn(cmd,args,cwd,$openedCmd.find('.out'));
                cmdHistory.push($(this).val());
                cmdHistoryIndex = cmdHistory.length;
		        $(this).val('');

		    }else if(ev.keyCode==38){
                if(cmdHistoryIndex>0)
                    $(this).val(cmdHistory[--cmdHistoryIndex]);
                $(this).focus();
                return false;
            }else if(ev.keyCode==40){
                if(cmdHistoryIndex<cmdHistory.length-1)
                    $(this).val(cmdHistory[++cmdHistoryIndex]);
                $(this).focus();
                return false;
            }
            
            //解析命令行
        	function parseCmd(cmd){
        		var str = cmd.replace(/^\s+|\s+$/).replace(/^[\s\S]*?>\s*/,'');
        		var dbQuoteReg = /"[\s\S]*?"|'[\s\S]*?'/g;
        		var quoteArgs = str.match(dbQuoteReg);
        		var args = str.replace(dbQuoteReg,'{}').split(/\s+/);
        		if(quoteArgs){
        			for(var i=0; i<quoteArgs.length; i++){
        				for(var j=0; j<args.length; j++){
        					if(args[j] === '{}'){
        						args[j] = quoteArgs[i];
        						break;
        					}
        				}
        			}
        		}
        		return args;
        	}
        });
        $(document).on('click','.add_cmd',function(){

            var menu = {
                cwd: globalDatas.dicKeyMap['rootDir']?globalDatas.dicKeyMap['rootDir']:process.cwd(),
                title: '',
                icon: 'imgs/main/l03.png',
                href: 'open_cmd',
                isCurrent: true
            }
            self.addMenu(menu);
        });
	},

	render: function(menu){
		var current;
        var menuName = $('.pf-nav').find('.current').data('menu');
        $('.current_menu').removeClass('current_menu');
		if(this.menus[menuName]){
            this.menus[menuName].addClass('current_menu');
            this.menus[menuName].find('li.current').trigger('click');
            return;
        }
        var cmdClass = menu.menu[0].cmdClass || '';
        var dicClass = menu.menu[0].dicClass || '';
        var navHtml = ['<div class="current_menu menu_wrap munu_'+menuName+'"><h2 class="pf-model-name"><span class="pf-sider-icon"></span><span class="pf-name">'+ menu.title +'</span></h2>'];
       
        navHtml.push('<ul class="sider-nav">');
		
        for(var i = 0, len = menu.menu.length; i < len; i++){
			if(menu.menu[i].isCurrent){
				current = menu.menu[i];
				navHtml.push('<li class="current" title="'+ menu.menu[i].title +'" data-src="'+ menu.menu[i].href +'" data-dicclass="'+dicClass+'" data-cmdclass="'+cmdClass+'"><a href="javascript:;"><img src="'+ menu.menu[i].icon +'"><span class="sider-nav-title">'+ menu.menu[i].title +'</span><i class="iconfont">&#xe611;</i></a></li>');
			}else{
				navHtml.push('<li data-src="'+ menu.menu[i].href +'" title="'+ menu.menu[i].title +'" data-dicclass="'+dicClass+'" data-cmdclass="'+cmdClass+'"><a href="javascript:;"><img src="'+ menu.menu[i].icon +'"><span class="sider-nav-title">'+ menu.menu[i].title +'</span><i class="iconfont">&#xe611;</i></a></li>');
			}
		}
		navHtml.push('</ul></div>');

		$('#pf-sider').append(navHtml.join(''));

        this.menus[menuName] = $('.current_menu');
        this.menus[menuName].iframeCount = 1;
        this.menus[menuName].cmdCount = 1;

        $('.current_menu').find('.sider-nav').find('li.current').trigger('click');
        this.menus[menuName].iframeCount++;
	},
	addMenu: function(menu){
		var html = '<li data-cwd="'+(menu.cwd||'')+'" data-src="'+ menu.href +'" title="'+ menu.title +'"><a href="javascript:;"><img src="'+ menu.icon +'"><span class="sider-nav-title">'+ menu.title +'</span><i class="iconfont">&#xe611;</i></a></li>'
		$('.current_menu').find('.sider-nav').append(html);
		$('.current_menu').find('.sider-nav').find('li').last().trigger('click');
	},
    spawn : function(cmd,arg,cwd,$dom){
        console.log('spawn:',cmd,arg,cwd)
        var self = this;
        var resultCwd = '';
        
        if($dom===true){
            var menu = {
                cwd: cwd||process.cwd(),
                title: '',
                icon: 'imgs/main/l03.png',
                href: 'open_cmd',
                isCurrent: true
            }
            self.addMenu(menu);
            $dom = $('.current_win').find('.out');
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
            this.exec('taskkill /F /T /pid '+globalDatas.process[title]);
            return;
        }

        
        var $openedCmd = null;
        var workerProcess = null;

        if($dom){
            var msg = '<span>'+cwd + '> '+'</span>'+cmd;
            $openedCmd = $dom.closest('.opened_cmd');
            arg ? (msg = msg+' '+arg.join(' ')+'<br/>'):(msg = msg+'<br/>');
            $dom.append(Util.replaceReturn(msg));
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

        globalDatas.process[$('.current_win').attr('title')] = workerProcess.pid;

        workerProcess.on('error',function(err){

            var msg = '命令'+cmd+'执行失败';
            if($dom){
                msg = msg+'<br/>';
                $dom.append(Util.replaceReturn(msg));
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
                $dom.append(Util.replaceReturn(msg));
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
                $dom.append(Util.replaceReturn(msg));
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
                    $dom.append(Util.replaceReturn(msg));
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
};

mainPlatform.init();