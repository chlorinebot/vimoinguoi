// routes/rankingRoutes.js
const express = require('express');
const router = express.Router();
const { dbPool } = require('../data/dbConfig');
const { checkDbConnection } = require('../data/dbConfig');

/**
 * Lấy bảng xếp hạng truyện đọc nhiều nhất (dựa trên số lượt xem tổng)
 */
router.get('/most-read', checkDbConnection, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        // Lấy 20 truyện có lượt xem cao nhất
        const [rankings] = await connection.query(`
            SELECT c.id, c.title, c.image, c.content as author, c.views, 
                   IFNULL(g.hashtags, '') as genres, c.link
            FROM cards c
            LEFT JOIN (
                SELECT cg.card_id, GROUP_CONCAT(g.genre_name SEPARATOR ', ') as hashtags
                FROM card_genres cg
                JOIN genres g ON cg.genre_id = g.genre_id
                GROUP BY cg.card_id
            ) g ON c.id = g.card_id
            ORDER BY c.views DESC
            LIMIT 20
        `);
        
        // Định dạng dữ liệu trả về
        const formattedData = rankings.map((item, index) => {
            const genres = item.genres ? item.genres.split(', ') : [];
            return {
                id: item.id,
                title: item.title,
                author: item.author,
                coverImage: item.image,
                genres: genres,
                metric: item.views,
                trend: calculateTrend(index), // Tính xu hướng dựa trên xếp hạng
                link: item.link
            };
        });
        
        res.json(formattedData);
    } catch (error) {
        console.error('Lỗi khi lấy bảng xếp hạng đọc nhiều nhất:', error);
        res.status(500).json({ error: 'Không thể lấy bảng xếp hạng' });
    } finally {
        connection.release();
    }
});

/**
 * Lấy bảng xếp hạng truyện được yêu thích nhất (dựa trên bảng favorites)
 */
router.get('/most-liked', checkDbConnection, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        // Lấy 20 truyện có nhiều lượt yêu thích nhất
        const [rankings] = await connection.query(`
            SELECT c.id, c.title, c.image, c.content as author, COUNT(*) as likes,
                   IFNULL(g.hashtags, '') as genres, c.link
            FROM cards c
            JOIN favorites f ON c.id = f.card_id
            LEFT JOIN (
                SELECT cg.card_id, GROUP_CONCAT(g.genre_name SEPARATOR ', ') as hashtags
                FROM card_genres cg
                JOIN genres g ON cg.genre_id = g.genre_id
                GROUP BY cg.card_id
            ) g ON c.id = g.card_id
            GROUP BY c.id, c.title, c.image, c.content, g.hashtags, c.link
            ORDER BY likes DESC
            LIMIT 20
        `);
        
        // Định dạng dữ liệu trả về
        const formattedData = rankings.map((item, index) => {
            const genres = item.genres ? item.genres.split(', ') : [];
            return {
                id: item.id,
                title: item.title,
                author: item.author,
                coverImage: item.image,
                genres: genres,
                metric: item.likes,
                trend: calculateTrend(index), // Tính xu hướng dựa trên xếp hạng
                link: item.link
            };
        });
        
        res.json(formattedData);
    } catch (error) {
        console.error('Lỗi khi lấy bảng xếp hạng yêu thích nhất:', error);
        res.status(500).json({ error: 'Không thể lấy bảng xếp hạng' });
    } finally {
        connection.release();
    }
});

/**
 * Lấy bảng xếp hạng truyện có đánh giá cao nhất (dựa trên bảng ratings)
 */
router.get('/highest-rated', checkDbConnection, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        // Lấy 20 truyện có điểm đánh giá trung bình cao nhất và có ít nhất 5 lượt đánh giá
        const [rankings] = await connection.query(`
            SELECT c.id, c.title, c.image, c.content as author, 
                   AVG(r.rating) as average_rating, COUNT(r.id) as rating_count,
                   IFNULL(g.hashtags, '') as genres, c.link
            FROM cards c
            JOIN chapters ch ON c.id = ch.card_id
            JOIN ratings r ON ch.id = r.chapter_id
            LEFT JOIN (
                SELECT cg.card_id, GROUP_CONCAT(g.genre_name SEPARATOR ', ') as hashtags
                FROM card_genres cg
                JOIN genres g ON cg.genre_id = g.genre_id
                GROUP BY cg.card_id
            ) g ON c.id = g.card_id
            GROUP BY c.id, c.title, c.image, c.content, g.hashtags, c.link
            HAVING rating_count >= 5
            ORDER BY average_rating DESC
            LIMIT 20
        `);
        
        // Định dạng dữ liệu trả về
        const formattedData = rankings.map((item, index) => {
            const genres = item.genres ? item.genres.split(', ') : [];
            return {
                id: item.id,
                title: item.title,
                author: item.author,
                coverImage: item.image,
                genres: genres,
                metric: parseFloat(item.average_rating).toFixed(1), // Làm tròn đến 1 chữ số thập phân
                trend: calculateTrend(index), // Tính xu hướng dựa trên xếp hạng
                link: item.link
            };
        });
        
        res.json(formattedData);
    } catch (error) {
        console.error('Lỗi khi lấy bảng xếp hạng đánh giá cao nhất:', error);
        res.status(500).json({ error: 'Không thể lấy bảng xếp hạng' });
    } finally {
        connection.release();
    }
});

/**
 * Lấy bảng xếp hạng truyện xem nhiều trong tuần
 */
router.get('/weekly-top', checkDbConnection, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        // Lấy 20 truyện có lượt xem trong 7 ngày gần nhất cao nhất
        // Giả định có một bảng view_logs để theo dõi lượt xem hàng ngày
        // Nếu không có, chúng ta sẽ lấy từ bảng cards và giả lập dữ liệu tuần
        
        // Nếu có bảng view_logs
        /*
        const [rankings] = await connection.query(`
            SELECT c.id, c.title, c.image, c.content as author, 
                   SUM(vl.views) as weekly_views,
                   IFNULL(g.hashtags, '') as genres, c.link
            FROM cards c
            JOIN view_logs vl ON c.id = vl.card_id
            LEFT JOIN (
                SELECT cg.card_id, GROUP_CONCAT(g.genre_name SEPARATOR ', ') as hashtags
                FROM card_genres cg
                JOIN genres g ON cg.genre_id = g.genre_id
                GROUP BY cg.card_id
            ) g ON c.id = g.card_id
            WHERE vl.viewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY c.id, c.title, c.image, c.content, g.hashtags, c.link
            ORDER BY weekly_views DESC
            LIMIT 20
        `);
        */
        
        // Sử dụng bảng cards và giả lập dữ liệu tuần (khoảng 20-40% tổng lượt xem)
        const [rankings] = await connection.query(`
            SELECT c.id, c.title, c.image, c.content as author, 
                   FLOOR(c.views * (RAND() * 0.2 + 0.2)) as weekly_views,
                   IFNULL(g.hashtags, '') as genres, c.link
            FROM cards c
            LEFT JOIN (
                SELECT cg.card_id, GROUP_CONCAT(g.genre_name SEPARATOR ', ') as hashtags
                FROM card_genres cg
                JOIN genres g ON cg.genre_id = g.genre_id
                GROUP BY cg.card_id
            ) g ON c.id = g.card_id
            ORDER BY weekly_views DESC
            LIMIT 20
        `);
        
        // Định dạng dữ liệu trả về
        const formattedData = rankings.map((item, index) => {
            const genres = item.genres ? item.genres.split(', ') : [];
            return {
                id: item.id,
                title: item.title,
                author: item.author,
                coverImage: item.image,
                genres: genres,
                metric: item.weekly_views,
                trend: calculateTrend(index), // Tính xu hướng dựa trên xếp hạng
                link: item.link
            };
        });
        
        res.json(formattedData);
    } catch (error) {
        console.error('Lỗi khi lấy bảng xếp hạng top tuần:', error);
        res.status(500).json({ error: 'Không thể lấy bảng xếp hạng' });
    } finally {
        connection.release();
    }
});

/**
 * Lấy bảng xếp hạng truyện xem nhiều trong ngày
 */
router.get('/daily-top', checkDbConnection, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        // Lấy 20 truyện có lượt xem trong 24 giờ gần nhất cao nhất
        // Giả định có một bảng view_logs để theo dõi lượt xem hàng ngày
        // Nếu không có, chúng ta sẽ lấy từ bảng cards và giả lập dữ liệu ngày
        
        // Nếu có bảng view_logs
        /*
        const [rankings] = await connection.query(`
            SELECT c.id, c.title, c.image, c.content as author, 
                   SUM(vl.views) as daily_views,
                   IFNULL(g.hashtags, '') as genres, c.link
            FROM cards c
            JOIN view_logs vl ON c.id = vl.card_id
            LEFT JOIN (
                SELECT cg.card_id, GROUP_CONCAT(g.genre_name SEPARATOR ', ') as hashtags
                FROM card_genres cg
                JOIN genres g ON cg.genre_id = g.genre_id
                GROUP BY cg.card_id
            ) g ON c.id = g.card_id
            WHERE vl.viewed_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            GROUP BY c.id, c.title, c.image, c.content, g.hashtags, c.link
            ORDER BY daily_views DESC
            LIMIT 20
        `);
        */
        
        // Sử dụng bảng cards và giả lập dữ liệu ngày (khoảng 5-15% tổng lượt xem)
        const [rankings] = await connection.query(`
            SELECT c.id, c.title, c.image, c.content as author, 
                   FLOOR(c.views * (RAND() * 0.1 + 0.05)) as daily_views,
                   IFNULL(g.hashtags, '') as genres, c.link
            FROM cards c
            LEFT JOIN (
                SELECT cg.card_id, GROUP_CONCAT(g.genre_name SEPARATOR ', ') as hashtags
                FROM card_genres cg
                JOIN genres g ON cg.genre_id = g.genre_id
                GROUP BY cg.card_id
            ) g ON c.id = g.card_id
            ORDER BY daily_views DESC
            LIMIT 20
        `);
        
        // Định dạng dữ liệu trả về
        const formattedData = rankings.map((item, index) => {
            const genres = item.genres ? item.genres.split(', ') : [];
            return {
                id: item.id,
                title: item.title,
                author: item.author,
                coverImage: item.image,
                genres: genres,
                metric: item.daily_views,
                trend: calculateTrend(index), // Tính xu hướng dựa trên xếp hạng
                link: item.link
            };
        });
        
        res.json(formattedData);
    } catch (error) {
        console.error('Lỗi khi lấy bảng xếp hạng top ngày:', error);
        res.status(500).json({ error: 'Không thể lấy bảng xếp hạng' });
    } finally {
        connection.release();
    }
});

/**
 * Tính xu hướng của một truyện dựa trên xếp hạng hiện tại
 * Giả định: truyện top 5 thường là xu hướng tăng, truyện mới sẽ có nhãn 'new'
 */
function calculateTrend(index) {
    // Xu hướng giả lập cho demo, trong thực tế cần theo dõi thứ hạng qua thời gian
    if (index === 0) return 'stable'; // Top 1 thường ổn định
    if (index < 5) return 'up'; // Top 2-5 thường tăng
    if (index === 19) return 'new'; // Giả lập truyện mới
    
    // Các truyện còn lại, phân bổ ngẫu nhiên
    const random = Math.random();
    if (random < 0.4) return 'up';
    if (random < 0.7) return 'down';
    if (random < 0.9) return 'stable';
    return 'new';
}

module.exports = router; 