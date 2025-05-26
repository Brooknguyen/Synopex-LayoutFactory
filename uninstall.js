const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'JSON Server Service',
  script: path.join(__dirname, 'server.js')
});

svc.on('uninstall', () => {
  console.log('Service uninstalled');
});

svc.uninstall();
