const {exec} = require('child_process');

const commands = [
    'reg delete "HKEY_CLASSES_ROOT\\anpan" /f',
    'reg delete "HKEY_CLASSES_ROOT\\anpan" /f',
    'reg delete "HKEY_CLASSES_ROOT\\anpan\\shell" /f',
    'reg delete "HKEY_CLASSES_ROOT\\anpan\\shell\\open" /f',
    'reg delete "HKEY_CLASSES_ROOT\\anpan\\shell\\open\\command" /f'
  ];

commands.forEach(command => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}\n${error}`);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
    });
});