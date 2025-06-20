// Session Manager - Quản lý hết hạn phiên làm việc
class SessionManager {
    constructor() {
        this.timeoutDuration = 60 * 60 * 1000; // 1 giờ = 60 phút * 60 giây * 1000ms
        this.warningDuration = 5 * 60 * 1000; // Cảnh báo trước 5 phút
        this.timeoutId = null;
        this.warningTimeoutId = null;
        this.lastActivityTime = Date.now();
        this.isUserLoggedIn = false;
        
        // Bind methods để đảm bảo context đúng
        this.handleActivity = this.handleActivity.bind(this);
        this.checkSession = this.checkSession.bind(this);
        this.showWarning = this.showWarning.bind(this);
        this.logout = this.logout.bind(this);
        
        this.init();
    }

    init() {
        // Kiểm tra xem có user đăng nhập không
        this.checkUserLoginStatus();
        
        if (this.isUserLoggedIn) {
            this.startSession();
            this.addEventListeners();
        }

        // Lắng nghe sự thay đổi localStorage để đồng bộ giữa các tab
        window.addEventListener('storage', this.handleStorageChange.bind(this));
    }

    checkUserLoginStatus() {
        const userInfo = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token');
        this.isUserLoggedIn = !!(userInfo && token);
        
        if (this.isUserLoggedIn) {
            // Kiểm tra thời gian đăng nhập cuối cùng
            const lastLoginTime = localStorage.getItem('lastLoginTime');
            const loginTime = lastLoginTime ? parseInt(lastLoginTime) : Date.now();
            
            // Nếu đã quá 1 giờ kể từ lần đăng nhập cuối, tự động đăng xuất
            if (Date.now() - loginTime > this.timeoutDuration) {
                this.logout('Phiên làm việc đã hết hạn');
                return;
            }
            
            this.lastActivityTime = loginTime;
        }
    }

    startSession() {
        this.updateLastActivity();
        this.resetTimers();
    }

    updateLastActivity() {
        this.lastActivityTime = Date.now();
        localStorage.setItem('lastActivityTime', this.lastActivityTime.toString());
    }

    resetTimers() {
        // Clear existing timers
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);

        // Set warning timer (5 phút trước khi hết hạn)
        this.warningTimeoutId = setTimeout(() => {
            this.showWarning();
        }, this.timeoutDuration - this.warningDuration);

        // Set logout timer (1 giờ)
        this.timeoutId = setTimeout(() => {
            this.logout('Phiên làm việc đã hết hạn do không hoạt động');
        }, this.timeoutDuration);
    }

    handleActivity() {
        if (!this.isUserLoggedIn) return;
        
        this.updateLastActivity();
        this.resetTimers();
        
        // Ẩn modal cảnh báo nếu đang hiển thị
        this.hideWarning();
    }

    checkSession() {
        if (!this.isUserLoggedIn) return;

        const currentTime = Date.now();
        const timeSinceLastActivity = currentTime - this.lastActivityTime;

        if (timeSinceLastActivity >= this.timeoutDuration) {
            this.logout('Phiên làm việc đã hết hạn');
        }
    }

    showWarning() {
        // Tạo modal cảnh báo
        const modal = this.createWarningModal();
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.style.display = 'flex';
            modal.style.opacity = '1';
        }, 100);
    }

    hideWarning() {
        const existingModal = document.getElementById('session-timeout-warning');
        if (existingModal) {
            existingModal.remove();
        }
    }

    createWarningModal() {
        // Remove existing modal if any
        this.hideWarning();

        const modal = document.createElement('div');
        modal.id = 'session-timeout-warning';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease;
        `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        content.innerHTML = `
            <div style="color: #ff6b6b; font-size: 3rem; margin-bottom: 20px;">
                ⚠️
            </div>
            <h3 style="color: #333; margin-bottom: 15px;">Cảnh báo hết hạn phiên</h3>
            <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">
                Phiên làm việc của bạn sẽ hết hạn trong <strong>5 phút</strong>. 
                Bạn có muốn tiếp tục sử dụng không?
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="extend-session" style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Tiếp tục
                </button>
                <button id="logout-now" style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Đăng xuất
                </button>
            </div>
        `;

        modal.appendChild(content);

        // Add event listeners
        modal.querySelector('#extend-session').addEventListener('click', () => {
            this.handleActivity(); // Reset session
            this.hideWarning();
        });

        modal.querySelector('#logout-now').addEventListener('click', () => {
            this.logout('Người dùng chọn đăng xuất');
        });

        // Add hover effects
        const buttons = modal.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            });
        });

        return modal;
    }

    logout(reason = 'Phiên làm việc đã hết hạn') {
        // Clear all timers
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);

        // Clear localStorage
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        localStorage.removeItem('lastActivityTime');
        localStorage.removeItem('lastLoginTime');

        // Remove event listeners
        this.removeEventListeners();

        // Hide warning modal
        this.hideWarning();

        // Update status
        this.isUserLoggedIn = false;

        // Show logout message
        this.showLogoutMessage(reason);

        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }

    showLogoutMessage(reason) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            max-width: 350px;
            animation: slideInRight 0.3s ease;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>🚪</span>
                <span>${reason}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }

    addEventListeners() {
        // List of events that indicate user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, this.handleActivity, { passive: true });
        });

        // Check session every minute
        this.intervalId = setInterval(this.checkSession, 60000);
    }

    removeEventListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.removeEventListener(event, this.handleActivity);
        });

        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    handleStorageChange(e) {
        // Đồng bộ giữa các tab - nếu một tab logout thì các tab khác cũng logout
        if (e.key === 'userInfo' || e.key === 'token') {
            if (!e.newValue) {
                // User logged out in another tab
                this.isUserLoggedIn = false;
                this.removeEventListeners();
                this.hideWarning();
                window.location.href = '/';
            }
        }
    }

    // Method to manually extend session (có thể gọi từ bên ngoài)
    extendSession() {
        if (this.isUserLoggedIn) {
            this.handleActivity();
        }
    }

    // Method to get remaining time
    getRemainingTime() {
        if (!this.isUserLoggedIn) return 0;
        const elapsed = Date.now() - this.lastActivityTime;
        return Math.max(0, this.timeoutDuration - elapsed);
    }

    // Method to manually start session (gọi khi user login)
    onUserLogin() {
        this.isUserLoggedIn = true;
        localStorage.setItem('lastLoginTime', Date.now().toString());
        this.startSession();
        this.addEventListeners();
    }

    // Method to manually end session (gọi khi user logout)
    onUserLogout() {
        this.logout('Người dùng đăng xuất');
    }
}

// Export singleton instance
export default new SessionManager(); 