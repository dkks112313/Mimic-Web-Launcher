const { app } = require('electron');
const ProgressBar = require('electron-progressbar');
const { Mojang, Launch } = require('minecraft-java-core');
const process = require('process');
const url = require('url');
const path = require('path');
const os = require('os');

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
})

async function launchTask(progressBar) {
  const launch = new Launch();
  const params = JSON.parse(url.parse(process.argv[2], true).query['options']);

  let mode = null;
  let enables = false;
  if (params['mode'] == 'Forge' || params['mode'] == 'Fabric' 
    || params['mode'] == 'Quilt' || params['mode'] == 'Neoforge') {
    mode = params['mode'].toLowerCase();
    enables = true;
  }

  let option = {
    authenticator: await Mojang.login(params['name']),
    url: null,
    authenticator: null,
    path: path.join(os.homedir(), 'Web-Pan', 'RMinecraft'),
    version: params['version'],
    instance: null,
    detached: false,
    intelEnabledMac: false,
    loader: {
      path: path.join(os.homedir(), 'Web-Pan', 'RMinecraft', 'loader'),
      type: mode,
      build: 'latest',
      enable: enables,
    },
    mcp: null,
    verify: false,
    ignored: [],
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

  await launch.Launch(option);

  launch.on('extract', extract => {
      console.log(extract);
  });

  launch.on('progress', (progress, size, element) => {
      console.log(`Downloading ${element} ${Math.round((progress / size) * 100)}%`);
  });

  launch.on('check', (progress, size, element) => {
      console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
  });

  launch.on('estimated', (time) => {
      let hours = Math.floor(time / 3600);
      let minutes = Math.floor((time - hours * 3600) / 60);
      let seconds = Math.floor(time - hours * 3600 - minutes * 60);
      console.log(`${hours}h ${minutes}m ${seconds}s`);
  })

  launch.on('speed', (speed) => {
      console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
  })

  launch.on('patch', patch => {
      console.log(patch);
  });

  launch.on('data', (e) => {
      progressBar._window.hide();
      console.log(e);
  })

  launch.on('close', code => {
      progressBar.setCompleted();
      console.log(code);
  });

  launch.on('error', err => {
      console.log(err);
  });
}
