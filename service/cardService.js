const { dbPool } = require('../data/dbConfig');

// Lấy danh sách tất cả cards, bao gồm tên thể loại từ bảng genres
const getAllCards = async () => {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT c.*, GROUP_CONCAT(g.genre_name) as genre_names
            FROM cards c
            LEFT JOIN card_genres cg ON c.id = cg.card_id
            LEFT JOIN genres g ON cg.genre_id = g.genre_id
            GROUP BY c.id
        `);
        return rows;
    } finally {
        connection.release();
    }
};

// Lưu hoặc cập nhật cards, bao gồm cột TheLoai (lưu genre_id)
const saveCards = async (cards) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        const query = `
            INSERT INTO cards (id, title, image, content, link, TheLoai) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
                title=VALUES(title), 
                image=VALUES(image), 
                content=VALUES(content), 
                link=VALUES(link), 
                TheLoai=VALUES(TheLoai)
        `;
        const values = cards.map(card => [
            card.id, 
            card.title, 
            card.image || null, 
            card.content, 
            card.link || null, 
            card.TheLoai || null // TheLoai là genre_id
        ]);
        const [result] = await connection.query(query, [values]);
        await connection.commit();
        return result;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Thêm truyện mới
const saveCard = async (cardData) => {
    const { title, image, content, link, hashtags, genres } = cardData;
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Thêm truyện mới vào bảng cards
        const [result] = await connection.query(
            'INSERT INTO cards (title, image, content, link, hashtags) VALUES (?, ?, ?, ?, ?)',
            [title, image, content, link, hashtags]
        );
        const cardId = result.insertId;

        // Thêm các thể loại vào bảng card_genres
        if (genres && Array.isArray(genres) && genres.length > 0) {
            const genreValues = genres.map(genreId => [cardId, genreId]);
            await connection.query(
                'INSERT INTO card_genres (card_id, genre_id) VALUES ?',
                [genreValues]
            );
        }

        await connection.commit();
        return { 
            id: cardId, 
            title, 
            image, 
            content, 
            link, 
            hashtags, 
            genres 
        };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Cập nhật truyện
const updateCard = async (id, cardData) => {
    const { title, image, content, link, hashtags, genres } = cardData;
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Cập nhật thông tin truyện
        const [result] = await connection.query(
            'UPDATE cards SET title = ?, image = ?, content = ?, link = ?, hashtags = ? WHERE id = ?',
            [title, image, content, link, hashtags, id]
        );
        
        if (result.affectedRows === 0) {
            throw new Error('Truyện không tồn tại');
        }

        // Xóa các thể loại cũ
        await connection.query('DELETE FROM card_genres WHERE card_id = ?', [id]);

        // Thêm các thể loại mới
        if (genres && Array.isArray(genres) && genres.length > 0) {
            const genreValues = genres.map(genreId => [id, genreId]);
            await connection.query(
                'INSERT INTO card_genres (card_id, genre_id) VALUES ?',
                [genreValues]
            );
        }

        await connection.commit();
        return { 
            id, 
            title, 
            image, 
            content, 
            link, 
            hashtags, 
            genres,
            message: 'Cập nhật truyện thành công'
        };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Xóa card theo id
const deleteCard = async (id) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        // Xóa các chapters liên quan trước
        await connection.query('DELETE FROM chapters WHERE card_id = ?', [id]);
        // Xóa các genre liên quan
        await connection.query('DELETE FROM card_genres WHERE card_id = ?', [id]);
        // Xóa card
        const [result] = await connection.query('DELETE FROM cards WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            throw new Error('Truyện không tồn tại');
        }
        
        await connection.commit();
        return { 
            affectedRows: result.affectedRows,
            message: 'Xóa truyện thành công'
        };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Đếm số lượng truyện
const countCards = async () => {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM cards');
        return { count: rows[0].count };
    } catch (err) {
        console.error('Lỗi khi đếm số lượng truyện:', err);
        throw new Error('Không thể đếm số lượng truyện');
    } finally {
        connection.release();
    }
};

module.exports = { 
    getAllCards, 
    saveCards, 
    deleteCard,
    saveCard,
    updateCard,
    countCards
};