// cardController.js
const { getAllCards, saveCard, deleteCard, updateCard: updateCardData, countCards: getCardsCount } = require('../service/cardService');

// Lấy danh sách truyện
const getCards = async (req, res) => {
    try {
        const cards = await getAllCards();
        res.json(cards);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách cards:', err);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách cards' });
    }
};

// Thêm truyện mới
const saveCardData = async (req, res) => {
    try {
        const cardData = req.body;
        const result = await saveCard(cardData);
        res.status(201).json(result);
    } catch (err) {
        console.error('Lỗi khi lưu card:', err);
        res.status(500).json({ error: 'Lỗi khi lưu card' });
    }
};

// Xóa truyện
const deleteCardData = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await deleteCard(id);
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi xóa truyện:', err);
        if (err.message === 'Truyện không tồn tại') {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: 'Lỗi khi xóa truyện' });
    }
};

// Cập nhật truyện
const updateCard = async (req, res) => {
    const { id } = req.params;
    try {
        const cardData = req.body;
        const result = await updateCardData(id, cardData);
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi cập nhật card:', err);
        if (err.message === 'Truyện không tồn tại') {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: 'Lỗi khi cập nhật card' });
    }
};

// Hàm đếm số lượng truyện
const countCards = async (req, res) => {
    try {
        const result = await getCardsCount();
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi đếm số lượng truyện:', err);
        res.status(500).json({ error: 'Lỗi khi đếm số lượng truyện' });
    }
};

// Export các functions
module.exports = {
    getCards,
    saveCardData,
    deleteCardData,
    updateCard,
    countCards
};