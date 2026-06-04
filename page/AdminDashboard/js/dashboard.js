const APPWRITE_ADMIN_CONFIG = {
    endpoint: 'https://sgp.cloud.appwrite.io/v1',
    projectId: '6a047edc002f06ccec20',
    databaseId: '6a04949300345f370eff',
    adminsTableId: 'admins',
    feedbackTableId: 'feedback',
    // Deploy the Appwrite Function and set the function ID here.
    // Example: '645a1f...' (replace with your actual function id)
    deleteFunctionId: '<FUNCTION_ID_PLACEHOLDER>'
};

const LOGIN_PATH = '/page/Login/index.html';

document.addEventListener('DOMContentLoaded', async () => {
    document.body.setAttribute('data-theme', 'dark');

    if (!window.Appwrite) {
        redirectToLogin();
        return;
    }

    const logoutButton = document.getElementById('adminLogoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleSignOut);
    }

    try {
        const account = createAccountService();
        const user = await account.get();
        const isAdmin = await checkAdminAccess(user.$id);

        if (!isAdmin) {
            await account.deleteSession('current');
            redirectToLogin();
            return;
        }

        const subtitle = document.getElementById('dashboardSubtitle');
        if (subtitle) {
            subtitle.textContent = `Logged in as ${user.email} (${user.$id})`;
        }
        // Helpful debug: log the current user id so you can compare in Appwrite Console
        console.info('Admin dashboard signed-in user id:', user.$id, 'email:', user.email);

        await loadFeedbackRows();
    } catch (error) {
        console.error('Dashboard authorization failed:', error);
        redirectToLogin();
    }
});

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

async function handleSignOut() {
    try {
        const account = createAccountService();
        await account.deleteSession('current');
    } catch (error) {
        console.error('Sign-out failed:', error);
    } finally {
        localStorage.removeItem('araro-admin-session');
        redirectToLogin();
    }
}

async function loadFeedbackRows() {
    const { Query } = window.Appwrite;
    const tablesDB = createTablesService();

    setFeedbackChip('Loading...');

    try {
        const response = await tablesDB.listRows({
            databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
            tableId: APPWRITE_ADMIN_CONFIG.feedbackTableId,
            queries: [
                Query.orderDesc('$createdAt'),
                Query.limit(25)
            ],
            ttl: 0
        });

        const rows = Array.isArray(response?.rows) ? response.rows : [];
        const approvedCount = rows.filter((row) => row.approved === true).length;
        const pendingCount = rows.length - approvedCount;

        renderFeedbackRows(rows);
        updateFeedbackCount(rows.length);
        setFeedbackChip(rows.length
            ? `${approvedCount} approved, ${pendingCount} pending`
            : '0 records');
    } catch (error) {
        console.error('Failed to load feedback rows:', error);
        renderFeedbackRows([]);
        updateFeedbackCount(0);
        setFeedbackChip('Read denied');
        showFeedbackEmptyState('Unable to load feedback. Check table READ permissions for signed-in users.');
    }
}

function renderFeedbackRows(rows) {
    const list = document.getElementById('feedbackList');
    if (!list) return;

    list.innerHTML = '';

    if (!rows.length) {
        showFeedbackEmptyState();
        return;
    }

    hideFeedbackEmptyState();

    rows.forEach((row) => {
        const item = document.createElement('article');
        item.className = 'feedback-item';
        item.dataset.rowId = row.$id;

        const name = row.Name || row.name || 'Unknown';
        const email = row.Email || row.email || 'No email';
        const message = row.Message || row.message || '';
        const isApproved = row.approved === true;
        const created = row.$createdAt ? new Date(row.$createdAt).toLocaleString() : 'Unknown date';

        item.innerHTML = `
            <div class="feedback-item-header">
                <div class="feedback-meta">
                    <span class="feedback-name">${escapeHtml(name)}</span>
                    <span class="feedback-email">${escapeHtml(email)}</span>
                    <span class="feedback-date">${escapeHtml(created)}</span>
                </div>
                <div class="feedback-item-actions">
                    <span class="feedback-status-badge ${isApproved ? 'is-approved' : 'is-pending'}">
                        ${isApproved ? 'Approved' : 'Pending'}
                    </span>
                    ${isApproved ? `
                        <button class="feedback-approve-btn" type="button" data-unapprove-row="${row.$id}">
                            <i class="fas fa-undo"></i>
                            Unapprove
                        </button>
                    ` : `
                        <button class="feedback-approve-btn" type="button" data-approve-row="${row.$id}">
                            <i class="fas fa-check"></i>
                            Approve
                        </button>
                    `}
                    <button class="feedback-delete-btn" type="button" data-delete-row="${row.$id}">
                        <i class="fas fa-trash"></i>
                        Remove
                    </button>
                </div>
            </div>
            <p class="feedback-message">${escapeHtml(message)}</p>
        `;

        list.appendChild(item);
    });

    list.querySelectorAll('[data-approve-row]').forEach((button) => {
        button.addEventListener('click', () => handleApproveFeedback(button));
    });

    list.querySelectorAll('[data-unapprove-row]').forEach((button) => {
        button.addEventListener('click', () => handleUnapproveFeedback(button));
    });

    list.querySelectorAll('[data-delete-row]').forEach((button) => {
        button.addEventListener('click', () => handleDeleteFeedback(button));
    });
}

async function handleApproveFeedback(button) {
    const rowId = button.getAttribute('data-approve-row');
    if (!rowId) return;

    button.disabled = true;
    const originalLabel = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Approving...';

    try {
        const tablesDB = createTablesService();
        // Ensure permissions use the signed-in admin user so Appwrite accepts the principal format
        const account = createAccountService();
        const currentUser = await account.get().catch(() => null);
        const userId = currentUser?.$id || null;

        let permissionsToSet = getApprovedFeedbackPermissions();

        if (userId) {
            const { Permission, Role } = window.Appwrite || {};
            if (Permission && Role) {
                permissionsToSet = [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(userId)),
                    Permission.delete(Role.user(userId))
                ];
            } else {
                permissionsToSet = [
                    'any',
                    `user:${userId}`
                ];
            }
        }

        await tablesDB.updateRow({
            databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
            tableId: APPWRITE_ADMIN_CONFIG.feedbackTableId,
            rowId,
            data: {
                approved: true
            },
            permissions: permissionsToSet
        });

        await loadFeedbackRows();
    } catch (error) {
        console.error('Failed to approve feedback row:', error);
        const errText = error?.message || (typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error));
        alert(`Approve failed: ${errText}`);
        button.disabled = false;
        button.innerHTML = originalLabel;
    }
}

function getApprovedFeedbackPermissions() {
    const { Permission, Role } = window.Appwrite;

    if (Permission && Role) {
        return [
            Permission.read(Role.any()),
            Permission.read(Role.team('admins')),
            Permission.update(Role.team('admins')),
            Permission.delete(Role.team('admins'))
        ];
    }

    // Fallback: use simple permission tokens accepted by the server
    // 'any' makes the row publicly readable; 'label:admin' restricts update/delete to admins
    return [
        'any',
        'label:admin'
    ];
}

async function handleUnapproveFeedback(button) {
    const rowId = button.getAttribute('data-unapprove-row');
    if (!rowId) return;

    button.disabled = true;
    const originalLabel = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';

    try {
        const tablesDB = createTablesService();
        const { Permission, Role } = window.Appwrite || {};
        const account = createAccountService();
        const currentUser = await account.get().catch(() => null);
        const userId = currentUser?.$id || null;

        let permissionsToSet;
        if (userId) {
            if (Permission && Role) {
                permissionsToSet = [
                    Permission.read(Role.user(userId)),
                    Permission.update(Role.user(userId)),
                    Permission.delete(Role.user(userId))
                ];
            } else {
                permissionsToSet = [
                    `user:${userId}`
                ];
            }
        } else {
            // fallback if we can't determine the current user
            permissionsToSet = ['label:admin'];
        }

        await tablesDB.updateRow({
            databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
            tableId: APPWRITE_ADMIN_CONFIG.feedbackTableId,
            rowId,
            data: {
                approved: false
            },
            permissions: permissionsToSet
        });

        await loadFeedbackRows();
    } catch (error) {
        console.error('Failed to unapprove feedback row:', error);
        const errText = error?.message || (typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error));
        alert(`Unapprove failed: ${errText}`);
        button.disabled = false;
        button.innerHTML = originalLabel;
    }
}

async function handleDeleteFeedback(button) {
    const rowId = button.getAttribute('data-delete-row');
    if (!rowId) return;

    const confirmed = window.confirm('Delete this feedback entry? This cannot be undone.');
    if (!confirmed) return;

    button.disabled = true;

    try {
        // Prefer server-side function if configured (safe for production).
        if (APPWRITE_ADMIN_CONFIG.deleteFunctionId && APPWRITE_ADMIN_CONFIG.deleteFunctionId !== '<FUNCTION_ID_PLACEHOLDER>') {
            await callAdminDeleteFunction(rowId);
        } else {
            // Fallback for local testing: attempt direct delete via TablesDB.
            // This will only succeed if your table DELETE permissions allow the current user.
            console.warn('Delete function not configured; attempting direct TablesDB.deleteRow as fallback.');
            const tablesDB = createTablesService();
            await tablesDB.deleteRow({
                databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
                tableId: APPWRITE_ADMIN_CONFIG.feedbackTableId,
                rowId
            });
        }

        const rowNode = document.querySelector(`.feedback-item[data-row-id="${CSS.escape(rowId)}"]`);
        if (rowNode) {
            rowNode.remove();
        }

        const remainingRows = document.querySelectorAll('.feedback-item').length;
        updateFeedbackCount(remainingRows);
        setFeedbackChip(`${remainingRows} record${remainingRows === 1 ? '' : 's'}`);

        if (!remainingRows) {
            showFeedbackEmptyState();
        }
    } catch (error) {
        console.error('Failed to delete feedback row:', error);
        alert(`Delete failed: ${error?.message || 'Unknown error'}`);
        button.disabled = false;
    }
}

async function handleFixVisibility(button) {
    // removed: Fix visibility handler
}

function showFeedbackEmptyState(customMessage) {
    const emptyState = document.getElementById('feedbackEmptyState');
    if (!emptyState) return;

    const small = emptyState.querySelector('small');
    if (small && customMessage) {
        small.textContent = customMessage;
    } else if (small) {
        small.textContent = 'Feedback submitted from the website will appear here.';
    }

    emptyState.style.display = 'block';
}

function hideFeedbackEmptyState() {
    const emptyState = document.getElementById('feedbackEmptyState');
    if (!emptyState) return;
    emptyState.style.display = 'none';
}

function updateFeedbackCount(count) {
    const countNode = document.getElementById('feedbackCount');
    if (!countNode) return;
    countNode.textContent = String(count);
}

function setFeedbackChip(text) {
    const chip = document.getElementById('feedbackPanelChip');
    if (!chip) return;
    chip.textContent = text;
}

async function callAdminDeleteFunction(rowId) {
    if (!APPWRITE_ADMIN_CONFIG.deleteFunctionId || APPWRITE_ADMIN_CONFIG.deleteFunctionId === '<FUNCTION_ID_PLACEHOLDER>') {
        throw new Error('Delete function ID is not configured. Set APPWRITE_ADMIN_CONFIG.deleteFunctionId');
    }

    const account = createAccountService();
    // Create a short-lived JWT for the current session so the function can verify the caller.
    const jwtResp = await account.createJWT();
    const token = jwtResp?.jwt;
    if (!token) throw new Error('Unable to create session JWT');

    const functionUrl = `${APPWRITE_ADMIN_CONFIG.endpoint}/functions/${APPWRITE_ADMIN_CONFIG.deleteFunctionId}/executions`;

    const resp = await fetch(functionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': APPWRITE_ADMIN_CONFIG.projectId
        },
        body: JSON.stringify({ action: 'delete', rowId, token })
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
        const message = (data && (data.message || data.error)) || `Function execution failed with status ${resp.status}`;
        throw new Error(message);
    }

    return data;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function redirectToLogin() {
    window.location.href = LOGIN_PATH;
}
