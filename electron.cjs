const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
  });

  // Give the server a moment to start up, then load the URL
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3001').catch(err => {
      console.error('Failed to load URL:', err);
      // You can show an error message to the user here
    });
  }, 2500); // Increased delay slightly

  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startServer() {
  const userDataPath = app.getPath('userData');
  const serverPath = path.join(__dirname, 'dist-server/server/index.js');

  serverProcess = fork(serverPath, [userDataPath], {
     stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server process.', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

app.on('ready', () => {
  startServer();
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    console.log('Killing server process...');
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});