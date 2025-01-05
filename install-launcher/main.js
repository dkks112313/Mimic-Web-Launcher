const { app } = require('electron');
const ProgressBar = require('electron-progressbar');
const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const adm = require('adm-zip');
const os = require('os');
const path = require('path');
const { Mojang, Launch } = require('minecraft-java-core');

const launch_json = new Launch();
const repo = 'dkks112313/dwd';
const file_name = 'setup.zip';

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
    'reg add "HKEY_CLASSES_ROOT\\webpan" /ve /d "Web-Pan" /f',
    'reg add "HKEY_CLASSES_ROOT\\webpan" /v "URL Protocol" /d "" /f',
    'reg add "HKEY_CLASSES_ROOT\\webpan\\shell" /f',
    'reg add "HKEY_CLASSES_ROOT\\webpan\\shell\\open" /f',
    `reg add "HKEY_CLASSES_ROOT\\webpan\\shell\\open\\command" /ve /d "\\"${os.homedir()}\\\\Web-Pan\\\\app.exe\\" \\"%1\\"" /f`
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
        asset_url = asset["browser_download_url"];
      }
    }

    downloadFile(asset_url, file_name)
    .then(() => {
      console.log('File successfully downloaded.');

      const appDataPath = path.join(os.homedir(), 'Web-Pan');

      if (!fs.existsSync(appDataPath)) {
        fs.mkdir(appDataPath, (err) => {
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

      fs.unlink(file_name, (err) => {
        if (err) throw err;
        console.log('File deleted');
      });

      launch(progressBar).then(() => {
        create_register();
      }).catch((e) => {
        console.log(e);
      });
    })
    .catch(err => {
        console.error(`Error downloading file: ${err.message}`);
    });
}

async function launch(progressBar) {
  let option = {
    authenticator: await Mojang.login('name'),
    path: path.join(os.homedir(), 'Web-Pan', 'Minecraft'),
    version: '1.16.5',
    loader: {
      path: './loader',
      type: 'forge',
      build: 'latest',
      enable: true,
    },
    JVM_ARGS: [],
    GAME_ARGS: [],
    java: {
      path: null,
      version: null,
      type: 'jre',
    },
    screen: {
      width: null,
      height: null,
      fullscreen: false,
    },
    memory: {
      min: '4G',
      max: '6G'
    },
  }

  await launch_json.Launch(option);

  launch_json.on('extract', extract => {
    console.log(extract);
  });

  launch_json.on('progress', (progress, size, element) => {
    console.log(`Downloading ${element} ${Math.round((progress / size) * 100)}%`);
    if (element == "Java" && Math.round((progress / size) * 100) == 100) {
      progressBar.setCompleted();
    }
  });

  launch_json.on('check', (progress, size, element) => {
    console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
    if (element == "Java" && Math.round((progress / size) * 100) == 100) {
      progressBar.setCompleted();
    }
  });

  launch_json.on('estimated', (time) => {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - hours * 3600) / 60);
    let seconds = Math.floor(time - hours * 3600 - minutes * 60);
    console.log(`${hours}h ${minutes}m ${seconds}s`);
  })

  launch_json.on('speed', (speed) => {
    console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
  })

  launch_json.on('patch', patch => {
    console.log(patch);
  });

  launch_json.on('data', (e) => {
    console.log(e);
    progressBar.setCompleted();
  })

  launch_json.on('close', code => {
    progressBar.setCompleted();
    console.log(code);
  });

  launch_json.on('error', err => {
    console.log(err);
  });
}
