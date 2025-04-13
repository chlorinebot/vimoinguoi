document.addEventListener('DOMContentLoaded', function() {
  // Lấy các phần tử DOM cần thiết
  const searchForm = document.querySelector('nav.sb-topnav form[role="search"]'); // Chọn form trong navbar
  const searchInput = searchForm.querySelector('input[type="search"]');
  const searchButton = searchForm.querySelector('button[data-bs-toggle="offcanvas"]');
  const offcanvasElement = document.getElementById('offcanvasRight'); // Lấy chính offcanvas
  const offcanvasTitle = offcanvasElement.querySelector('#offcanvasRightLabel'); // Lấy title bên trong offcanvas
  const offcanvasBody = offcanvasElement.querySelector('.offcanvas-body'); // Lấy body bên trong offcanvas

  // Xử lý sự kiện khi người dùng nhấn nút tìm kiếm
  searchButton.addEventListener('click', function(event) {
    // Lấy giá trị từ ô input
    const searchValue = searchInput.value.trim().toLowerCase();

    // Cập nhật tiêu đề của offcanvas
    if (offcanvasTitle) {
        offcanvasTitle.textContent = 'Bạn đang tìm kiếm: ' + (searchValue || '...'); // Thêm kiểm tra null
    }

    if (searchValue === '') {
      if (offcanvasBody) { // Thêm kiểm tra null
          offcanvasBody.innerHTML = '<p>Vui lòng nhập từ khóa tìm kiếm</p>';
      }
      return;
    }

    // Kiểm tra xem cardData có tồn tại không
    if (typeof cardData === 'undefined') {
        console.error('Biến cardData không được định nghĩa.');
        if (offcanvasBody) { // Thêm kiểm tra null
            offcanvasBody.innerHTML = '<p>Lỗi: Không thể tải dữ liệu truyện.</p>';
        }
        return;
    }

    // Tìm kiếm trong dữ liệu cardData
    const searchResults = cardData.filter(card =>
      (card.title && card.title.toLowerCase().includes(searchValue)) ||
      (card.content && card.content.toLowerCase().includes(searchValue)) // Thêm kiểm tra null cho title/content
    );

    // Hiển thị kết quả
    if (offcanvasBody) { // Thêm kiểm tra null
        displaySearchResults(searchResults);
    }
  });

  // Ngăn chặn form submit mặc định
  searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    searchButton.click(); // Kích hoạt sự kiện click trên nút tìm kiếm
  });

  // Hàm hiển thị kết quả tìm kiếm
  function displaySearchResults(results) {
    // Xóa nội dung cũ
    offcanvasBody.innerHTML = '';

    if (results.length === 0) {
      offcanvasBody.innerHTML = '<p>Không tìm thấy kết quả phù hợp</p>';
      return;
    }

    // Tạo phần tử để hiển thị số lượng kết quả
    const resultCount = document.createElement('p');
    resultCount.className = 'mb-3';
    resultCount.textContent = `Tìm thấy ${results.length} kết quả:`;
    offcanvasBody.appendChild(resultCount);

    // Tạo các card kết quả
    results.forEach(item => {
      // Tạo card element
      const cardDiv = document.createElement('div');
      // Sử dụng class của Bootstrap, không cần thêm style inline cho dark mode
      cardDiv.className = 'card mb-3';
      cardDiv.style.maxWidth = '540px';
      cardDiv.style.maxHeight = '190px'; // Giữ đồng bộ với giao diện mẫu

      // Tạo nội dung bên trong
      cardDiv.innerHTML = `
        <div class="row g-0">
          <div class="col-md-4">
            <img src="${item.image}" class="img-fluid rounded-start" alt="${item.title || 'Hình ảnh truyện'}">
          </div>
          <div class="col-md-8">
            <div class="card-body">
              <h5 class="card-title">${item.title || 'Không có tiêu đề'}</h5>
              <p class="card-text">${item.content || 'Không có mô tả'}</p>
              ${item.link ? `<a href="${item.link}" class="btn btn-primary btn-sm">Xem thông tin truyện</a>` : ''}
            </div>
          </div>
        </div>
      `;

      // Thêm sự kiện click để mở modal chi tiết
      cardDiv.style.cursor = 'pointer';
      cardDiv.addEventListener('click', function(event) {
        // Ngăn sự kiện click từ nút "Xem chi tiết" kích hoạt modal
        if (event.target.tagName === 'A' && event.target.closest('a')) return; // Sửa điều kiện kiểm tra thẻ a
        openCardModal(item);
      });

      // Thêm card vào offcanvas
      offcanvasBody.appendChild(cardDiv);
    });

    // XÓA BỎ listener không cần thiết cho dark mode switch
    // const darkModeSwitch = document.getElementById('flexSwitchCheckDefault');
    // if (darkModeSwitch) {
    //   darkModeSwitch.addEventListener('change', function() {
    //     if (results.length > 0) {
    //       displaySearchResults(results);
    //     }
    //   });
    // }
  }

  // Hàm mở modal và hiển thị thông tin card (tích hợp từ card_title.js)
  function openCardModal(data) {
    // Kiểm tra xem có dữ liệu hợp lệ không
    if (!data || typeof data !== 'object') {
      console.error('Dữ liệu không hợp lệ để mở modal:', data);
      return;
    }

    // Lấy các phần tử modal
    const modalElement = document.getElementById('card');
    if (!modalElement) {
        console.error('Không tìm thấy phần tử modal #card');
        return;
    }
    const modalTitle = modalElement.querySelector('#cardModalLabel'); // Sửa selector cho tiêu đề modal
    const modalBody = modalElement.querySelector('.modal-body'); // Giữ nguyên selector body modal

    if (!modalTitle || !modalBody) {
        console.error('Không tìm thấy tiêu đề hoặc body của modal #card');
        return;
    }

    // Đặt tiêu đề modal là tiêu đề card
    modalTitle.textContent = data.title || 'Thông tin truyện'; // Thêm giá trị mặc định

    // Cập nhật hình ảnh và thông tin trong card bên trong modal
    const comicImage = modalBody.querySelector('#comicImage');
    const comicTitle = modalBody.querySelector('#comicTitle');
    const comicAuthor = modalBody.querySelector('#comicAuthor');
    const comicGenre = modalBody.querySelector('#comicGenre');
    const comicContent = modalBody.querySelector('#comicContent');

    if (comicImage) {
        comicImage.src = data.image || ''; // Thêm giá trị mặc định
        comicImage.alt = data.title || 'Hình ảnh truyện';
    }
    if (comicTitle) comicTitle.textContent = data.title || 'Không có tiêu đề';
    if (comicAuthor) comicAuthor.textContent = data.author || 'Không rõ tác giả'; // Giả sử có trường author
    if (comicGenre) comicGenre.textContent = data.genre || 'Không rõ thể loại'; // Giả sử có trường genre
    if (comicContent) comicContent.innerHTML = data.content || 'Không có mô tả'; // Sử dụng innerHTML nếu content có thể chứa HTML

    // Đóng offcanvas nếu đang mở
    // const offcanvasElement = document.getElementById('offcanvasRight'); // Đã khai báo ở trên
    if (offcanvasElement) {
        const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (offcanvasInstance) {
            offcanvasInstance.hide();
        }
    }

    // Mở modal sử dụng Bootstrap
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalElement); // Sử dụng getOrCreateInstance
    bsModal.show();

    // TODO: Load chapter list for the selected comic (this part needs integration with chapter.js logic)
    // Ví dụ: giả sử có hàm loadChapters(comicId)
    // if (typeof loadChapters === 'function' && data.id) {
    //     loadChapters(data.id);
    // } else {
    //     console.warn('Hàm loadChapters chưa được định nghĩa hoặc comicId không tồn tại.');
    // }
  }
});