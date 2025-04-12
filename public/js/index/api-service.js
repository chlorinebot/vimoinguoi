/**
 * Service quản lý các API endpoints
 * Tập trung quản lý tất cả các gọi API trong ứng dụng
 */
const ApiService = (function () {
    // Sử dụng đường dẫn tương đối thay vì hard-code URL
    const API_BASE_URL = '/api';

    // Cấu hình mặc định cho fetch
    const defaultFetchOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    /**
     * Thêm authorization header vào request nếu có token
     */
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (token) {
            return {
                ...defaultFetchOptions.headers,
                'Authorization': `Bearer ${token}`
            };
        }
        return defaultFetchOptions.headers;
    };

    /**
     * Xử lý response từ API
     */
    const handleResponse = async (response) => {
        const data = await response.json();

        if (!response.ok) {
            // Nếu có lỗi, tạo một Error object với thông tin từ API
            const error = new Error(data.error || 'Lỗi khi gọi API');
            error.statusCode = response.status;
            error.response = data;
            throw error;
        }

        return data;
    };

    // API functions
    return {
        /**
         * Xác thực người dùng
         */
        login: async (credentials) => {
            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: defaultFetchOptions.headers,
                    body: JSON.stringify(credentials)
                });

                return handleResponse(response);
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        },

        /**
         * Đăng ký người dùng mới
         */
        register: async (userData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: defaultFetchOptions.headers,
                    body: JSON.stringify(userData)
                });

                return handleResponse(response);
            } catch (error) {
                console.error('Registration error:', error);
                throw error;
            }
        },

        /**
         * Đổi mật khẩu người dùng
         */
        changePassword: async (passwordData) => {
            try {
                console.log('ApiService - Đang gửi yêu cầu đổi mật khẩu:', {
                    url: `${API_BASE_URL}/users/change-password`,
                    method: 'PUT',
                    headers: {
                        ...defaultFetchOptions.headers,
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    data: passwordData
                });
                
                const response = await fetch(`${API_BASE_URL}/users/change-password`, {
                    method: 'PUT',
                    headers: {
                        ...defaultFetchOptions.headers,
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(passwordData)
                });

                console.log('ApiService - Nhận phản hồi:', {
                    status: response.status,
                    statusText: response.statusText
                });

                return handleResponse(response);
            } catch (error) {
                console.error('Change password error:', error);
                throw error;
            }
        },

        /**
         * Lấy thông tin comics
         */
        getCards: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/cards`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                return handleResponse(response);
            } catch (error) {
                console.error('Get cards error:', error);
                throw error;
            }
        },

        /**
         * Lấy thông tin comic theo ID
         */
        getCardById: async (id) => {
            try {
                const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                return handleResponse(response);
            } catch (error) {
                console.error(`Get card ${id} error:`, error);
                throw error;
            }
        },

        /**
         * Lấy danh sách chapters
         */
        getChapters: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/chapters`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                return handleResponse(response);
            } catch (error) {
                console.error('Get chapters error:', error);
                throw error;
            }
        },

        /**
         * Lấy chi tiết của một chapter
         */
        getChapterById: async (chapterId) => {
            try {
                const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                return handleResponse(response);
            } catch (error) {
                console.error(`Get chapter ${chapterId} error:`, error);
                throw error;
            }
        },

        /**
         * Lấy danh sách thể loại
         */
        getGenres: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/genres`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                return handleResponse(response);
            } catch (error) {
                console.error('Get genres error:', error);
                throw error;
            }
        },

        /**
         * Lấy lịch sử đọc của người dùng
         */
        getHistory: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/history`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                return handleResponse(response);
            } catch (error) {
                console.error('Get history error:', error);
                throw error;
            }
        },

        /**
         * Thêm một mục vào lịch sử đọc
         */
        addToHistory: async (historyData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/history`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(historyData)
                });

                return handleResponse(response);
            } catch (error) {
                console.error('Add to history error:', error);
                throw error;
            }
        },

        /**
         * Cập nhật thông tin người dùng
         */
        updateUserProfile: async (profileData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/users/profile`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(profileData)
                });

                return handleResponse(response);
            } catch (error) {
                console.error('Update profile error:', error);
                throw error;
            }
        },

        /**
         * Gửi bình luận về một chapter
         */
        addComment: async (commentData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/comments`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(commentData)
                });

                return handleResponse(response);
            } catch (error) {
                console.error('Add comment error:', error);
                throw error;
            }
        },

        /**
         * Lấy danh sách bình luận của một chapter
         */
        getComments: async (chapterId) => {
            try {
                const response = await fetch(`${API_BASE_URL}/comments/${chapterId}`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                return handleResponse(response);
            } catch (error) {
                console.error(`Get comments for chapter ${chapterId} error:`, error);
                throw error;
            }
        },

        /**
         * Kiểm tra trạng thái yêu thích của một truyện
         */
        checkFavoriteStatus: async (userId, cardId) => {
            try {
                const response = await fetch(`${API_BASE_URL}/favorites/${userId}/${cardId}`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Check favorite status error:', error);
                throw error;
            }
        },

        /**
         * Thêm truyện vào danh sách yêu thích
         */
        addToFavorites: async (favoriteData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/favorites`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(favoriteData)
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Add to favorites error:', error);
                throw error;
            }
        },
        /**
 * Lấy thông tin hồ sơ người dùng
 */
getUserProfile: async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Get user profile error:', error);
        throw error;
    }
},

/**
 * Lấy danh sách truyện yêu thích của người dùng
 */
getUserFavorites: async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        const data = await handleResponse(response);
        // Đảm bảo dữ liệu trả về là mảng
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Get user favorites error:', error);
        throw error;
    }
},
        /**
         * Xóa truyện khỏi danh sách yêu thích
         */
        removeFromFavorites: async (userId, cardId) => {
            try {
                const response = await fetch(`${API_BASE_URL}/favorites/${userId}/${cardId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Remove from favorites error:', error);
                throw error;
            }
        },

        /**
         * Lấy bảng xếp hạng truyện đọc nhiều nhất
         * Dựa trên bảng cards (số lượt xem)
         */
        getRankingMostRead: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/rankings/most-read`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Get most read rankings error:', error);
                throw error;
            }
        },

        /**
         * Lấy bảng xếp hạng truyện được yêu thích nhất
         * Dựa trên bảng favorites (số lượt yêu thích)
         */
        getRankingMostLiked: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/rankings/most-liked`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Get most liked rankings error:', error);
                throw error;
            }
        },

        /**
         * Lấy bảng xếp hạng truyện có đánh giá cao nhất
         * Dựa trên bảng ratings (điểm đánh giá trung bình)
         */
        getRankingHighestRated: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/rankings/highest-rated`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Get highest rated rankings error:', error);
                throw error;
            }
        },

        /**
         * Lấy bảng xếp hạng truyện xem nhiều trong tuần
         * Dựa trên bảng cards (số lượt xem trong 7 ngày gần nhất)
         */
        getRankingWeeklyTop: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/rankings/weekly-top`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Get weekly top rankings error:', error);
                throw error;
            }
        },

        /**
         * Lấy bảng xếp hạng truyện xem nhiều trong ngày
         * Dựa trên bảng cards (số lượt xem trong 24 giờ gần nhất)
         */
        getRankingDailyTop: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/rankings/daily-top`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Get daily top rankings error:', error);
                throw error;
            }
        }
        
    };
})();

// Xuất module để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
} else {
    window.ApiService = ApiService;
}