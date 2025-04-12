// auth.js
export function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const roleId = localStorage.getItem('roleId');
    if (!token || !roleId || roleId !== '1') {
        window.location.href = '/';
        return false;
    }
    console.log('User is logged in as admin');
    return true;
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('roleId');
    setTimeout(() => {
        window.location.href = '/';
    }, 500);
}