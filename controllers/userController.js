// controllers/userController.js
const { getAllUsers, deleteUser, updateUser, countUsers: getUsersCount, addToBlacklist, removeFromBlacklist, getBlacklist, checkBlacklist } = require('../service/userService');
const { dbPool } = require('../data/dbConfig');
const fs = require('fs').promises;
const path = require('path');

// Thêm hàm đếm số bình luận của người dùng
const getUserStats = async (req, res) => {
    try {
        const userId = req.params.userId;
        const connection = await dbPool.getConnection();

        try {
            // Đếm số bình luận từ bảng comments
            const [mainComments] = await connection.query(
                'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
                [userId]
            );

            // Đếm số replies từ bảng comment_replies
            const [commentReplies] = await connection.query(
                'SELECT COUNT(*) as count FROM comment_replies WHERE user_id = ?',
                [userId]
            );

            // Tính tổng số bình luận
            const totalComments = mainComments[0].count + commentReplies[0].count;

            // Đếm số lần click chia sẻ từ bảng shares
            const [shares] = await connection.query(
                'SELECT COUNT(*) as count FROM shares WHERE user_id = ?',
                [userId]
            );

            console.log('Thống kê người dùng:', {
                userId,
                mainComments: mainComments[0].count,
                replies: commentReplies[0].count,
                totalComments,
                shares: shares[0].count
            });

            res.json({
                comment_count: totalComments,
                share_count: shares[0].count || 0
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Lỗi khi lấy thống kê người dùng:', error);
        res.status(500).json({
            error: 'Không thể lấy thống kê người dùng',
            details: error.message
        });
    }
};

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

const uploadAvatar = async (req, res) => {
    try {
        // Kiểm tra xem có file được upload không
        if (!req.file) {
            throw new Error('Không tìm thấy file upload');
        }

        const userId = req.params.userId;
        const oldAvatarUrl = req.body.oldAvatarUrl;

        // Nếu có avatar cũ, xóa file cũ
        if (oldAvatarUrl) {
            try {
                const oldAvatarPath = oldAvatarUrl.split('/storage/avatars/')[1];
                if (oldAvatarPath) {
                    const fullPath = path.join(process.cwd(), 'public', 'storage', 'avatars', oldAvatarPath);
                    console.log('Đường dẫn file cần xóa:', fullPath);
                    
                    await fs.access(fullPath);
                    await fs.unlink(fullPath);
                    console.log(`Đã xóa avatar cũ thành công: ${fullPath}`);
                }
            } catch (error) {
                console.log('Không tìm thấy hoặc không thể xóa avatar cũ:', error.message);
                // Tiếp tục xử lý ngay cả khi không thể xóa file cũ
            }
        }

        // Cập nhật đường dẫn avatar mới trong database
        const avatarUrl = `/storage/avatars/${req.file.filename}`;
        const connection = await dbPool.getConnection();
        
        try {
            await connection.query(
                'UPDATE users SET avatar = ? WHERE id = ?',
                [avatarUrl, userId]
            );
            
            console.log('Cập nhật avatar thành công:', {
                userId,
                avatarUrl,
                filename: req.file.filename
            });

            res.json({
                message: 'Avatar đã được cập nhật thành công',
                avatar_url: avatarUrl
            });
        } catch (dbError) {
            // Nếu cập nhật database thất bại, xóa file đã upload
            const uploadedFilePath = path.join(process.cwd(), 'public', avatarUrl);
            try {
                await fs.unlink(uploadedFilePath);
                console.log('Đã xóa file upload do lỗi database:', uploadedFilePath);
            } catch (unlinkError) {
                console.error('Không thể xóa file upload:', unlinkError);
            }
            throw dbError;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Lỗi trong quá trình xử lý upload avatar:', error);
        res.status(500).json({
            error: 'Không thể cập nhật ảnh đại diện',
            details: error.message
        });
    }
};

// Thêm người dùng vào blacklist
const addUserToBlacklist = async (req, res) => {
    try {
        const { userId, reason } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'ID người dùng là bắt buộc' });
        }
        
        const result = await addToBlacklist(userId, reason || 'Không có lý do');
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi thêm người dùng vào blacklist:', err);
        res.status(400).json({ error: 'Lỗi khi thêm người dùng vào blacklist', details: err.message });
    }
};

// Xóa người dùng khỏi blacklist
const removeUserFromBlacklist = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'ID người dùng là bắt buộc' });
        }
        
        const result = await removeFromBlacklist(userId);
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi xóa người dùng khỏi blacklist:', err);
        res.status(400).json({ error: 'Lỗi khi xóa người dùng khỏi blacklist', details: err.message });
    }
};

// Lấy danh sách người dùng trong blacklist
const getBlacklistUsers = async (req, res) => {
    try {
        const blacklist = await getBlacklist();
        res.json(blacklist);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách blacklist:', err);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách blacklist', details: err.message });
    }
};

// Kiểm tra xem người dùng có trong blacklist không
const checkUserBlacklist = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'ID người dùng là bắt buộc' });
        }
        
        const result = await checkBlacklist(userId);
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi kiểm tra blacklist:', err);
        res.status(500).json({ error: 'Lỗi khi kiểm tra blacklist', details: err.message });
    }
};

module.exports = {
    getUsers,
    deleteUserData,
    updateUser: updateUserData,
    countUsers,
    uploadAvatar,
    getUserStats,
    addUserToBlacklist,
    removeUserFromBlacklist,
    getBlacklistUsers,
    checkUserBlacklist
};