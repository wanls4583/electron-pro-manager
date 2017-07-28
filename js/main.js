var mainPlatform = {

	init: function(){

		this.bindEvent();
		this.render(menu['project']);
	},
	bindEvent: function(){
		var cmdCount = 0;
		var openedCmd = {};
		var self = this;
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
            $('.sider-nav li').removeClass('current');
            $(this).addClass('current');
            if(src.indexOf('open_cmd')!=-1){
            	var index = src.replace('open_cmd','');
            	if(index && openedCmd['cmd'+index]){
            		$('.current_cmd').removeClass('current_cmd');
            		openedCmd['cmd'+index].addClass('current_cmd');
            	}else{
            		$('.current_cmd').removeClass('current_cmd');
            		var html = 
            		/*'<div class="crumbs">'+
						'<i class="crumbs-arrow"></i>'+
						'<a href="javascript:;" class="crumbs-label">机构管理</a>'+
					'</div>'+*/
					'<div data-cwd="'+$(this).data('cwd')+'" class="opened_cmd current_cmd"><div class="out"></div><div class="wrap"><span>'+$(this).data('cwd')+'> </span><input type="text"></wrap></div>'
            		$('#pf-page').append(html);
            		$(this).data('src','open_cmd'+cmdCount);
            		openedCmd['cmd'+cmdCount] = $('.current_cmd');
            		openedCmd['cmd'+cmdCount].find('input').focus();
            		if(!$(this).attr('title')){
            			$(this).attr('title','命令窗口'+cmdCount);
            			$(this).find('.sider-nav-title').html('命令窗口'+cmdCount);
            		}
            		cmdCount++;
            	}
            }else
            	$('iframe').attr('src', $(this).data('src'));
        });
        $(document).on('click','.opened_cmd',function(){
        	$(this).find('input').focus();
        });
        $(document).on('keydown','.opened_cmd input',function(e){
        	var ev = document.all ? window.event : e;
        	var $openedCmd = $(this).closest('.opened_cmd');
        	var args = null;
        	var cwd = $openedCmd.data('cwd');
        	if($openedCmd.find('.wrap').hasClass('choke'))
        	 	return;
		    if(ev.keyCode==13) {
		        args = parseCmd($(this).val());
		        Util.spawn(args.splice(0,1)[0],args,cwd,$openedCmd.find('.out'));
		        $(this).val('');
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
        		console.log(args);
        		return args;
        	}
        });
        $(document).on('keyup',function(){
        	var $openedCmd = $(this).closest('.opened_cmd');
        	if($openedCmd.find('.wrap').hasClass('choke'))
        	 	$openedCmd.find('input').val('');
        })
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
		var current,
			html = ['<h2 class="pf-model-name"><span class="pf-sider-icon"></span><span class="pf-name">'+ menu.title +'</span></h2>'];

		html.push('<ul class="sider-nav">');
		for(var i = 0, len = menu.menu.length; i < len; i++){
			if(menu.menu[i].isCurrent){
				current = menu.menu[i];
				html.push('<li class="current" title="'+ menu.menu[i].title +'" data-src="'+ menu.menu[i].href +'"><a href="javascript:;"><img src="'+ menu.menu[i].icon +'"><span class="sider-nav-title">'+ menu.menu[i].title +'</span><i class="iconfont">&#xe611;</i></a></li>');
			}else{
				html.push('<li data-src="'+ menu.menu[i].href +'" title="'+ menu.menu[i].title +'"><a href="javascript:;"><img src="'+ menu.menu[i].icon +'"><span class="sider-nav-title">'+ menu.menu[i].title +'</span><i class="iconfont">&#xe611;</i></a></li>');
			}
		}
		html.push('</ul>');

		$('iframe').attr('src', current.href);
		$('#pf-sider').html(html.join(''));
	},

	addMenu: function(menu){
		var html = '<li data-cwd="'+(menu.cwd||'')+'" data-src="'+ menu.href +'" title="'+ menu.title +'"><a href="javascript:;"><img src="'+ menu.icon +'"><span class="sider-nav-title">'+ menu.title +'</span><i class="iconfont">&#xe611;</i></a></li>'
		$('.sider-nav').append(html);
		$('.sider-nav').find('li').last().trigger('click');
	}

};

mainPlatform.init();