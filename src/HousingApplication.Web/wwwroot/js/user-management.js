/**
 * User & Role Management Controller (SuperUser-only)
 * Enforces 3-tier RBAC UI:
 *   1. SuperUser (strictly 1 in system): Full access + exclusive user/permission management
 *   2. Admin: Full archive & delete access, cannot manage users or permissions
 *   3. Contributor (Regular User): Read & upload only, no delete or settings access
 *
 * Includes seamless local directory fallback (housing_rbac_directory_v1) when running
 * against an older precompiled FileOrganizer.Web.exe binary returning 404/405 on /api/users.
 */
(function () {
    'use strict';

    let usersList = [];
    let isInitialized = false;
    let activePasswordResetUserId = null;
    let usingLocalFallback = false;

    const DEFAULT_FALLBACK_USERS = [
        { id: 1, username: 'Emad', displayName: 'Emad', role: 'SuperUser' },
        { id: 2, username: 'Bubshait', displayName: 'Bubshait', role: 'Admin' },
        { id: 3, username: 'Ehtezaz', displayName: 'Ehtezaz', role: 'Admin' },
        { id: 4, username: 'Mustafa', displayName: 'Mustafa', role: 'Admin' },
        { id: 5, username: 'Nawaf', displayName: 'Nawaf', role: 'Contributor' },
        { id: 6, username: 'Naseem', displayName: 'Naseem', role: 'Contributor' },
        { id: 7, username: 'Mulla', displayName: 'Mulla', role: 'Contributor' },
        { id: 8, username: 'Mariam', displayName: 'Mariam', role: 'Contributor' },
        { id: 9, username: 'Shaima', displayName: 'Shaima', role: 'Contributor' },
        { id: 10, username: 'Mona', displayName: 'Mona', role: 'Contributor' }
    ];

    function tr(key, fallback) {
        if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
            const val = window.i18n.t(key, fallback || '');
            if (val && val !== key) return val;
        }
        return fallback || key;
    }

    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function sortUsersByTier(list) {
        const rank = (role) => {
            const r = String(role || '').toLowerCase();
            if (r === 'superuser') return 0;
            if (r === 'admin') return 1;
            return 2;
        };
        return [...list].sort((a, b) => {
            const diff = rank(a.role) - rank(b.role);
            if (diff !== 0) return diff;
            return Number(a.id || 0) - Number(b.id || 0);
        });
    }

    function readLocalDirectory() {
        if (window.authManager && typeof window.authManager.getLocalRbacDirectory === 'function') {
            return window.authManager.getLocalRbacDirectory();
        }
        try {
            const raw = localStorage.getItem('housing_rbac_directory_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
                    return {
                        users: parsed.users,
                        deletedUsernames: Array.isArray(parsed.deletedUsernames) ? parsed.deletedUsernames : []
                    };
                }
            }
        } catch (e) {}
        return {
            users: DEFAULT_FALLBACK_USERS.map(u => ({ ...u })),
            deletedUsernames: []
        };
    }

    function writeLocalDirectory(dir) {
        if (window.authManager && typeof window.authManager.saveLocalRbacDirectory === 'function') {
            window.authManager.saveLocalRbacDirectory(dir);
            return;
        }
        try {
            localStorage.setItem('housing_rbac_directory_v1', JSON.stringify(dir));
        } catch (e) {}
    }

    function buildHeaders() {
        return { 'Content-Type': 'application/json' };
    }

    function isCurrentUserSuperUser() {
        return Boolean(
            typeof window !== 'undefined' &&
            window.authManager &&
            typeof window.authManager.canManageUsers === 'function' &&
            window.authManager.canManageUsers()
        );
    }

    function syncUserMgmtVisibility() {
        const canManage = isCurrentUserSuperUser();
        const menuBtn = document.getElementById('btn-open-user-management');
        if (menuBtn) {
            menuBtn.classList.toggle('hidden', !canManage);
        }

        if (!canManage) {
            const modal = document.getElementById('user-management-modal');
            if (modal && !modal.classList.contains('hidden')) {
                closeUserManagementModal();
            }
        }
    }

    function showFeedback(type, message) {
        const banner = document.getElementById('user-mgmt-feedback');
        if (!banner) return;

        let cls = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200';
        let icon = '✓';
        if (type === 'error') {
            cls = 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200';
            icon = '⚠️';
        } else if (type === 'info') {
            cls = 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-200';
            icon = 'ℹ️';
        }

        banner.className = `rounded-xl border p-3 text-xs font-semibold flex items-center gap-2 ${cls}`;
        banner.innerHTML = `<span>${icon}</span><span>${esc(message)}</span>`;
        banner.classList.remove('hidden');
    }

    function clearFeedback() {
        if (usingLocalFallback) {
            showFeedback(
                'info',
                tr(
                    'user_mgmt.local_fallback_notice',
                    'User and permission changes are currently saved locally because the running server binary predates /api/users. Run scripts\\build-windows.bat once for permanent SQLite persistence.'
                )
            );
            return;
        }
        const banner = document.getElementById('user-mgmt-feedback');
        if (banner) {
            banner.classList.add('hidden');
            banner.innerHTML = '';
        }
    }

    function renderUsersList() {
        const listEl = document.getElementById('user-mgmt-list');
        const countBadge = document.getElementById('user-mgmt-count-badge');
        if (!listEl) return;

        const ordered = sortUsersByTier(usersList);
        if (countBadge) {
            countBadge.textContent = String(ordered.length);
        }

        listEl.innerHTML = '';

        ordered.forEach(user => {
            const role = String(user.role || 'Contributor');
            const isSuper = role.toLowerCase() === 'superuser';
            const isAdmin = role.toLowerCase() === 'admin';
            const initial = String(user.displayName || user.username || 'U').charAt(0).toUpperCase();

            const card = document.createElement('div');
            card.className = isSuper
                ? 'p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/50 dark:bg-amber-950/25 space-y-2.5'
                : 'p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5';
            card.setAttribute('data-user-id', String(user.id));

            const avatarBg = isSuper
                ? 'bg-amber-600'
                : (isAdmin ? 'bg-emerald-600' : 'bg-blue-600');

            const roleBadgeHtml = isSuper
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">👑 ${esc(tr('user_mgmt.unique_superuser_tag', 'Sole Super User'))}</span>`
                : isAdmin
                    ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">${esc(tr('common.admin', 'System Administrator'))}</span>`
                    : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">${esc(tr('common.regular_user', 'Regular User'))}</span>`;

            const controlsHtml = isSuper
                ? `
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <button type="button" class="btn-user-reset-pass px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer" data-uid="${user.id}">
                            🔑 ${esc(tr('user_mgmt.reset_password_btn', 'Reset Password'))}
                        </button>
                    </div>
                `
                : `
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <select class="user-role-select px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer" data-uid="${user.id}" aria-label="Role for ${esc(user.username)}">
                            <option value="Admin" ${isAdmin ? 'selected' : ''}>${esc(tr('user_mgmt.role_admin_option', 'Admin (Full Access)'))}</option>
                            <option value="Contributor" ${!isAdmin ? 'selected' : ''}>${esc(tr('user_mgmt.role_regular_option', 'Regular User (Read & Upload)'))}</option>
                        </select>
                        <button type="button" class="btn-user-reset-pass px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer" data-uid="${user.id}">
                            🔑 ${esc(tr('user_mgmt.reset_password_btn', 'Reset Password'))}
                        </button>
                        <button type="button" class="btn-user-transfer-super px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 cursor-pointer" data-uid="${user.id}" data-uname="${esc(user.displayName || user.username)}">
                            👑 ${esc(tr('user_mgmt.transfer_super_btn', 'Make Super User'))}
                        </button>
                        <button type="button" class="btn-user-delete px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 cursor-pointer" data-uid="${user.id}" data-uname="${esc(user.displayName || user.username)}">
                            ${esc(tr('user_mgmt.remove_user_btn', 'Remove'))}
                        </button>
                    </div>
                `;

            const permissionsRowHtml = isSuper
                ? `
                    <div class="pt-2 border-t border-amber-200/60 dark:border-amber-800/50 flex flex-wrap items-center gap-2 text-[11px]">
                        <span class="font-semibold text-amber-900/80 dark:text-amber-200/80">${esc(tr('user_mgmt.perm_section_label', 'Permissions granted to this account:'))}</span>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/60 border border-amber-200 dark:border-amber-800/60 text-slate-700 dark:text-slate-200">✓ ${esc(tr('user_mgmt.perm_read_upload', 'Browse, Search & Upload Documents'))}</span>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/60 border border-amber-200 dark:border-amber-800/60 text-slate-700 dark:text-slate-200">✓ ${esc(tr('user_mgmt.perm_delete_records', 'Delete Documents, Houses & Areas'))}</span>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/60 border border-amber-200 dark:border-amber-800/60 text-slate-700 dark:text-slate-200">✓ ${esc(tr('user_mgmt.perm_storage_settings', 'Configure Storage & Database Paths'))}</span>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold">👑 ${esc(tr('user_mgmt.perm_manage_users_locked', 'Manage Users & Permissions (Super User exclusive)'))}</span>
                    </div>
                `
                : `
                    <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                        <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">${esc(tr('user_mgmt.perm_section_label', 'Permissions granted to this account:'))}</div>
                        <div class="flex flex-wrap items-center gap-2 text-[11px]">
                            <label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 opacity-85 select-none">
                                <input type="checkbox" checked disabled class="rounded border-slate-300 text-blue-600" />
                                <span>${esc(tr('user_mgmt.perm_read_upload', 'Browse, Search & Upload Documents'))}</span>
                            </label>
                            <label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isAdmin ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'} cursor-pointer hover:border-blue-400 transition-colors select-none">
                                <input type="checkbox" class="perm-toggle-delete rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" data-uid="${user.id}" ${isAdmin ? 'checked' : ''} />
                                <span>${esc(tr('user_mgmt.perm_delete_records', 'Delete Documents, Houses & Areas'))}</span>
                            </label>
                            <label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isAdmin ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'} cursor-pointer hover:border-blue-400 transition-colors select-none">
                                <input type="checkbox" class="perm-toggle-settings rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" data-uid="${user.id}" ${isAdmin ? 'checked' : ''} />
                                <span>${esc(tr('user_mgmt.perm_storage_settings', 'Configure Storage & Database Paths'))}</span>
                            </label>
                        </div>
                    </div>
                `;

            const showPassBox = activePasswordResetUserId === user.id;
            const passBoxHtml = showPassBox
                ? `
                    <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <input type="password" dir="ltr" class="input-user-new-pass flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="${esc(tr('user_mgmt.new_password_placeholder', 'New password...'))}" data-uid="${user.id}" />
                        <button type="button" class="btn-user-save-pass px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer" data-uid="${user.id}">
                            ${esc(tr('user_mgmt.save_password_btn', 'Save'))}
                        </button>
                    </div>
                `
                : '';

            card.innerHTML = `
                <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-9 h-9 rounded-xl ${avatarBg} text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                            ${esc(initial)}
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">${esc(user.displayName || user.username)}</span>
                                ${roleBadgeHtml}
                            </div>
                            <div dir="ltr" class="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">@${esc(user.username)}</div>
                        </div>
                    </div>
                    ${controlsHtml}
                </div>
                ${permissionsRowHtml}
                ${passBoxHtml}
            `;

            listEl.appendChild(card);
        });

        bindUserRowActions(listEl);
    }

    function bindUserRowActions(listEl) {
        listEl.querySelectorAll('.user-role-select').forEach(selectEl => {
            selectEl.addEventListener('change', async (e) => {
                const uid = Number(e.target.getAttribute('data-uid'));
                const nextRole = e.target.value;
                await handleRoleChange(uid, nextRole);
            });
        });

        listEl.querySelectorAll('.perm-toggle-delete, .perm-toggle-settings').forEach(checkboxEl => {
            checkboxEl.addEventListener('change', async (e) => {
                const uid = Number(e.target.getAttribute('data-uid'));
                const nextRole = e.target.checked ? 'Admin' : 'Contributor';
                await handleRoleChange(uid, nextRole);
            });
        });

        listEl.querySelectorAll('.btn-user-reset-pass').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = Number(btn.getAttribute('data-uid'));
                activePasswordResetUserId = activePasswordResetUserId === uid ? null : uid;
                renderUsersList();
                if (activePasswordResetUserId === uid) {
                    const input = listEl.querySelector(`.input-user-new-pass[data-uid="${uid}"]`);
                    if (input) input.focus();
                }
            });
        });

        listEl.querySelectorAll('.btn-user-save-pass').forEach(btn => {
            btn.addEventListener('click', async () => {
                const uid = Number(btn.getAttribute('data-uid'));
                const input = listEl.querySelector(`.input-user-new-pass[data-uid="${uid}"]`);
                const newPassword = input ? input.value.trim() : '';
                await handlePasswordReset(uid, newPassword);
            });
        });

        listEl.querySelectorAll('.btn-user-transfer-super').forEach(btn => {
            btn.addEventListener('click', async () => {
                const uid = Number(btn.getAttribute('data-uid'));
                const uname = btn.getAttribute('data-uname') || '';
                await handleTransferSuperUser(uid, uname);
            });
        });

        listEl.querySelectorAll('.btn-user-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const uid = Number(btn.getAttribute('data-uid'));
                const uname = btn.getAttribute('data-uname') || '';
                await handleDeleteUser(uid, uname);
            });
        });
    }

    async function loadFallbackDirectoryUsers() {
        const dir = readLocalDirectory();
        try {
            const authUsersRes = await fetch('/api/auth/users');
            if (authUsersRes && authUsersRes.ok) {
                const serverUsers = await authUsersRes.json().catch(() => []);
                if (Array.isArray(serverUsers) && serverUsers.length > 0) {
                    serverUsers.forEach(su => {
                        const unameLower = String(su.username || '').toLowerCase();
                        if (!unameLower) return;
                        if (dir.deletedUsernames.some(d => String(d).toLowerCase() === unameLower)) return;
                        const existing = dir.users.find(u => String(u.username || '').toLowerCase() === unameLower);
                        if (!existing) {
                            dir.users.push({
                                id: su.id || (dir.users.length + 1),
                                username: su.username,
                                displayName: su.displayName || su.username,
                                role: su.role === 'SuperUser' ? 'Admin' : (su.role || 'Contributor')
                            });
                        }
                    });
                    writeLocalDirectory(dir);
                }
            }
        } catch (e) {}

        usersList = sortUsersByTier(dir.users);
        renderUsersList();
    }

    async function loadUsersForManagement() {
        const listEl = document.getElementById('user-mgmt-list');
        if (listEl) {
            listEl.innerHTML = `<div class="py-6 text-center text-xs text-slate-400">${esc(tr('common.loading', 'Loading...'))}</div>`;
        }

        try {
            const res = await fetch('/api/users');
            if (res.status === 404 || res.status === 405) {
                usingLocalFallback = true;
                showFeedback(
                    'info',
                    tr(
                        'user_mgmt.local_fallback_notice',
                        'User and permission changes are currently saved locally because the running server binary predates /api/users. Run scripts\\build-windows.bat once for permanent SQLite persistence.'
                    )
                );
                await loadFallbackDirectoryUsers();
                return;
            }
            if (res.status === 403) {
                showFeedback('error', tr('user_mgmt.superuser_only_error', 'Only the Super User can manage users and permissions.'));
                if (listEl) listEl.innerHTML = '';
                return;
            }
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            usingLocalFallback = false;
            const data = await res.json();
            usersList = Array.isArray(data) ? data : (data.users || []);
            renderUsersList();
        } catch (err) {
            showFeedback('error', err && err.message ? err.message : String(err));
        }
    }

    async function handleCreateUser(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        clearFeedback();

        const usernameInput = document.getElementById('user-mgmt-username-input');
        const displayNameInput = document.getElementById('user-mgmt-displayname-input');
        const passwordInput = document.getElementById('user-mgmt-password-input');
        const roleSelect = document.getElementById('user-mgmt-role-select');
        const createBtn = document.getElementById('btn-user-mgmt-create');
        const createLabel = createBtn ? createBtn.querySelector('[data-i18n]') : null;

        const username = usernameInput ? usernameInput.value.trim() : '';
        const displayName = displayNameInput ? displayNameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';
        const role = roleSelect ? roleSelect.value : 'Contributor';

        if (!username || username.length < 2) {
            showFeedback('error', 'Username must be at least 2 characters.');
            return;
        }
        if (!password || password.length < 4) {
            showFeedback('error', tr('user_mgmt.password_placeholder', 'Minimum 4 characters'));
            return;
        }

        if (createBtn) createBtn.disabled = true;
        if (createLabel) createLabel.textContent = tr('user_mgmt.adding_btn', 'Adding...');

        try {
            if (!usingLocalFallback) {
                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: buildHeaders(),
                    body: JSON.stringify({
                        username,
                        display_name: displayName || username,
                        displayName: displayName || username,
                        password,
                        role
                    })
                });

                if (res.status === 404 || res.status === 405) {
                    usingLocalFallback = true;
                } else {
                    const body = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        showFeedback('error', body.error || `HTTP ${res.status}`);
                        return;
                    }

                    if (usernameInput) usernameInput.value = '';
                    if (displayNameInput) displayNameInput.value = '';
                    if (passwordInput) passwordInput.value = '';
                    if (roleSelect) roleSelect.value = 'Contributor';

                    await loadUsersForManagement();
                    if (window.authManager && typeof window.authManager.loadUsers === 'function') {
                        await window.authManager.loadUsers();
                    }

                    if (typeof window.showToast === 'function') {
                        window.showToast(tr('user_mgmt.user_created_toast', 'User account created successfully.'), 'success');
                    }
                    return;
                }
            }

            // Local directory fallback (precompiled binary mode)
            const dir = readLocalDirectory();
            const unameLower = username.toLowerCase();
            if (dir.users.some(u => String(u.username || '').toLowerCase() === unameLower)) {
                showFeedback('error', `User '${username}' already exists.`);
                return;
            }
            dir.deletedUsernames = dir.deletedUsernames.filter(d => String(d).toLowerCase() !== unameLower);
            const nextId = dir.users.reduce((max, u) => Math.max(max, Number(u.id || 0)), 0) + 1;
            dir.users.push({
                id: nextId,
                username,
                displayName: displayName || username,
                role: role === 'Admin' ? 'Admin' : 'Contributor',
                hasCustomPassword: true,
                customPassword: password,
                isLocalCreated: true
            });
            writeLocalDirectory(dir);

            if (usernameInput) usernameInput.value = '';
            if (displayNameInput) displayNameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (roleSelect) roleSelect.value = 'Contributor';

            clearFeedback();
            usersList = sortUsersByTier(dir.users);
            renderUsersList();

            if (typeof window.showToast === 'function') {
                window.showToast(tr('user_mgmt.user_created_toast', 'User account created successfully.'), 'success');
            }
        } catch (err) {
            showFeedback('error', err && err.message ? err.message : String(err));
        } finally {
            if (createBtn) createBtn.disabled = false;
            if (createLabel) createLabel.textContent = tr('user_mgmt.add_user_btn', 'Add User');
        }
    }

    async function handleRoleChange(userId, nextRole) {
        clearFeedback();
        try {
            if (!usingLocalFallback) {
                const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: nextRole })
                });

                if (res.status === 404 || res.status === 405) {
                    usingLocalFallback = true;
                } else {
                    const body = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        showFeedback('error', body.error || `HTTP ${res.status}`);
                        await loadUsersForManagement();
                        return;
                    }

                    await loadUsersForManagement();
                    if (window.authManager && typeof window.authManager.loadUsers === 'function') {
                        await window.authManager.loadUsers();
                    }

                    if (typeof window.showToast === 'function') {
                        window.showToast(tr('user_mgmt.role_updated_toast', 'User role updated successfully.'), 'success');
                    }
                    return;
                }
            }

            const dir = readLocalDirectory();
            const target = dir.users.find(u => Number(u.id) === Number(userId));
            if (target && String(target.role || '').toLowerCase() !== 'superuser') {
                target.role = nextRole === 'Admin' ? 'Admin' : 'Contributor';
                writeLocalDirectory(dir);
            }
            clearFeedback();
            usersList = sortUsersByTier(dir.users);
            renderUsersList();

            if (typeof window.showToast === 'function') {
                window.showToast(tr('user_mgmt.role_updated_toast', 'User role updated successfully.'), 'success');
            }
        } catch (err) {
            showFeedback('error', err && err.message ? err.message : String(err));
        }
    }

    async function handlePasswordReset(userId, newPassword) {
        clearFeedback();
        if (!newPassword || newPassword.length < 4) {
            showFeedback('error', tr('user_mgmt.password_placeholder', 'Minimum 4 characters'));
            return;
        }

        try {
            if (!usingLocalFallback) {
                const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: newPassword })
                });

                if (res.status === 404 || res.status === 405) {
                    usingLocalFallback = true;
                } else {
                    const body = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        showFeedback('error', body.error || `HTTP ${res.status}`);
                        return;
                    }

                    activePasswordResetUserId = null;
                    renderUsersList();

                    if (typeof window.showToast === 'function') {
                        window.showToast(tr('user_mgmt.password_updated_toast', 'Password updated successfully.'), 'success');
                    }
                    return;
                }
            }

            const dir = readLocalDirectory();
            const target = dir.users.find(u => Number(u.id) === Number(userId));
            if (target) {
                target.hasCustomPassword = true;
                target.customPassword = newPassword;
                writeLocalDirectory(dir);
            }
            activePasswordResetUserId = null;
            clearFeedback();
            usersList = sortUsersByTier(dir.users);
            renderUsersList();

            if (typeof window.showToast === 'function') {
                window.showToast(tr('user_mgmt.password_updated_toast', 'Password updated successfully.'), 'success');
            }
        } catch (err) {
            showFeedback('error', err && err.message ? err.message : String(err));
        }
    }

    async function handleDeleteUser(userId, userLabel) {
        clearFeedback();
        const confirmTemplate = tr('user_mgmt.confirm_delete_user', 'Are you sure you want to permanently remove user "{name}"?');
        const confirmMsg = confirmTemplate.replace('{name}', userLabel || String(userId));
        if (typeof window.confirm === 'function' && !window.confirm(confirmMsg)) {
            return;
        }

        try {
            if (!usingLocalFallback) {
                const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
                    method: 'DELETE'
                });

                if (res.status === 404 || res.status === 405) {
                    usingLocalFallback = true;
                } else {
                    const body = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        showFeedback('error', body.error || `HTTP ${res.status}`);
                        return;
                    }

                    await loadUsersForManagement();
                    if (window.authManager && typeof window.authManager.loadUsers === 'function') {
                        await window.authManager.loadUsers();
                    }

                    if (typeof window.showToast === 'function') {
                        window.showToast(tr('user_mgmt.user_deleted_toast', 'User account removed successfully.'), 'success');
                    }
                    return;
                }
            }

            const dir = readLocalDirectory();
            const target = dir.users.find(u => Number(u.id) === Number(userId));
            if (target && String(target.role || '').toLowerCase() === 'superuser') {
                showFeedback('error', 'The Super User account cannot be deleted.');
                return;
            }
            if (target) {
                dir.deletedUsernames.push(target.username);
                dir.users = dir.users.filter(u => Number(u.id) !== Number(userId));
                writeLocalDirectory(dir);
            }
            clearFeedback();
            usersList = sortUsersByTier(dir.users);
            renderUsersList();

            if (typeof window.showToast === 'function') {
                window.showToast(tr('user_mgmt.user_deleted_toast', 'User account removed successfully.'), 'success');
            }
        } catch (err) {
            showFeedback('error', err && err.message ? err.message : String(err));
        }
    }

    async function handleTransferSuperUser(targetUserId, targetLabel) {
        clearFeedback();
        const confirmTemplate = tr(
            'user_mgmt.confirm_transfer_super',
            'There can only be one Super User. Transferring Super User ownership to "{name}" will convert your account to Admin. Continue?'
        );
        const confirmMsg = confirmTemplate.replace('{name}', targetLabel || String(targetUserId));
        if (typeof window.confirm === 'function' && !window.confirm(confirmMsg)) {
            return;
        }

        try {
            if (!usingLocalFallback) {
                const res = await fetch(`/api/users/${encodeURIComponent(targetUserId)}/transfer-superuser`, {
                    method: 'POST'
                });

                if (res.status === 404 || res.status === 405) {
                    usingLocalFallback = true;
                } else {
                    const body = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        showFeedback('error', body.error || `HTTP ${res.status}`);
                        return;
                    }

                    if (body.currentUser && window.authManager && typeof window.authManager.applyUpdatedCurrentUser === 'function') {
                        window.authManager.applyUpdatedCurrentUser(body.currentUser);
                    }

                    closeUserManagementModal();

                    if (typeof window.showToast === 'function') {
                        window.showToast(tr('user_mgmt.super_transferred_toast', 'Super User ownership transferred successfully.'), 'success');
                    }
                    return;
                }
            }

            // Local directory atomic transfer
            const dir = readLocalDirectory();
            let demotedCurrent = null;
            dir.users.forEach(u => {
                if (String(u.role || '').toLowerCase() === 'superuser') {
                    u.role = 'Admin';
                    demotedCurrent = { ...u, canDelete: true };
                }
            });
            const promoted = dir.users.find(u => Number(u.id) === Number(targetUserId));
            if (promoted) {
                promoted.role = 'SuperUser';
            }
            writeLocalDirectory(dir);

            if (demotedCurrent && window.authManager && typeof window.authManager.applyUpdatedCurrentUser === 'function') {
                window.authManager.applyUpdatedCurrentUser(demotedCurrent);
            }

            closeUserManagementModal();

            if (typeof window.showToast === 'function') {
                window.showToast(tr('user_mgmt.super_transferred_toast', 'Super User ownership transferred successfully.'), 'success');
            }
        } catch (err) {
            showFeedback('error', err && err.message ? err.message : String(err));
        }
    }

    async function openUserManagementModal() {
        if (!isCurrentUserSuperUser()) {
            if (typeof window.showToast === 'function') {
                window.showToast(tr('user_mgmt.superuser_only_error', 'Only the Super User can manage users and permissions.'), 'error');
            }
            return;
        }

        if (window.authManager && typeof window.authManager.toggleProfileDropdown === 'function') {
            window.authManager.toggleProfileDropdown(false);
        } else {
            const dropdown = document.getElementById('user-profile-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
        }

        const modal = document.getElementById('user-management-modal');
        if (!modal) return;

        activePasswordResetUserId = null;
        usingLocalFallback = false;
        clearFeedback();

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');

        if (window.i18n && typeof window.i18n.apply === 'function') {
            window.i18n.apply(modal);
        }

        await loadUsersForManagement();
    }

    function closeUserManagementModal() {
        const modal = document.getElementById('user-management-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        activePasswordResetUserId = null;
    }

    function initUserManagement() {
        if (isInitialized) {
            syncUserMgmtVisibility();
            return;
        }
        isInitialized = true;

        const openBtn = document.getElementById('btn-open-user-management');
        if (openBtn) {
            openBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openUserManagementModal();
            });
        }

        const closeBtn = document.getElementById('btn-close-user-management');
        if (closeBtn) closeBtn.addEventListener('click', closeUserManagementModal);

        const doneBtn = document.getElementById('btn-done-user-management');
        if (doneBtn) doneBtn.addEventListener('click', closeUserManagementModal);

        const modal = document.getElementById('user-management-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeUserManagementModal();
            });
        }

        const createForm = document.getElementById('user-mgmt-create-form');
        if (createForm) {
            createForm.addEventListener('submit', handleCreateUser);
        }

        window.addEventListener('auth:user-changed', syncUserMgmtVisibility);
        window.addEventListener('languageChanged', () => {
            if (modal && !modal.classList.contains('hidden')) {
                clearFeedback();
                renderUsersList();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                closeUserManagementModal();
            }
        });

        syncUserMgmtVisibility();
    }

    window.initUserManagement = initUserManagement;
    window.openUserManagementModal = openUserManagementModal;
    window.closeUserManagementModal = closeUserManagementModal;
    window._resetUserManagementForTests = function () {
        isInitialized = false;
        usersList = [];
        activePasswordResetUserId = null;
        usingLocalFallback = false;
    };
})();
