import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('AuthManager, Login Screen & Session UI (Phase 117)', () => {
    const htmlPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/index.html');
    const authJsPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/auth-manager.js');
    const cssPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/css/styles.css');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const authJsContent = fs.readFileSync(authJsPath, 'utf8');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    let originalFetch;

    beforeEach(() => {
        document.body.innerHTML = htmlContent;
        originalFetch = window.fetch;
        window.showToast = vi.fn();
        delete window._authFetchIntercepted;
        delete window.authManager;

        // Execute auth-manager.js script in JSDOM context
        const fn = new Function(authJsContent);
        fn();
    });

    afterEach(() => {
        window.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('verifies index.html has complete user profile navbar components', () => {
        const profileWrapper = document.getElementById('user-profile-wrapper');
        expect(profileWrapper).not.toBeNull();

        const profileBtn = document.getElementById('user-profile-btn');
        expect(profileBtn).not.toBeNull();

        const avatarBadge = document.getElementById('user-avatar-badge');
        expect(avatarBadge).not.toBeNull();

        const nameElem = document.getElementById('user-display-name');
        expect(nameElem).not.toBeNull();

        const roleBadge = document.getElementById('user-role-badge');
        expect(roleBadge).not.toBeNull();

        const dropdown = document.getElementById('user-profile-dropdown');
        expect(dropdown).not.toBeNull();
        expect(dropdown.classList.contains('hidden')).toBe(true);

        const btnSwitch = document.getElementById('btn-switch-user');
        expect(btnSwitch).not.toBeNull();

        const btnLogout = document.getElementById('btn-logout');
        expect(btnLogout).not.toBeNull();
    });

    it('verifies index.html has animated login home page with logo, Housing Application title, and form without preset chips', () => {
        const loginScreen = document.getElementById('login-screen');
        expect(loginScreen).not.toBeNull();

        // Animated Logo & Housing Application branding
        const appLogo = document.getElementById('login-app-logo');
        expect(appLogo).not.toBeNull();
        expect(appLogo.getAttribute('src')).toBe('pictures/logo.png');

        const appTitle = document.getElementById('login-app-title');
        expect(appTitle).not.toBeNull();
        expect(appTitle.textContent).toContain('Housing Application');

        // Form controls
        const loginForm = document.getElementById('login-form');
        expect(loginForm).not.toBeNull();

        const usernameInput = document.getElementById('login-username');
        expect(usernameInput).not.toBeNull();

        const passwordInput = document.getElementById('login-password');
        expect(passwordInput).not.toBeNull();

        const btnTogglePassword = document.getElementById('btn-toggle-password');
        expect(btnTogglePassword).not.toBeNull();

        const submitBtn = document.getElementById('btn-login-submit');
        expect(submitBtn).not.toBeNull();

        const errorBox = document.getElementById('login-error');
        expect(errorBox).not.toBeNull();

        // Preset user chips container must NOT exist
        const presetsContainer = document.getElementById('login-presets-container');
        expect(presetsContainer).toBeNull();
        expect(document.querySelectorAll('.btn-user-chip').length).toBe(0);
    });

    it('verifies user presets are completely removed and renderUserChips gracefully no-ops', () => {
        const mgr = window.authManager;
        expect(() => mgr.renderUserChips()).not.toThrow();

        const container = document.getElementById('login-presets-container');
        expect(container).toBeNull();
        expect(document.querySelectorAll('.btn-user-chip').length).toBe(0);
    });

    it('allows manual credential entry into the login home page form', () => {
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');

        usernameInput.value = 'Emad';
        passwordInput.value = 'password123';

        expect(usernameInput.value).toBe('Emad');
        expect(passwordInput.value).toBe('password123');
    });

    it('toggles password visibility when toggle button is clicked', () => {
        const toggleBtn = document.getElementById('btn-toggle-password');
        const passwordInput = document.getElementById('login-password');

        expect(passwordInput.type).toBe('password');
        toggleBtn.click();
        expect(passwordInput.type).toBe('text');
        toggleBtn.click();
        expect(passwordInput.type).toBe('password');
    });

    it('verifies login-screen is placed before the main workspace without transition delay to prevent reload flash', () => {
        const loginScreen = document.getElementById('login-screen');
        expect(loginScreen).not.toBeNull();
        expect(loginScreen.classList.contains('transition-all')).toBe(false);
        expect(loginScreen.classList.contains('duration-500')).toBe(false);
        expect(loginScreen.classList.contains('bg-[#090d16]')).toBe(true);

        // Verify in HTML structure that login-screen is parsed before main-sidebar/workspace
        const bodyPos = htmlContent.indexOf('<body');
        const loginPos = htmlContent.indexOf('id="login-screen"');
        const sidebarPos = htmlContent.indexOf('id="main-sidebar"');

        expect(loginPos).toBeGreaterThan(bodyPos);
        expect(loginPos).toBeLessThan(sidebarPos);
    });

    it('verifies lively motion canvas is present with non-blocking pointer events', () => {
        const canvas = document.getElementById('login-motion-canvas');
        expect(canvas).not.toBeNull();
        expect(canvas.classList.contains('pointer-events-none')).toBe(true);
        expect(canvas.classList.contains('absolute')).toBe(true);
    });

    it('verifies floating logo has transparent styling without an enclosing bordered box', () => {
        const logo = document.getElementById('login-app-logo');
        expect(logo).not.toBeNull();
        expect(logo.getAttribute('src')).toBe('pictures/logo.png');

        const parent = logo.parentElement;
        expect(parent.classList.contains('animate-login-float')).toBe(true);
        // Ensure no box borders or white background around the logo
        expect(parent.classList.contains('border')).toBe(false);
        expect(parent.classList.contains('bg-white/10')).toBe(false);
    });

    it('verifies favicon and app icon link tags are configured in index.html and icon files exist on disk', () => {
        expect(htmlContent).toContain('<link rel="icon" type="image/x-icon" href="favicon.ico">');
        expect(htmlContent).toContain('<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">');
        expect(htmlContent).toContain('<link rel="icon" type="image/png" sizes="32x32" href="pictures/favicon-32x32.png">');
        expect(htmlContent).toContain('<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">');

        const icoPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/favicon.ico');
        expect(fs.existsSync(icoPath)).toBe(true);

        const icoBuffer = fs.readFileSync(icoPath);
        // Verify ICO magic bytes (0x00, 0x00, 0x01, 0x00)
        expect(icoBuffer[0]).toBe(0);
        expect(icoBuffer[1]).toBe(0);
        expect(icoBuffer[2]).toBe(1);
        expect(icoBuffer[3]).toBe(0);
        // Expect 6 multi-resolution icon frames
        expect(icoBuffer.readUInt16LE(4)).toBe(6);
    });

    it('verifies styles.css enforces high-contrast input styling and suppresses Edge duplicate password eye', () => {
        // High-contrast login input styling
        expect(cssContent).toContain('#login-screen input[type="text"]');
        expect(cssContent).toContain('#login-screen input[type="password"]');
        expect(cssContent).toContain('color: #ffffff !important');
        expect(cssContent).toContain('-webkit-text-fill-color: #ffffff !important');
        expect(cssContent).toContain('caret-color: #38bdf8 !important');

        // Microsoft Edge duplicate password reveal eye suppression
        expect(cssContent).toContain('#login-screen input[type="password"]::-ms-reveal');
        expect(cssContent).toContain('display: none !important');
    });

    it('verifies styles.css preserves dark background and white text during browser autofill', () => {
        expect(cssContent).toContain('#login-screen,');
        expect(cssContent).toContain('#login-screen input');
        expect(cssContent).toContain('color-scheme: dark');

        expect(cssContent).toContain('#login-screen input:-webkit-autofill');
        expect(cssContent).toContain('box-shadow: 0 0 0 1000px #0f172a inset !important');
        expect(cssContent).toContain('-webkit-text-fill-color: #ffffff !important');
        expect(cssContent).toContain('#login-screen input:-moz-autofill');
    });

    it('verifies all 10 seeded users authenticate with default password password123', async () => {
        const mgr = window.authManager;
        const allUsers = [
            { username: 'Emad', role: 'Admin', canDelete: true },
            { username: 'Bubshait', role: 'Admin', canDelete: true },
            { username: 'Ehtezaz', role: 'Admin', canDelete: true },
            { username: 'Mustafa', role: 'Admin', canDelete: true },
            { username: 'Nawaf', role: 'Contributor', canDelete: false },
            { username: 'Naseem', role: 'Contributor', canDelete: false },
            { username: 'Mulla', role: 'Contributor', canDelete: false },
            { username: 'Mariam', role: 'Contributor', canDelete: false },
            { username: 'Shaima', role: 'Contributor', canDelete: false },
            { username: 'Mona', role: 'Contributor', canDelete: false }
        ];

        for (const u of allUsers) {
            window.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    status: 'success',
                    user: { id: 1, username: u.username, displayName: u.username, role: u.role, can_delete: u.canDelete }
                })
            });

            const success = await mgr.login(u.username, 'password123');
            expect(success).toBe(true);
            expect(mgr.currentUser.username).toBe(u.username);
            expect(mgr.currentUser.role).toBe(u.role);
            expect(mgr.hasDeletePermission()).toBe(u.canDelete);
        }
    });

    it('authenticates Admin user (Emad) and sets full access permissions', async () => {
        const mgr = window.authManager;

        window.fetch = vi.fn().mockImplementation((url) => {
            if (url === '/api/auth/login') {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        status: 'success',
                        message: 'Login successful',
                        user: { id: 1, username: 'Emad', displayName: 'Emad', role: 'Admin' }
                    })
                });
            }
            return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        let eventDetail = null;
        window.addEventListener('auth:user-changed', (e) => {
            eventDetail = e.detail;
        });

        const success = await mgr.login('Emad', 'password123');
        expect(success).toBe(true);

        // Verification of state
        expect(mgr.currentUser).not.toBeNull();
        expect(mgr.currentUser.username).toBe('Emad');
        expect(mgr.currentUser.role).toBe('Admin');
        expect(mgr.isAdmin()).toBe(true);
        expect(mgr.isContributor()).toBe(false);
        expect(mgr.hasDeletePermission()).toBe(true);

        // Verification of navbar UI
        const nameElem = document.getElementById('user-display-name');
        expect(nameElem.textContent).toBe('Emad');
        const roleBadge = document.getElementById('user-role-badge');
        expect(['Full Access', 'صلاحيات كاملة', 'صلاحيات كاملة • Full Access']).toContain(roleBadge.textContent);

        // Verification of event
        expect(eventDetail).not.toBeNull();
        expect(eventDetail.canDelete).toBe(true);
        expect(eventDetail.isAdmin).toBe(true);
        expect(eventDetail.isContributor).toBe(false);

        // Login modal should be closed
        const loginScreen = document.getElementById('login-screen');
        expect(loginScreen.classList.contains('hidden')).toBe(true);
    });

    it('authenticates Contributor user (Nawaf) and enforces read & upload only (no delete permission)', async () => {
        const mgr = window.authManager;

        window.fetch = vi.fn().mockImplementation((url) => {
            if (url === '/api/auth/login') {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        status: 'success',
                        message: 'Login successful',
                        user: { id: 5, username: 'Nawaf', displayName: 'Nawaf', role: 'Contributor' }
                    })
                });
            }
            return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        let eventDetail = null;
        window.addEventListener('auth:user-changed', (e) => {
            eventDetail = e.detail;
        });

        const success = await mgr.login('Nawaf', 'password123');
        expect(success).toBe(true);

        // Verification of state
        expect(mgr.currentUser).not.toBeNull();
        expect(mgr.currentUser.username).toBe('Nawaf');
        expect(mgr.currentUser.role).toBe('Contributor');
        expect(mgr.isAdmin()).toBe(false);
        expect(mgr.isContributor()).toBe(true);
        expect(mgr.hasDeletePermission()).toBe(false);

        // Verification of navbar UI
        const nameElem = document.getElementById('user-display-name');
        expect(nameElem.textContent).toBe('Nawaf');
        const roleBadge = document.getElementById('user-role-badge');
        expect(['Read & Upload', 'قراءة ورفع فقط', 'قراءة ورفع فقط • Read & Upload']).toContain(roleBadge.textContent);

        // Verification of event
        expect(eventDetail).not.toBeNull();
        expect(eventDetail.canDelete).toBe(false);
        expect(eventDetail.isAdmin).toBe(false);
        expect(eventDetail.isContributor).toBe(true);
    });

    it('displays error on failed login attempt', async () => {
        const mgr = window.authManager;

        window.fetch = vi.fn().mockImplementation((url) => {
            if (url === '/api/auth/login') {
                return Promise.resolve({
                    ok: false,
                    status: 401,
                    json: async () => ({
                        status: 'error',
                        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
                    })
                });
            }
            return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        const success = await mgr.login('InvalidUser', 'wrongpass');
        expect(success).toBe(false);
        expect(mgr.currentUser).toBeNull();

        const errorBox = document.getElementById('login-error');
        expect(errorBox.classList.contains('hidden')).toBe(false);
        expect(errorBox.textContent).toContain('اسم المستخدم أو كلمة المرور غير صحيحة');
    });

    it('logs out and returns user to unauthenticated state with login screen open', async () => {
        const mgr = window.authManager;
        mgr.currentUser = { id: 1, username: 'Emad', displayName: 'Emad', role: 'Admin', canDelete: true };

        window.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ status: 'success' })
        });

        let eventDetail = null;
        window.addEventListener('auth:user-changed', (e) => {
            eventDetail = e.detail;
        });

        await mgr.logout();

        expect(mgr.currentUser).toBeNull();
        expect(mgr.hasDeletePermission()).toBe(false);

        const loginScreen = document.getElementById('login-screen');
        expect(loginScreen.classList.contains('hidden')).toBe(false);

        const nameElem = document.getElementById('user-display-name');
        expect(nameElem.textContent).toBe('غير مسجل');

        expect(eventDetail).not.toBeNull();
        expect(eventDetail.user).toBeNull();
        expect(eventDetail.canDelete).toBe(false);
    });

    it('seamlessly authenticates seeded users when running against an older server binary returning 405 Method Not Allowed', async () => {
        const mgr = window.authManager;

        // Mock older server binary that does not recognize POST /api/auth/login and returns 405
        window.fetch = vi.fn().mockImplementation((url, init) => {
            if (url === '/api/auth/login') {
                return Promise.resolve({
                    ok: false,
                    status: 405,
                    json: async () => { throw new Error('Not JSON'); }
                });
            }
            if (url === '/api/auth/me') {
                return Promise.resolve({
                    ok: false,
                    status: 404,
                    json: async () => ({})
                });
            }
            return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        // Test with emad123
        const success1 = await mgr.login('Emad', 'emad123');
        expect(success1).toBe(true);
        expect(mgr.currentUser).not.toBeNull();
        expect(mgr.currentUser.username).toBe('Emad');
        expect(mgr.isAdmin()).toBe(true);
        expect(mgr.hasDeletePermission()).toBe(true);

        // Test with password123
        const success2 = await mgr.login('Nawaf', 'password123');
        expect(success2).toBe(true);
        expect(mgr.currentUser.username).toBe('Nawaf');
        expect(mgr.isContributor()).toBe(true);
        expect(mgr.hasDeletePermission()).toBe(false);

        // Test with wrong password fails
        const fail = await mgr.login('Emad', 'wrongpass');
        expect(fail).toBe(false);
        expect(mgr.currentUser).toBeNull();
    });

    it('correctly evaluates permissions across all 10 users in the system', () => {
        const mgr = window.authManager;

        const admins = ['Emad', 'Bubshait', 'Ehtezaz', 'Mustafa'];
        for (const admin of admins) {
            mgr.currentUser = { username: admin, role: 'Admin', canDelete: true };
            expect(mgr.isAdmin()).toBe(true);
            expect(mgr.isContributor()).toBe(false);
            expect(mgr.hasDeletePermission()).toBe(true);
        }

        const contributors = ['Nawaf', 'Naseem', 'Mulla', 'Mariam', 'Shaima', 'Mona'];
        for (const contrib of contributors) {
            mgr.currentUser = { username: contrib, role: 'Contributor', canDelete: false };
            expect(mgr.isAdmin()).toBe(false);
            expect(mgr.isContributor()).toBe(true);
            expect(mgr.hasDeletePermission()).toBe(false);
        }
    });

    it('fetch interceptor automatically attaches credentials and role headers', async () => {
        const mgr = window.authManager;
        mgr.currentUser = { username: 'Mustafa', role: 'Admin', canDelete: true };

        let capturedInit = null;
        window.fetch = vi.fn().mockImplementation((url, init) => {
            capturedInit = init;
            return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        mgr.setupFetchInterceptor(true);

        await window.fetch('/api/houses');

        expect(capturedInit).not.toBeNull();
        expect(capturedInit.credentials).toBe('same-origin');
        expect(capturedInit.headers['X-User-Role']).toBe('Admin');
        expect(capturedInit.headers['X-User']).toBe('Mustafa');
    });

    it('fetch interceptor detects 403 Forbidden and displays user-friendly error toast', async () => {
        const mgr = window.authManager;
        mgr.currentUser = { username: 'Shaima', role: 'Contributor', canDelete: false };

        window.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ error: 'Forbidden: Contributors do not have permission to delete' })
        });

        mgr.setupFetchInterceptor(true);

        await window.fetch('/api/documents/some-doc', { method: 'DELETE' });

        expect(window.showToast).toHaveBeenCalledWith(
            expect.stringContaining('عذراً: ليس لديك صلاحية حذف الوثائق أو العناصر'),
            'error'
        );
    });
});
