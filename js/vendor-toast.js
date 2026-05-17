// ============================================================
//  vendor-toast.js - Toast notification system
// ============================================================

const showToast = (message, type = 'info', duration = 3000) => {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

const getToastIcon = (type) => {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-warning',
        info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
};

const showSuccess = (message) => showToast(message, 'success');
const showError = (message) => showToast(message, 'error');
const showWarning = (message) => showToast(message, 'warning');
const showInfo = (message) => showToast(message, 'info');

// Add slideOut animation to CSS
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
