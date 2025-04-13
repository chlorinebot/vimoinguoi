const express = require('express');
const { dbPool, checkDbConnection, initializeDb } = require('./data/dbConfig');
const { getCards, saveCardData, deleteCardData, updateCard, countCards } = require('./controllers/cardController');
const { getChapters, saveChapterData, deleteChapterData, countChapters } = require('./controllers/chapterController');
const { getUsers, deleteUserData, updateUser: updateUserData, countUsers, getUserStats, addUserToBlacklist, removeUserFromBlacklist, getBlacklistUsers, checkUserBlacklist } = require('./controllers/userController');
const { register, login } = require('./controllers/authController');
const { getGenres, createGenre, updateGenre, deleteGenre, getCardGenres, updateCardGenres, countGenres } = require('./controllers/genreController');
const { checkFavoriteStatus, addToFavorites, removeFromFavorites } = require('./controllers/favoriteController');
const { checkAdminAuth, verifyToken } = require('./middleware/authMiddleware');
const { getUserProfile, getUserFavorites } = require('./controllers/profileController');
const { addReadingHistory, getReadingHistoryByUser, deleteReadingHistory, clearReadingHistory } = require('./controllers/readingHistoryController');
const apiRoutes = require('./routes/api');
const reportRoutes = require('./routes/reportRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const { addComment, getComments, updateComment, deleteComment, getCommentReplies, addCommentReply } = require('./controllers/commentController');
const jwt = require('jsonwebtoken');
const userRoutes = require('./routes/userRoutes'); 
// Cố gắng import cookie-parser nếu đã cài đặt, nếu không thì xử lý thủ công
let cookieParser;
try {
    cookieParser = require('cookie-parser');
} catch (error) {
    console.warn('Module cookie-parser không được tìm thấy. Sẽ sử dụng phương thức thủ công để xử lý cookie.');
}

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Thêm middleware cookie-parser nếu đã cài đặt
if (cookieParser) {
    app.use(cookieParser());
}

app.set('view engine', 'ejs');
app.set('views', './views');

// Sử dụng các route cho user
app.use('/api', userRoutes);

// Sử dụng routes từ file api.js
app.use('/api', apiRoutes);

// Sử dụng routes cho báo cáo
app.use('/report', reportRoutes);

// Sử dụng routes cho bảng xếp hạng
app.use('/api/rankings', rankingRoutes);

// API cho thống kê người dùng
app.get('/api/users/:userId/stats', verifyToken, getUserStats);

// Middleware xử lý lỗi chung
app.use((err, req, res, next) => {
    console.error('Lỗi không xử lý được:', err.stack);
    res.status(500).json({ error: 'Lỗi server nội bộ', details: err.message });
});

// API cho cards
app.get('/api/cards', checkDbConnection, getCards);
app.post('/api/cards', checkDbConnection, saveCardData);
app.delete('/api/cards/:id', checkDbConnection, deleteCardData);
app.put('/api/cards/:id', checkDbConnection, updateCard);

// API cho thể loại của một truyện
app.get('/api/cards/:id/genres', checkDbConnection, getCardGenres);
app.put('/api/cards/:id/genres', checkDbConnection, updateCardGenres);

// API cho lịch sử đọc
app.post('/api/reading-history', checkDbConnection, addReadingHistory);
app.get('/api/reading-history/:userId', checkDbConnection, getReadingHistoryByUser);
app.delete('/api/reading-history/:historyId', checkDbConnection, verifyToken, deleteReadingHistory);
app.delete('/api/reading-history/clear/all', checkDbConnection, verifyToken, clearReadingHistory);

// API cho chapters
app.get('/api/chapters', checkDbConnection, getChapters);
app.post('/api/chapters', checkDbConnection, saveChapterData);
app.delete('/api/chapters', checkDbConnection, deleteChapterData);

// API cho users (BẢO VỆ BẰNG checkAdminAuth)
app.get('/api/users', checkDbConnection, checkAdminAuth, getUsers);
app.delete('/api/users/:id', checkDbConnection, checkAdminAuth, deleteUserData);

// API cho blacklist (BẢO VỆ BẰNG checkAdminAuth)
app.get('/api/blacklist', checkDbConnection, checkAdminAuth, getBlacklistUsers);
app.post('/api/blacklist', checkDbConnection, checkAdminAuth, addUserToBlacklist);
app.delete('/api/blacklist/:userId', checkDbConnection, checkAdminAuth, removeUserFromBlacklist);
app.get('/api/blacklist/:userId', checkDbConnection, checkAdminAuth, checkUserBlacklist);

// API đổi mật khẩu người dùng (phải đặt trước route động /api/users/:id)
app.put('/api/users/change-password', [checkDbConnection, verifyToken], async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        
        if (!username || !currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Thiếu thông tin. Vui lòng cung cấp đầy đủ username, currentPassword và newPassword' });
        }
        
        // Kiểm tra xem username trong request có khớp với người dùng đã xác thực không
        if (username !== req.user.username) {
            return res.status(403).json({ error: 'Bạn không có quyền đổi mật khẩu cho tài khoản này' });
        }
        
        // Sử dụng service để thay đổi mật khẩu
        const { changePassword } = require('./service/userService');
        const result = await changePassword(username, currentPassword, newPassword);
        
        res.json(result);
    } catch (err) {
        console.error('Lỗi khi đổi mật khẩu:', err);
        res.status(400).json({ error: err.message || 'Đổi mật khẩu thất bại' });
    }
});

// API cập nhật thông tin người dùng
app.put('/api/users/:id', checkDbConnection, updateUserData);

// API cho genres (BẢO VỆ BẰNG checkAdminAuth)
app.get('/api/genres', checkDbConnection, checkAdminAuth, getGenres);
app.post('/api/genres', checkDbConnection, checkAdminAuth, createGenre);
app.put('/api/genres/:id', checkDbConnection, checkAdminAuth, updateGenre);
app.delete('/api/genres/:id', checkDbConnection, checkAdminAuth, deleteGenre);

// API cho favorites
app.get('/api/favorites/:userId/:cardId', checkDbConnection, checkFavoriteStatus);
app.post('/api/favorites', checkDbConnection, addToFavorites);
app.delete('/api/favorites/:userId/:cardId', checkDbConnection, removeFromFavorites);

// API đếm số lượng
app.get('/api/cards/count', [checkDbConnection, checkAdminAuth], countCards);
app.get('/api/users/count', [checkDbConnection, checkAdminAuth], countUsers);
app.get('/api/genres/count', [checkDbConnection, checkAdminAuth], countGenres);
app.get('/api/chapters/count', [checkDbConnection, checkAdminAuth], countChapters);

// API đăng ký và đăng nhập
app.post('/api/register', checkDbConnection, register);
app.post('/api/login', checkDbConnection, login);

// API cho thông tin người dùng và danh sách yêu thích
app.get('/api/users/:userId', checkDbConnection, getUserProfile);
app.get('/api/favorites/:userId', checkDbConnection, getUserFavorites);

// API bình luận
app.post('/api/comments', checkDbConnection, verifyToken, addComment);
app.get('/api/comments/:chapterId', checkDbConnection, getComments);
app.put('/api/comments/:commentId', checkDbConnection, verifyToken, updateComment);
app.delete('/api/comments/:commentId', checkDbConnection, verifyToken, deleteComment);
app.get('/api/comments/:commentId/replies', checkDbConnection, getCommentReplies);
app.post('/api/comments/:commentId/replies', checkDbConnection, verifyToken, addCommentReply);

// Route admin
app.get('/admin-web', checkDbConnection, checkAdminAuth, async (req, res) => {
    try {
        // Lấy thông tin đầy đủ của người dùng từ database
        const connection = await dbPool.getConnection();
        try {
            const [rows] = await connection.query(
                'SELECT id, username, email, avatar, role_id FROM users WHERE id = ?',
                [req.user.id || req.user.userId]
            );
            
            if (rows.length === 0) {
                return res.status(404).render('401', { error: 'Không tìm thấy thông tin người dùng' });
            }
            
            const user = rows[0];
            console.log('Thông tin người dùng từ database:', user);
            
            res.render('admin-web', { user: user });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        res.status(500).render('401', { error: 'Lỗi khi lấy thông tin người dùng' });
    }
});

// Route cho trang lỗi
app.get('/401', (req, res) => {
    res.render('401', { error: 'Direct access to 401 page' });
});

app.get('/404', (req, res) => {
    res.status(404).render('404');
});

// Route trang chủ
app.get('/', checkDbConnection, async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query('SELECT VERSION() as version');
        res.render('index', { mysqlVersion: rows[0].version });
    } catch (err) {
        console.error('Lỗi khi lấy version MySQL:', err.stack);
        res.status(500).send('Lỗi server');
    } finally {
        connection.release();
    }
});

// Khởi tạo DB và mở cổng
const startServer = async () => {
    try {
        await initializeDb();
        app.listen(port, () => {
            console.log(`Server đang chạy tại http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Không thể khởi tạo database:', err);
        process.exit(1);
    }
};

// Xử lý khi có lỗi không bắt được
process.on('uncaughtException', (err) => {
    console.error('Lỗi không bắt được:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Lỗi promise không được xử lý:', reason);
});

startServer();