const { dbPool } = require('../data/dbConfig');

// Hàm xử lý gửi báo cáo
const submitReport = async (req, res) => {
    const { title, content, email } = req.body;
    
    if (!title || !content) {
        return res.status(400).send('Thiếu thông tin cần thiết');
    }
    
    const connection = await dbPool.getConnection();
    try {
        let userId = 1; // Mặc định là user 1 nếu không đăng nhập
        
        // Kiểm tra người dùng đã đăng nhập chưa
        if (req.user && req.user.id) {
            userId = req.user.id;
            console.log('Người dùng đã đăng nhập gửi báo cáo, id:', userId);
        }
        
        // Thực hiện truy vấn để thêm báo cáo vào database
        const [result] = await connection.query(
            'INSERT INTO reports (user_id, title, content, email, status, reported_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [userId, title, content, email || null, 'pending']
        );
        
        console.log('Đã lưu báo cáo mới, id:', result.insertId);
        
        res.status(201).json({
            message: 'Báo cáo đã được gửi thành công!',
            reportId: result.insertId
        });
    } catch (err) {
        console.error('Lỗi khi lưu báo cáo:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xử lý báo cáo của bạn.' });
    } finally {
        connection.release();
    }
};

// Lấy danh sách báo cáo (chỉ admin)
const getReports = async (req, res) => {
    console.log('===== BẮT ĐẦU LẤY DANH SÁCH BÁO CÁO =====');
    const connection = await dbPool.getConnection();
    try {
        console.log('Thông tin người dùng từ middleware:', req.user);
        
        // Kiểm tra xem người dùng có phải admin không
        if (!req.user || req.user.role_id != 1) {
            console.error('Người dùng không có quyền admin:', req.user ? req.user.role_id : 'không đăng nhập');
            return res.status(403).json({ error: 'Bạn không có quyền truy cập vào tài nguyên này.' });
        }
        
        console.log('Xác thực quyền admin thành công, tiến hành lấy dữ liệu báo cáo');
        
        // Lấy danh sách báo cáo kèm theo tên người dùng
        const [reports] = await connection.query(`
            SELECT r.id, r.user_id, u.username, r.title, r.content, r.email, 
                   r.reported_at, r.status, r.processed_at, r.notes
            FROM reports r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.reported_at DESC
        `);
        
        console.log(`Đã lấy ${reports.length} báo cáo thành công`);
        if (reports.length > 0) {
            console.log('Mẫu dữ liệu báo cáo đầu tiên:', JSON.stringify(reports[0]).substring(0, 200) + '...');
        }
        
        console.log('===== KẾT THÚC LẤY DANH SÁCH BÁO CÁO =====');
        res.json(reports);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách báo cáo:', err);
        console.log('===== LỖI KHI LẤY DANH SÁCH BÁO CÁO =====');
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách báo cáo.' });
    } finally {
        connection.release();
    }
};

// Cập nhật trạng thái báo cáo (chỉ admin)
const updateReportStatus = async (req, res) => {
    const reportId = req.params.id;
    const { status } = req.body;
    
    if (!reportId || !status) {
        return res.status(400).json({ error: 'Thiếu thông tin cần thiết' });
    }
    
    if (!['pending', 'processed'].includes(status)) {
        return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        // Kiểm tra xem người dùng có phải admin không
        if (!req.user || req.user.role_id != 1) {
            return res.status(403).json({ error: 'Bạn không có quyền truy cập vào tài nguyên này.' });
        }
        
        // Xác định xem có cần cập nhật thời gian xử lý hay không
        let processedTimeQuery = '';
        let params = [status, reportId];
        
        if (status === 'processed') {
            processedTimeQuery = ', processed_at = NOW()';
        }
        
        // Cập nhật trạng thái báo cáo
        const [result] = await connection.query(
            `UPDATE reports SET status = ?${processedTimeQuery} WHERE id = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy báo cáo' });
        }
        
        res.json({ message: 'Cập nhật trạng thái báo cáo thành công' });
    } catch (err) {
        console.error('Lỗi khi cập nhật trạng thái báo cáo:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật trạng thái báo cáo.' });
    } finally {
        connection.release();
    }
};

// Xóa báo cáo (chỉ admin)
const deleteReport = async (req, res) => {
    const reportId = req.params.id;
    
    if (!reportId) {
        return res.status(400).json({ error: 'Thiếu ID báo cáo' });
    }
    
    const connection = await dbPool.getConnection();
    try {
        // Kiểm tra xem người dùng có phải admin không
        if (!req.user || req.user.role_id != 1) {
            return res.status(403).json({ error: 'Bạn không có quyền truy cập vào tài nguyên này.' });
        }
        
        // Xóa báo cáo
        const [result] = await connection.query('DELETE FROM reports WHERE id = ?', [reportId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy báo cáo' });
        }
        
        res.json({ message: 'Xóa báo cáo thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa báo cáo:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa báo cáo.' });
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