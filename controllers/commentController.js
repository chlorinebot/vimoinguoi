const { dbPool } = require('../data/dbConfig');
const { checkBlacklist } = require('../service/userService');

// Thêm bình luận mới
const addComment = async (req, res) => {
    const { user_id, chapter_id, content } = req.body;
    
    if (!user_id || !chapter_id || !content) {
        return res.status(400).json({ error: 'Thiếu thông tin cần thiết' });
    }
    
    // Kiểm tra xem người dùng có trong danh sách đen không
    try {
        const blacklistStatus = await checkBlacklist(user_id);
        if (blacklistStatus.isBlacklisted) {
            return res.status(403).json({ 
                error: 'Tài khoản của bạn đã bị khóa và không thể bình luận', 
                reason: blacklistStatus.blacklistInfo.reason,
                blacklisted: true
            });
        }
    } catch (err) {
        console.error('Lỗi khi kiểm tra blacklist:', err);
        // Tiếp tục xử lý nếu có lỗi khi kiểm tra blacklist
    }

    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Thêm bình luận mới
        const [result] = await connection.query(
            'INSERT INTO comments (user_id, chapter_id, content, created_at) VALUES (?, ?, ?, NOW())',
            [user_id, chapter_id, content]
        );

        // Cập nhật số lượng bình luận trong bảng chapters
        await connection.query(
            'UPDATE chapters SET comment_count = comment_count + 1 WHERE id = ?',
            [chapter_id]
        );

        await connection.commit();

        // Lấy thông tin bình luận vừa thêm
        const [comments] = await connection.query(
            `SELECT c.*, u.username, u.avatar 
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.id = ?`,
            [result.insertId]
        );

        res.status(201).json(comments[0]);
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi khi thêm bình luận:', err);
        res.status(500).json({ error: 'Lỗi khi thêm bình luận' });
    } finally {
        connection.release();
    }
};

// Lấy danh sách bình luận của một chương
const getComments = async (req, res) => {
    const { chapterId } = req.params;
    const connection = await dbPool.getConnection();
    
    try {
        // Lấy bình luận chính và thông tin người dùng
        const [comments] = await connection.query(
            `SELECT c.*, u.username, u.avatar,
                (SELECT COUNT(*) FROM comment_replies WHERE comment_id = c.id) as reply_count
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.chapter_id = ?
            ORDER BY c.created_at DESC`,
            [chapterId]
        );

        res.json(comments);
    } catch (err) {
        console.error('Lỗi khi lấy bình luận:', err);
        res.status(500).json({ error: 'Lỗi khi lấy bình luận' });
    } finally {
        connection.release();
    }
};

// Cập nhật bình luận
const updateComment = async (req, res) => {
    const { commentId } = req.params;
    const { content, user_id } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Nội dung bình luận không được để trống' });
    }

    const connection = await dbPool.getConnection();
    try {
        // Kiểm tra quyền sửa bình luận
        const [comment] = await connection.query(
            'SELECT user_id FROM comments WHERE id = ?',
            [commentId]
        );

        if (comment.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bình luận' });
        }

        if (comment[0].user_id !== user_id) {
            return res.status(403).json({ error: 'Bạn không có quyền sửa bình luận này' });
        }

        // Cập nhật bình luận
        await connection.query(
            'UPDATE comments SET content = ? WHERE id = ?',
            [content, commentId]
        );

        res.json({ message: 'Đã cập nhật bình luận' });
    } catch (err) {
        console.error('Lỗi khi cập nhật bình luận:', err);
        res.status(500).json({ error: 'Lỗi khi cập nhật bình luận' });
    } finally {
        connection.release();
    }
};

// Xóa bình luận
const deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const { user_id } = req.body;

    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra quyền xóa bình luận
        const [comment] = await connection.query(
            'SELECT user_id, chapter_id FROM comments WHERE id = ?',
            [commentId]
        );

        if (comment.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bình luận' });
        }

        if (comment[0].user_id !== user_id) {
            return res.status(403).json({ error: 'Bạn không có quyền xóa bình luận này' });
        }

        // Xóa bình luận và các phản hồi
        await connection.query('DELETE FROM comment_replies WHERE comment_id = ?', [commentId]);
        await connection.query('DELETE FROM comments WHERE id = ?', [commentId]);

        // Cập nhật số lượng bình luận trong bảng chapters
        await connection.query(
            'UPDATE chapters SET comment_count = comment_count - 1 WHERE id = ?',
            [comment[0].chapter_id]
        );

        await connection.commit();
        res.json({ message: 'Đã xóa bình luận' });
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi khi xóa bình luận:', err);
        res.status(500).json({ error: 'Lỗi khi xóa bình luận' });
    } finally {
        connection.release();
    }
};

// Lấy danh sách phản hồi của một bình luận
const getCommentReplies = async (req, res) => {
    const { commentId } = req.params;
    const connection = await dbPool.getConnection();
    
    try {
        const [replies] = await connection.query(
            `SELECT r.*, u.username, u.avatar 
            FROM comment_replies r
            JOIN users u ON r.user_id = u.id
            WHERE r.comment_id = ?
            ORDER BY r.created_at ASC`,
            [commentId]
        );

        res.json(replies);
    } catch (err) {
        console.error('Lỗi khi lấy phản hồi:', err);
        res.status(500).json({ error: 'Lỗi khi lấy phản hồi' });
    } finally {
        connection.release();
    }
};

// Thêm phản hồi cho bình luận
const addCommentReply = async (req, res) => {
    const { commentId } = req.params;
    const { user_id, content } = req.body;

    if (!user_id || !content) {
        return res.status(400).json({ error: 'Thiếu thông tin cần thiết' });
    }
    
    // Kiểm tra xem người dùng có trong danh sách đen không
    try {
        const blacklistStatus = await checkBlacklist(user_id);
        if (blacklistStatus.isBlacklisted) {
            return res.status(403).json({ 
                error: 'Tài khoản của bạn đã bị khóa và không thể trả lời bình luận', 
                reason: blacklistStatus.blacklistInfo.reason,
                blacklisted: true
            });
        }
    } catch (err) {
        console.error('Lỗi khi kiểm tra blacklist:', err);
        // Tiếp tục xử lý nếu có lỗi khi kiểm tra blacklist
    }

    const connection = await dbPool.getConnection();
    try {
        // Thêm phản hồi mới
        const [result] = await connection.query(
            'INSERT INTO comment_replies (comment_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
            [commentId, user_id, content]
        );

        // Lấy thông tin phản hồi vừa thêm
        const [replies] = await connection.query(
            `SELECT r.*, u.username, u.avatar 
            FROM comment_replies r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?`,
            [result.insertId]
        );

        res.status(201).json(replies[0]);
    } catch (err) {
        console.error('Lỗi khi thêm phản hồi:', err);
        res.status(500).json({ error: 'Lỗi khi thêm phản hồi' });
    } finally {
        connection.release();
    }
};

// Thêm phản hồi cho phản hồi
const addReplyToReply = async (req, res) => {
    const { replyId } = req.params;
    const { user_id, content, parent_reply_id } = req.body;

    if (!user_id || !content) {
        return res.status(400).json({ error: 'Thiếu thông tin cần thiết' });
    }

    const connection = await dbPool.getConnection();
    try {
        // Thêm phản hồi mới
        const [result] = await connection.query(
            'INSERT INTO comment_replies (comment_id, user_id, content, parent_reply_id, created_at) VALUES ((SELECT comment_id FROM comment_replies WHERE id = ?), ?, ?, ?, NOW())',
            [replyId, user_id, content, parent_reply_id]
        );

        // Lấy thông tin phản hồi vừa thêm
        const [replies] = await connection.query(
            `SELECT r.*, u.username, u.avatar 
            FROM comment_replies r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?`,
            [result.insertId]
        );

        res.status(201).json(replies[0]);
    } catch (err) {
        console.error('Lỗi khi thêm phản hồi:', err);
        res.status(500).json({ error: 'Lỗi khi thêm phản hồi' });
    } finally {
        connection.release();
    }
};

// Lấy danh sách phản hồi của một phản hồi
const getRepliesOfReply = async (req, res) => {
    const { replyId } = req.params;
    const connection = await dbPool.getConnection();
    
    try {
        const [replies] = await connection.query(
            `SELECT r.*, u.username, u.avatar 
            FROM comment_replies r
            JOIN users u ON r.user_id = u.id
            WHERE r.parent_reply_id = ?
            ORDER BY r.created_at ASC`,
            [replyId]
        );

        res.json(replies);
    } catch (err) {
        console.error('Lỗi khi lấy phản hồi:', err);
        res.status(500).json({ error: 'Lỗi khi lấy phản hồi' });
    } finally {
        connection.release();
    }
};

// Cập nhật phản hồi
const updateReply = async (req, res) => {
    const { replyId } = req.params;
    const { content, user_id } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Nội dung phản hồi không được để trống' });
    }

    const connection = await dbPool.getConnection();
    try {
        // Kiểm tra quyền sửa phản hồi
        const [reply] = await connection.query(
            'SELECT user_id FROM comment_replies WHERE id = ?',
            [replyId]
        );

        if (reply.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy phản hồi' });
        }

        if (reply[0].user_id !== user_id) {
            return res.status(403).json({ error: 'Bạn không có quyền sửa phản hồi này' });
        }

        // Cập nhật phản hồi
        await connection.query(
            'UPDATE comment_replies SET content = ? WHERE id = ?',
            [content, replyId]
        );

        res.json({ message: 'Đã cập nhật phản hồi' });
    } catch (err) {
        console.error('Lỗi khi cập nhật phản hồi:', err);
        res.status(500).json({ error: 'Lỗi khi cập nhật phản hồi' });
    } finally {
        connection.release();
    }
};

// Xóa phản hồi
const deleteReply = async (req, res) => {
    const { replyId } = req.params;
    const { user_id } = req.body;

    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra quyền xóa phản hồi
        const [reply] = await connection.query(
            'SELECT user_id, comment_id FROM comment_replies WHERE id = ?',
            [replyId]
        );

        if (reply.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy phản hồi' });
        }

        if (reply[0].user_id !== user_id) {
            return res.status(403).json({ error: 'Bạn không có quyền xóa phản hồi này' });
        }

        // Xóa phản hồi và các phản hồi con
        await connection.query('DELETE FROM comment_replies WHERE id = ? OR parent_reply_id = ?', [replyId, replyId]);

        await connection.commit();
        res.json({ message: 'Đã xóa phản hồi' });
    } catch (err) {
        await connection.rollback();
        console.error('Lỗi khi xóa phản hồi:', err);
        res.status(500).json({ error: 'Lỗi khi xóa phản hồi' });
    } finally {
        connection.release();
    }
};

module.exports = {
    addComment,
    getComments,
    updateComment,
    deleteComment,
    getCommentReplies,
    addCommentReply,
    addReplyToReply,
    getRepliesOfReply,
    updateReply,
    deleteReply
}; 