// controllers/authController.js
const jwt = require('jsonwebtoken');
const { registerUser, loginUser } = require('../service/userService');

// Lấy JWT_SECRET từ biến môi trường, nếu không có thì dùng giá trị mặc định
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const register = async (req, res) => {
    try {
        const { username, email, password, role_id } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin (username, email, password)!' });
        }

        const { userId, user } = await registerUser(username, email, password, role_id);
        res.status(201).json({ message: 'Đăng ký thành công!', userId, role_id: user.role_id });
    } catch (err) {
        console.error('Lỗi khi đăng ký:', err.stack);
        res.status(400).json({ error: 'Tên người dùng hoặc email đã tồn tại!', details: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Vui lòng cung cấp username và password!' });
        }

        // Gọi hàm loginUser để kiểm tra thông tin đăng nhập
        const user = await loginUser(username, password);
        if (!user) {
            return res.status(401).json({ error: 'Tên người dùng hoặc mật khẩu không đúng!' });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role_id: user.role_id },
            JWT_SECRET,
            { expiresIn: '190h' }
        );

        res.json({ message: 'Đăng nhập thành công!', token, role_id: user.role_id });
    } catch (err) {
        console.error('Lỗi khi đăng nhập:', err.stack);
        res.status(500).json({ error: 'Lỗi server khi đăng nhập', details: err.message });
    }
};

module.exports = { register, login };