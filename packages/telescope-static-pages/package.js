Package.describe({
  summary: "Telescope static pages package",
  version: '0.1.0',
  name: "telescope-static-pages"
});

Package.onUse(function (api) {

  api.use([
    'templating'
  ], ['client']);

  api.use([
    'telescope-lib',
    'telescope-base',
    'iron:router'
  ], ['client', 'server']);

  api.add_files([
    'lib/client/templates/about_page.html',
    'lib/client/templates/about_page.js',
    'lib/client/templates/about_link.html',
    'lib/client/about.js',
    'lib/client/templates/leader_page.html',
    'lib/client/templates/leader_page.js',
    'lib/client/templates/share_page.html',
    'lib/client/templates/share_page.js'
  ], ['client']);

  api.add_files([
    'lib/server/methods.js'
    ], ['server']);

});
