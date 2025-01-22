const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    sendToMain: (channel, data) => {
        const validChannels = ['play-button-clicked'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data)
        }
    },

    onFromMain: (channel, callback) => {
        const validChannels = ['progress-update'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args))
        }
    }
})
