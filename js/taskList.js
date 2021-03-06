var require = require || window.parent.require;
var fs = require('fs');
var shell = require('electron').shell;
var remote = require('electron').remote;
var globalDatas = remote.getGlobal('datas');
var userName = globalDatas.userName;
var taskData = globalDatas.taskData;
var datas = globalDatas.taskDatas || {};
var cmdData = globalDatas.cmdData;
initData();
initEvt();

function initEvt() {
    var layerIndex = null;
    //添加任务
    $('body').on('click', '.add', function() {
        layer.open({
            title: '添加任务',
            area: ['750px'],
            content: $('#addTpl').html(),
            btn: ['保存', '取消'],
            yes: function(index, layero) {
                Util.writeTaskFile(JSON.stringify(getAddData()), function(err) {
                    if (err) {
                        layer.open({
                            title: '错误',
                            content: '' + err,
                            btn: ['确定']
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
    $('body').on('click', '.del', function() {
        var delItems = $('.item_cb:checked');
        layer.confirm('您确定要删除吗？', {
            icon: 4,
            title: '删除' //按钮
        }, function(index) {
            var toDels = [];
            delItems.each(function(index, dom) {
                index = $(dom).closest('tr').find('.num').data('index');
                toDels.push(taskData.tasks[index]);
            })
            for (var i = 0; i < toDels.length; i++) {
                taskData.tasks.remove(toDels[i]);
            }
            Util.writeTaskFile(JSON.stringify(datas), function(err) {
                if (err) {
                    layer.open({
                        title: '错误',
                        content: '' + err,
                        btn: ['确定']
                    });
                    return;
                }
                initData();
            });
            layer.close(index);
        })
    })
    //修改任务
    $('body').on('click', '.modify', function() {
        var oldTask = {};
        oldTask.dir = $(this).closest('tr').find('.dir').data('dir');
        oldTask.title = $(this).closest('tr').find('.title').data('title');
        oldTask.wiki = $(this).closest('tr').find('.wiki').data('wiki');
        layer.open({
            title: '修改任务',
            area: ['750px'],
            content: $('#addTpl').html(),
            btn: ['保存', '取消'],
            yes: function(index, layero) {
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
    $('body').on('click', '.open_cmd', function() {
        var tpl = $('#cmdTpl');
        var This = this;
        var cmdItemHtml = '<div class="button">i class="iconfont">&#xe628;</i><span class="button-label"></span></div>';
        var cmdItem = null;
        var html = '';
        for (var i = 0; cmdData && i < cmdData.cmds.length; i++) {
            cmdItem = cmdData.cmds[i];
            if(cmdItem.key.substr(0,1)=='_')
                continue;
            html += '<div data-key="' + cmdItem.key + '" class="cmd button"><i class="iconfont">&#xe628;</i><span class="button-label">' + cmdItem.title + '</span></div>'
        }
        if (!html) {
            layer.open({
                title: '命令',
                content: '没有命令',
                btn: ['确定']
            });
            return;
        }
        layerIndex = layer.open({
            title: '命令',
            area: ['500px'],
            content: html,
            btn: ['取消']
        });
        var index = $(This).closest('tr').find('.num').data('index');
        globalDatas.currentTask = taskData.tasks[index];
    })
    //命令
    $('body').on('click', '.cmd', function() {
        var key = $(this).data('key');
        var self = this;
        cmdData.cmds.forEach(function(item) {
            if (item.key == key) {
                var code = parseCode(key)
                try {
                    eval(code);
                    layer.close(layerIndex);
                } catch (e) {
                    layer.open({
                        title: '错误',
                        area: ['500px'],
                        content: e.stack,
                        btn: ['确定']
                    });
                }
            }
        })
    })
    //全选
    $('body').on('click', '.all_cb', function() {
        if ($('.all_cb').attr('checked')) {
            $('.item_cb').attr('checked', true);
        } else {
            $('.item_cb').attr('checked', false);
        }
    })
    //单选
    $('body').on('click', '.item_cb', function() {
        if ($('.item_cb').length == $('.item_cb:checked').length) {
            $('.all_cb').attr('checked', true);
        } else {
            $('.all_cb').attr('checked', false);
        }
    })
    //wiki
    $('body').on('click', '.wiki a', function() {
        var url = $(this).closest('.wiki').data('wiki');
        shell.openExternal(url);
    })
    //帮助
    $('body').on('click', '.help', function() {
        var index = layer.open({
            title: '帮助',
            content: '可用\"<font style="color:#0c9d72">|</font>\"分割版本，第一个为样式版本，第二个为js版本',
            btn: ['确定'],
        });
    })
}
//解析命令
function parseCode(cmdkey) {
    for (key1 in globalDatas.cmdKeyMap) {
        if (globalDatas.cmdKeyMap[cmdkey].match(returnReg(key1)) && !globalDatas.cmdKeyMap[key1].match(returnReg(cmdkey))) {
            globalDatas.cmdKeyMap[cmdkey] = globalDatas.cmdKeyMap[cmdkey].replace(returnReg(key1), globalDatas.cmdKeyMap[key1]);
        }
    }

    function returnReg(key) {
        return RegExp('exec\\s*?\\(\\s*?[\'\"]' + key + '[\'\"]\\s*?\\)', 'mg');;
    }
    var cmd = globalDatas.cmdKeyMap[cmdkey];
    return cmd.replace(/([^\\])\\([^\\])/g, '$1\\\\$2');
}

function initData() {
    var html = $('#taskItem').html();
    var tasks = taskData && taskData.tasks || [];
    $('#taskList').html('');
    for (var j = 0; j < tasks.length; j++) {
        var item = '';
        item = html.replace('<td class="num"></td>', '<td data-index="' + j + '" class="num">' + (j + 1) + '</td>');
        item = item.replace('<td class="title"></td>', '<td data-title="' + tasks[j].title + '" class="title">' + tasks[j].title + '</td>');
        item = item.replace('<td class="dir"></td>', '<td data-dir="' + tasks[j].dir + '" class="dir">' + tasks[j].dir + '</td>');
        item = item.replace('<td class="wiki"></td>', '<td data-wiki="' + tasks[j].wiki + '" class="wiki"><a href="javascript:void(0)">' + tasks[j].wiki + '</a></td>');
        $('#taskList').append(item);
    }
    checkBoxReset();
}
//checkbox检测
function checkBoxReset() {
    if ($('.item_cb').length == $('.item_cb:checked').length) {
        $('.all_cb').attr('checked', true);
    } else {
        $('.all_cb').attr('checked', false);
    }
}

function getAddData() {
    var task = {};
    //是否存在该任务
    var existTask = false;
    //是否存在该用户的任务列表
    var existUser = false;
    task.title = $('.in_title').val() || '';
    task.dir = $('.in_dir').val() || '';
    task.wiki = $('.in_wiki').val() || ''
    if (taskData) {
        var tasks = taskData.tasks;
        for (var j = 0; j < tasks.length; j++) {
            if (tasks[j].dir == task.dir) {
                tasks[j].title = task.title;
                tasks[j].wiki = task.wiki;
                existTask = true;
                break;
            }
        }
        if (!existTask) {
            tasks.push(task);
        }
    } else {
        datas[userName] = {};
        datas[userName].userName = userName;
        datas[userName].tasks = [task];
        taskData = datas[userName];
        globalDatas.taskDatas = datas;
        globalDatas.taskData = taskData;
    }
    return datas;
}

function getModifyData(oldTask) {
    var task = {};
    task.title = $('.in_title').val() || '';
    task.dir = $('.in_dir').val() || '';
    task.wiki = $('.in_wiki').val() || ''
    if (taskData != null) {
        var tasks = taskData.tasks;
        for (var j = 0; j < tasks.length; j++) {
            if (tasks[j].dir == oldTask.dir) {
                tasks[j].title = task.title;
                tasks[j].wiki = task.wiki;
                tasks[j].dir = task.dir;
                break;
            }
        }
    }
    return { datas: datas, task: task };
}
