import os
import copy
import json
import platform
import subprocess
import sys
import uuid
import urllib.parse


class VersionNotFound(ValueError):
    def __init__(self, version: str) -> None:
        self.version: str = version
        "The version that caused the exception"

        self.msg: str = f"Version {version} was not found"
        "A message to display"

        ValueError.__init__(self, self.msg)


def get_arguments_string(versionData, path, options, classpath):
    arglist = []

    for v in versionData["minecraftArguments"].split(" "):
        v = replace_arguments(v, versionData, path, options, classpath)
        arglist.append(v)

    if options.get("customResolution", False):
        arglist.append("--width")
        arglist.append(options.get("resolutionWidth", "854"))
        arglist.append("--height")
        arglist.append(options.get("resolutionHeight", "480"))

    if options.get("demo", False):
        arglist.append("--demo")

    return arglist


def get_arguments(data, versionData, path, options, classpath):
    arglist = []
    for i in data:
        if isinstance(i, str):
            arglist.append(replace_arguments(i, versionData, path, options, classpath))
        else:
            if "compatibilityRules" in i and not parse_rule_list(i["compatibilityRules"], options):
                continue

            if "rules" in i and not parse_rule_list(i["rules"], options):
                continue

            if isinstance(i["value"], str):
                arglist.append(replace_arguments(i["value"], versionData, path, options, classpath))
            else:
                for v in i["value"]:
                    v = replace_arguments(v, versionData, path, options, classpath)
                    arglist.append(v)
    return arglist


def _get_jvm_platform_string():
    if platform.system() == "Windows":
        if platform.architecture()[0] == "32bit":
            return "windows-x86"
        else:
            return "windows-x64"
    elif platform.system() == "Linux":
        if platform.architecture()[0] == "32bit":
            return "linux-i386"
        else:
            return "linux"
    elif platform.system() == "Darwin":
        if platform.machine() == "arm64":
            return "mac-os-arm64"
        else:
            return "mac-os"
    else:
        return "gamecore"


def get_library_version():
    _version_cache = '6.5'
    return _version_cache


def replace_arguments(argstr, versionData, path, options, classpath):
    argstr = argstr.replace("${natives_directory}", options["nativesDirectory"])
    argstr = argstr.replace("${launcher_name}", options.get("launcherName", "minecraft-launcher-lib"))
    argstr = argstr.replace("${launcher_version}", options.get("launcherVersion", get_library_version()))
    argstr = argstr.replace("${classpath}", classpath)
    argstr = argstr.replace("${auth_player_name}", options.get("username", "{username}"))
    argstr = argstr.replace("${version_name}", versionData["id"])
    argstr = argstr.replace("${game_directory}", options.get("gameDirectory", path))
    argstr = argstr.replace("${assets_root}", os.path.join(path, "assets"))
    argstr = argstr.replace("${assets_index_name}", versionData.get("assets", versionData["id"]))
    argstr = argstr.replace("${auth_uuid}", options.get("uuid", "{uuid}"))
    argstr = argstr.replace("${auth_access_token}", options.get("token", "{token}"))
    argstr = argstr.replace("${user_type}", "msa")
    argstr = argstr.replace("${version_type}", versionData["type"])
    argstr = argstr.replace("${user_properties}", "{}")
    argstr = argstr.replace("${resolution_width}", options.get("resolutionWidth", "854"))
    argstr = argstr.replace("${resolution_height}", options.get("resolutionHeight", "480"))
    argstr = argstr.replace("${game_assets}", os.path.join(path, "assets", "virtual", "legacy"))
    argstr = argstr.replace("${auth_session}", options.get("token", "{token}"))
    argstr = argstr.replace("${library_directory}", os.path.join(path, "libraries"))
    argstr = argstr.replace("${classpath_separator}", get_classpath_separator())
    argstr = argstr.replace("${quickPlayPath}", options.get("quickPlayPath") or "{quickPlayPath}")
    argstr = argstr.replace("${quickPlaySingleplayer}",
                            options.get("quickPlaySingleplayer") or "{quickPlaySingleplayer}")
    argstr = argstr.replace("${quickPlayMultiplayer}", options.get("quickPlayMultiplayer") or "{quickPlayMultiplayer}")
    argstr = argstr.replace("${quickPlayRealms}", options.get("quickPlayRealms") or "{quickPlayRealms}")
    return argstr


def get_executable_path(jvm_version, minecraft_directory):
    java_path = os.path.join(minecraft_directory, "runtime", jvm_version, _get_jvm_platform_string(), jvm_version,
                             "bin", "java")
    if os.path.isfile(java_path):
        return java_path
    elif os.path.isfile(java_path + ".exe"):
        return java_path + ".exe"
    java_path = java_path.replace(os.path.join("bin", "java"),
                                  os.path.join("jre.bundle", "Contents", "Home", "bin", "java"))
    if os.path.isfile(java_path):
        return java_path
    else:
        return None


def get_natives(data):
    if platform.architecture()[0] == "32bit":
        arch_type = "32"
    else:
        arch_type = "64"

    if "natives" in data:
        if platform.system() == 'Windows':
            if "windows" in data["natives"]:
                return data["natives"]["windows"].replace("${arch}", arch_type)
            else:
                return ""
        elif platform.system() == 'Darwin':
            if "osx" in data["natives"]:
                return data["natives"]["osx"].replace("${arch}", arch_type)
            else:
                return ""
        else:
            if "linux" in data["natives"]:
                return data["natives"]["linux"].replace("${arch}", arch_type)
            else:
                return ""
    else:
        return ""


def get_classpath_separator():
    if platform.system() == "Windows":
        return ";"
    else:
        return ":"


def parse_single_rule(rule, options):
    returnvalue = None

    if rule["action"] == "allow":
        returnvalue = False
    elif rule["action"] == "disallow":
        returnvalue = True

    for os_key, os_value in rule.get("os", {}).items():
        if os_key == "name":
            if os_value == "windows" and platform.system() != 'Windows':
                return returnvalue
            elif os_value == "osx" and platform.system() != 'Darwin':
                return returnvalue
            elif os_value == "linux" and platform.system() != 'Linux':
                return returnvalue
        elif os_key == "arch":
            if os_value == "x86" and platform.architecture()[0] != "32bit":
                return returnvalue
        elif os_key == "version":
            if not re.match(os_value, get_os_version()):
                return returnvalue

    for features_key in rule.get("features", {}).keys():
        if features_key == "has_custom_resolution" and not options.get("customResolution", False):
            return returnvalue
        elif features_key == "is_demo_user" and not options.get("demo", False):
            return returnvalue
        elif features_key == "has_quick_plays_support" and options.get("quickPlayPath") is None:
            return returnvalue
        elif features_key == "is_quick_play_singleplayer" and options.get("quickPlaySingleplayer") is None:
            return returnvalue
        elif features_key == "is_quick_play_multiplayer" and options.get("quickPlayMultiplayer") is None:
            return returnvalue
        elif features_key == "is_quick_play_realms" and options.get("quickPlayRealms") is None:
            return returnvalue

    return not returnvalue


def get_library_path(name, path):
    libpath = os.path.join(path, "libraries")
    parts = name.split(":")
    base_path, libname, version = parts[0:3]
    for i in base_path.split("."):
        libpath = os.path.join(libpath, i)
    try:
        version, fileend = version.split("@")
    except ValueError:
        fileend = "jar"

    filename = f"{libname}-{version}{''.join(map(lambda p: f'-{p}', parts[3:]))}.{fileend}"
    libpath = os.path.join(libpath, libname, version, filename)
    return libpath


def parse_rule_list(rules, options):
    for i in rules:
        if not parse_single_rule(i, options):
            return False

    return True


def get_libraries(data, path):
    classpath_seperator = get_classpath_separator()
    libstr = ""
    for i in data["libraries"]:
        if "rules" in i and not parse_rule_list(i["rules"], {}):
            continue

        libstr += get_library_path(i["name"], path) + classpath_seperator
        native = get_natives(i)
        if native != "":
            if "downloads" in i and "path" in i["downloads"]["classifiers"][native]:
                libstr += os.path.join(path, "libraries", i["downloads"]["classifiers"][native][
                    "path"]) + classpath_seperator
            else:
                libstr += get_library_path(i["name"] + "-" + native, path) + classpath_seperator

    if "jar" in data:
        libstr = libstr + os.path.join(path, "versions", data["jar"], data["jar"] + ".jar")
    else:
        libstr = libstr + os.path.join(path, "versions", data["id"], data["id"] + ".jar")

    return libstr


def inherit_json(original_data, path):
    inherit_version = original_data["inheritsFrom"]

    with open(os.path.join(path, "versions", inherit_version, inherit_version + ".json")) as f:
        new_data = json.load(f)

    for key, value in original_data.items():
        if isinstance(value, list) and isinstance(new_data.get(key, None), list):
            new_data[key] = value + new_data[key]  # type: ignore
        elif isinstance(value, dict) and isinstance(new_data.get(key, None), dict):
            for a, b in value.items():
                if isinstance(b, list):
                    new_data[key][a] = new_data[key][a] + b
        else:
            new_data[key] = value

    return new_data


def get_minecraft_command(version, minecraft_directory, options):
    path = str(minecraft_directory)

    if not os.path.isdir(os.path.join(path, "versions", version)):
        raise VersionNotFound(version)

    options = copy.deepcopy(options)

    with open(os.path.join(path, "versions", version, version + ".json"), "r", encoding="utf-8") as f:
        data: ClientJson = json.load(f)

    if "inheritsFrom" in data:
        data = inherit_json(data, path)

    options["nativesDirectory"] = options.get("nativesDirectory", os.path.join(path, "versions", data["id"], "natives"))
    classpath = get_libraries(data, path)

    command = []
    if "executablePath" in options:
        command.append(options["executablePath"])
    elif "javaVersion" in data:
        java_path = get_executable_path(data["javaVersion"]["component"], path)
        if java_path is None:
            command.append("java")
        else:
            command.append(java_path)
    else:
        command.append(options.get("defaultExecutablePath", "java"))

    if "jvmArguments" in options:
        command = command + options["jvmArguments"]

    if isinstance(data.get("arguments", None), dict):
        if "jvm" in data["arguments"]:
            command = command + get_arguments(data["arguments"]["jvm"], data, path, options, classpath)
        else:
            command.append("-Djava.library.path=" + options["nativesDirectory"])
            command.append("-cp")
            command.append(classpath)
    else:
        command.append("-Djava.library.path=" + options["nativesDirectory"])
        command.append("-cp")
        command.append(classpath)

    if options.get("enableLoggingConfig", False):
        if "logging" in data:
            if len(data["logging"]) != 0:
                logger_file = os.path.join(path, "assets", "log_configs", data["logging"]["client"]["file"]["id"])
                command.append(data["logging"]["client"]["argument"].replace("${path}", logger_file))

    command.append(data["mainClass"])

    if "minecraftArguments" in data:
        command = command + get_arguments_string(data, path, options, classpath)
    else:
        command = command + get_arguments(data["arguments"]["game"], data, path, options, classpath)

    if "server" in options:
        command.append("--server")
        command.append(options["server"])
        if "port" in options:
            command.append("--port")
            command.append(options["port"])

    if options.get("disableMultiplayer", False):
        command.append("--disableMultiplayer")

    if options.get("disableChat", False):
        command.append("--disableChat")

    return command


os.makedirs(os.path.join(os.getenv('APPDATA'), '.anpan'), exist_ok=True)

if len(sys.argv) > 1:
    url = sys.argv[1]
    parsed_url = urllib.parse.urlparse(url)
    query_params = urllib.parse.parse_qs(parsed_url.query)

    dir = query_params.get('dir', [None])[0]
    if dir == 'true':
        subprocess.Popen("explorer " + os.path.join(os.getenv('APPDATA'), '.anpan'),
                         creationflags=subprocess.CREATE_NO_WINDOW)
        sys.exit(0)

    data_param = query_params.get('options', [None])[0]
    name_param = query_params.get('name', [None])[0]
    version_param = query_params.get('version', [None])[0]

    data_dict = json.loads(data_param)
    version = version_param
    name = name_param

    if not os.path.isdir(os.path.join(os.getenv('APPDATA'), '.anpan', version)):
        subprocess.Popen([os.path.join(os.path.expanduser('~'), 'An-Pan', 'install.exe'), name, version], creationflags=subprocess.CREATE_NO_WINDOW)
        sys.exit(0)

    command = ''
    try:
        command = get_minecraft_command(version, os.path.join(os.getenv('APPDATA'), '.anpan', version),
                                        data_dict)
        subprocess.Popen(command, creationflags=subprocess.CREATE_NO_WINDOW)
    except VersionNotFound:
        pass
