// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { submitReport, getReports, updateReportStatus, deleteReport } = require('../controllers/reportController');
const { checkDbConnection } = require('../data/dbConfig');
const { checkAdminAuth, verifyToken } = require('../middleware/authMiddleware');

// Route gửi báo cáo (có thể truy cập bởi bất kỳ người dùng nào)
router.post('/', checkDbConnection, submitReport);

// Routes quản lý báo cáo (chỉ admin mới có quyền truy cập)
router.get('/', [checkDbConnection, checkAdminAuth], getReports);
router.put('/:reportId/status', [checkDbConnection, checkAdminAuth], updateReportStatus);
router.delete('/:reportId', [checkDbConnection, checkAdminAuth], deleteReport);

module.exports = router; 