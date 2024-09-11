import subprocess
import minecraft_launcher_lib
import platform
import uuid
import sys
import os
import urllib
import json
import signal

url = sys.argv[1]
parsed_url = urllib.parse.urlparse(url)
query_params = urllib.parse.parse_qs(parsed_url.query)

variable_params = json.loads(query_params['options'][0])

name_param = str(variable_params.get('name', [None]))
version_param = str(variable_params.get('version', [None]))
type_param = str(variable_params.get('type', [None]))
mode_param = str(variable_params.get('mode', [None]))
dir_param = str(variable_params.get('dir', [None]))
'''
if dir_param:
    subprocess.Popen(f'explorer {os.path.join("bebr", "Web-Pan", "Minecraft")}', creationflags=subprocess.CREATE_NO_WINDOW)
    sys.exit(0)

process = None
if not (mode_param == 'Forge' and (version_param == '1.16.5'
                                   or version_param == '1.16.4' or version_param == '1.16.3'
                                   or version_param == '1.16.2' or version_param == '1.16.1' or version_param == '1.15.2')):
    subprocess.Popen(f'setup.exe {sys.argv[1]}', creationflags=subprocess.CREATE_NO_WINDOW)
else:
    process = subprocess.Popen('setup-without.exe', creationflags=subprocess.CREATE_NO_WINDOW)'''

core = ''
if platform.system() == "Windows":
    if platform.architecture()[0] == "32bit":
        core = "windows-x86"
    else:
        core = "windows-x64"
elif platform.system() == "Linux":
    if platform.architecture()[0] == "32bit":
        core = "linux-i386"
    else:
        core = "linux"
elif platform.system() == "Darwin":
    if platform.machine() == "arm64":
        core = "mac-os-arm64"
    else:
        core = "mac-os"

options = {
    'username': name_param,
    'uuid': str(uuid.uuid4()),
    'token': '',
    'jvmArguments': ['-Dminecraft.api.env=custom',
                     '-Dminecraft.api.auth.host=https://invalid.invalid/',
                     '-Dminecraft.api.account.host=https://invalid.invalid/',
                     '-Dminecraft.api.session.host=https://invalid.invalid/',
                     '-Dminecraft.api.services.host=https://invalid.invalid/']
}

versions = {
    '1.16.5': '1.16.5-forge-36.2.42',
    '1.16.4': '1.16.4-forge-35.1.37',
    '1.16.3': '1.16.3-forge-34.1.42',
    '1.16.2': '1.16.2-forge-33.0.61',
    '1.16.1': '1.16.1-forge-32.0.108',
    '1.15.2': '1.15.2-forge-31.2.57',
}

os.makedirs(os.path.join(os.path.expanduser("~"), 'Web-Pan', 'LMinecraft'), exist_ok=True)
minecraft_directory = os.path.join(os.path.expanduser("~"), 'Web-Pan', 'LMinecraft')

minecraft_launcher_lib.forge.install_forge_version(minecraft_launcher_lib.forge.find_forge_version(version_param),
                                                   minecraft_directory,
                                                   java=f'{minecraft_directory}\\runtime\\jre-legacy\\{core}\\jre-legacy\\bin\\java.exe')

command = minecraft_launcher_lib.command.get_minecraft_command(versions[version_param],
                                                               minecraft_directory,
                                                               options)

if process is not None:
    os.kill(process.pid, signal.SIGTERM)

subprocess.Popen(command, creationflags=subprocess.CREATE_NO_WINDOW)
