const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Cấu hình storage cho multer
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            // Đảm bảo thư mục tồn tại
            const avatarDir = path.join(process.cwd(), 'public', 'storage', 'avatars');
            console.log('Thư mục lưu trữ avatar:', avatarDir);
            
            await fs.access(avatarDir).catch(async () => {
                console.log('Tạo thư mục mới:', avatarDir);
                await fs.mkdir(avatarDir, { recursive: true });
            });
            
            // Kiểm tra quyền ghi
            try {
                const testFile = path.join(avatarDir, 'test.txt');
                await fs.writeFile(testFile, 'test');
                await fs.unlink(testFile);
                console.log('Kiểm tra quyền ghi thành công');
            } catch (error) {
                console.error('Lỗi quyền ghi:', error);
                throw new Error('Không có quyền ghi vào thư mục upload');
            }
            
            cb(null, avatarDir);
        } catch (error) {
            console.error('Lỗi destination:', error);
            cb(new Error(`Không thể truy cập hoặc tạo thư mục lưu trữ: ${error.message}`));
        }
    },
    filename: function (req, file, cb) {
        try {
            console.log('File gốc:', file.originalname);
            
            // Lấy phần mở rộng của file gốc
            const ext = path.extname(file.originalname);
            console.log('Phần mở rộng:', ext);
            
            // Kiểm tra phần mở rộng hợp lệ
            const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];
            if (!allowedExts.includes(ext.toLowerCase())) {
                return cb(new Error('Chỉ chấp nhận file ảnh có định dạng: jpg, jpeg, png, gif'));
            }
            
            // Tạo tên file duy nhất với timestamp
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = uniqueSuffix + ext;
            console.log('Tên file mới:', filename);
            
            cb(null, filename);
        } catch (error) {
            console.error('Lỗi filename:', error);
            cb(new Error(`Lỗi khi xử lý tên file: ${error.message}`));
        }
    }
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
    try {
        console.log('Kiểm tra file:', {
            mimetype: file.mimetype,
            size: req.headers['content-length']
        });
        
        // Kiểm tra MIME type
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }

        // Kiểm tra kích thước file
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (parseInt(req.headers['content-length']) > maxSize) {
            return cb(new Error('Kích thước file không được vượt quá 2MB'), false);
        }

        console.log('File hợp lệ');
        cb(null, true);
    } catch (error) {
        console.error('Lỗi fileFilter:', error);
        cb(new Error(`Lỗi khi kiểm tra file: ${error.message}`));
    }
};

// Khởi tạo multer với cấu hình
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1 // Chỉ cho phép upload 1 file
    }
});

// Export middleware xử lý upload single file
module.exports = upload.single('avatar'); 