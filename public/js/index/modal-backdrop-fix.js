/**
 * modal-backdrop-fix.js
 * Script xử lý tự động dọn dẹp lớp phủ modal (modal backdrop) khi đóng modal
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Khởi tạo hệ thống xử lý modal backdrop');
    
    // Cờ để kiểm soát việc ghi nhật ký
    const DEBUG = false;
    
    // Biến theo dõi modal đang mở
    let activeModals = [];
    
    // Hàm ghi nhật ký khi DEBUG=true
    function log(...args) {
        if (DEBUG) {
            console.log(...args);
        }
    }
    
    // Hàm dọn dẹp lớp phủ modal toàn cục
    function cleanupGlobalModalBackdrops() {
        log('Đang dọn dẹp lớp phủ modal...');
        const visibleModals = document.querySelectorAll('.modal.show');
        const visibleModalsCount = visibleModals.length;
        
        if (visibleModalsCount === 0) {
            // Nếu không có modal hiển thị, xóa tất cả lớp phủ
            const backdropCount = document.querySelectorAll('.modal-backdrop').length;
            if (backdropCount > 0) {
                log(`Xóa ${backdropCount} backdrop vì không có modal hiển thị`);
                document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            }
            
            // Xóa các class và style trên body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.body.removeAttribute('style');
            
            // Reset danh sách modal đang hoạt động
            activeModals = [];
        } else if (document.querySelectorAll('.modal-backdrop').length > visibleModalsCount) {
            // Nếu số lượng lớp phủ nhiều hơn số modal, xóa bớt lớp phủ
            const extraBackdrops = document.querySelectorAll('.modal-backdrop').length - visibleModalsCount;
            log(`Phát hiện ${extraBackdrops} backdrop thừa, đang xóa...`);
            
            const backdrops = Array.from(document.querySelectorAll('.modal-backdrop'));
            
            // Chỉ xóa backdrop không có thuộc tính data-bs-backdrop="static"
            const backdropToRemove = backdrops.filter(backdrop => {
                // Tìm modal tương ứng
                const zIndex = parseInt(backdrop.style.zIndex || '1040');
                const modalZIndex = zIndex + 1;
                const relatedModal = document.querySelector(`.modal.show[style*="z-index: ${modalZIndex}"]`);
                
                // Không xóa backdrop của modal có thuộc tính data-bs-backdrop="static"
                return !relatedModal || relatedModal.getAttribute('data-bs-backdrop') !== 'static';
            }).slice(0, extraBackdrops);
            
            backdropToRemove.forEach(backdrop => backdrop.remove());
            
            // Cập nhật z-index cho các backdrop còn lại
            document.querySelectorAll('.modal-backdrop').forEach((backdrop, index) => {
                const zIndex = 1040 + (10 * index);
                backdrop.style.zIndex = zIndex;
            });
            
            // Cập nhật danh sách modal đang hoạt động
            activeModals = Array.from(visibleModals).map(modal => ({
                id: modal.id,
                zIndex: parseInt(modal.style.zIndex || '1050')
            }));
        }
        
        // Đảm bảo z-index chính xác cho modal đang hiển thị
        Array.from(visibleModals).forEach((modal, index) => {
            const zIndex = 1050 + (10 * index);
            modal.style.zIndex = zIndex;
            
            // Thêm vào danh sách theo dõi nếu chưa có
            if (!activeModals.some(m => m.id === modal.id)) {
                activeModals.push({
                    id: modal.id,
                    zIndex: zIndex
                });
            }
        });
        
        // Kiểm tra trường hợp đặc biệt: có class modal-open trên body nhưng không có modal hiển thị
        if (visibleModalsCount === 0 && document.body.classList.contains('modal-open')) {
            log('Phát hiện lỗi: body có class modal-open nhưng không có modal hiển thị, đang sửa...');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            document.body.removeAttribute('style');
        }
        
        // Kiểm tra backdrop "treo" (không có modal tương ứng)
        const allBackdrops = document.querySelectorAll('.modal-backdrop');
        allBackdrops.forEach(backdrop => {
            const zIndex = parseInt(backdrop.style.zIndex || '1040');
            const modalZIndex = zIndex + 1;
            const relatedModal = document.querySelector(`.modal.show[style*="z-index: ${modalZIndex}"]`);
            
            if (!relatedModal) {
                log('Phát hiện backdrop "treo" không có modal tương ứng, đang xóa...');
                backdrop.remove();
            }
        });
    }

    // Xử lý tất cả các modal trong trang
    document.querySelectorAll('.modal').forEach(modal => {
        // Sự kiện trước khi hiển thị modal
        modal.addEventListener('show.bs.modal', function(event) {
            log(`Modal ${modal.id || 'không tên'} sắp hiển thị`);
            
            // Đặt z-index cho modal mới
            const zIndex = 1050 + (10 * document.querySelectorAll('.modal.show').length);
            this.style.zIndex = zIndex;
            
            // Đặt z-index cho backdrop tương ứng
            setTimeout(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop:not(.modal-stack)');
                backdrops.forEach(backdrop => {
                    backdrop.style.zIndex = zIndex - 1;
                    backdrop.classList.add('modal-stack');
                });
            }, 0);
        });

        // Sự kiện sau khi modal đã được hiển thị
        modal.addEventListener('shown.bs.modal', function(event) {
            log(`Modal ${modal.id || 'không tên'} đã hiển thị hoàn tất`);
            
            // Cập nhật danh sách modal đang mở
            const zIndex = parseInt(this.style.zIndex || '1050');
            if (!activeModals.some(m => m.id === modal.id)) {
                activeModals.push({
                    id: modal.id,
                    zIndex: zIndex
                });
            }
            
            // Đảm bảo backdrop được hiển thị đúng
            setTimeout(cleanupGlobalModalBackdrops, 0);
        });

        // Sự kiện sau khi modal đã được ẩn hoàn toàn
        modal.addEventListener('hidden.bs.modal', function(event) {
            log(`Modal ${modal.id || 'không tên'} đã ẩn, đang dọn dẹp...`);
            
            // Lọc modal khỏi danh sách đang hoạt động
            activeModals = activeModals.filter(m => m.id !== modal.id);
            
            setTimeout(cleanupGlobalModalBackdrops, 0);
        });
        
        // Sự kiện ngay khi modal bắt đầu ẩn
        modal.addEventListener('hide.bs.modal', function(event) {
            log(`Modal ${modal.id || 'không tên'} bắt đầu ẩn`);
            
            // Đánh dấu backdrop để xóa
            const currentBackdrops = document.querySelectorAll('.modal-backdrop');
            if (currentBackdrops.length > 0) {
                // Tìm backdrop tương ứng với modal này
                const zIndex = parseInt(this.style.zIndex || '1050');
                const backdropZIndex = zIndex - 1;
                const backdrop = document.querySelector(`.modal-backdrop[style*="z-index: ${backdropZIndex}"]`);
                
                if (backdrop) {
                    backdrop.dataset.toRemove = 'true';
                } else {
                    // Nếu không tìm thấy backdrop cụ thể, đánh dấu backdrop cuối cùng
                    const lastBackdrop = currentBackdrops[currentBackdrops.length - 1];
                    lastBackdrop.dataset.toRemove = 'true';
                }
            }
        });
    });

    // Xử lý phím Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && document.querySelectorAll('.modal.show').length > 0) {
            log('Phát hiện nhấn phím ESC khi modal hiển thị');
            setTimeout(cleanupGlobalModalBackdrops, 10);
        }
    });

    // Xử lý click vào backdrop
    document.addEventListener('click', function(event) {
        if (event.target && event.target.classList && event.target.classList.contains('modal')) {
            log('Phát hiện click vào backdrop của modal');
            setTimeout(cleanupGlobalModalBackdrops, 10);
        }
    });

    // Xử lý click vào nút đóng modal
    document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(button => {
        button.addEventListener('click', function() {
            log('Phát hiện click vào nút đóng modal');
            setTimeout(cleanupGlobalModalBackdrops, 10);
        });
    });
    
    // MutationObserver để theo dõi thay đổi DOM
    const observer = new MutationObserver(function(mutations) {
        let needCleanup = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // Kiểm tra node mới thêm vào
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.classList && node.classList.contains('modal-backdrop')) {
                        log('Phát hiện backdrop mới được thêm vào DOM');
                        needCleanup = true;
                    }
                }
                
                // Kiểm tra node bị xóa
                for (let i = 0; i < mutation.removedNodes.length; i++) {
                    const node = mutation.removedNodes[i];
                    if (node.classList && node.classList.contains('modal')) {
                        log('Phát hiện modal bị xóa khỏi DOM');
                        needCleanup = true;
                    }
                }
            }
        });
        
        if (needCleanup) {
            setTimeout(cleanupGlobalModalBackdrops, 10);
        }
    });
    
    // Bắt đầu theo dõi thay đổi trong body
    observer.observe(document.body, { childList: true, subtree: false });
    
    // Kiểm tra định kỳ backdrop dư thừa - giảm tần suất kiểm tra để tăng hiệu suất
    const checkInterval = setInterval(function() {
        const visibleModals = document.querySelectorAll('.modal.show').length;
        const backdropCount = document.querySelectorAll('.modal-backdrop').length;
        
        // Chỉ xử lý khi phát hiện vấn đề
        if (visibleModals === 0 && backdropCount > 0) {
            console.log(`Phát hiện ${backdropCount} backdrop thừa khi không có modal nào hiển thị`);
            cleanupGlobalModalBackdrops();
        } else if (backdropCount > visibleModals) {
            console.log(`Phát hiện ${backdropCount - visibleModals} backdrop thừa`);
            cleanupGlobalModalBackdrops();
        }
    }, 2000);  // Kiểm tra mỗi 2 giây
    
    // Xử lý trước khi tải lại trang
    window.addEventListener('beforeunload', function() {
        // Dừng interval kiểm tra
        clearInterval(checkInterval);
        
        // Xóa tất cả backdrop
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
    });
    
    // Xử lý khi tab mất focus và được focus lại (người dùng chuyển tab)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // Khi tab được focus lại, kiểm tra và dọn dẹp backdrop
            log('Tab được focus lại, kiểm tra backdrop...');
            setTimeout(cleanupGlobalModalBackdrops, 100);
        }
    });
    
    // Dọn dẹp khi trang vừa tải xong
    cleanupGlobalModalBackdrops();
    
    // Dọn dẹp lại sau 1 giây để xử lý các trường hợp đặc biệt
    setTimeout(cleanupGlobalModalBackdrops, 1000);
    
    // Xuất API công khai để các module khác có thể sử dụng
    window.modalBackdropFix = {
        cleanup: cleanupGlobalModalBackdrops,
        getActiveModals: () => [...activeModals]
    };
}); 