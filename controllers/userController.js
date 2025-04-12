// controllers/userController.js
const { getAllUsers, deleteUser, updateUser, countUsers: getUsersCount } = require('../service/userService');
const { dbPool } = require('../data/dbConfig');

const getUsers = async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách người dùng:', err);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng', details: err.message });
    }
};

const deleteUserData = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'ID người dùng là bắt buộc' });
    }
    
    try {
        await deleteUser(id);
        res.json({ message: 'Xóa người dùng thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa người dùng:', err);
        res.status(500).json({ error: 'Lỗi khi xóa người dùng', details: err.message });
    }
};

const updateUserData = async (req, res) => {
    const { id } = req.params;
    const userData = req.body;
    
    if (!id) {
        return res.status(400).json({ error: 'ID người dùng là bắt buộc' });
    }
    
    try {
        const result = await updateUser(id, userData);
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi cập nhật người dùng:', err);
        res.status(400).json({ error: 'Lỗi khi cập nhật người dùng', details: err.message });
    }
};

// Hàm đếm số lượng người dùng
const countUsers = async (req, res) => {
    try {
        const result = await getUsersCount();
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi đếm số lượng người dùng:', err);
        res.status(500).json({ error: 'Lỗi khi đếm số lượng người dùng' });
    }
};

module.exports = {
    getUsers,
    deleteUserData,
    updateUser: updateUserData,
    countUsers
};