function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}

document.getElementById('openApp').addEventListener('click', function(event) {
  let options = {};
  const name = document.getElementById('name')
  const version = document.getElementById('select_version')

  if (name.value == '' || name.value == ' ')
      return;

  options['username'] = name.value
  options['uuid'] = uuidv4();
  options['token'] = '';

  const json = JSON.stringify(options)
  var appUrl = `anpan://?options=${encodeURIComponent(json)}&version=${encodeURIComponent(version.value)}`;
  
  //var fallbackUrl = 'https://google.com';

  var iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = appUrl;

  document.body.appendChild(iframe);

  /*var timeout = setTimeout(function() {
      document.body.removeChild(iframe);
      window.location.href = fallbackUrl;
  }, 5000);*/
});
