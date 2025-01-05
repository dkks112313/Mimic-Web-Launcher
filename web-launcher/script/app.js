document.getElementById('openApp').addEventListener('click', function(event) {
  const name = document.getElementById('name');
  const version = document.getElementById('select_version');
  const mode = document.getElementById('select_mode')

  let result = version.options[version.selectedIndex].text;

  if (name.value == '')
      return;

  const options = {
    name: name.value,
    version: result,
    mode: mode.value
  };

  const json = JSON.stringify(options);
  let appUrl = `webpan://?options=${encodeURIComponent(json)}`;
  console.log(appUrl)

  let iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = appUrl;

  document.body.appendChild(iframe);
 
  let timeout = setTimeout(function() {
    document.body.removeChild(iframe);
    window.location.href = 'https://github.com/dkks112313/dwd/releases/download/1/web-pan.1.0.0.exe';
  }, 10000);

  window.addEventListener('blur', function() {
    clearTimeout(timeout);
    document.body.removeChild(iframe);
  });
});

document.getElementById('openDir').addEventListener('click', function(event) {
  const options = {
    dir: "true"
  };

  const json = JSON.stringify(options);
  let appUrl = `webpan://?options=${encodeURIComponent(json)}`;
  console.log(appUrl);

  var iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = appUrl;

  document.body.appendChild(iframe);

  let timeout = setTimeout(function() {
    document.body.removeChild(iframe);
    window.location.href = 'https://github.com/dkks112313/dwd/releases/download/1/web-pan.1.0.0.exe';
  }, 10000);

  window.addEventListener('blur', function() {
    clearTimeout(timeout);
    document.body.removeChild(iframe);
  });
})
