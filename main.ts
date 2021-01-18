import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as chromeLauncher from 'chrome-launcher';
import * as puppeteer from 'puppeteer-core';
import { Browser, Page } from 'puppeteer-core';
import fetch from 'node-fetch';

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

let browser: Browser | undefined;
let page: Page | undefined;

function createWindow(): BrowserWindow {

  // const electronScreen = screen;
  // const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    frame: false,
    autoHideMenuBar: true,
    center: true,
    width: 1400,
    height: 800,
    title: 'Accesibility Report',
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
      contextIsolation: false,  // false if you want to run 2e2 test with Spectron
      enableRemoteModule : true // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
    },
  });

  if (serve) {

    win.webContents.openDevTools();

    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');

  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}

try {
  ipcMain.on('fromRenderer', (event: IpcMainEvent, message: any) => {
    // Run in next tick
    setTimeout(() => {
      switch (message.command) {
        case 'launch':
          launch(message.url);
          break;
        case 'runAxe':
          runAxe();
          break;
      }
    }, 0);
    event.reply('fromRenderer', '');
  });
}  catch (e) {
  // Catch Error
  // throw e;
}


function launch(url: string): void {
  (async () => {
    if (!browser) {
      const opts = {
        chromeFlags: ['--window-size=1600,1024'],
        output: 'json'
      };

      // Launch chrome using chrome-launcher.
      const chrome = await chromeLauncher.launch(opts);

      // Connect to it using puppeteer.connect().
      const resp = await fetch({
        href: `http://localhost:${chrome.port}/json/version`
      });
      const { webSocketDebuggerUrl } = await resp.json();
      browser = await puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl
      });

      browser.on('disconnected', () => {
        browser = undefined;
        page = undefined;
      });
    }

    if (browser) {
      if (!page) {
        const pages = await browser.pages();
        page = pages[0];
      }

      if (page) {
        await page.goto(url);
        await page.setViewport({
          width: 1600,
          height: 900
        });

        // add axe-core to the pages
        await page.addScriptTag({
          path: require.resolve('axe-core')
        });
      }
    }
  })();
}

function runAxe(): void {
  if (browser && page) {
    (async () => {
      if (page) {
        // run axe on the page
        const axeResults = await page.evaluate(
          `
          (async () => {
            return await axe.run({
              runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa']
              }
            });
          })();
          `
        );
        win.webContents.send('fromMain', {
          command: 'report',
          axeResults
        });
      }
    })();
  }
}
