// Lấy form và các elements
const reportForm = document.getElementById('reportForm');
const statusMessage = document.getElementById('statusMessage');

// Xử lý sự kiện submit form
reportForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Lấy giá trị từ form
    const mangaName = document.getElementById('mangaName').value.trim();
    const chapterNumber = document.getElementById('chapterNumber').value.trim();
    const issueType = document.getElementById('issueType').value;
    const description = document.getElementById('description').value.trim();
    const email = document.getElementById('email').value.trim();
    
    // Kiểm tra dữ liệu nhập vào
    if (!mangaName || !issueType || !description) {
        showMessage('Vui lòng điền đầy đủ thông tin bắt buộc (tên manga, loại vấn đề, mô tả)', 'danger');
        return;
    }
    
    // Hiển thị thông báo đang xử lý
    showMessage('Đang gửi báo cáo...', 'info');
    
    try {
        // Tạo đối tượng dữ liệu báo cáo
        const reportData = {
            mangaName,
            issueType,
            description,
            email: email || null
        };
        
        // Thêm chapterNumber nếu có
        if (chapterNumber) {
            reportData.chapterNumber = chapterNumber;
        }
        
        console.log('Đang gửi báo cáo:', reportData);
        
        // Gửi request API
        const response = await fetch('/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        });
        
        // Kiểm tra phản hồi
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Lỗi khi gửi báo cáo:', response.status, errorText);
            throw new Error(`Không thể gửi báo cáo (${response.status}): ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Phản hồi từ server:', result);
        
        // Xóa dữ liệu form và hiển thị thông báo thành công
        reportForm.reset();
        showMessage('Báo cáo đã được gửi thành công. Cảm ơn bạn đã đóng góp!', 'success');
        
        // Tự động ẩn thông báo sau 5 giây
        setTimeout(() => {
            statusMessage.classList.add('d-none');
        }, 5000);
        
    } catch (error) {
        console.error('Lỗi khi gửi báo cáo:', error);
        showMessage(`Đã xảy ra lỗi: ${error.message}`, 'danger');
    }
});

// Hàm hiển thị thông báo
function showMessage(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `alert alert-${type} mt-3`;
    statusMessage.classList.remove('d-none');
} 