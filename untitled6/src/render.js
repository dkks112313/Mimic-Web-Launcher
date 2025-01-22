document.getElementById('progress').addEventListener('click', () => {
    const name = document.getElementById('greet-input').value
    let version = document.getElementById('greet-select')
    let selectedMode = document.getElementById('greet-sel')

    version = version.options[version.selectedIndex].text
    selectedMode = selectedMode.options[selectedMode.selectedIndex].text

    if (window.electron) {
        window.electron.sendToMain('play-button-clicked', { name, version, selectedMode })
    } else {
        console.error("window.electron is undefined")
    }
})

if (window.electron) {
    window.electron.onFromMain('progress-update', (progress) => {
        console.log(`Progress update: ${progress}%`)
    })
} else {
    console.error("window.electron is undefined")
}
