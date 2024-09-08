const { app } = require('electron');
const ProgressBar = require('electron-progressbar');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const adm = require('adm-zip');
const path = require('path');
const process = require('process');

const repo = 'dkks112313/dwd';
const file_name = `${process.argv[2]}.zip`;

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
        asset_url = asset["browser_download_url"];
      }
    }

    downloadFile(asset_url, file_name)
    .then(() => {
      console.log('File successfully downloaded.');
      
      const homeDir = os.homedir();
      const appDataPath = path.join(process.env.APPDATA, '.anpan');

      const zip = new adm(file_name);
      zip.extractAllTo(appDataPath, true);

      fs.unlink(file_name, (err) => {
        if (err) throw err;
        console.log('File deleted');
      });

      execSync(`${path.join(homeDir, 'An-Pan', 'main.exe')} "anpan://?options=%7B%22username%22%3A%22${process.argv[1]}%22%2C%22uuid%22%3A%22c4330a49-26f9-41fa-bcf1-ea04f038c1a6%22%2C%22token%22%3A%22%22%7D&name=${process.argv[1]}&version=${process.argv[2]}&dir=false"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${command}\n${error}`);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);
      });

      progressBar.setCompleted();
    })
    .catch(err => {
        console.error(`Error downloading file: ${err.message}`);
    });
}
