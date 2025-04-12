// models/userModel.js
const { dbPool } = require('../data/dbConfig');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const getAllUsers = async () => {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query('SELECT id, username, email, password, role_id, created_at FROM users');
        return rows;
    } finally {
        connection.release();
    }
};

const registerUser = async (username, email, password, role_id = 2) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        const [existingUsers] = await connection.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUsers.length > 0) throw new Error('Tên người dùng hoặc email đã tồn tại!');

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const [result] = await connection.query(
            'INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role_id]
        );
        const [newUser] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        await connection.commit();
        return { userId: result.insertId, user: newUser[0] };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const loginUser = async (username, password) => {
    const connection = await dbPool.getConnection();
    try {
        console.log('Đang tìm người dùng:', username);
        const [users] = await connection.query('SELECT id, username, password, role_id FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            console.log('Không tìm thấy người dùng');
            return null;
        }

        const user = users[0];
        console.log('Người dùng tìm thấy:', user);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Kết quả so sánh mật khẩu:', isMatch);
        if (!isMatch) {
            console.log('Mật khẩu không khớp');
            return null;
        }

        return user;
    } catch (err) {
        console.error('Lỗi trong loginUser:', err);
        throw err;
    } finally {
        connection.release();
    }
};

const deleteUser = async (id) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query('DELETE FROM users WHERE id = ?', [id]);
        await connection.commit();
        return result;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const updateUser = async (id, userData) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra xem người dùng có tồn tại không
        const [existingUser] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            throw new Error('Người dùng không tồn tại');
        }

        // Chuẩn bị truy vấn và các tham số
        let query = 'UPDATE users SET ';
        const queryParams = [];
        const updateFields = [];

        // Xử lý username nếu có
        if (userData.username) {
            updateFields.push('username = ?');
            queryParams.push(userData.username);
        }

        // Xử lý email nếu có
        if (userData.email) {
            updateFields.push('email = ?');
            queryParams.push(userData.email);
        }

        // Xử lý password nếu có
        if (userData.password) {
            const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
            updateFields.push('password = ?');
            queryParams.push(hashedPassword);
        }

        // Xử lý role_id nếu có
        if (userData.role_id) {
            updateFields.push('role_id = ?');
            queryParams.push(userData.role_id);
        }

        // Nếu không có trường nào cần cập nhật
        if (updateFields.length === 0) {
            throw new Error('Không có dữ liệu cần cập nhật');
        }

        // Hoàn thiện câu truy vấn
        query += updateFields.join(', ') + ' WHERE id = ?';
        queryParams.push(id);

        const [result] = await connection.query(query, queryParams);
        await connection.commit();
        return { 
            affectedRows: result.affectedRows,
            message: 'Cập nhật người dùng thành công'
        };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Đếm số lượng người dùng
const countUsers = async () => {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
        return { count: rows[0].count };
    } catch (err) {
        console.error('Lỗi khi đếm số lượng người dùng:', err);
        throw new Error('Không thể đếm số lượng người dùng');
    } finally {
        connection.release();
    }
};

// Đổi mật khẩu người dùng
const changePassword = async (username, currentPassword, newPassword) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Thêm log để kiểm tra giá trị username
        console.log('Đang thực hiện đổi mật khẩu cho username:', username);

        // Kiểm tra xem người dùng có tồn tại không
        const [users] = await connection.query('SELECT id, username, password FROM users WHERE username = ?', [username]);
        
        // Log để kiểm tra kết quả truy vấn
        console.log('Kết quả tìm kiếm người dùng:', users.length ? 'Tìm thấy' : 'Không tìm thấy');
        
        if (users.length === 0) {
            throw new Error('Người dùng không tồn tại');
        }

        const user = users[0];
        
        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        console.log('Kết quả kiểm tra mật khẩu:', isMatch ? 'Đúng' : 'Sai');
        
        if (!isMatch) {
            throw new Error('Mật khẩu hiện tại không chính xác');
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        
        // Cập nhật mật khẩu
        const [result] = await connection.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, user.id]
        );
        
        console.log('Kết quả cập nhật mật khẩu:', result.affectedRows > 0 ? 'Thành công' : 'Thất bại');
        
        await connection.commit();
        return { 
            success: true,
            message: 'Đổi mật khẩu thành công'
        };
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi trong hàm changePassword:', err);
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = { getAllUsers, registerUser, loginUser, deleteUser, updateUser, countUsers, changePassword };