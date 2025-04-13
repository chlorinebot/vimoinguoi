// controllers/profileController.js
const { dbPool } = require('../data/dbConfig');

// Lấy thông tin hồ sơ người dùng
const getUserProfile = async (req, res) => {
    const { userId } = req.params;
    let connection; // Khai báo connection ở đây để finally có thể truy cập
    try {
        connection = await dbPool.getConnection();
        // Sửa câu lệnh SQL để lấy thêm cột avatar và đổi tên thành avatar_url
        const [rows] = await connection.query(
            'SELECT id, username, email, role_id, created_at, avatar AS avatar_url FROM users WHERE id = ?',
            [userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        res.json(rows[0]); // Trả về thông tin bao gồm cả avatar_url
    } catch (err) {
        console.error('Lỗi khi lấy thông tin người dùng:', err);
        res.status(500).json({ error: 'Lỗi khi lấy thông tin người dùng', details: err.message });
    } finally {
        if (connection) connection.release(); // Đảm bảo giải phóng kết nối
    }
};

// Lấy danh sách truyện yêu thích của người dùng
const getUserFavorites = async (req, res) => {
    const { userId } = req.params;
    const connection = await dbPool.getConnection();
    try {
        // Kiểm tra userId có hợp lệ không
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ error: 'ID người dùng không hợp lệ' });
        }

        // Truy vấn lấy danh sách truyện yêu thích
        const [rows] = await connection.query(
            `SELECT c.id, c.title, c.image 
             FROM favorites f 
             JOIN cards c ON f.card_id = c.id 
             WHERE f.user_id = ?`,
            [userId]
        );

        // Trả về danh sách truyện yêu thích (có thể rỗng)
        res.json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách truyện yêu thích:', err);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách truyện yêu thích', details: err.message });
    } finally {
        connection.release();
    }
};

module.exports = {
    getUserProfile,
    getUserFavorites
};