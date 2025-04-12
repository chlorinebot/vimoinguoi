const { dbPool } = require('../data/dbConfig');
const jwt = require('jsonwebtoken');

// Hàm xử lý gửi báo cáo
const submitReport = async (req, res) => {
    const { title, content, email } = req.body;
    
    if (!title || !content || !email) {
        return res.status(400).send('Thiếu thông tin cần thiết');
    }
    
    const connection = await dbPool.getConnection();
    try {
        let userId = null; // Mặc định là null cho người dùng chưa đăng nhập
        
        // Xử lý cookies thủ công nếu cookie-parser chưa được cài đặt
        let token = null;
        if (req.cookies && req.cookies.token) {
            // Nếu cookie-parser đã được cài đặt
            token = req.cookies.token;
        } else if (req.headers.cookie) {
            // Xử lý thủ công nếu không có cookie-parser
            const cookies = req.headers.cookie.split(';');
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'token') {
                    token = value;
                    break;
                }
            }
        }
        
        // Kiểm tra cả cookie và header Authorization
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.substring(7);
        }
        
        if (token) {
            try {
                // Giải mã token để lấy thông tin người dùng
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
                if (decoded && decoded.userId) {
                    userId = decoded.userId;
                    console.log(`Người dùng đã đăng nhập với ID: ${userId}`);
                }
            } catch (tokenError) {
                console.error('Lỗi khi giải mã token:', tokenError);
                // Tiếp tục với userId null
            }
        }
        
        // Nếu không có token hoặc không lấy được userId từ token
        if (!userId) {
            // Kiểm tra email cung cấp có tồn tại trong hệ thống không
            const [userRows] = await connection.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );
            
            if (userRows.length > 0) {
                userId = userRows[0].id;
                console.log(`Tìm thấy người dùng với email ${email} - ID: ${userId}`);
            } else {
                userId = 1; // Mặc định là ID 1 cho người dùng không xác định
                console.log(`Không tìm thấy người dùng với email ${email}, sử dụng ID mặc định: ${userId}`);
            }
        }
        
        // Log để debug
        console.log('Thông tin báo cáo:', { userId, title, content, email });
        
        // Lưu báo cáo vào database với email
        const [result] = await connection.query(
            'INSERT INTO reports (user_id, title, content, email, reported_at, status) VALUES (?, ?, ?, ?, NOW(), "pending")',
            [userId, title, content, email]
        );
        
        if (result.affectedRows === 1) {
            // Chuyển hướng về trang chính với thông báo thành công
            res.redirect('/?reportSuccess=true');
        } else {
            res.status(500).send('Không thể lưu báo cáo');
        }
    } catch (err) {
        console.error('Lỗi khi xử lý báo cáo:', err);
        res.status(500).send('Đã xảy ra lỗi khi xử lý báo cáo: ' + err.message);
    } finally {
        connection.release();
    }
};

// Hàm lấy danh sách báo cáo
const getReports = async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        // Kiểm tra xem cột notes đã tồn tại chưa
        const [columns] = await connection.query('SHOW COLUMNS FROM reports LIKE ?', ['notes']);
        
        // Nếu cột notes chưa tồn tại, thêm cột notes vào bảng reports
        if (columns.length === 0) {
            await connection.query('ALTER TABLE reports ADD COLUMN notes TEXT');
            console.log('Đã thêm cột notes vào bảng reports');
        }
        
        const [reports] = await connection.query(
            `SELECT r.*, u.username 
             FROM reports r
             LEFT JOIN users u ON r.user_id = u.id
             ORDER BY r.reported_at DESC`
        );
        
        res.json(reports);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách báo cáo:', err);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách báo cáo', details: err.message });
    } finally {
        connection.release();
    }
};

// Hàm cập nhật trạng thái báo cáo
const updateReportStatus = async (req, res) => {
    const { reportId } = req.params;
    const { status, notes } = req.body;
    
    if (!reportId || !status) {
        return res.status(400).json({ error: 'Thiếu thông tin cần thiết' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        // Kiểm tra xem cột notes đã tồn tại chưa
        const [columns] = await connection.query('SHOW COLUMNS FROM reports LIKE ?', ['notes']);
        
        // Nếu cột notes chưa tồn tại, thêm cột notes vào bảng reports
        if (columns.length === 0) {
            await connection.query('ALTER TABLE reports ADD COLUMN notes TEXT');
            console.log('Đã thêm cột notes vào bảng reports');
        }
        
        // Cập nhật trạng thái và ghi chú
        const query = notes 
            ? 'UPDATE reports SET status = ?, processed_at = NOW(), notes = ? WHERE id = ?'
            : 'UPDATE reports SET status = ?, processed_at = NOW() WHERE id = ?';
            
        const params = notes 
            ? [status, notes, reportId]
            : [status, reportId];
            
        const [result] = await connection.query(query, params);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy báo cáo với ID này' });
        }
        
        res.json({ 
            message: 'Cập nhật trạng thái báo cáo thành công',
            status,
            notes: notes || null,
            processed_at: new Date()
        });
    } catch (err) {
        console.error('Lỗi khi cập nhật trạng thái báo cáo:', err);
        res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái báo cáo', details: err.message });
    } finally {
        connection.release();
    }
};

// Hàm xóa báo cáo
const deleteReport = async (req, res) => {
    const { reportId } = req.params;
    
    if (!reportId) {
        return res.status(400).json({ error: 'Thiếu ID báo cáo' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        const [result] = await connection.query(
            'DELETE FROM reports WHERE id = ?',
            [reportId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy báo cáo với ID này' });
        }
        
        res.json({ message: 'Xóa báo cáo thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa báo cáo:', err);
        res.status(500).json({ error: 'Lỗi khi xóa báo cáo', details: err.message });
    } finally {
        connection.release();
    }
};

module.exports = {
    submitReport,
    getReports,
    updateReportStatus,
    deleteReport
}; 