const {app} = require('electron');
const ProgressBar = require('electron-progressbar');
const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const adm = require('adm-zip');
const os = require('os');
const path = require('path');

const repo = 'dkks112313/dwd';
const file_name = 'bober.zip';

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
  
  launchTask(progressBar);
});

function create_register() {
  const commands = [
    'reg add "HKEY_CLASSES_ROOT\\anpan" /ve /d "An-Pan" /f',
    'reg add "HKEY_CLASSES_ROOT\\anpan" /v "URL Protocol" /d "" /f',
    'reg add "HKEY_CLASSES_ROOT\\anpan\\shell" /f',
    'reg add "HKEY_CLASSES_ROOT\\anpan\\shell\\open" /f',
    `reg add "HKEY_CLASSES_ROOT\\anpan\\shell\\open\\command" /ve /d "\\"${os.homedir()}\\\\An-Pan\\\\main.exe\\" \\"%1\\"" /f`
  ];
  
  commands.forEach(command => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}\n${error}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  });
  
}

async function downloadFile(url, savePath) {
  const writer = fs.createWriteStream(savePath);

  const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
  });
}

async function launchTask(progressBar) {
    const fetch = (await import('node-fetch')).default;
  
    let asset_url;
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
    const data = await response.json();
    for(let asset of data['assets']) {
      if(asset['name'] == file_name) {
        asset_url = asset["browser_download_url"]
      }
    }

    downloadFile(asset_url, file_name)
    .then(() => {
      console.log('File successfully downloaded.');

      const homeDir = os.homedir();
      const appDataPath = path.join(homeDir, 'An-Pan');

      if (!fs.existsSync(path.join(homeDir, 'An-Pan'))) {
        fs.mkdir(path.join(homeDir, 'An-Pan'), (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log('Folder created successfully!');
          }
        });
      } else {
        console.log('Folder already exists');
      }

      const zip = new adm(file_name);
      zip.extractAllTo(appDataPath, true);
      
      create_register();

      progressBar.setCompleted();
    })
    .catch(err => {
        console.error(`Error downloading file: ${err.message}`);
    });
}
