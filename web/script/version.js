const version_list = document.getElementById('select_version');
fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
    .then(r => r.json())
    .then(names => {
        for(let i = 0; i < names['versions'].length; i++) {
            let newOption = new Option(names['versions'][i]['id'], names['versions'][i]['id']);
            version_list.append(newOption);
        }
    });