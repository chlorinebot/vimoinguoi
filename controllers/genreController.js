const genreService = require('../service/genreService');

// Lấy danh sách thể loại
const getGenres = async (req, res) => {
    try {
        const genres = await genreService.getAllGenres();
        res.json(genres);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách thể loại:', err);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách thể loại' });
    }
};

// Thêm thể loại mới
const createGenre = async (req, res) => {
    const { genre_name } = req.body;
    try {
        const newGenre = await genreService.createGenre(genre_name);
        res.status(201).json(newGenre);
    } catch (err) {
        console.error('Lỗi khi thêm thể loại:', err);
        res.status(400).json({ error: err.message || 'Lỗi khi thêm thể loại' });
    }
};

// Cập nhật thể loại
const updateGenre = async (req, res) => {
    const { id } = req.params;
    const { genre_name } = req.body;
    try {
        const updatedGenre = await genreService.updateGenre(id, genre_name);
        res.json(updatedGenre);
    } catch (err) {
        console.error('Lỗi khi cập nhật thể loại:', err);
        if (err.message === 'Thể loại không tồn tại') {
            return res.status(404).json({ error: err.message });
        }
        res.status(400).json({ error: err.message || 'Lỗi khi cập nhật thể loại' });
    }
};

// Xóa thể loại
const deleteGenre = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await genreService.deleteGenre(id);
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi xóa thể loại:', err);
        if (err.message === 'Thể loại không tồn tại') {
            return res.status(404).json({ error: err.message });
        }
        if (err.message.includes('đang được sử dụng')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message || 'Lỗi khi xóa thể loại' });
    }
};

// Lấy thể loại của một truyện
const getCardGenres = async (req, res) => {
    const { id } = req.params;
    try {
        const genres = await genreService.getGenresForCard(id);
        res.json(genres);
    } catch (err) {
        console.error('Lỗi khi lấy thể loại của truyện:', err);
        res.status(500).json({ error: err.message || 'Lỗi khi lấy thể loại của truyện' });
    }
};

// Cập nhật thể loại của một truyện
const updateCardGenres = async (req, res) => {
    const { id } = req.params;
    const { genres } = req.body;
    try {
        const result = await genreService.updateCardGenres(id, genres);
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi cập nhật thể loại:', err);
        res.status(500).json({ error: err.message || 'Lỗi khi cập nhật thể loại' });
    }
};

// Đếm số lượng thể loại
const countGenres = async (req, res) => {
    try {
        const result = await genreService.countGenres();
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi đếm số lượng thể loại:', err);
        res.status(500).json({ error: err.message || 'Lỗi khi đếm số lượng thể loại' });
    }
};

module.exports = {
    getGenres,
    createGenre,
    updateGenre,
    deleteGenre,
    getCardGenres,
    updateCardGenres,
    countGenres
}; 