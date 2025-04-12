const express = require('express');
const router = express.Router();
const { dbPool } = require('../data/dbConfig');

// Lấy thông tin chapter theo cardId và chapterNumber
router.get('/chapters/:cardId/:chapterNumber', async (req, res) => {
    const { cardId, chapterNumber } = req.params;
    
    if (!cardId || !chapterNumber) {
        return res.status(400).json({ error: 'Thiếu thông tin card_id hoặc chapter_number' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT * FROM chapters WHERE card_id = ? AND chapter_number = ?',
            [cardId, chapterNumber]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy chapter' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Lỗi khi lấy thông tin chapter:', err);
        res.status(500).json({ error: 'Lỗi khi lấy thông tin chapter', details: err.message });
    } finally {
        connection.release();
    }
});

// API đánh giá chương
// Lấy đánh giá của người dùng cho một chương cụ thể
router.get('/ratings', async (req, res) => {
    const { user_id, chapter_id } = req.query;
    
    if (!user_id || !chapter_id) {
        return res.status(400).json({ error: 'Thiếu thông tin user_id hoặc chapter_id' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT * FROM ratings WHERE user_id = ? AND chapter_id = ?',
            [user_id, chapter_id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Lỗi khi lấy thông tin đánh giá:', err);
        res.status(500).json({ error: 'Lỗi khi lấy thông tin đánh giá', details: err.message });
    } finally {
        connection.release();
    }
});

// Thêm hoặc cập nhật đánh giá của người dùng cho một chương
router.post('/ratings', async (req, res) => {
    const { user_id, chapter_id, rating } = req.body;
    
    if (!user_id || !chapter_id || !rating) {
        return res.status(400).json({ error: 'Thiếu thông tin user_id, chapter_id hoặc rating' });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Điểm đánh giá phải từ 1-5' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        // Kiểm tra xem người dùng đã đánh giá chương này chưa
        const [existingRating] = await connection.query(
            'SELECT * FROM ratings WHERE user_id = ? AND chapter_id = ?',
            [user_id, chapter_id]
        );
        
        let result;
        const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        if (existingRating.length > 0) {
            // Cập nhật đánh giá hiện có
            [result] = await connection.query(
                'UPDATE ratings SET rating = ?, rated_at = ? WHERE user_id = ? AND chapter_id = ?',
                [rating, currentDate, user_id, chapter_id]
            );
            
            res.json({ message: 'Cập nhật đánh giá thành công', updated: true, rating });
        } else {
            // Thêm đánh giá mới
            [result] = await connection.query(
                'INSERT INTO ratings (user_id, chapter_id, rating, rated_at) VALUES (?, ?, ?, ?)',
                [user_id, chapter_id, rating, currentDate]
            );
            
            res.json({ message: 'Thêm đánh giá thành công', created: true, rating, id: result.insertId });
        }
    } catch (err) {
        console.error('Lỗi khi xử lý đánh giá:', err);
        res.status(500).json({ error: 'Lỗi khi xử lý đánh giá', details: err.message });
    } finally {
        connection.release();
    }
});

// Lấy điểm đánh giá trung bình của một chương
router.get('/ratings/average/:chapter_id', async (req, res) => {
    const { chapter_id } = req.params;
    
    if (!chapter_id) {
        return res.status(400).json({ error: 'Thiếu thông tin chapter_id' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT AVG(rating) as average_rating, COUNT(*) as rating_count FROM ratings WHERE chapter_id = ?',
            [chapter_id]
        );
        
        res.json({
            chapter_id,
            average_rating: rows[0].average_rating || 0,
            rating_count: rows[0].rating_count || 0
        });
    } catch (err) {
        console.error('Lỗi khi lấy điểm đánh giá trung bình:', err);
        res.status(500).json({ error: 'Lỗi khi lấy điểm đánh giá trung bình', details: err.message });
    } finally {
        connection.release();
    }
});

// Lấy điểm đánh giá trung bình của một truyện
router.get('/ratings/average/comic/:card_id', async (req, res) => {
    const { card_id } = req.params;
    
    if (!card_id) {
        return res.status(400).json({ error: 'Thiếu thông tin card_id' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        // Lấy điểm đánh giá trung bình từ tất cả các chương của truyện
        const [rows] = await connection.query(
            `SELECT AVG(r.rating) as average_rating, COUNT(r.id) as rating_count
            FROM ratings r
            JOIN chapters c ON r.chapter_id = c.id
            WHERE c.card_id = ?`,
            [card_id]
        );
        
        res.json({
            card_id,
            average_rating: rows[0].average_rating ? parseFloat(rows[0].average_rating).toFixed(1) : 0,
            rating_count: rows[0].rating_count || 0
        });
    } catch (err) {
        console.error('Lỗi khi lấy điểm đánh giá trung bình của truyện:', err);
        res.status(500).json({ error: 'Lỗi khi lấy điểm đánh giá trung bình của truyện', details: err.message });
    } finally {
        connection.release();
    }
});

// Lấy số lượt xem của một truyện
router.get('/cards/views/:cardId', async (req, res) => {
    const { cardId } = req.params;
    
    if (!cardId) {
        return res.status(400).json({ error: 'Thiếu thông tin cardId' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT views FROM cards WHERE id = ?',
            [cardId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy truyện' });
        }
        
        // Đảm bảo trả về 0 nếu views là NULL
        const views = rows[0].views === null ? 0 : rows[0].views;
        
        res.json({
            card_id: cardId,
            views: views
        });
    } catch (err) {
        console.error('Lỗi khi lấy số lượt xem truyện:', err);
        res.status(500).json({ error: 'Lỗi khi lấy số lượt xem truyện', details: err.message });
    } finally {
        connection.release();
    }
});

// Tăng số lượt xem của một truyện
router.post('/cards/views/increment/:cardId', async (req, res) => {
    const { cardId } = req.params;
    
    if (!cardId) {
        return res.status(400).json({ error: 'Thiếu thông tin cardId' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        // Kiểm tra xem truyện có tồn tại không và giá trị views hiện tại
        const [checkRows] = await connection.query(
            'SELECT views FROM cards WHERE id = ?',
            [cardId]
        );
        
        if (checkRows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy truyện' });
        }
        
        // Xử lý trường hợp views là NULL hoặc không tồn tại
        if (checkRows[0].views === null) {
            // Cập nhật từ NULL thành 1
            await connection.query(
                'UPDATE cards SET views = 1 WHERE id = ?',
                [cardId]
            );
        } else {
            // Tăng số lượt xem lên 1
            await connection.query(
                'UPDATE cards SET views = views + 1 WHERE id = ?',
                [cardId]
            );
        }
        
        // Lấy số lượt xem mới
        const [rows] = await connection.query(
            'SELECT views FROM cards WHERE id = ?',
            [cardId]
        );
        
        res.json({
            card_id: cardId,
            views: rows[0].views,
            message: 'Đã cập nhật số lượt xem truyện'
        });
    } catch (err) {
        console.error('Lỗi khi cập nhật số lượt xem truyện:', err);
        res.status(500).json({ error: 'Lỗi khi cập nhật số lượt xem truyện', details: err.message });
    } finally {
        connection.release();
    }
});

module.exports = router; 