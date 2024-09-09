const { app } = require('electron');
const ProgressBar = require('electron-progressbar');
const { Client, Authenticator } = require('minecraft-launcher-core');
const path = require('path');
const process = require('process');
const fs = require('fs');
const url = require('url');

app.on('ready', function() {
  var progressBar = new ProgressBar({
    text: 'Preparing data...',
    detail: 'Wait...'
  });
  
  progressBar
    .on('completed', function() {
      console.info(`completed...`);
      progressBar.detail = 'Task completed. Exiting...';
    })
    .on('aborted', function() {
      console.info(`aborted...`);
    });
  
  launchTask().then(() => {
    progressBar.setCompleted();
  }).catch((e) => {
    console.log(e)
  })
});

async function launchTask() {
  const launcher = new Client();
  const pathMine = path.join(process.env.APPDATA, 'WebPan');

  if (!fs.existsSync(pathMine)) {
    fs.mkdirSync(pathMine, { recursive: true });
  }

  let params = JSON.parse(url.parse(process.argv[2], true).query['options']);

  const options = {
    clientPackage: null,
    authorization: Authenticator.getAuth(params['name']),
    root: pathMine,
    version: {
      number: params['version'],
      type: "release"
    },
    memory: {
      max: "6G",
      min: "4G"
    },
    javaPath: 'C:\\Program Files\\Java\\jdk-17\\bin\\javaw.exe'
  };
  
  launcher.launch(options);
  
  launcher.on('debug', (e) => console.log('[DEBUG]', e));
  return new Promise((resolve, reject) => {
    launcher.on('data', (e) => resolve());
  });
}
