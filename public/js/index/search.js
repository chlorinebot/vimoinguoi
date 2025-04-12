document.addEventListener('DOMContentLoaded', function() {
  // Lấy các phần tử DOM cần thiết
  const searchForm = document.querySelector('form[role="search"]');
  const searchInput = searchForm.querySelector('input[type="search"]');
  const searchButton = searchForm.querySelector('button[data-bs-toggle="offcanvas"]');
  const offcanvasTitle = document.getElementById('offcanvasRightLabel');
  const offcanvasBody = document.querySelector('.offcanvas-body');

  // Xử lý sự kiện khi người dùng nhấn nút tìm kiếm
  searchButton.addEventListener('click', function(event) {
    // Lấy giá trị từ ô input
    const searchValue = searchInput.value.trim().toLowerCase();
    
    // Cập nhật tiêu đề của offcanvas
    offcanvasTitle.textContent = 'Bạn đang tìm kiếm: ' + searchValue;
    
    if (searchValue === '') {
      offcanvasBody.innerHTML = '<p>Vui lòng nhập từ khóa tìm kiếm</p>';
      return;
    }
    
    // Tìm kiếm trong dữ liệu cardData
    const searchResults = cardData.filter(card => 
      card.title.toLowerCase().includes(searchValue) || 
      card.content.toLowerCase().includes(searchValue)
    );
    
    // Hiển thị kết quả
    displaySearchResults(searchResults);
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
    
    // Kiểm tra nếu đang ở chế độ tối dựa trên localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    
    // Tạo các card kết quả
    results.forEach(item => {
      // Tạo card element
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card mb-3';
      cardDiv.style.maxWidth = '540px';
      cardDiv.style.maxHeight = '190px'; // Giữ đồng bộ với giao diện mẫu
      
      // Tạo nội dung bên trong
      cardDiv.innerHTML = `
        <div class="row g-0">
          <div class="col-md-4">
            <img src="${item.image}" class="img-fluid rounded-start" alt="${item.title}">
          </div>
          <div class="col-md-8">
            <div class="card-body">
              <h5 class="card-title">${item.title}</h5>
              <p class="card-text">${item.content}</p>
              <a href="${item.link}" class="btn btn-primary btn-sm">Xem thông tin truyện</a>
            </div>
          </div>
        </div>
      `;
      
      // Áp dụng kiểu dark mode nếu cần
      if (isDarkMode) {
        cardDiv.style.backgroundColor = '#212529';
        cardDiv.style.borderColor = '#343a40';
        cardDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        
        const cardBody = cardDiv.querySelector('.card-body');
        if (cardBody) {
          cardBody.style.backgroundColor = '#212529';
        }
        
        const cardTitle = cardDiv.querySelector('.card-title');
        if (cardTitle) {
          cardTitle.style.color = '#fff';
        }
        
        const cardText = cardDiv.querySelector('.card-text');
        if (cardText) {
          cardText.style.color = '#adb5bd';
        }
      }
      
      // Thêm sự kiện click để mở modal chi tiết
      cardDiv.style.cursor = 'pointer';
      cardDiv.addEventListener('click', function(event) {
        // Ngăn sự kiện click từ nút "Xem chi tiết" kích hoạt modal
        if (event.target.tagName === 'A') return;
        openCardModal(item);
      });
      
      // Thêm card vào offcanvas
      offcanvasBody.appendChild(cardDiv);
    });
    
    // Lắng nghe sự kiện thay đổi chế độ và cập nhật lại giao diện kết quả
    const darkModeSwitch = document.getElementById('flexSwitchCheckDefault');
    if (darkModeSwitch) {
      darkModeSwitch.addEventListener('change', function() {
        if (results.length > 0) {
          displaySearchResults(results);
        }
      });
    }
  }

  // Hàm mở modal và hiển thị thông tin card (tích hợp từ card_title.js)
  function openCardModal(data) {
    // Lưu dữ liệu card hiện tại
    currentCardData = data;
    
    // Lấy các phần tử modal
    const modal = document.getElementById('card');
    const modalTitle = modal.querySelector('.modal-title');
    const modalBody = modal.querySelector('.modal-body');
    
    // Đặt tiêu đề modal là tiêu đề card
    modalTitle.textContent = data.title;
    
    // Cập nhật hình ảnh và thông tin trong card bên trong modal
    const cardImg = modalBody.querySelector('.img-fluid') || modalBody.querySelector('.card img');
    if (cardImg) {
      cardImg.src = data.image;
      cardImg.alt = data.title;
    }
    
    const cardTitle = modalBody.querySelector('.card-title');
    if (cardTitle) {
      cardTitle.textContent = data.title;
    }
    
    const cardTexts = modalBody.querySelectorAll('.card-text');
    if (cardTexts.length > 0) {
      cardTexts[0].textContent = data.content; // Tác giả hoặc nội dung chính
      if (cardTexts.length > 1) {
        cardTexts[1].textContent = "Thể loại: Truyện tranh";
      }
      if (cardTexts.length > 2) {
        cardTexts[2].textContent = `Nội dung truyện: ${data.content}`;
      }
    }
    
    // Đóng offcanvas nếu đang mở
    const offcanvasElement = document.getElementById('offcanvasRight');
    const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
    if (offcanvasInstance) {
      offcanvasInstance.hide();
    }
    
    // Mở modal sử dụng Bootstrap
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  }
});