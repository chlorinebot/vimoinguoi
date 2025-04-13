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
    const connection = await dbPool.getConnection();
    try {
        // Tạo bảng users nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                role_id INT DEFAULT 2,
                avatar VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tạo bảng cards nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS cards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                alternative_title VARCHAR(255),
                description TEXT,
                image VARCHAR(255),
                author VARCHAR(100),
                status VARCHAR(50),
                release_date DATE,
                views INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Tạo bảng chapters nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chapters (
                id INT AUTO_INCREMENT PRIMARY KEY,
                card_id INT NOT NULL,
                chapter_number VARCHAR(10) NOT NULL,
                title VARCHAR(255),
                content TEXT,
                views INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
            )
        `);

        // Tạo bảng genres nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS genres (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tạo bảng card_genres nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS card_genres (
                card_id INT NOT NULL,
                genre_id INT NOT NULL,
                PRIMARY KEY (card_id, genre_id),
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
                FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
            )
        `);

        // Tạo bảng favorites nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                user_id INT NOT NULL,
                card_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, card_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
            )
        `);

        // Tạo bảng reading_history nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS reading_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                card_id INT NOT NULL,
                chapter_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
            )
        `);

        // Tạo bảng comments nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                chapter_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                like_count INT DEFAULT 0,
                dislike_count INT DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
            )
        `);

        // Tạo bảng comment_replies nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS comment_replies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                comment_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                like_count INT DEFAULT 0,
                dislike_count INT DEFAULT 0,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Tạo bảng reports nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                email VARCHAR(255),
                reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('pending', 'processed') DEFAULT 'pending',
                processed_at DATETIME DEFAULT NULL,
                notes TEXT DEFAULT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Tạo bảng shares nếu chưa tồn tại
        await connection.query(`
            CREATE TABLE IF NOT EXISTS shares (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                card_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
            )
        `);

        console.log('Khởi tạo database thành công');
    } catch (err) {
        console.error('Lỗi khi khởi tạo database:', err);
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = { dbPool, checkDbConnection, initializeDb };