const { getAllChapters, saveChapters, deleteChapter, countChapters: getChaptersCount } = require('../service/chapterService');
const { dbPool } = require('../data/dbConfig');

const getChapters = async (req, res) => {
    try {
        const chapters = await getAllChapters();
        res.json(chapters);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách chương:', err);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách chương', details: err.message });
    }
};

const saveChapterData = async (req, res) => {
    try {
        const result = await saveChapters(req.body);
        res.status(201).json({ message: 'Lưu chương thành công', data: result });
    } catch (err) {
        console.error('Lỗi khi lưu chương:', err);
        res.status(400).json({ error: 'Lỗi khi lưu chương', details: err.message });
    }
};

const deleteChapterData = async (req, res) => {
    try {
        const { cardId, chapterNumber } = req.query;
        
        if (!cardId || !chapterNumber) {
            return res.status(400).json({ error: 'Vui lòng cung cấp cardId và chapterNumber' });
        }
        
        const result = await deleteChapter(cardId, chapterNumber);
        res.json({ message: 'Xóa chương thành công', result });
    } catch (err) {
        console.error('Lỗi khi xóa chương:', err);
        res.status(500).json({ error: 'Lỗi khi xóa chương', details: err.message });
    }
};

// Hàm đếm số lượng chương
const countChapters = async (req, res) => {
    try {
        const result = await getChaptersCount();
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi đếm số lượng chương:', err);
        res.status(500).json({ error: 'Lỗi khi đếm số lượng chương' });
    }
};

module.exports = {
    getChapters,
    saveChapterData,
    deleteChapterData,
    countChapters
};