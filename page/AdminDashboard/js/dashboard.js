const APPWRITE_ADMIN_CONFIG = {
    endpoint: 'https://sgp.cloud.appwrite.io/v1',
    projectId: '6a047edc002f06ccec20',
    databaseId: '6a04949300345f370eff',
    adminsTableId: 'admins',
    feedbackTableId: 'feedback',
    patchNotesTableId: 'patch_notes',
    showcaseTableId: 'showcase', 
    storageBucketId: '6a34cd24002a42489904',
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
        console.info('Admin dashboard signed-in user id:', user.$id, 'email:', user.email);

        // Initialize all lists
        await loadFeedbackRows();
        await loadDashboardPatchNotes(); 
        await loadDashboardShowcaseCards(); 
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

// ==========================================
// FEEDBACK MANAGEMENT LOGIC
// ==========================================
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
        if (APPWRITE_ADMIN_CONFIG.deleteFunctionId && APPWRITE_ADMIN_CONFIG.deleteFunctionId !== '<FUNCTION_ID_PLACEHOLDER>') {
            await callAdminDeleteFunction(rowId);
        } else {
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

// ==========================================
// PATCH NOTES PUBLISHING & EDITING LOGIC
// ==========================================
let patchChangesArray = [];
let editingPatchId = null;
let editingPatchImageId = null;
let allLoadedPatches = []; 

document.addEventListener('DOMContentLoaded', () => {
    const addChangeBtn = document.getElementById('addChangeBtn');
    const currentChangesList = document.getElementById('currentChangesList');
    const patchNoteForm = document.getElementById('patchNoteForm');

    // Dynamically add a Cancel button to the form actions
    const formActions = patchNoteForm ? patchNoteForm.querySelector('.form-actions') : null;
    let cancelBtn = null;
    if (formActions) {
        cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.style.display = 'none';
        cancelBtn.style.marginRight = '1rem';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Edit';
        cancelBtn.addEventListener('click', resetPatchForm);
        formActions.prepend(cancelBtn);
    }

    function resetPatchForm() {
        if (patchNoteForm) patchNoteForm.reset();
        if (currentChangesList) currentChangesList.innerHTML = '';
        patchChangesArray = [];
        editingPatchId = null;
        editingPatchImageId = null;
        
        const submitBtn = patchNoteForm ? patchNoteForm.querySelector('button[type="submit"]') : null;
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-upload"></i> Publish Update';
        }
        if (cancelBtn) cancelBtn.style.display = 'none';
    }

    // 1. Build the array of changes
    if (addChangeBtn) {
        addChangeBtn.addEventListener('click', () => {
            const tag = document.getElementById('changeTag').value;
            const textInput = document.getElementById('changeText');
            const text = textInput.value.trim();

            if (!text) return;

            patchChangesArray.push({ tag, text });
            renderPatchChangesList();
            textInput.value = ''; 
        });
    }

    // Render list and allow removal of individual items
    function renderPatchChangesList() {
        if (!currentChangesList) return;
        currentChangesList.innerHTML = '';
        patchChangesArray.forEach((change, index) => {
            const li = document.createElement('li');
            li.style.marginBottom = "0.5rem";
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            
            li.innerHTML = `
                <div>
                    <span class="badge badge-${change.tag.toLowerCase()}">${change.tag}</span> ${escapeHtml(change.text)}
                </div>
                <button type="button" class="feedback-delete-btn" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" data-remove-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            currentChangesList.appendChild(li);
        });

        currentChangesList.querySelectorAll('[data-remove-index]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-remove-index'), 10);
                patchChangesArray.splice(idx, 1);
                renderPatchChangesList();
            });
        });
    }

    // Global edit trigger
    window.startEditingPatch = function(patchId) {
        const patch = allLoadedPatches.find(p => p.$id === patchId);
        if (!patch) return;

        editingPatchId = patch.$id;
        editingPatchImageId = patch.image_id;

        document.getElementById('patchVersion').value = patch.version || '';
        document.getElementById('patchTitle').value = patch.title || '';
        
        try {
            patchChangesArray = JSON.parse(patch.changes || '[]');
        } catch(e) {
            patchChangesArray = [];
        }
        renderPatchChangesList();

        const submitBtn = patchNoteForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Patch Note';
        }
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';

        patchNoteForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // 2. Handle the final form submission
    if (patchNoteForm) {
        patchNoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const version = document.getElementById('patchVersion').value;
            const title = document.getElementById('patchTitle').value;
            const imageInput = document.getElementById('patchImage');
            const submitBtn = patchNoteForm.querySelector('button[type="submit"]');

            if (patchChangesArray.length === 0) {
                alert('Please add at least one change log item using the "Add to List" button.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                let finalImageId = editingPatchImageId; 

                // Upload NEW Image if provided
                if (imageInput && imageInput.files.length > 0) {
                    const file = imageInput.files[0];
                    const storage = new window.Appwrite.Storage(createClient());
                    
                    const uploadResult = await storage.createFile(
                        APPWRITE_ADMIN_CONFIG.storageBucketId,
                        window.Appwrite.ID.unique(),
                        file
                    );
                    finalImageId = uploadResult.$id;

                    // Clean up old image from storage if replacing
                    if (editingPatchId && editingPatchImageId && editingPatchImageId !== 'null') {
                        try {
                            await storage.deleteFile(APPWRITE_ADMIN_CONFIG.storageBucketId, editingPatchImageId);
                        } catch (imgErr) {
                            console.warn("Could not delete old image:", imgErr);
                        }
                    }
                }

                const tablesDB = createTablesService();
                const rowData = {
                    version: version,
                    title: title,
                    changes: JSON.stringify(patchChangesArray),
                    image_id: finalImageId 
                };

                if (editingPatchId) {
                    // Update existing row
                    await tablesDB.updateRow({
                        databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
                        tableId: APPWRITE_ADMIN_CONFIG.patchNotesTableId,
                        rowId: editingPatchId,
                        data: rowData
                    });
                    showDashboardNotification('success', 'Update modified successfully!');
                } else {
                    // Create new row
                    await tablesDB.createRow({
                        databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
                        tableId: APPWRITE_ADMIN_CONFIG.patchNotesTableId,
                        rowId: window.Appwrite.ID.unique(),
                        data: rowData
                    });
                    showDashboardNotification('success', 'Update published successfully!');
                }
                
                resetPatchForm();
                await loadDashboardPatchNotes();

            } catch (error) {
                console.error(error);
                showDashboardNotification('error', 'Failed: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = editingPatchId ? '<i class="fas fa-save"></i> Update Patch Note' : '<i class="fas fa-upload"></i> Publish Update';
            }
        });
    }
});

// ==========================================
// PATCH NOTES MANAGEMENT LOGIC
// ==========================================
async function loadDashboardPatchNotes() {
    const list = document.getElementById('dashboardPatchNotesList');
    if (!list) return;

    list.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">Loading updates...</p>';

    try {
        const { Query } = window.Appwrite;
        const tablesDB = createTablesService();
        
        const response = await tablesDB.listRows({
            databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
            tableId: APPWRITE_ADMIN_CONFIG.patchNotesTableId,
            queries: [
                Query.orderDesc('$createdAt'),
                Query.limit(25)
            ]
        });

        const rows = Array.isArray(response?.rows) ? response.rows : [];
        allLoadedPatches = rows; // Sync global state

        if (rows.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No updates published yet.</p>';
            return;
        }

        list.innerHTML = '';

        rows.forEach(row => {
            const item = document.createElement('article');
            item.className = 'feedback-item'; 
            
            const dateObj = new Date(row.$createdAt);
            const formattedDate = dateObj.toLocaleDateString('en-US');

            item.innerHTML = `
                <div class="feedback-item-header" style="margin-bottom: 0;">
                    <div class="feedback-meta">
                        <span class="feedback-name" style="font-size: 1.1rem; color: var(--color-primary);">${escapeHtml(row.version)} - ${escapeHtml(row.title)}</span>
                        <span class="feedback-date">Published: ${formattedDate}</span>
                    </div>
                    <div class="feedback-item-actions">
                        <button class="patch-edit-btn" type="button" onclick="window.startEditingPatch('${row.$id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="feedback-delete-btn" type="button" data-delete-patch="${row.$id}" data-delete-image="${row.image_id || ''}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            list.appendChild(item);
        });

        list.querySelectorAll('[data-delete-patch]').forEach(button => {
            button.addEventListener('click', () => handleDeletePatchNote(button));
        });

    } catch (error) {
        console.error('Failed to load patch notes for dashboard:', error);
        list.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">Failed to load updates. Check permissions.</p>';
    }
}

async function handleDeletePatchNote(button) {
    const rowId = button.getAttribute('data-delete-patch');
    const imageId = button.getAttribute('data-delete-image'); 
    
    if (!confirm('Are you sure you want to delete this update log? This cannot be undone.')) return;

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';

    try {
        const tablesDB = createTablesService();
        
        await tablesDB.deleteRow({
            databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
            tableId: APPWRITE_ADMIN_CONFIG.patchNotesTableId,
            rowId: rowId
        });

        if (imageId && imageId !== 'null') {
            try {
                const storage = new window.Appwrite.Storage(createClient());
                await storage.deleteFile(APPWRITE_ADMIN_CONFIG.storageBucketId, imageId);
                console.log("Associated image successfully deleted from storage bucket.");
            } catch (imgErr) {
                console.warn('Image could not be deleted (it might have already been removed).', imgErr);
            }
        }

        showDashboardNotification('success', 'Update log and image deleted!');
        await loadDashboardPatchNotes();

    } catch (error) {
        console.error('Failed to delete patch note:', error);
        showDashboardNotification('error', 'Delete failed: ' + error.message);
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-trash"></i> Remove';
    }
}

// ==========================================
// GAME SHOWCASE MANAGEMENT LOGIC
// ==========================================

let editingShowcaseId = null;
let editingShowcaseImageId = null;
let allLoadedShowcaseCards = []; 

// File Upload Text Updater
const showcaseImageInput = document.getElementById('showcaseImage');
const fileChosenText = document.getElementById('file-chosen-text');

if (showcaseImageInput && fileChosenText) {
    showcaseImageInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            fileChosenText.textContent = this.files[0].name;
            fileChosenText.style.color = "var(--primary)"; 
        } else {
            fileChosenText.textContent = 'Click to browse or drag file here';
            fileChosenText.style.color = "var(--text-secondary)";
        }
    });
}

const showcaseForm = document.getElementById('showcaseForm');

// Dynamically add a Cancel button to the showcase form actions
let showcaseCancelBtn = null;
if (showcaseForm) {
    const formActions = showcaseForm.querySelector('.form-actions');
    if (formActions) {
        showcaseCancelBtn = document.createElement('button');
        showcaseCancelBtn.type = 'button';
        showcaseCancelBtn.className = 'btn btn-secondary';
        showcaseCancelBtn.style.display = 'none';
        showcaseCancelBtn.style.marginRight = '1rem';
        showcaseCancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Edit';
        showcaseCancelBtn.addEventListener('click', resetShowcaseForm);
        formActions.prepend(showcaseCancelBtn);
    }
}

function resetShowcaseForm() {
    if (showcaseForm) showcaseForm.reset();
    editingShowcaseId = null;
    editingShowcaseImageId = null;
    
    const submitBtn = showcaseForm ? showcaseForm.querySelector('button[type="submit"]') : null;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Publish Showcase Card';
    }
    if (showcaseCancelBtn) showcaseCancelBtn.style.display = 'none';

    if (fileChosenText) {
        fileChosenText.textContent = 'Click to browse or drag file here';
        fileChosenText.style.color = 'var(--text-secondary)';
    }
}

// Global edit trigger for Showcase
window.startEditingShowcase = function(rowId) {
    const card = allLoadedShowcaseCards.find(c => c.$id === rowId);
    if (!card) return;

    editingShowcaseId = card.$id;
    editingShowcaseImageId = card.imageId; // Note: using imageId as defined in your DB

    document.getElementById('showcaseTitle').value = card.title || '';
    document.getElementById('showcaseDesc').value = card.description || '';
    document.getElementById('showcaseOrder').value = card.order || '';

    const submitBtn = showcaseForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Showcase Card';
    }
    if (showcaseCancelBtn) showcaseCancelBtn.style.display = 'inline-flex';

    if (fileChosenText) {
        fileChosenText.textContent = '(Optional) Select new image to replace current';
        fileChosenText.style.color = 'var(--color-primary)';
    }

    showcaseForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

if (showcaseForm) {
    showcaseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = showcaseForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const title = document.getElementById('showcaseTitle').value;
        const desc = document.getElementById('showcaseDesc').value;
        const order = parseInt(document.getElementById('showcaseOrder').value, 10);
        const imageInput = document.getElementById('showcaseImage');

        try {
            const { ID } = window.Appwrite;
            const storage = new window.Appwrite.Storage(createClient());
            const tablesDB = createTablesService();

            let finalImageId = editingShowcaseImageId;

            // 1. Handle Image Upload / Replacement
            if (imageInput.files.length > 0) {
                const file = imageInput.files[0];
                const uploadResponse = await storage.createFile(
                    APPWRITE_ADMIN_CONFIG.storageBucketId,
                    ID.unique(),
                    file
                );
                finalImageId = uploadResponse.$id;

                // Delete old image if we are replacing it
                if (editingShowcaseId && editingShowcaseImageId && editingShowcaseImageId !== 'null') {
                    try {
                        await storage.deleteFile(APPWRITE_ADMIN_CONFIG.storageBucketId, editingShowcaseImageId);
                    } catch (imgErr) {
                        console.warn("Could not delete old showcase image:", imgErr);
                    }
                }
            } else if (!editingShowcaseId) {
                // If creating a NEW card, an image is required
                throw new Error("Please select an image file.");
            }

            const rowData = {
                title: title,
                description: desc,
                order: order,
                imageId: finalImageId
            };

            // 2. Create or Update the Database Row
            if (editingShowcaseId) {
                await tablesDB.updateRow({
                    databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
                    tableId: APPWRITE_ADMIN_CONFIG.showcaseTableId,
                    rowId: editingShowcaseId,
                    data: rowData
                });
                showDashboardNotification('success', 'Showcase Card updated successfully!');
            } else {
                await tablesDB.createRow({
                    databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
                    tableId: APPWRITE_ADMIN_CONFIG.showcaseTableId,
                    rowId: ID.unique(),
                    data: rowData,
                    permissions: null 
                });
                showDashboardNotification('success', 'Showcase Card published successfully!');
            }
            
            resetShowcaseForm();
            await loadDashboardShowcaseCards();

        } catch (error) {
            console.error('Failed to save showcase card:', error);
            showDashboardNotification('error', 'Failed: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = editingShowcaseId ? '<i class="fas fa-save"></i> Update Showcase Card' : '<i class="fas fa-upload"></i> Publish Showcase Card';
        }
    });
}

async function loadDashboardShowcaseCards() {
    const list = document.getElementById('dashboardShowcaseList');
    if (!list) return;

    list.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">Loading showcase cards...</p>';

    try {
        const { Query } = window.Appwrite;
        const tablesDB = createTablesService();
        
        const response = await tablesDB.listRows({
            databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
            tableId: APPWRITE_ADMIN_CONFIG.showcaseTableId,
            queries: [
                Query.orderAsc('order'),
                Query.limit(20)
            ]
        });

        const rows = Array.isArray(response?.rows) ? response.rows : [];
        allLoadedShowcaseCards = rows; // Sync state for editing

        if (rows.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No showcase cards published yet.</p>';
            return;
        }

        list.innerHTML = '';

        rows.forEach(row => {
            const item = document.createElement('article');
            item.className = 'feedback-item'; 
            
            const imageUrl = row.imageId 
                ? `${APPWRITE_ADMIN_CONFIG.endpoint}/storage/buckets/${APPWRITE_ADMIN_CONFIG.storageBucketId}/files/${row.imageId}/view?project=${APPWRITE_ADMIN_CONFIG.projectId}`
                : '';

            item.innerHTML = `
                <div class="feedback-item-header" style="margin-bottom: 0;">
                    <div class="showcase-item-content">
                        <img src="${imageUrl}" class="showcase-thumb-preview" alt="Preview">
                        <div class="showcase-details">
                            <span class="dashboard-kicker">Order: ${escapeHtml(row.order)}</span>
                            <h3 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 0.3rem;">${escapeHtml(row.title)}</h3>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">${escapeHtml(row.description)}</p>
                        </div>
                    </div>
                    <div class="feedback-item-actions">
                        <button class="patch-edit-btn" type="button" onclick="window.startEditingShowcase('${row.$id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="feedback-delete-btn" type="button" data-delete-showcase="${row.$id}" data-delete-image="${row.imageId || ''}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            list.appendChild(item);
        });

        list.querySelectorAll('[data-delete-showcase]').forEach(button => {
            button.addEventListener('click', () => handleDeleteShowcaseCard(button));
        });

    } catch (error) {
        console.error('Failed to load showcase cards:', error);
        list.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">Failed to load cards. Check console for errors.</p>';
    }
}

async function handleDeleteShowcaseCard(button) {
    const rowId = button.getAttribute('data-delete-showcase');
    const imageId = button.getAttribute('data-delete-image');
    
    if (!confirm('Are you sure you want to delete this showcase card?')) return;

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const tablesDB = createTablesService();
        
        await tablesDB.deleteRow({
            databaseId: APPWRITE_ADMIN_CONFIG.databaseId,
            tableId: APPWRITE_ADMIN_CONFIG.showcaseTableId,
            rowId: rowId
        });

        if (imageId && imageId !== 'null') {
            try {
                const storage = new window.Appwrite.Storage(createClient());
                await storage.deleteFile(APPWRITE_ADMIN_CONFIG.storageBucketId, imageId);
            } catch (imgErr) {
                console.warn('Image already removed or missing', imgErr);
            }
        }

        showDashboardNotification('success', 'Showcase Card deleted!');
        await loadDashboardShowcaseCards();

    } catch (error) {
        console.error('Failed to delete card:', error);
        showDashboardNotification('error', 'Delete failed: ' + error.message);
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-trash"></i> Remove';
    }
}

// ==========================================
// CUSTOM DASHBOARD NOTIFICATIONS
// ==========================================
function showDashboardNotification(type, message) {
    const isSuccess = type === 'success';
    const popupId = isSuccess ? 'dashboardSuccessPopup' : 'dashboardErrorPopup';
    const msgId = isSuccess ? 'dashboardSuccessMessage' : 'dashboardErrorMessage';
    
    const popup = document.getElementById(popupId);
    const msgEl = document.getElementById(msgId);
    
    if (popup && msgEl) {
        msgEl.textContent = message;
        popup.setAttribute('aria-hidden', 'false');
        popup.classList.add('is-visible');
        
        setTimeout(() => {
            popup.classList.remove('is-visible');
            popup.setAttribute('aria-hidden', 'true');
        }, 3000); 
    }
}
