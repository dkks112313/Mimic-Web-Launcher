/*function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}*/

document.getElementById('openApp').addEventListener('click', function(event) {
  const name = document.getElementById('name');
  const version = document.getElementById('select_version');

  if (name.value == '' || name.value == ' ')
      return;

  const options = {
    name: name.value,
    version: version.value
  };

  const json = JSON.stringify(options);
  let appUrl = `anpan://?options=${encodeURIComponent(json)}`;
  console.log(appUrl)

  let iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = appUrl;

  document.body.appendChild(iframe);
 
  let timeout = setTimeout(function() {
    window.location.href = 'https://github.com/dkks112313/dwd/releases/download/1/web-pan.1.0.0.exe';
    document.body.removeChild(iframe);
  }, 1000);

  window.addEventListener('blur', function() {
    clearTimeout(timeout);
    document.body.removeChild(iframe);
  });
});

/*document.getElementById('openDir').addEventListener('click', function(event) {
  let appUrl = `anpan://?dir=true`;

  var iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = appUrl;

  document.body.appendChild(iframe);

  let timeout = setTimeout(function() {
    window.location.href = 'https://github.com/dkks112313/dwd/releases/download/1/web-pan.1.0.0.exe';
  }, 1000);

  window.addEventListener('blur', function() {
    clearTimeout(timeout);
    document.body.removeChild(iframe);
  });
})*/