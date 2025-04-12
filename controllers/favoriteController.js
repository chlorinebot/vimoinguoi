// controllers/favoriteController.js
const { dbPool } = require('../data/dbConfig');

// Kiểm tra trạng thái yêu thích
const checkFavoriteStatus = async (req, res) => {
    const { userId, cardId } = req.params;
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT * FROM favorites WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );
        res.json({ isFavorite: rows.length > 0 });
    } catch (err) {
        console.error('Lỗi khi kiểm tra trạng thái yêu thích:', err);
        res.status(500).json({ error: 'Lỗi khi kiểm tra trạng thái yêu thích' });
    } finally {
        connection.release();
    }
};

// Thêm truyện vào danh sách yêu thích
const addToFavorites = async (req, res) => {
    const { user_id, card_id } = req.body;
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            'INSERT INTO favorites (user_id, card_id) VALUES (?, ?)',
            [user_id, card_id]
        );
        await connection.commit();
        res.status(201).json({ message: 'Đã thêm vào danh sách yêu thích' });
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi khi thêm vào danh sách yêu thích:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Truyện đã có trong danh sách yêu thích' });
        } else {
            res.status(500).json({ error: 'Lỗi khi thêm vào danh sách yêu thích' });
        }
    } finally {
        connection.release();
    }
};

// Xóa truyện khỏi danh sách yêu thích
const removeFromFavorites = async (req, res) => {
    const { userId, cardId } = req.params;
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            'DELETE FROM favorites WHERE user_id = ? AND card_id = ?',
            [userId, cardId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy truyện trong danh sách yêu thích' });
        }
        await connection.commit();
        res.json({ message: 'Đã xóa khỏi danh sách yêu thích' });
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi khi xóa khỏi danh sách yêu thích:', err);
        res.status(500).json({ error: 'Lỗi khi xóa khỏi danh sách yêu thích' });
    } finally {
        connection.release();
    }
};

module.exports = {
    checkFavoriteStatus,
    addToFavorites,
    removeFromFavorites
};