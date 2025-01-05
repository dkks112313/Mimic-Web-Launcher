const { Client, Authenticator } = require('minecraft-launcher-core');
const { forge } = require('tomate-loaders');
const path = require('path');

const launcher = new Client();

forge.getMCLCLaunchConfig({
  gameVersion: '1.16.5',
  rootPath: './Minecraft',
});

launcher.launch({
  authorization: Authenticator.getAuth("username"),
    root: './Minecraft',
    version: {
        number: "1.16.5",
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
    forge: './Minecraft/versions/forge-1.16.5/forge.jar',
    javaPath: path.resolve("C:/Users/ovcha/web-launcher/app-launcher/Minecraft/runtime/jre-8u51-windows-x64/bin/java.exe"),
    customArgs: ['-Dminecraft.api.env=custom',
                '-Dminecraft.api.auth.host=https://invalid.invalid/',
                '-Dminecraft.api.account.host=https://invalid.invalid/',
                '-Dminecraft.api.session.host=https://invalid.invalid/',
                '-Dminecraft.api.services.host=https://invalid.invalid/']
});

launcher.on('debug', (e) => console.log(e));
launcher.on('data', (e) => console.log(e));
