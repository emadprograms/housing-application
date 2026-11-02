import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';

const rootDir = path.resolve(__dirname, '../../..');
const indexPath = path.join(rootDir, 'src/HousingApplication.Web/wwwroot/index.html');
const i18nPath = path.join(rootDir, 'src/HousingApplication.Web/wwwroot/js/i18n.js');
const authJsPath = path.join(rootDir, 'src/HousingApplication.Web/wwwroot/js/auth-manager.js');
const userMgmtJsPath = path.join(rootDir, 'src/HousingApplication.Web/wwwroot/js/user-management.js');

const distIndexPath = path.join(rootDir, 'dist/win-x64/wwwroot/index.html');
const distAuthJsPath = path.join(rootDir, 'dist/win-x64/wwwroot/js/auth-manager.js');
const distUserMgmtJsPath = path.join(rootDir, 'dist/win-x64/wwwroot/js/user-management.js');

const indexHtmlContent = fs.readFileSync(indexPath, 'utf-8');
const i18nJsContent = fs.readFileSync(i18nPath, 'utf-8');
const authJsContent = fs.readFileSync(authJsPath, 'utf-8');
const userMgmtJsContent = fs.readFileSync(userMgmtJsPath, 'utf-8');

describe('3-Tier RBAC (SuperUser, Admin, Regular User) & In-App User Management', () => {
    let store = {};
    let fetchMock;
    let mockUsersDb = [];

    const localStorageMock = {
        getItem: vi.fn(key => (key in store ? store[key] : null)),
        setItem: vi.fn((key, val) => { store[key] = String(val); }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', localStorageMock);

        mockUsersDb = [
            { id: 1, username: 'Emad', displayName: 'Emad', role: 'SuperUser', isSuperUser: true, canManageUsers: true, canDelete: true },
            { id: 2, username: 'Bubshait', displayName: 'Bubshait', role: 'Admin', isSuperUser: false, canManageUsers: false, canDelete: true },
            { id: 5, username: 'Nawaf', displayName: 'Nawaf', role: 'Contributor', isSuperUser: false, canManageUsers: false, canDelete: false }
        ];

        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
        document.body.innerHTML = indexHtmlContent;

        fetchMock = vi.fn(async (url, init = {}) => {
            const method = (init.method || 'GET').toUpperCase();
            const cleanUrl = String(url);

            if (cleanUrl.endsWith('/api/auth/me')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ authenticated: false, user: null })
                };
            }

            if (cleanUrl.endsWith('/api/auth/users')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => [...mockUsersDb]
                };
            }

            if (cleanUrl.endsWith('/api/users') && method === 'GET') {
                return {
                    ok: true,
                    status: 200,
                    json: async () => [...mockUsersDb]
                };
            }

            if (cleanUrl.endsWith('/api/users') && method === 'POST') {
                const payload = JSON.parse(init.body || '{}');
                const created = {
                    id: 99,
                    username: payload.username,
                    displayName: payload.displayName || payload.username,
                    role: payload.role,
                    isSuperUser: false,
                    canManageUsers: false,
                    canDelete: payload.role === 'Admin'
                };
                mockUsersDb.push(created);
                return {
                    ok: true,
                    status: 201,
                    json: async () => created
                };
            }

            const putMatch = cleanUrl.match(/\/api\/users\/(\d+)$/);
            if (putMatch && method === 'PUT') {
                const id = Number(putMatch[1]);
                const payload = JSON.parse(init.body || '{}');
                const target = mockUsersDb.find(u => u.id === id);
                if (!target) {
                    return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) };
                }
                if (payload.role) {
                    target.role = payload.role;
                    target.canDelete = payload.role === 'Admin';
                }
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ ...target })
                };
            }

            if (putMatch && method === 'DELETE') {
                const id = Number(putMatch[1]);
                mockUsersDb = mockUsersDb.filter(u => u.id !== id);
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ status: 'success' })
                };
            }

            const transferMatch = cleanUrl.match(/\/api\/users\/(\d+)\/transfer-superuser$/);
            if (transferMatch && method === 'POST') {
                const targetId = Number(transferMatch[1]);
                const currentSuper = mockUsersDb.find(u => u.role === 'SuperUser');
                const nextSuper = mockUsersDb.find(u => u.id === targetId);
                if (currentSuper) {
                    currentSuper.role = 'Admin';
                    currentSuper.isSuperUser = false;
                    currentSuper.canManageUsers = false;
                    currentSuper.canDelete = true;
                }
                if (nextSuper) {
                    nextSuper.role = 'SuperUser';
                    nextSuper.isSuperUser = true;
                    nextSuper.canManageUsers = true;
                    nextSuper.canDelete = true;
                }
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        status: 'success',
                        newSuperUser: nextSuper,
                        currentUser: currentSuper
                    })
                };
            }

            return { ok: true, status: 200, json: async () => ({}) };
        });

        vi.stubGlobal('fetch', fetchMock);
        window.showToast = vi.fn();
        window.confirm = vi.fn(() => true);

        const i18nFn = new Function('window', 'document', 'localStorage', i18nJsContent);
        i18nFn(window, document, window.localStorage);
        window.i18n.setLanguage('en');

        const authFn = new Function('window', 'document', 'localStorage', authJsContent);
        authFn(window, document, window.localStorage);

        const userMgmtFn = new Function('window', 'document', userMgmtJsContent);
        userMgmtFn(window, document);
        window._resetUserManagementForTests();
        window.initUserManagement();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('keeps dist/win-x64/wwwroot synchronized with src user management & auth assets', () => {
        expect(fs.readFileSync(distUserMgmtJsPath, 'utf-8')).toBe(userMgmtJsContent);
        expect(fs.readFileSync(distAuthJsPath, 'utf-8')).toBe(authJsContent);
        expect(fs.readFileSync(distIndexPath, 'utf-8')).toBe(indexHtmlContent);
    });

    it('enforces 3-tier permissions and shows #btn-open-user-management ONLY for the 1 SuperUser', () => {
        const mgr = window.authManager;
        const menuBtn = document.getElementById('btn-open-user-management');
        const roleBadge = document.getElementById('user-role-badge');
        const dropdownBadge = document.getElementById('dropdown-role-badge');

        // 1. SuperUser (Emad): Full archive access + exclusive user management
        mgr.applyUpdatedCurrentUser({
            id: 1,
            username: 'Emad',
            displayName: 'Emad',
            role: 'SuperUser',
            canDelete: true
        });
        expect(mgr.isSuperUser()).toBe(true);
        expect(mgr.canManageUsers()).toBe(true);
        expect(mgr.isAdmin()).toBe(true);
        expect(mgr.hasDeletePermission()).toBe(true);
        expect(mgr.isContributor()).toBe(false);
        expect(menuBtn.classList.contains('hidden')).toBe(false);
        expect(roleBadge.textContent).toBe('Super User');
        expect(dropdownBadge.textContent).toBe('Super User');

        // 2. Admin (Bubshait): Full archive & delete access, CANNOT manage users
        mgr.applyUpdatedCurrentUser({
            id: 2,
            username: 'Bubshait',
            displayName: 'Bubshait',
            role: 'Admin',
            canDelete: true
        });
        expect(mgr.isSuperUser()).toBe(false);
        expect(mgr.canManageUsers()).toBe(false);
        expect(mgr.isAdmin()).toBe(true);
        expect(mgr.hasDeletePermission()).toBe(true);
        expect(mgr.isContributor()).toBe(false);
        expect(menuBtn.classList.contains('hidden')).toBe(true);
        expect(roleBadge.textContent).toBe('Full Access');
        expect(dropdownBadge.textContent).toBe('System Administrator');

        // 3. Regular User / Contributor (Nawaf): Read & upload only, CANNOT delete or manage users
        mgr.applyUpdatedCurrentUser({
            id: 5,
            username: 'Nawaf',
            displayName: 'Nawaf',
            role: 'Contributor',
            canDelete: false
        });
        expect(mgr.isSuperUser()).toBe(false);
        expect(mgr.canManageUsers()).toBe(false);
        expect(mgr.isAdmin()).toBe(false);
        expect(mgr.hasDeletePermission()).toBe(false);
        expect(mgr.isContributor()).toBe(true);
        expect(menuBtn.classList.contains('hidden')).toBe(true);
    });

    it('blocks Admin and Contributor from opening User Management modal programmatically', async () => {
        const modal = document.getElementById('user-management-modal');

        // Admin (Bubshait)
        window.authManager.applyUpdatedCurrentUser({
            id: 2,
            username: 'Bubshait',
            displayName: 'Bubshait',
            role: 'Admin',
            canDelete: true
        });
        await window.openUserManagementModal();
        expect(modal.classList.contains('hidden')).toBe(true);
        expect(window.showToast).toHaveBeenCalledWith(
            'Only the Super User can manage users and permissions.',
            'error'
        );

        // Contributor (Nawaf)
        window.showToast.mockClear();
        window.authManager.applyUpdatedCurrentUser({
            id: 5,
            username: 'Nawaf',
            displayName: 'Nawaf',
            role: 'Contributor',
            canDelete: false
        });
        await window.openUserManagementModal();
        expect(modal.classList.contains('hidden')).toBe(true);
        expect(window.showToast).toHaveBeenCalledTimes(1);
    });

    it('renders SuperUser-protected row without delete/role dropdown and restricts Add User roles to Admin or Regular User', async () => {
        window.authManager.applyUpdatedCurrentUser({
            id: 1,
            username: 'Emad',
            displayName: 'Emad',
            role: 'SuperUser',
            canDelete: true
        });

        await window.openUserManagementModal();

        const modal = document.getElementById('user-management-modal');
        expect(modal.classList.contains('hidden')).toBe(false);

        // Role select in Add User form MUST NOT offer SuperUser
        const roleSelect = document.getElementById('user-mgmt-role-select');
        const optionValues = Array.from(roleSelect.options).map(o => o.value);
        expect(optionValues).toEqual(['Contributor', 'Admin']);
        expect(optionValues).not.toContain('SuperUser');

        // SuperUser row (id=1) has Sole Super User badge, password reset button, NO role dropdown, NO delete button
        const superRow = document.querySelector('#user-mgmt-list [data-user-id="1"]');
        expect(superRow).not.toBeNull();
        expect(superRow.textContent).toContain('Sole Super User');
        expect(superRow.querySelector('.user-role-select')).toBeNull();
        expect(superRow.querySelector('.btn-user-delete')).toBeNull();
        expect(superRow.querySelector('.btn-user-transfer-super')).toBeNull();
        expect(superRow.querySelector('.btn-user-reset-pass')).not.toBeNull();

        // Admin row (id=2) and Regular User row (id=5) have role selector, reset password, transfer superuser, and remove buttons
        const adminRow = document.querySelector('#user-mgmt-list [data-user-id="2"]');
        expect(adminRow.querySelector('.user-role-select').value).toBe('Admin');
        expect(adminRow.querySelector('.btn-user-delete')).not.toBeNull();
        expect(adminRow.querySelector('.btn-user-transfer-super')).not.toBeNull();

        const regularRow = document.querySelector('#user-mgmt-list [data-user-id="5"]');
        expect(regularRow.querySelector('.user-role-select').value).toBe('Contributor');
    });

    it('creates a new user, toggles role between Regular User and Admin, resets password, and removes user', async () => {
        window.authManager.applyUpdatedCurrentUser({
            id: 1,
            username: 'Emad',
            displayName: 'Emad',
            role: 'SuperUser',
            canDelete: true
        });

        await window.openUserManagementModal();

        // 1. Add User
        document.getElementById('user-mgmt-username-input').value = 'Ali';
        document.getElementById('user-mgmt-displayname-input').value = 'Ali Hassan';
        document.getElementById('user-mgmt-password-input').value = 'aliPass99';
        document.getElementById('user-mgmt-role-select').value = 'Contributor';

        const createForm = document.getElementById('user-mgmt-create-form');
        createForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await vi.waitFor(() => {
            expect(document.querySelector('#user-mgmt-list [data-user-id="99"]')).not.toBeNull();
        });

        // 2. Promote Ali from Contributor -> Admin
        const aliRoleSelect = document.querySelector('#user-mgmt-list [data-user-id="99"] .user-role-select');
        aliRoleSelect.value = 'Admin';
        aliRoleSelect.dispatchEvent(new Event('change', { bubbles: true }));
        await vi.waitFor(() => {
            expect(mockUsersDb.find(u => u.id === 99).role).toBe('Admin');
        });

        // 3. Reset Ali's password inline
        const resetBtn = document.querySelector('#user-mgmt-list [data-user-id="99"] .btn-user-reset-pass');
        resetBtn.click();
        const passInput = document.querySelector('#user-mgmt-list [data-user-id="99"] .input-user-new-pass');
        expect(passInput).not.toBeNull();
        passInput.value = 'NewStrongPass1';
        const savePassBtn = document.querySelector('#user-mgmt-list [data-user-id="99"] .btn-user-save-pass');
        savePassBtn.click();
        await vi.waitFor(() => {
            expect(document.querySelector('#user-mgmt-list [data-user-id="99"] .input-user-new-pass')).toBeNull();
        });

        // 4. Delete Ali
        const deleteBtn = document.querySelector('#user-mgmt-list [data-user-id="99"] .btn-user-delete');
        deleteBtn.click();
        await vi.waitFor(() => {
            expect(document.querySelector('#user-mgmt-list [data-user-id="99"]')).toBeNull();
        });
    });

    it('transfers sole SuperUser ownership and immediately downgrades caller UI to Admin', async () => {
        window.authManager.applyUpdatedCurrentUser({
            id: 1,
            username: 'Emad',
            displayName: 'Emad',
            role: 'SuperUser',
            canDelete: true
        });

        await window.openUserManagementModal();

        const modal = document.getElementById('user-management-modal');
        const menuBtn = document.getElementById('btn-open-user-management');
        expect(modal.classList.contains('hidden')).toBe(false);
        expect(menuBtn.classList.contains('hidden')).toBe(false);

        const transferBtn = document.querySelector('#user-mgmt-list [data-user-id="2"] .btn-user-transfer-super');
        transferBtn.click();

        await vi.waitFor(() => {
            expect(modal.classList.contains('hidden')).toBe(true);
        });

        // Emad is now Admin (still has delete permission, NO longer SuperUser or user-mgmt access)
        expect(window.authManager.isSuperUser()).toBe(false);
        expect(window.authManager.canManageUsers()).toBe(false);
        expect(window.authManager.isAdmin()).toBe(true);
        expect(window.authManager.hasDeletePermission()).toBe(true);
        expect(menuBtn.classList.contains('hidden')).toBe(true);
    });

    it('provides clean single-language Arabic and English translations with zero navbar mixed-language separators', async () => {
        window.authManager.applyUpdatedCurrentUser({
            id: 1,
            username: 'Emad',
            displayName: 'Emad',
            role: 'SuperUser',
            canDelete: true
        });

        window.i18n.setLanguage('ar');
        expect(document.getElementById('user-role-badge').textContent).toBe('مشرف عام');
        expect(document.getElementById('dropdown-role-badge').textContent).toBe('المشرف العام');
        expect(document.querySelector('#btn-open-user-management [data-i18n="user_mgmt.menu_btn"]').textContent).toBe('إدارة المستخدمين والصلاحيات');

        const navbarTextAr = document.getElementById('top-navbar').textContent;
        expect(navbarTextAr).not.toContain('•');
        expect(navbarTextAr).not.toContain('/');

        await window.openUserManagementModal();
        const superRowAr = document.querySelector('#user-mgmt-list [data-user-id="1"]');
        expect(superRowAr.textContent).toContain('المشرف العام الوحيد');

        window.i18n.setLanguage('en');
        expect(document.getElementById('user-role-badge').textContent).toBe('Super User');
        const superRowEn = document.querySelector('#user-mgmt-list [data-user-id="1"]');
        expect(superRowEn.textContent).toContain('Sole Super User');
    });

    it('displays actionable build instructions AND renders full interactive user list when running against an outdated precompiled binary (405/404)', async () => {
        fetchMock.mockImplementation(async (url) => {
            const cleanUrl = String(url);
            if (cleanUrl.endsWith('/api/health')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ status: 'ok', version: '2026.09.20' }) // No user_management_support flag!
                };
            }
            if (cleanUrl.endsWith('/api/auth/me')) {
                return {
                    ok: true,
                    status: 200,
                    // Legacy binary returns role: 'Admin' without isSuperUser field
                    json: async () => ({
                        authenticated: true,
                        user: { id: 1, username: 'Emad', displayName: 'Emad', role: 'Admin', canDelete: true }
                    })
                };
            }
            if (cleanUrl.endsWith('/api/auth/users')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => [
                        { id: 1, username: 'Emad', displayName: 'Emad', role: 'Admin', canDelete: true },
                        { id: 2, username: 'Bubshait', displayName: 'Bubshait', role: 'Admin', canDelete: true },
                        { id: 5, username: 'Nawaf', displayName: 'Nawaf', role: 'Contributor', canDelete: false }
                    ]
                };
            }
            if (cleanUrl.includes('/api/users')) {
                return {
                    ok: false,
                    status: 404,
                    json: async () => ({})
                };
            }
            return { ok: true, status: 200, json: async () => ({}) };
        });

        // Re-check session against legacy binary
        window.authManager._backendCapsPromise = null;
        await window.authManager.checkSession();

        // Emad MUST be recognized as SuperUser immediately even on the legacy binary!
        expect(window.authManager.isSuperUser()).toBe(true);
        expect(window.authManager.canManageUsers()).toBe(true);

        // Manage Users & Permissions lives exclusively inside #user-profile-dropdown (NEVER in the title bar)
        expect(document.getElementById('btn-navbar-user-management')).toBeNull();
        const userDropdown = document.getElementById('user-profile-dropdown');
        expect(userDropdown).not.toBeNull();
        expect(userDropdown.querySelector('#dropdown-role-desc')).not.toBeNull();
        expect(userDropdown.querySelector('#btn-open-user-management')).not.toBeNull();
        expect(userDropdown.querySelector('#btn-open-storage-settings')).not.toBeNull();
        expect(userDropdown.querySelector('#btn-switch-user')).not.toBeNull();
        expect(userDropdown.querySelector('#btn-logout')).not.toBeNull();

        const menuBtn = document.getElementById('btn-open-user-management');
        expect(menuBtn.classList.contains('hidden')).toBe(false);

        // Clicking #user-profile-btn opens the user dialog, and clicking #btn-open-user-management opens the modal & closes the dropdown
        document.getElementById('user-profile-btn').click();
        expect(userDropdown.classList.contains('hidden')).toBe(false);

        menuBtn.click();
        expect(userDropdown.classList.contains('hidden')).toBe(true);
        await vi.waitFor(() => {
            expect(document.querySelectorAll('#user-mgmt-list [data-user-id]').length).toBeGreaterThanOrEqual(3);
        });

        const feedback = document.getElementById('user-mgmt-feedback');
        expect(feedback.classList.contains('hidden')).toBe(false);
        expect(feedback.textContent).toContain('build-windows.bat');

        // Toggling Nawaf's Delete permission checkbox promotes Nawaf to Admin in local fallback directory
        const nawafDeleteCheckbox = document.querySelector('#user-mgmt-list [data-user-id="5"] .perm-toggle-delete');
        expect(nawafDeleteCheckbox).not.toBeNull();
        expect(nawafDeleteCheckbox.checked).toBe(false);

        nawafDeleteCheckbox.checked = true;
        nawafDeleteCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

        await vi.waitFor(() => {
            const updatedSelect = document.querySelector('#user-mgmt-list [data-user-id="5"] .user-role-select');
            expect(updatedSelect.value).toBe('Admin');
        });
    });

    it('lets SuperUser toggle per-user Delete and Storage Settings permission checkboxes directly', async () => {
        window.authManager.applyUpdatedCurrentUser({
            id: 1,
            username: 'Emad',
            displayName: 'Emad',
            role: 'SuperUser',
            canDelete: true
        });

        await window.openUserManagementModal();

        // Nawaf (id=5) starts as Contributor -> both checkboxes unchecked
        const nawafDeleteToggle = document.querySelector('#user-mgmt-list [data-user-id="5"] .perm-toggle-delete');
        const nawafSettingsToggle = document.querySelector('#user-mgmt-list [data-user-id="5"] .perm-toggle-settings');
        expect(nawafDeleteToggle.checked).toBe(false);
        expect(nawafSettingsToggle.checked).toBe(false);

        // Toggle Delete permission ON -> promotes Nawaf to Admin and checks both operational checkboxes
        nawafDeleteToggle.checked = true;
        nawafDeleteToggle.dispatchEvent(new Event('change', { bubbles: true }));

        await vi.waitFor(() => {
            expect(mockUsersDb.find(u => u.id === 5).role).toBe('Admin');
            expect(document.querySelector('#user-mgmt-list [data-user-id="5"] .perm-toggle-settings').checked).toBe(true);
        });

        // Toggle Storage Settings permission OFF -> demotes Nawaf back to Regular User (Contributor)
        const nawafSettingsAfter = document.querySelector('#user-mgmt-list [data-user-id="5"] .perm-toggle-settings');
        nawafSettingsAfter.checked = false;
        nawafSettingsAfter.dispatchEvent(new Event('change', { bubbles: true }));

        await vi.waitFor(() => {
            expect(mockUsersDb.find(u => u.id === 5).role).toBe('Contributor');
        });
    });

    it('resolves every data-i18n key in index.html and renders zero raw user_mgmt.* keys in Arabic or English', async () => {
        const attrRegex = /data-i18n(?:-(?:title|placeholder|aria))?="([^"]+)"/g;
        const arDict = window.i18n.translations.ar;
        const enDict = window.i18n.translations.en;

        let match;
        while ((match = attrRegex.exec(indexHtmlContent)) !== null) {
            const key = match[1];
            expect(arDict[key], `Missing AR translation for ${key}`).toBeTruthy();
            expect(enDict[key], `Missing EN translation for ${key}`).toBeTruthy();
        }

        const distI18nPath = path.join(rootDir, 'dist/win-x64/wwwroot/js/i18n.js');
        expect(fs.readFileSync(distI18nPath, 'utf-8')).toBe(i18nJsContent);

        window.authManager.applyUpdatedCurrentUser({
            id: 1,
            username: 'Emad',
            displayName: 'Emad',
            role: 'SuperUser',
            canDelete: true
        });

        window.i18n.setLanguage('ar');
        await window.openUserManagementModal();
        const modalArText = document.getElementById('user-management-modal').textContent;
        expect(modalArText).not.toContain('user_mgmt.');
        expect(modalArText).toContain('إدارة المستخدمين والصلاحيات');
        expect(modalArText).toContain('مستويات الصلاحيات في النظام');
        expect(modalArText).toContain('مشرف عام (حساب واحد فقط)');

        window.i18n.setLanguage('en');
        const modalEnText = document.getElementById('user-management-modal').textContent;
        expect(modalEnText).not.toContain('user_mgmt.');
        expect(modalEnText).toContain('User & Permission Management');
        expect(modalEnText).toContain('Permission Tiers');
        expect(modalEnText).toContain('Super User (1 only)');
    });
});
