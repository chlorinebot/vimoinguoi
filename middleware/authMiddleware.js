// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware xác thực token JWT
const verifyToken = (req, res, next) => {
    // Lấy token từ nhiều nguồn (header Authorization, cookie)
    let token = null;

    // 1. Kiểm tra Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // 2. Nếu không có trong Authorization header, kiểm tra cookie
    if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'token') {
                token = value;
                break;
            }
        }
    }

    // 3. Nếu vẫn không có token, kiểm tra req.cookies (nếu cookie-parser đã cài đặt)
    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Không tìm thấy token xác thực' });
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, JWT_SECRET);
        // Lưu thông tin người dùng đã giải mã vào req.user
        req.user = decoded;
        console.log('Token xác thực thành công, thông tin user:', decoded);
        next();
    } catch (err) {
        console.error('Lỗi xác thực token:', err);
        return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};

const checkAdminAuth = (req, res, next) => {
    console.log('===== BẮT ĐẦU XÁC THỰC ADMIN =====');
    // Lấy token từ nhiều nguồn (header Authorization, cookie)
    let token = null;

    // 1. Kiểm tra Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('Tìm thấy token trong Authorization header');
    }

    // 2. Nếu không có trong Authorization header, kiểm tra cookie
    if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'token') {
                token = value;
                console.log('Tìm thấy token trong cookie thủ công');
                break;
            }
        }
    }

    // 3. Nếu vẫn không có token, kiểm tra req.cookies (nếu cookie-parser đã cài đặt)
    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log('Tìm thấy token trong req.cookies');
    }

    // Nếu không có token, render 401
    if (!token) {
        console.log('Không tìm thấy token, trả về lỗi 401');
        return res.status(401).render('401', { error: 'Không tìm thấy token' });
    }
    
    console.log('TOKEN TÌM THẤY:', token.substring(0, 20) + '...');

    try {
        // Giải mã token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token đã giải mã thành công:', decoded);

        // Lấy role_id từ token
        const roleId = decoded.role_id;
        console.log('Role ID từ token:', roleId, '(Kiểu dữ liệu:', typeof roleId + ')');

        // Kiểm tra quyền admin (chấp nhận cả số và chuỗi)
        if (roleId != 1 && roleId != '1') {
            console.log('Người dùng không phải admin, roleId =', roleId);
            return res.status(401).render('401', { error: 'Bạn không có quyền truy cập trang admin' });
        }

        // Nếu là admin, lưu thông tin user và tiếp tục
        req.user = decoded;
        console.log('Xác thực admin thành công, tiếp tục đến trang admin');
        console.log('===== KẾT THÚC XÁC THỰC ADMIN =====');
        next();
    } catch (err) {
        // Nếu token không hợp lệ, render 401
        console.error('Lỗi xác thực token:', err);
        console.log('===== LỖI XÁC THỰC ADMIN =====');
        return res.status(401).render('401', { error: 'Token không hợp lệ' });
    }
};

module.exports = { checkAdminAuth, verifyToken };
