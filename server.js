// server.js (hoặc tên file bạn đặt, ví dụ: start-db.js)

const { spawn } = require('child_process');
const path = require('path');

// --- Cấu hình Đường dẫn và Cổng ---

// 1. Định nghĩa đường dẫn tới file db.json
//    path.join(__dirname, 'db.json') là cách tốt nhất để đảm bảo
//    đường dẫn tương đối chính xác, không phụ thuộc vào thư mục bạn chạy lệnh.
//    Đảm bảo file db.json nằm cùng cấp với file server.js này.
const dbPath = path.join(__dirname, 'db.json');

// 2. Định nghĩa cổng mà JSON Server sẽ chạy
const port = '3006'; // Hoặc thử cổng khác như '4000' nếu 3000 bị xung đột
const host = '0.0.0.0'; // Chấp nhận kết nối từ mọi địa chỉ IP

// --- Kiểm tra trước khi chạy (Tùy chọn nhưng hữu ích) ---
console.log(`Đang cố gắng khởi động JSON Server với các cài đặt:`);
console.log(`  File DB: ${dbPath}`);
console.log(`  Cổng: ${port}`);
console.log(`  Host: ${host}`);


// --- Khởi chạy JSON Server ---

const child = spawn('npx', [
    'json-server',
    '--watch', dbPath, // Sử dụng cờ --watch để theo dõi thay đổi trong db.json
    '--port', port,
    '--host', host
], {
    shell: true, // Quan trọng: Chạy lệnh trong một shell.
                 // Điều này giúp npx và json-server được tìm thấy trong PATH.
    stdio: 'inherit' // Quan trọng: Hiển thị output của JSON Server trực tiếp ra console của Node.js
});

// --- Xử lý sự kiện từ tiến trình con ---

child.on('error', (err) => {
    // Xảy ra lỗi nếu không thể spawn (ví dụ: lệnh 'npx' không tìm thấy)
    console.error('----------------------------------------------------');
    console.error('LỖI: Không thể khởi chạy JSON Server.');
    console.error('Vui lòng kiểm tra các điều sau:');
    console.error('1. Đảm bảo Node.js và npm (npx) đã được cài đặt đúng.');
    console.error('2. Đảm bảo json-server đã được cài đặt (npm install -g json-server).');
    console.error(`Chi tiết lỗi: ${err.message}`);
    console.error('----------------------------------------------------');
});

child.on('exit', (code, signal) => {
    // Xảy ra khi JSON Server thoát
    if (code !== 0) {
        console.warn(`JSON Server đã thoát với mã LỖI: ${code}`);
        console.warn(`Tín hiệu thoát: ${signal || 'Không có'}`);
        console.warn('Điều này có thể do một lỗi bên trong JSON Server hoặc xung đột cổng.');
    } else {
        console.log(`JSON Server đã thoát thành công với mã: ${code}`);
    }
});

// Xử lý sự kiện thoát của tiến trình Node.js chính
process.on('SIGINT', () => {
    console.log('\nPhát hiện Ctrl+C. Đang cố gắng đóng JSON Server...');
    child.kill('SIGINT'); // Gửi tín hiệu SIGINT để đóng JSON Server một cách duyên dáng
});

process.on('SIGTERM', () => {
    console.log('\nPhát hiện SIGTERM. Đang đóng JSON Server...');
    child.kill('SIGTERM');
});