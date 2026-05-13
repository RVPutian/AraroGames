const APPWRITE_ADMIN_CONFIG = {
    endpoint: 'https://sgp.cloud.appwrite.io/v1',
    projectId: '6a047edc002f06ccec20',
    databaseId: '6a04949300345f370eff',
    adminsTableId: 'admins'
};

const DASHBOARD_PATH = '/page/AdminDashboard/index.html';

document.addEventListener('DOMContentLoaded', () => {
    initializeAdminLogin();
});

async function initializeAdminLogin() {
    const form = document.getElementById('adminLoginForm');
    const submitButton = document.getElementById('adminLoginButton');

    if (!form || !submitButton) {
        return;
    }

    if (!window.Appwrite) {
        showAuthAlert('Appwrite SDK is not loaded.');
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearAuthAlert();

        const formData = new FormData(form);
        const email = String(formData.get('email') || '').trim();
        const password = String(formData.get('password') || '');

        if (!email || !password) {
            showAuthAlert('Email and password are required.');
            return;
        }

        setFormBusy(true);

        try {
            const account = createAccountService();
            await account.createEmailPasswordSession({ email, password });

            const user = await account.get();
            const isAdmin = await checkAdminAccess(user.$id);

            if (!isAdmin) {
                await account.deleteSession('current');
                throw new Error('Your account is not allowed to access admin dashboard.');
            }

            window.location.href = DASHBOARD_PATH;
        } catch (error) {
            console.error('Admin login failed:', error);
            showAuthAlert(error?.message || 'Login failed.');
        } finally {
            setFormBusy(false);
        }
    });

    try {
        const account = createAccountService();
        const user = await account.get();
        const isAdmin = await checkAdminAccess(user.$id);

        if (isAdmin) {
            window.location.href = DASHBOARD_PATH;
        }
    } catch (error) {
        // No active session is expected for first-time users.
    }
}

function createClient() {
    const { Client } = window.Appwrite;
    return new Client()
        .setEndpoint(APPWRITE_ADMIN_CONFIG.endpoint)
        .setProject(APPWRITE_ADMIN_CONFIG.projectId);
}

function createAccountService() {
    const { Account } = window.Appwrite;
    return new Account(createClient());
}

function createTablesService() {
    const { TablesDB } = window.Appwrite;
    return new TablesDB(createClient());
}

async function checkAdminAccess(userId) {
    const { Query } = window.Appwrite;
    const tablesDB = createTablesService();

    const response = await tablesDB.listRows({
        databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
        tableId: APPWRITE_ADMIN_CONFIG.adminsTableId,
        queries: [
            Query.equal('userId', [userId]),
            Query.equal('active', [true])
        ]
    });

    return Array.isArray(response?.rows) && response.rows.length > 0;
}

function showAuthAlert(message) {
    const alert = document.getElementById('authAlert');
    if (!alert) return;
    alert.textContent = message;
    alert.style.display = 'block';
}

function clearAuthAlert() {
    const alert = document.getElementById('authAlert');
    if (!alert) return;
    alert.style.display = 'none';
    alert.textContent = '';
}

function setFormBusy(isBusy) {
    const submitButton = document.getElementById('adminLoginButton');
    const form = document.getElementById('adminLoginForm');
    if (!submitButton || !form) return;

    submitButton.disabled = isBusy;
    form.querySelectorAll('input').forEach((input) => {
        input.disabled = isBusy;
    });

    submitButton.style.opacity = isBusy ? '0.75' : '1';
}