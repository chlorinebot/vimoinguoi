const { dbPool } = require('../data/dbConfig');

const getAllChapters = async () => {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query('SELECT card_id, chapter_number, chapter_title, content, image_folder, image_count FROM chapters');
        const chapterData = {};
        rows.forEach(row => {
            if (!chapterData[row.card_id]) chapterData[row.card_id] = [];
            chapterData[row.card_id].push({
                chapterNumber: row.chapter_number,
                chapterTitle: row.chapter_title,
                content: row.content,
                imageFolder: row.image_folder,
                imageCount: row.image_count
            });
        });
        return chapterData;
    } finally {
        connection.release();
    }
};

const saveChapters = async (chapters) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        const query = 'INSERT INTO chapters (card_id, chapter_number, chapter_title, content, image_folder, image_count, rating, comment_count) VALUES ? ON DUPLICATE KEY UPDATE chapter_title=VALUES(chapter_title), content=VALUES(content), image_folder=VALUES(image_folder), image_count=VALUES(image_count), rating=VALUES(rating), comment_count=VALUES(comment_count)';
        const values = [];
        Object.keys(chapters).forEach(cardId => {
            chapters[cardId].forEach(chapter => {
                values.push([
                    cardId,
                    chapter.chapterNumber,
                    chapter.chapterTitle || null,
                    chapter.content || null,
                    chapter.imageFolder || null,
                    chapter.imageCount || 0,
                    chapter.rating || 0,
                    chapter.commentCount || 0
                ]);
            });
        });
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

const deleteChapter = async (card_id, chapter_number) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query('DELETE FROM chapters WHERE card_id = ? AND chapter_number = ?', [card_id, chapter_number]);
        await connection.commit();
        return result;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Đếm số lượng chương
const countChapters = async () => {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM chapters');
        return { count: rows[0].count };
    } catch (err) {
        console.error('Lỗi khi đếm số lượng chương:', err);
        throw new Error('Không thể đếm số lượng chương');
    } finally {
        connection.release();
    }
};

module.exports = { 
    getAllChapters, 
    saveChapters, 
    deleteChapter,
    countChapters
};