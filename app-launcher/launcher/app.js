const { Client, Authenticator } = require('minecraft-launcher-core');
const launcher = new Client();

const options = {
    clientPackage: null,
    authorization: Authenticator.getAuth("Dev"),
    root: "./minecraft",
    version: {
        number: "1.20.1",
        type: "release"
    },
    memory: {
        max: "6G",
        min: "4G"
    },
    javaPath: 'C:\\Program Files\\Java\\jdk-17\\bin\\java.exe'
};

launcher.launch(options);

launcher.on('debug', (e) => console.log('[DEBUG]', e));
launcher.on('data', (e) => console.log('[DATA]', e));
