const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const {ipcMain} = electron
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {

    mainWindow = null
  })
}


app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

//全局数据
global.initDatas = global.datas  ={}
global.datas.configFilePath = "data/config.txt";
global.datas.taskFilePath = "data/task.txt";
global.datas.dicFilePath = "data/dic.txt";
global.datas.cmdFilePath = 'data/cmd.txt';

ipcMain.on('init',function(event, arg){
  global.datas.userName = arg;
  event.returnValue = true;
});

ipcMain.on('setDicDatas',function(event, arg){
  global.datas.dicDatas = arg;
  global.datas.dicData = global.datas.dicDatas[global.datas.userName];
  event.returnValue = global.datas;
});

ipcMain.on('setCmdDatas',function(event, arg){
  global.datas.cmdDatas = arg;
  global.datas.cmdData = global.datas.cmdDatas[global.datas.userName];
  event.returnValue = global.datas;
});

ipcMain.on('setTaskDatas',function(event, arg){
  global.datas.taskDatas = arg;
  global.datas.taskData = global.datas.taskDatas[global.datas.userName];
  event.returnValue = global.datas;
});

ipcMain.on('parseDic',function(event, arg){
  global.datas.dicKeyMap = {};
  global.datas.dicData.dics.forEach(function(item){
      global.datas.dicKeyMap[item.key] = item.value;
  })
  event.returnValue = true;
});

ipcMain.on('parseCmd',function(event, arg){
  global.datas.cmdKeyMap = {};
  global.datas.cmdData.cmds.forEach(function(item){
      global.datas.cmdKeyMap[item.key] = item.code;
  })
  event.returnValue = true;
});

ipcMain.on('spawn', function(event, arg) {
  mainWindow.webContents.send('do-spawn', arg);
});

ipcMain.on('refresh-need-cmd-win', function(event, arg) {
  mainWindow.webContents.send('do-refresh-need-cmd-win', arg);
});

ipcMain.on('refresh-need-dic-win', function(event, arg) {
  mainWindow.webContents.send('do-refresh-need-dic-win', arg);
});