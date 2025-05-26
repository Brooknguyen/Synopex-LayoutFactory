const Service = require('node-windows').Service;
const path = require('path');

// Tạo một service mới
const svc = new Service({
  name: 'FACTORY',
  description: 'Chạy JSON Server như một Windows Service',
  script: path.join(__dirname, 'server.js')
});

// Lắng nghe sự kiện khi service được cài thành công
svc.on('install', () => {
  console.log('Service installed!');
  svc.start(); // Bắt đầu service sau khi cài
});

svc.on('alreadyinstalled', () => {
  console.log('Service đã được cài trước đó.');
});

svc.on('error', err => {
  console.error('Lỗi:', err);
});

// Cài service
svc.install();