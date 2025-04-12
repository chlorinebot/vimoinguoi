// data/dbConfig.js
const mysql = require('mysql2/promise');

const dbPool = mysql.createPool({
    host: 'shuttle.proxy.rlwy.net', // Thay bằng host MySQL của bạn
    user: 'root', // Thay bằng username MySQL của bạn
    password: 'WKYnbtwtuHNhuTOIlQgFlwrOpnHOqCxr', // Thay bằng mật khẩu MySQL của bạn
    database: 'ebook', //Thay bằng tên database của bạn
    port: 39675, // Thay bằng port MySQL của bạn
    connectionLimit: 20,// Số lượng kết nối tối đa
    waitForConnections: true, // Cho phép chờ kết nối nếu không có kết nối nào trống
    queueLimit: 0
});

// Middleware kiểm tra kết nối database
const checkDbConnection = async (req, res, next) => {
    try {
        const connection = await dbPool.getConnection();
        await connection.ping();
        connection.release();
        next();
    } catch (err) {
        console.error('Lỗi kiểm tra kết nối database:', err.stack);
        res.status(503).json({ error: 'Dịch vụ không khả dụng, lỗi kết nối database' });
    }
};

// Hàm kiểm tra kết nối khi khởi động
const initializeDb = async () => {
    try {
        const connection = await dbPool.getConnection();
        console.log('Đã kết nối tới MySQL!');
        connection.release();
    } catch (err) {
        console.error('Lỗi kết nối MySQL khi khởi động:', err.stack);
        process.exit(1);
    }
};

module.exports = { dbPool, checkDbConnection, initializeDb };