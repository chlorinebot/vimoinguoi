// controllers/readingHistoryController.js
const { dbPool } = require('../data/dbConfig');

// Thêm lịch sử đọc truyện
const addReadingHistory = async (req, res) => {
    const { user_id, card_id, chapter_id } = req.body;
    
    // Validate input
    if (!user_id || !card_id || !chapter_id) {
        return res.status(400).json({ error: 'Thiếu thông tin cần thiết (user_id, card_id, chapter_id)' });
    }

    const connection = await dbPool.getConnection();
    try {
        // Kiểm tra xem bản ghi đã tồn tại chưa
        const [existing] = await connection.query(
            'SELECT id FROM reading_history WHERE user_id = ? AND card_id = ? AND chapter_id = ?',
            [user_id, card_id, chapter_id]
        );

        if (existing.length > 0) {
            // Nếu đã tồn tại, cập nhật thời gian đọc
            await connection.query(
                'UPDATE reading_history SET read_at = NOW() WHERE user_id = ? AND card_id = ? AND chapter_id = ?',
                [user_id, card_id, chapter_id]
            );
            return res.status(200).json({ message: 'Đã cập nhật lịch sử đọc truyện' });
        }

        // Nếu chưa tồn tại, thêm mới
        await connection.query(
            'INSERT INTO reading_history (user_id, card_id, chapter_id, read_at) VALUES (?, ?, ?, NOW())',
            [user_id, card_id, chapter_id]
        );

        res.status(201).json({ message: 'Đã thêm vào lịch sử đọc truyện' });
    } catch (err) {
        console.error('Lỗi khi thêm lịch sử đọc:', err);
        res.status(500).json({ error: 'Lỗi khi thêm lịch sử đọc', details: err.message });
    } finally {
        connection.release();
    }
};

// Lấy lịch sử đọc truyện của người dùng
const getReadingHistoryByUser = async (req, res) => {
    const { userId } = req.params;
    
    if (!userId) {
        return res.status(400).json({ error: 'Thiếu thông tin người dùng' });
    }

    const connection = await dbPool.getConnection();
    try {
        // Lấy lịch sử đọc truyện với thông tin chi tiết về truyện và chương
        const [rows] = await connection.query(
            `SELECT 
                h.id, h.user_id, h.card_id, h.chapter_id, h.read_at,
                c.title as card_title, c.image as card_image,
                ch.chapter_number, ch.chapter_title
            FROM reading_history h
            JOIN cards c ON h.card_id = c.id
            JOIN chapters ch ON h.chapter_id = ch.id AND ch.card_id = h.card_id
            WHERE h.user_id = ?
            ORDER BY h.read_at DESC
            LIMIT 100`,
            [userId]
        );

        res.json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy lịch sử đọc:', err);
        res.status(500).json({ error: 'Lỗi khi lấy lịch sử đọc', details: err.message });
    } finally {
        connection.release();
    }
};

// Xóa lịch sử đọc truyện
const deleteReadingHistory = async (req, res) => {
    const { historyId } = req.params;
    const userId = req.user.id; // Lấy từ JWT token đã xác thực

    if (!historyId) {
        return res.status(400).json({ error: 'Thiếu thông tin bản ghi cần xóa' });
    }

    const connection = await dbPool.getConnection();
    try {
        // Chỉ cho phép người dùng xóa lịch sử của chính họ
        const [result] = await connection.query(
            'DELETE FROM reading_history WHERE id = ? AND user_id = ?',
            [historyId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bản ghi hoặc không có quyền xóa' });
        }

        res.json({ message: 'Đã xóa lịch sử đọc truyện thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa lịch sử đọc:', err);
        res.status(500).json({ error: 'Lỗi khi xóa lịch sử đọc', details: err.message });
    } finally {
        connection.release();
    }
};

// Xóa tất cả lịch sử đọc của người dùng
const clearReadingHistory = async (req, res) => {
    const userId = req.user.id; // Lấy từ JWT token đã xác thực

    const connection = await dbPool.getConnection();
    try {
        const [result] = await connection.query(
            'DELETE FROM reading_history WHERE user_id = ?',
            [userId]
        );

        res.json({ 
            message: 'Đã xóa tất cả lịch sử đọc truyện',
            deletedCount: result.affectedRows
        });
    } catch (err) {
        console.error('Lỗi khi xóa tất cả lịch sử đọc:', err);
        res.status(500).json({ error: 'Lỗi khi xóa tất cả lịch sử đọc', details: err.message });
    } finally {
        connection.release();
    }
};

module.exports = {
    addReadingHistory,
    getReadingHistoryByUser,
    deleteReadingHistory,
    clearReadingHistory
};