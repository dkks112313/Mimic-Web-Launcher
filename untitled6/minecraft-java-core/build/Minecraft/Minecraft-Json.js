"use strict";
/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Minecraft_Lwjgl_Native_js_1 = __importDefault(require("./Minecraft-Lwjgl-Native.js"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const os_1 = __importDefault(require("os"));
class Json {
    constructor(options) {
        this.options = options;
    }
    async GetInfoVersion() {
        let version = this.options.version;
        let data = await (0, node_fetch_1.default)(`https://launchermeta.mojang.com/mc/game/version_manifest_v2.json?_t=${new Date().toISOString()}`);
        data = await data.json();
        if (version == 'latest_release' || version == 'r' || version == 'lr') {
            version = data.latest.release;
        }
        else if (version == 'latest_snapshot' || version == 's' || version == 'ls') {
            version = data.latest.snapshot;
        }
        data = data.versions.find(v => v.id === version);
        if (!data)
            return {
                error: true,
                message: `Minecraft ${version} is not found.`
            };
        let json = await (0, node_fetch_1.default)(data.url).then(res => res.json());
        if (os_1.default.platform() == 'linux' && os_1.default.arch().startsWith('arm'))
            json = await new Minecraft_Lwjgl_Native_js_1.default(this.options).ProcessJson(json);
        return {
            InfoVersion: data,
            json: json,
            version: version
        };
    }
}
exports.default = Json;
