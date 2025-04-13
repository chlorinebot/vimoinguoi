const express = require('express');
const { verifyToken: authenticateToken } = require('../middleware/authMiddleware');
const { dbPool } = require('../data/dbConfig');
const { uploadAvatar, getUserStats } = require('../controllers/userController');
const upload = require('../middleware/uploadMiddleware');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Đảm bảo tất cả các thư mục cần thiết tồn tại
async function ensureDirectoryStructure() {
    const publicDir = path.join(process.cwd(), 'public');
    const storageDir = path.join(publicDir, 'storage');
    const avatarDir = path.join(storageDir, 'avatars');

    try {
        // Tạo thư mục public nếu chưa tồn tại
        await fs.access(publicDir).catch(async () => {
            console.log('Tạo thư mục public');
            await fs.mkdir(publicDir);
        });

        // Tạo thư mục storage nếu chưa tồn tại
        await fs.access(storageDir).catch(async () => {
            console.log('Tạo thư mục storage');
            await fs.mkdir(storageDir);
        });

        // Tạo thư mục avatars nếu chưa tồn tại
        await fs.access(avatarDir).catch(async () => {
            console.log('Tạo thư mục avatars');
            await fs.mkdir(avatarDir);
        });

        console.log('Cấu trúc thư mục đã được tạo thành công:', avatarDir);
        return true;
    } catch (err) {
        console.error('Lỗi khi tạo cấu trúc thư mục:', err);
        throw err;
    }
}

// Khởi tạo cấu trúc thư mục khi khởi động
ensureDirectoryStructure()
    .then(() => console.log('Khởi tạo thư mục thành công'))
    .catch(err => console.error('Lỗi khởi tạo thư mục:', err));

// Route upload avatar
router.post('/users/:userId/avatar', authenticateToken, async (req, res) => {
    try {
        // Đảm bảo thư mục tồn tại
        await ensureDirectoryStructure();

        // Xử lý upload với Promise
        await new Promise((resolve, reject) => {
            upload(req, res, (err) => {
                if (err) {
                    console.error('Lỗi upload:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Nếu không có lỗi, tiếp tục xử lý upload avatar
        await uploadAvatar(req, res);

    } catch (error) {
        console.error('Lỗi xử lý upload:', error);
        res.status(400).json({
            error: 'Không thể tải lên avatar',
            details: error.message || 'Lỗi không xác định'
        });
    }
});

// Route để phục vụ ảnh avatar
router.get('/avatars/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'public', 'storage', 'avatars', filename);

    try {
        await fs.access(filePath);
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error("Lỗi khi gửi file avatar:", filename, err);
                res.status(500).json({ 
                    error: 'Lỗi khi gửi file avatar',
                    details: err.message
                });
            }
        });
    } catch (error) {
        console.log(`Không tìm thấy file avatar: ${filename}`);
        res.status(404).json({ 
            error: 'Không tìm thấy ảnh đại diện',
            details: error.message
        });
    }
});

// Route lấy thống kê người dùng
router.get('/users/:userId/stats', authenticateToken, getUserStats);

module.exports = router;