var mainPlatform = {
    menus: [],
    openedWin: {},
    cmdData:null,
    dicData:null,
    taskData:null,
    config:null,
	init: function(){
        this.render(menu['config']);
		this.bindEvent();
	},
	bindEvent: function(){
        var menuName = $('.pf-nav').find('.current').data('menu');
		var self = this;
        var firstIframe = $('iframe');
        var menus = this.menus;
        var cmdHistory = [];
        var cmdHistoryIndex = 0;
        // 第一个窗口
        $('.sider-nav li').first().data('src','open_iframe_'+menuName+'_'+menus[menuName].iframeCount);
        firstIframe.addClass('current_win');
        self.openedWin['open_iframe_'+menuName+'_'+menus[menuName].iframeCount] = firstIframe;
        menus[menuName].iframeCount++;
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
            	if(src!='open_cmd_' && self.openedWin[src]){
            		self.openedWin[src].addClass('current_win');
            	}else{
            		var html = '<div data-cwd="'+$(this).data('cwd')+'" class="opened_cmd current_win"><div class="out"></div><div class="wrap"><span>'+$(this).data('cwd').replace(/\\/g,'/')+'> </span><input type="text"></wrap></div>'
            		var openedCmd = null;
                    $('#pf-page').append(html);
                    openedCmd = $('.current_win');
            		$(this).data('src','open_cmd_'+menuName+'_'+self.menus[menuName].cmdCount);
            		self.openedWin['open_cmd_'+menuName+'_'+self.menus[menuName].cmdCount] = openedCmd;
            		openedCmd.find('input').focus();
                    openedCmd.find('input').css('padding-left',openedCmd.find('.wrap').find('span').width()+'px')
            		if(!$(this).attr('title')){
            			$(this).attr('title','命令窗口'+menuName+'_'+self.menus[menuName].cmdCount);
            			openedCmd.attr('title','命令窗口'+menuName+'_'+self.menus[menuName].cmdCount);
            			$(this).find('.sider-nav-title').html('命令窗口'+self.menus[menuName].cmdCount);
            		}
            		self.menus[menuName].cmdCount++;
            	}
            }else{
            	if(src.indexOf('open_iframe')!=-1){
            		self.openedWin[src]&&self.openedWin[src].addClass('current_win');
            	}else{
            		var html = '<iframe class="current_win" src="'+src+'" frameborder="no"   border="no" height="100%" width="100%" scrolling="auto"></iframe>'
            		$('#pf-page').append(html);
            		$(this).data('src','open_iframe_'+menuName+'_'+self.menus[menuName].iframeCount);
            		self.openedWin['open_iframe_'+menuName+'_'+self.menus[menuName].iframeCount] = $('.current_win');
                    self.menus[menuName].iframeCount++;
            	}
            }
        });
        $(document).on('click','.opened_cmd',function(){
        	$(this).find('input').focus();
        });
        $(document).on('keydown','.opened_cmd input',function(e){
        	var ev = document.all ? window.event : e;
        	var $openedCmd = $(this).closest('.opened_cmd');
        	var args = null;
        	var cwd = $openedCmd.data('cwd');
            var cmd = '';
        	if($openedCmd.find('.wrap').hasClass('choke')){
                return false;
            }
		    if(ev.keyCode==13) {
		        args = parseCmd($(this).val());
                cmd = args.splice(0,1)[0];
		        Util.spawn(cmd,args,cwd,$openedCmd.find('.out'));
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
        // $(document).on('keypress','.opened_cmd input',function(){
        // 	var $openedCmd = $(this).closest('.opened_cmd');
        // 	if($openedCmd.find('.wrap').hasClass('choke'))
        // 	 	$openedCmd.find('input').val('wocao');
        // })
        $(document).on('click', '.pf-logout', function() {
            layer.confirm('您确定要退出吗？', {
              icon: 4,
			  title: '确定退出' //按钮
			}, function(){
			  location.href= 'login.html'; 
			});
        });

        $(document).on('click', '.pf-modify-pwd', function() {
            $('#pf-page').find('iframe').eq(0).attr('src', 'backend/modify_pwd.html')
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
        var navHtml = ['<div class="current_menu menu_wrap munu_'+menuName+'"><h2 class="pf-model-name"><span class="pf-sider-icon"></span><span class="pf-name">'+ menu.title +'</span></h2>'];
        var winHtml = '<iframe class="current_win" src="'+menu.menu[0].href+'" frameborder="no"   border="no" height="100%" width="100%" scrolling="auto"></iframe>';
		
        navHtml.push('<ul class="sider-nav">');
		
        for(var i = 0, len = menu.menu.length; i < len; i++){
			if(menu.menu[i].isCurrent){
				current = menu.menu[i];
				navHtml.push('<li class="current" title="'+ menu.menu[i].title +'" data-src="'+ menu.menu[i].href +'"><a href="javascript:;"><img src="'+ menu.menu[i].icon +'"><span class="sider-nav-title">'+ menu.menu[i].title +'</span><i class="iconfont">&#xe611;</i></a></li>');
			}else{
				navHtml.push('<li data-src="'+ menu.menu[i].href +'" title="'+ menu.menu[i].title +'"><a href="javascript:;"><img src="'+ menu.menu[i].icon +'"><span class="sider-nav-title">'+ menu.menu[i].title +'</span><i class="iconfont">&#xe611;</i></a></li>');
			}
		}
		navHtml.push('</ul></div>');

        $('#pf-page').append(winHtml);
		$('#pf-sider').append(navHtml.join(''));

        this.menus[menuName] = $('.current_menu');
        this.menus[menuName].iframeCount = 1;
        this.menus[menuName].cmdCount = 1;

        $(this).data('src','open_iframe_'+this.menus[menuName]+'_'+this.menus[menuName].iframeCount);
        this.openedWin['open_iframe_'+menuName+'_'+this.menus[menuName].iframeCount] = $('.current_win');
        $('.current_menu').find('.sider-nav').find('li').first().trigger('click');
        this.menus[menuName].iframeCount++;
	},

	addMenu: function(menu){
		var html = '<li data-cwd="'+(menu.cwd||'')+'" data-src="'+ menu.href +'" title="'+ menu.title +'"><a href="javascript:;"><img src="'+ menu.icon +'"><span class="sider-nav-title">'+ menu.title +'</span><i class="iconfont">&#xe611;</i></a></li>'
		$('.current_menu').find('.sider-nav').append(html);
		$('.current_menu').find('.sider-nav').find('li').last().trigger('click');
	}

};

mainPlatform.init();