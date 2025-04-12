// controllers/profileController.js
const { dbPool } = require('../data/dbConfig');

// Lấy thông tin hồ sơ người dùng
const getUserProfile = async (req, res) => {
    const { userId } = req.params;
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT username, email, created_at FROM users WHERE id = ?',
            [userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Lỗi khi lấy thông tin người dùng:', err);
        res.status(500).json({ error: 'Lỗi khi lấy thông tin người dùng', details: err.message });
    } finally {
        connection.release();
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