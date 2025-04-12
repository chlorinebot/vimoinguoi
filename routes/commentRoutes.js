const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

// Routes cho bình luận
router.post('/', authenticateToken, commentController.addComment);
router.get('/chapter/:chapterId', commentController.getComments);
router.put('/:commentId', authenticateToken, commentController.updateComment);
router.delete('/:commentId', authenticateToken, commentController.deleteComment);

// Routes cho phản hồi bình luận
router.get('/:commentId/replies', commentController.getCommentReplies);
router.post('/:commentId/replies', authenticateToken, commentController.addCommentReply);

// Routes cho phản hồi của phản hồi
router.get('/replies/:replyId/replies', commentController.getRepliesOfReply);
router.post('/replies/:replyId/replies', authenticateToken, commentController.addReplyToReply);
router.put('/replies/:replyId', authenticateToken, commentController.updateReply);
router.delete('/replies/:replyId', authenticateToken, commentController.deleteReply);

module.exports = router; 