const { app } = require('electron');
const ProgressBar = require('electron-progressbar');
const { Mojang, Launch } = require('minecraft-java-core');
const { Client, Authenticator } = require('minecraft-launcher-core');
const { forge } = require('tomate-loaders');
const process = require('process');
const url = require('url');
const path = require('path');
const os = require('os');
const fs = require('fs');

const launch_toml = new Client();
const launch_json = new Launch();

const params = JSON.parse(url.parse(process.argv[2], true).query['options']);

app.on('ready', function() {
  let progressBar = new ProgressBar({
    text: 'Preparing data...',
    detail: 'Wait...',
    style: {
			text: {
				'font-weight': 'bold',
				'color': '#B11C11'
			},
			detail: {
				'color': '#3F51B5'
			},
			bar: {
				'background': '#FFD2CF'
			},
			value: {
				'background': '#F44336'
			}
		},
    browserWindow: {
      width: 1000,
      backgroundColor: '#18191a'
    }
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

function find_jre8(callback) {
  const path_jre = `${path.join(os.homedir(), 'Web-Pan', 'Minecraft', 'runtime')}`;

  let files = fs.readdirSync(path_jre);

  for (let file of files) {
    if (file.substring(0, 5) === 'jre-8') {
      return file;
    }
  }
}

async function launchTask(progressBar) {
  if(params['dir']) {
    progressBar.setCompleted();
  }

  let mode = null;
  let enables = false;
  if (params['mode'] === 'Forge' || params['mode'] === 'Fabric'
    || params['mode'] === 'Quilt' || params['mode'] === 'Neoforge') {
    mode = params['mode'].toLowerCase();
    enables = true;
  }

  let option= {
    authenticator: await Mojang.login(params['name']),
    path: path.join(os.homedir(), 'Web-Pan', 'Minecraft'),
    version: params['version'],
    loader: {
      path: '',
      type: mode,
      build: 'latest',
      enable: enables,
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

  if ((params['version'] === '1.16.5' || params['version'] === '1.16.4' ||
    params['version'] === '1.16.3' || params['version'] === '1.16.2' ||
    params['version'] === '1.16.1' || params['version'] === '1.15.2') && params['mode'] === 'Forge') {
        fs.stat(`${path.join(os.homedir(), 'Web-Pan', 'Minecraft', 'versions', params['version'])}`, function(err, stat) {
          if(!err) {
            fs.rm(path.join(os.homedir(), 'Web-Pan', 'Minecraft', 'versions', params['version']), { recursive:true }, (err) => {
              console.log('Dir, del');
            });
            forge.getMCLCLaunchConfig({
              gameVersion: params['version'],
              rootPath: './Minecraft',
            }); 
          }
          else if (err.code === 'ENOENT') {
            forge.getMCLCLaunchConfig({
              gameVersion: params['version'],
              rootPath: './Minecraft',
            });
          }
        });
  
        await launch_toml.launch({
          authorization: Authenticator.getAuth(params['name']),
            root: `${path.join(os.homedir(), 'Web-Pan', 'Minecraft')}`,
            version: {
                number: params['version'],
                type: "release"
            },
            memory: {
                max: "6G",
                min: "4G"
            },
            overrides: {
                detached: false
            },
            fw: {
              version: '1.6.0'
            },
            forge: `./Minecraft/versions/forge-${params['version']}/forge.jar`,
            javaPath: path.resolve(`${path.join(os.homedir(), 'Web-Pan', 'Minecraft', 'runtime', find_jre8(), 'bin', 'java.exe')}`),
            customArgs: ['-Dminecraft.api.env=custom',
                        '-Dminecraft.api.auth.host=https://invalid.invalid/',
                        '-Dminecraft.api.account.host=https://invalid.invalid/',
                        '-Dminecraft.api.session.host=https://invalid.invalid/',
                        '-Dminecraft.api.services.host=https://invalid.invalid/']
        });
        
        launch_toml.on('debug', (e) => console.log(e));
        launch_toml.on('data', (e) => {
          progressBar._window.hide();
          console.log(e);
        });
        launch_toml.on('close', (e) => {
          progressBar.setCompleted();
          console.log(e);
        })
      }
  else {
    await launch_json.Launch(option);

    launch_json.on('extract', extract => {
      console.log(extract);
    });

    launch_json.on('progress', (progress, size, element) => {
      console.log(`Downloading ${element} ${Math.round((progress / size) * 100)}%`);
    });

    launch_json.on('check', (progress, size, element) => {
      console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
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
      progressBar._window.hide();
      console.log(e);
    })

    launch_json.on('close', code => {
      progressBar.setCompleted();
      console.log(code);
    });

    launch_json.on('error', err => {
      console.log(err);
    });
  }
}
