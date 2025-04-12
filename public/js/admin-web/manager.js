import { checkLoginStatus, logout } from './auth.js';
import { fetchComics, renderComics, deleteComic, editComic, searchComics } from './comics.js';
import { showChapters, renderChapters, deleteChapter, editChapter, searchChapters } from './chapters.js';
import { fetchUsers, renderUsers, deleteUser, editUser, searchUsers } from './users.js';
import { fetchGenres, renderGenres, deleteGenre, editGenre, searchGenres } from './genres.js';

// Khởi tạo khi DOM được tải
document.addEventListener('DOMContentLoaded', () => {
    if (!checkLoginStatus()) return;

    // Tải dữ liệu ban đầu
    fetchComics();
    fetchUsers();
    fetchGenres();

    // Xử lý sự kiện chuyển tab
    const tabLinks = document.querySelectorAll('.nav-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('href'); // Ví dụ: "#comic-management" hoặc "#user-management"

            // Ẩn tất cả các tab
            document.querySelectorAll('.tab-pane').forEach(tab => {
                tab.classList.remove('show', 'active');
            });

            // Hiển thị tab được chọn
            document.querySelector(targetTab).classList.add('show', 'active');

            // Cập nhật trạng thái active cho sidebar
            tabLinks.forEach(tabLink => {
                tabLink.classList.remove('active');
            });
            link.classList.add('active');
        });
    });

    // Sử dụng event delegation để xử lý các nút trong Quản Lý Truyện Tranh
    document.getElementById('comicTableBody').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const comicId = target.dataset.id;
        if (target.classList.contains('delete-comic-btn')) {
            deleteComic(target);
        } else if (target.classList.contains('show-chapters-btn')) {
            showChapters(comicId).then(() => {
                // Gắn sự kiện tìm kiếm chương sau khi modal được mở
                document.getElementById('chapterSearch').oninput = () => searchChapters(comicId);
            });
        } else if (target.classList.contains('edit-comic-btn')) {
            editComic(comicId);
        }
    });

    // Sử dụng event delegation để xử lý các nút trong Quản Lý Người Dùng
    document.getElementById('userTableBody').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const userId = target.dataset.id;
        if (target.classList.contains('delete-user-btn')) {
            deleteUser(target);
        } else if (target.classList.contains('edit-user-btn')) {
            editUser(userId);
        } else if (target.classList.contains('toggle-password')) {
            const row = target.closest('tr');
            const mask = row.querySelector('.password-mask');
            const text = row.querySelector('.password-text');
            mask.classList.toggle('d-none');
            text.classList.toggle('d-none');
            target.innerHTML = text.classList.contains('d-none') ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
        }
    });

    // Sử dụng event delegation để xử lý các nút trong modal Chương
    document.getElementById('chapterTableBody').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const cardId = target.dataset.cardId;
        const chapterNumber = target.dataset.chapterNumber;
        if (target.classList.contains('delete-chapter-btn')) {
            deleteChapter(cardId, chapterNumber, target);
        } else if (target.classList.contains('edit-chapter-btn')) {
            editChapter(cardId, chapterNumber);
        }
    });

    // Sử dụng event delegation để xử lý các nút trong Quản Lý Thể Loại
    document.getElementById('genreTableBody').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const genreId = target.dataset.id;
        if (target.classList.contains('delete-genre-btn')) {
            deleteGenre(target);
        } else if (target.classList.contains('edit-genre-btn')) {
            editGenre(genreId);
        }
    });

    // Tìm kiếm truyện tranh
    document.getElementById('comicSearch').addEventListener('input', searchComics);

    // Tìm kiếm người dùng
    document.getElementById('userSearch').addEventListener('input', searchUsers);

    // Tìm kiếm thể loại
    document.getElementById('genreSearch').addEventListener('input', searchGenres);

    // Thêm hoặc cập nhật truyện
    document.getElementById('addComicForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Không tìm thấy token');

            const comicId = document.getElementById('comicId').value;
            const isEdit = comicId !== '';
            const genres = isEdit ? window.editSelectedGenres : window.selectedGenres;

            if (!genres || genres.length === 0) {
                throw new Error('Vui lòng chọn ít nhất một thể loại!');
            }

            // Chuẩn bị dữ liệu cơ bản của truyện
            const comicData = {
                title: document.getElementById('comicTitle').value,
                image: document.getElementById('comicImage').value,
                content: document.getElementById('comicContent').value,
                link: document.getElementById('comicLink').value
            };

            let response;
            
            if (isEdit) {
                // Cập nhật thông tin cơ bản của truyện
                response = await fetch(`/api/cards/${comicId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(comicData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Lỗi khi cập nhật thông tin truyện');
                }

                // Cập nhật thể loại của truyện
                const genreResponse = await fetch(`/api/cards/${comicId}/genres`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        genres: genres.map(g => parseInt(g))
                    })
                });

                if (!genreResponse.ok) {
                    const errorData = await genreResponse.json();
                    throw new Error(errorData.error || 'Lỗi khi cập nhật thể loại');
                }

            } else {
                // Thêm truyện mới
                response = await fetch('/api/cards', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...comicData,
                        genres: genres.map(g => parseInt(g))
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Lỗi khi thêm truyện mới');
                }
            }

            // Reset form và đóng modal
            this.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addComicModal'));
            modal.hide();

            // Reset các biến toàn cục
            window.selectedGenres = [];
            window.editSelectedGenres = [];
            window.isEditMode = false;
            window.currentComicGenres = [];

            // Tải lại danh sách truyện
            await fetchComics();
            alert(isEdit ? 'Cập nhật truyện thành công!' : 'Thêm truyện thành công!');

        } catch (error) {
            console.error('Lỗi khi xử lý form:', error);
            alert(error.message);
        }
    });

    // Thêm hoặc cập nhật chương
    document.getElementById('addChapterForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const cardId = document.getElementById('chapterCardId').value;
        const chapterNumber = parseInt(document.getElementById('chapterNumber').value);
        const chapterTitle = document.getElementById('chapterTitle').value.trim();
        const content = document.getElementById('chapterContent').value.trim() || null;
        const imageFolder = document.getElementById('chapterImageFolder').value.trim() || null;
        const imageCount = parseInt(document.getElementById('chapterImageCount').value) || 0;

        // Validation
        if (!chapterNumber || isNaN(chapterNumber) || chapterNumber <= 0) {
            alert('Số chương phải là một số dương!');
            return;
        }
        if (!chapterTitle) {
            alert('Vui lòng nhập tiêu đề chương!');
            return;
        }
        if (imageCount < 0) {
            alert('Số lượng hình ảnh không được nhỏ hơn 0!');
            return;
        }

        const chapterData = {
            chapterNumber,
            chapterTitle,
            content,
            imageFolder,
            imageCount
        };

        try {
            const token = localStorage.getItem('token');
            const method = document.getElementById('chapterSubmitButton').textContent === 'Cập Nhật' ? 'PUT' : 'POST';
            const url = method === 'PUT' ? `/api/chapters?card_id=${cardId}&chapter_number=${chapterNumber}` : '/api/chapters';
            const body = method === 'PUT' ? chapterData : { [cardId]: [chapterData] };

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi lưu chương');
            }
            this.reset();
            document.getElementById('chapterCardIdHidden').value = '';
            document.getElementById('addChapterModalLabel').textContent = 'Thêm Chương Mới';
            document.getElementById('chapterSubmitButton').textContent = 'Thêm';
            bootstrap.Modal.getInstance(document.getElementById('addChapterModal')).hide();
            showChapters(cardId); // Cập nhật danh sách chương
        } catch (error) {
            console.error('Lỗi khi lưu chương:', error);
            alert('Lỗi khi lưu chương: ' + error.message);
        }
    });

    // Thêm hoặc cập nhật người dùng
    document.getElementById('addUserForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const id = document.getElementById('userId').value;
        const username = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;

        // Validation
        if (!username) {
            alert('Vui lòng nhập tên người dùng!');
            return;
        }
        if (!email) {
            alert('Vui lòng nhập email!');
            return;
        }
        if (!password) {
            alert('Vui lòng nhập mật khẩu!');
            return;
        }

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/users/${id}` : '/api/register';

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi lưu người dùng');
            }
            this.reset();
            document.getElementById('userId').value = '';
            document.getElementById('addUserModalLabel').textContent = 'Thêm Người Dùng Mới';
            document.getElementById('userSubmitButton').textContent = 'Thêm';
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            fetchUsers(); // Tải lại danh sách
        } catch (error) {
            console.error('Lỗi khi lưu người dùng:', error);
            alert('Lỗi khi lưu người dùng: ' + error.message);
        }
    });

    // Thêm hoặc cập nhật thể loại
    document.getElementById('addGenreForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const id = document.getElementById('genreId').value;
        const genreName = document.getElementById('genreName').value.trim();

        // Validation
        if (!genreName) {
            alert('Vui lòng nhập tên thể loại!');
            return;
        }

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/genres/${id}` : '/api/genres';

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ genre_name: genreName })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi lưu thể loại');
            }
            this.reset();
            document.getElementById('genreId').value = '';
            document.getElementById('addGenreModalLabel').textContent = 'Thêm Thể Loại Mới';
            document.getElementById('genreSubmitButton').textContent = 'Thêm';
            bootstrap.Modal.getInstance(document.getElementById('addGenreModal')).hide();
            fetchGenres(); // Tải lại danh sách thể loại
        } catch (error) {
            console.error('Lỗi khi lưu thể loại:', error);
            alert('Lỗi khi lưu thể loại: ' + error.message);
        }
    });

    // Hàm thử nghiệm mở modal
    window.testModal = function () {
        console.log('Thử mở modal chapterModal');
        const chapterModal = document.getElementById('chapterModal');
        if (!chapterModal) {
            console.error('Không tìm thấy modal chapterModal trong DOM');
            return;
        }
        if (typeof bootstrap === 'undefined') {
            console.error('Bootstrap không được tải đúng cách');
            return;
        }
        const modalInstance = new bootstrap.Modal(chapterModal);
        modalInstance.show();
        console.log('Modal thử nghiệm đã được gọi để hiển thị');
    };

    document.getElementById('logoutButton').addEventListener('click', logout);
});