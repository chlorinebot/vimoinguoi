// language-switcher.js
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo ngôn ngữ
    const currentLang = localStorage.getItem('language') || 'vi';
    setLanguage(currentLang);
    
    // Cập nhật trạng thái active của menu ngôn ngữ
    updateLanguageMenu(currentLang);
    
    // Xử lý sự kiện khi người dùng chọn ngôn ngữ
    const languageLinks = document.querySelectorAll('.language-option');
    languageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('data-lang');
            console.log('Người dùng đã chọn ngôn ngữ:', lang);
            
            // Đặt ngôn ngữ mới
            setLanguage(lang);
            updateLanguageMenu(lang);
            
            // Áp dụng Google Translate
            applyGoogleTranslate(lang);
        });
    });
    
    // Áp dụng Google Translate cho ngôn ngữ hiện tại khi tải trang
    // Chỉ áp dụng nếu ngôn ngữ không phải tiếng Việt
    if (currentLang !== 'vi') {
        applyGoogleTranslate(currentLang);
    }
});

// Hàm áp dụng Google Translate
function applyGoogleTranslate(lang) {
    console.log('Đang áp dụng Google Translate cho ngôn ngữ:', lang);
    
    // Nếu đã có Google Translate script, không cần tạo lại
    let existingScript = document.getElementById('google-translate-script');
    
    // Ẩn thanh thông báo và tất cả các phần tử giao diện của Google Translate
    addGoogleTranslateHidingCSS();
    
    // Tiếng Việt là ngôn ngữ gốc, không cần dịch
    if (lang === 'vi') {
        console.log('Đang chuyển về tiếng Việt (ngôn ngữ gốc)');
        // Xóa cookie Google Translate
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + location.hostname + ';';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + location.hostname.split('.').slice(-2).join('.') + ';';
        
        // Xóa các phần tử Google Translate
        removeGoogleTranslateElements();
        
        // Tải lại trang nếu đang ở trạng thái đã dịch
        if (document.querySelector('.translated-ltr') || document.querySelector('.translated-rtl')) {
            window.location.reload();
        }
        return;
    }
    
    // Xác định mã ngôn ngữ chính xác cho Google Translate
    let targetLang;
    switch(lang) {
        case 'en':
            targetLang = 'en';
            break;
        case 'zh':
            targetLang = 'zh-CN';
            break;
        default:
            targetLang = lang;
    }
    
    console.log('Mã ngôn ngữ mục tiêu cho Google Translate:', targetLang);
    
    // Đặt cookie trực tiếp cho việc dịch
    document.cookie = 'googtrans=/vi/' + targetLang + '; path=/;';
    document.cookie = 'googtrans=/vi/' + targetLang + '; path=/; domain=.' + location.hostname + ';';
    document.cookie = 'googtrans=/vi/' + targetLang + '; path=/; domain=.' + location.hostname.split('.').slice(-2).join('.') + ';';
    
    // Nếu chưa có script Google Translate thì thêm vào
    if (!existingScript) {
        console.log('Đang thêm script Google Translate');
        
        // Thêm xử lý để ẩn phần tử iframe trước khi thêm script
        const iframeBlocker = document.createElement('script');
        iframeBlocker.textContent = `
            // Vô hiệu hóa tạo iframe
            const originalCreateElement = document.createElement;
            document.createElement = function(tag) {
                const element = originalCreateElement.call(document, tag);
                if (tag.toLowerCase() === 'iframe') {
                    setTimeout(() => {
                        if (element.classList.contains('goog-te-menu-frame') || 
                            element.classList.contains('goog-te-banner-frame') ||
                            element.id === 'google_translate_element') {
                            element.style.display = 'none';
                            element.style.visibility = 'hidden';
                            element.style.opacity = '0';
                            element.style.height = '0';
                            element.style.position = 'absolute';
                            element.style.top = '-9999px';
                            element.style.left = '-9999px';
                        }
                    }, 0);
                }
                return element;
            };
        `;
        document.head.appendChild(iframeBlocker);
        
        // Thêm script Google Translate
        existingScript = document.createElement('script');
        existingScript.id = 'google-translate-script';
        existingScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        
        // Tạo function khởi tạo Google Translate
        window.googleTranslateElementInit = function() {
            console.log('Đang khởi tạo Google Translate Element');
            // Tạo phần tử ẩn để chứa widget Translate
            let translateElement = document.getElementById('google_translate_element');
            if (!translateElement) {
                translateElement = document.createElement('div');
                translateElement.id = 'google_translate_element';
                translateElement.style.display = 'none';
                translateElement.style.visibility = 'hidden';
                translateElement.style.position = 'absolute';
                translateElement.style.overflow = 'hidden';
                translateElement.style.height = '0';
                translateElement.style.width = '0';
                translateElement.style.opacity = '0';
                translateElement.style.top = '-9999px';
                translateElement.style.left = '-9999px';
                document.body.appendChild(translateElement);
            }
            
            // Khởi tạo widget Google Translate với cài đặt ẩn giao diện
            new google.translate.TranslateElement({
                pageLanguage: 'vi',
                includedLanguages: 'en,zh-CN',
                autoDisplay: false,
                layout: google.translate.TranslateElement.InlineLayout.NO_FRAME
            }, 'google_translate_element');
            
            // Ẩn các phần tử Google Translate sau khi khởi tạo
            setTimeout(function() {
                console.log('Đang ẩn các phần tử Google Translate');
                hideGoogleElements();
                removeGoogleTranslateElements();
                
                // Đảm bảo ngôn ngữ được chọn đúng
                try {
                    const iframe = document.querySelector('.goog-te-menu-frame');
                    if (iframe) {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        const links = iframeDoc.querySelectorAll('.goog-te-menu2-item');
                        
                        for (let i = 0; i < links.length; i++) {
                            if (links[i].textContent.includes(targetLang === 'en' ? 'English' : '中文')) {
                                links[i].click();
                                break;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Không thể đặt ngôn ngữ tự động:', e);
                }
            }, 1000);
        };
        
        // Thêm script và xử lý sự kiện load
        document.body.appendChild(existingScript);
        existingScript.onload = function() {
            console.log('Script Google Translate đã được tải');
        };
    } else {
        console.log('Script Google Translate đã tồn tại, tải lại trang để áp dụng ngôn ngữ mới');
        // Tải lại trang để áp dụng ngôn ngữ mới
        window.location.reload();
    }
}

// Hàm để thêm CSS ẩn các phần tử Google Translate
function addGoogleTranslateHidingCSS() {
    // Kiểm tra nếu đã có style này rồi thì không thêm nữa
    if (document.getElementById('google-translate-hiding-css')) {
        return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'google-translate-hiding-css';
    styleElement.textContent = `
        /* CSS để ẩn tất cả các phần tử của Google Translate */
        .goog-te-banner-frame, 
        .goog-te-balloon-frame, 
        #goog-gt-tt, 
        .goog-te-balloon-frame, 
        .goog-tooltip, 
        .goog-tooltip:hover,
        .skiptranslate,
        .goog-te-gadget,
        .goog-te-menu-frame,
        .goog-te-menu-value,
        .goog-te-menu,
        .goog-te-spinner, 
        .goog-te-spinner-pos,
        iframe[id*="google"],
        iframe[class*="goog"],
        div[id*="google_translate_element"],
        div[class*="skiptranslate"] { 
            display: none !important; 
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            position: absolute !important;
            top: -999999px !important;
            left: -999999px !important;
            z-index: -9999 !important;
            pointer-events: none !important;
        }
        
        .goog-text-highlight { 
            background-color: transparent !important; 
            border: none !important; 
            box-shadow: none !important;
        }
        
        body { 
            top: 0 !important; 
            position: static !important;
        }
        
        /* Ẩn thanh thông báo dịch ở trên cùng */
        html > body > div.skiptranslate {
            display: none !important;
            visibility: hidden !important;
            top: -999999px !important;
        }
    `;
    document.head.appendChild(styleElement);
}

// Hàm để ẩn các phần tử Google Translate
function hideGoogleElements() {
    const elements = [
        '.goog-te-banner-frame', 
        '.goog-te-menu-frame',
        '.goog-te-balloon-frame',
        '#goog-gt-tt',
        '.goog-te-gadget',
        '.goog-tooltip',
        '.skiptranslate',
        'iframe[id*="google"]',
        'iframe[class*="goog"]',
        'div[id="google_translate_element"]',
        'div[class*="skiptranslate"]',
        '.goog-te-spinner-pos'
    ];
    
    elements.forEach(selector => {
        const items = document.querySelectorAll(selector);
        items.forEach(item => {
            if (item) {
                item.style.display = 'none';
                item.style.visibility = 'hidden';
                item.style.opacity = '0';
                item.style.height = '0';
                item.style.width = '0';
                item.style.position = 'absolute';
                item.style.top = '-9999px';
                item.style.left = '-9999px';
                item.style.zIndex = '-9999';
                item.style.pointerEvents = 'none';
            }
        });
    });
    
    // Sửa thuộc tính của body nếu Google Translate đã thêm
    document.body.style.top = '0px';
    document.body.style.position = 'static';
    
    // Ẩn phần tử skiptranslate đặc biệt
    const skipTranslate = document.querySelector('body > .skiptranslate');
    if (skipTranslate) {
        skipTranslate.style.display = 'none';
        skipTranslate.style.visibility = 'hidden';
        skipTranslate.style.opacity = '0';
    }
}

// Hàm xóa các phần tử Google Translate
function removeGoogleTranslateElements() {
    const elements = [
        '.goog-te-banner-frame', 
        '.goog-te-menu-frame',
        '.goog-te-balloon-frame',
        '#goog-gt-tt',
        '.goog-te-gadget',
        '.goog-tooltip',
        '.skiptranslate',
        'iframe[id*="google"]',
        'iframe[class*="goog"]',
        'div[class*="skiptranslate"]',
        '.goog-te-spinner-pos'
    ];
    
    elements.forEach(selector => {
        const items = document.querySelectorAll(selector);
        items.forEach(item => {
            if (item && item.id !== 'google_translate_element') {
                item.parentNode?.removeChild(item);
            }
        });
    });
}

// Hàm đặt ngôn ngữ và lưu vào localStorage
function setLanguage(lang) {
    localStorage.setItem('language', lang);
    document.documentElement.setAttribute('lang', lang);
    console.log('Đã đổi ngôn ngữ thành:', lang);
    
    // Kích hoạt sự kiện để thông báo thay đổi ngôn ngữ cho các thành phần khác
    const event = new CustomEvent('languageChanged', {
        detail: {
            language: lang,
            previousLanguage: document.documentElement.getAttribute('lang') || 'vi'
        },
        bubbles: true
    });
    document.dispatchEvent(event);
}

// Hàm cập nhật giao diện menu ngôn ngữ
function updateLanguageMenu(currentLang) {
    const languageLinks = document.querySelectorAll('.language-option');
    const currentLanguageText = document.getElementById('currentLanguageText');
    const currentLanguageFlag = document.getElementById('currentLanguageFlag');
    
    // Xóa tất cả các lớp flag-icon-* khỏi currentLanguageFlag
    if (currentLanguageFlag) {
        currentLanguageFlag.className = 'flag-icon me-1';
        currentLanguageFlag.classList.add('flag-icon-' + currentLang);
    }
    
    // Cập nhật tên ngôn ngữ hiện tại
    if (currentLanguageText) {
        switch(currentLang) {
            case 'vi':
                currentLanguageText.textContent = 'Tiếng Việt';
                break;
            case 'en':
                currentLanguageText.textContent = 'English';
                break;
            case 'zh':
                currentLanguageText.textContent = '中文';
                break;
        }
    }
    
    // Cập nhật trạng thái active cho các mục trong dropdown
    languageLinks.forEach(link => {
        const linkLang = link.getAttribute('data-lang');
        if (linkLang === currentLang) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Hàm chuyển đổi văn bản theo ngôn ngữ (sẽ được phát triển sau)
function translateText(key) {
    const translations = {
        'vi': {
            'home': 'Trang chủ',
            'genre': 'Thể loại',
            'history': 'Lịch sử',
            'report': 'Báo cáo sự cố',
            'search': 'Tìm kiếm',
            'login': 'Đăng nhập',
            'register': 'Đăng ký'
            // Thêm các cặp key-value khác tùy theo nhu cầu
        },
        'en': {
            'home': 'Home',
            'genre': 'Genre',
            'history': 'History',
            'report': 'Report Issue',
            'search': 'Search',
            'login': 'Login',
            'register': 'Register'
            // Thêm các cặp key-value khác tùy theo nhu cầu
        },
        'zh': {
            'home': '首页',
            'genre': '类型',
            'history': '历史',
            'report': '报告问题',
            'search': '搜索',
            'login': '登录',
            'register': '注册'
            // Thêm các cặp key-value khác tùy theo nhu cầu
        }
    };
    
    const lang = localStorage.getItem('language') || 'vi';
    return translations[lang][key] || key;
}

// Export hàm dịch để sử dụng từ các file khác
window.translate = translateText;