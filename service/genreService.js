const { dbPool } = require('../data/dbConfig');

// Lấy tất cả thể loại
async function getAllGenres() {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM genres');
        return rows;
    } catch (err) {
        console.error('Lỗi khi lấy danh sách thể loại:', err);
        throw new Error('Không thể lấy danh sách thể loại');
    } finally {
        connection.release();
    }
}

// Thêm thể loại mới
async function createGenre(genreName) {
    if (!genreName) {
        throw new Error('Tên thể loại là bắt buộc');
    }
    
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query('INSERT INTO genres (genre_name) VALUES (?)', [genreName]);
        await connection.commit();
        return { genre_id: result.insertId, genre_name: genreName };
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi khi thêm thể loại:', err);
        throw new Error('Không thể thêm thể loại');
    } finally {
        connection.release();
    }
}

// Cập nhật thể loại
async function updateGenre(genreId, genreName) {
    if (!genreName) {
        throw new Error('Tên thể loại là bắt buộc');
    }
    
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query('UPDATE genres SET genre_name = ? WHERE genre_id = ?', [genreName, genreId]);
        
        if (result.affectedRows === 0) {
            throw new Error('Thể loại không tồn tại');
        }
        
        await connection.commit();
        return { genre_id: genreId, genre_name: genreName };
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi khi cập nhật thể loại:', err);
        if (err.message === 'Thể loại không tồn tại') {
            throw err;
        }
        throw new Error('Không thể cập nhật thể loại');
    } finally {
        connection.release();
    }
}

// Xóa thể loại
async function deleteGenre(genreId) {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Kiểm tra xem thể loại có đang được sử dụng không
        const [usageCheck] = await connection.query('SELECT COUNT(*) as count FROM card_genres WHERE genre_id = ?', [genreId]);
        if (usageCheck[0].count > 0) {
            throw new Error('Không thể xóa thể loại đang được sử dụng bởi truyện');
        }
        
        const [result] = await connection.query('DELETE FROM genres WHERE genre_id = ?', [genreId]);
        
        if (result.affectedRows === 0) {
            throw new Error('Thể loại không tồn tại');
        }
        
        await connection.commit();
        return { success: true, message: 'Xóa thể loại thành công' };
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi khi xóa thể loại:', err);
        throw err;
    } finally {
        connection.release();
    }
}

// Lấy thể loại của một truyện
async function getGenresForCard(cardId) {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT g.genre_id, g.genre_name FROM genres g ' +
            'JOIN card_genres cg ON g.genre_id = cg.genre_id ' +
            'WHERE cg.card_id = ?',
            [cardId]
        );
        return rows;
    } catch (err) {
        console.error('Lỗi khi lấy thể loại của truyện:', err);
        throw new Error('Không thể lấy thể loại của truyện');
    } finally {
        connection.release();
    }
}

// Cập nhật thể loại của một truyện
async function updateCardGenres(cardId, genreIds) {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Xóa các thể loại hiện tại của truyện
        await connection.query('DELETE FROM card_genres WHERE card_id = ?', [cardId]);

        // Thêm các thể loại mới
        if (genreIds && genreIds.length > 0) {
            const values = genreIds.map(genreId => [cardId, genreId]);
            await connection.query('INSERT INTO card_genres (card_id, genre_id) VALUES ?', [values]);
        }

        await connection.commit();
        return { success: true, message: 'Cập nhật thể loại truyện thành công' };
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi khi cập nhật thể loại truyện:', err);
        throw new Error('Không thể cập nhật thể loại truyện');
    } finally {
        connection.release();
    }
}

// Đếm số lượng thể loại
async function countGenres() {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM genres');
        return { count: rows[0].count };
    } catch (err) {
        console.error('Lỗi khi đếm số lượng thể loại:', err);
        throw new Error('Không thể đếm số lượng thể loại');
    } finally {
        connection.release();
    }
}

module.exports = {
    getAllGenres,
    createGenre,
    updateGenre,
    deleteGenre,
    getGenresForCard,
    updateCardGenres,
    countGenres
}; 