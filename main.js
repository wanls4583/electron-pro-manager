const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const { ipcMain } = electron
const fs = require('fs');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 800, height: 600 })
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        mainWindow = null
    })
}
app.on('ready', createWindow)
// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})
//全局数据
global.datas = {}
var exists = fs.existsSync('data');
if(exists){
    global.datas.taskFilePath = "data/task.txt";
    global.datas.dicFilePath = "data/dic.txt";
    global.datas.cmdFilePath = 'data/cmd.txt';
}else{
    global.datas.taskFilePath = "resources/app/data/task.txt";
    global.datas.dicFilePath = "resources/app/data/dic.txt";
    global.datas.cmdFilePath = 'resources/app/data/cmd.txt';
}
ipcMain.on('spawn', function(event, arg) {
    mainWindow.webContents.send('do-spawn', arg);
    // event.sender.send('do-spawn', arg);
});
ipcMain.on('refresh-need-cmd-win', function(event, arg) {
    mainWindow.webContents.send('do-refresh-need-cmd-win', arg);
});
ipcMain.on('refresh-need-dic-win', function(event, arg) {
    mainWindow.webContents.send('do-refresh-need-dic-win', arg);
});
