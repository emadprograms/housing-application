import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';

const indexPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/index.html');
const i18nPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/i18n.js');
const authPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/auth-manager.js');

const indexHtmlContent = fs.readFileSync(indexPath, 'utf-8');
const i18nJsContent = fs.readFileSync(i18nPath, 'utf-8');
const authJsContent = fs.readFileSync(authPath, 'utf-8');

describe('Clean Language Separation - Shell, Navbar, Login, Shortcuts & Search (Phase 121)', () => {
    let store = {};
    const localStorageMock = {
        getItem: vi.fn(key => (key in store ? store[key] : null)),
        setItem: vi.fn((key, val) => { store[key] = String(val); }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', localStorageMock);
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
        document.body.innerHTML = indexHtmlContent;

        // Initialize i18n engine
        const i18nFn = new Function('window', 'document', 'localStorage', i18nJsContent);
        i18nFn(window, document, window.localStorage);

        // Initialize auth manager
        delete window._authFetchIntercepted;
        delete window.authManager;
        const authFn = new Function('window', 'document', 'localStorage', authJsContent);
        authFn(window, document, window.localStorage);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Top Navbar & Header Shell', () => {
        it('ensures top navbar buttons contain no intermixed slash (" / ") or bullet (" • ") language pairs', () => {
            const navbar = document.getElementById('top-navbar');
            expect(navbar).not.toBeNull();

            // All button titles and labels in top navbar must be clean single-language
            const buttons = navbar.querySelectorAll('button, a, select, option, span, h1');
            buttons.forEach(el => {
                const title = el.getAttribute('title') || '';
                const ariaLabel = el.getAttribute('aria-label') || '';
                const text = el.textContent || '';

                // Must not contain bilingual pair patterns like "English / عربي" or "Arabic • English"
                expect(title).not.toMatch(/[\u0600-\u06FF]+.*[•\/].*[a-zA-Z]+/);
                expect(title).not.toMatch(/[a-zA-Z]+.*[•\/].*[\u0600-\u06FF]+/);
                expect(ariaLabel).not.toMatch(/[\u0600-\u06FF]+.*[•\/].*[a-zA-Z]+/);
                expect(ariaLabel).not.toMatch(/[a-zA-Z]+.*[•\/].*[\u0600-\u06FF]+/);

                if (!el.children.length && text.trim().length > 0) {
                    expect(text).not.toMatch(/[\u0600-\u06FF]+.*[•\/].*[a-zA-Z]+/);
                    expect(text).not.toMatch(/[a-zA-Z]+.*[•\/].*[\u0600-\u06FF]+/);
                }
            });
        });

        it('verifies all key navbar interactive controls have data-i18n attributes', () => {
            expect(document.getElementById('sidebar-toggle-btn').hasAttribute('data-i18n-title')).toBe(true);
            expect(document.getElementById('back-to-grid-btn').hasAttribute('data-i18n-title')).toBe(true);
            expect(document.getElementById('current-house-title').hasAttribute('data-i18n')).toBe(true);
            expect(document.getElementById('btn-grid-view-options').hasAttribute('data-i18n-title')).toBe(true);
            expect(document.getElementById('btn-search-trigger').hasAttribute('data-i18n-title')).toBe(true);
            expect(document.getElementById('btn-shortcuts-trigger').hasAttribute('data-i18n-title')).toBe(true);
            expect(document.getElementById('lang-toggle-btn').hasAttribute('data-i18n-title')).toBe(true);
            expect(document.getElementById('btn-theme-toggle').hasAttribute('data-i18n-title')).toBe(true);
            expect(document.getElementById('btn-ingest-trigger').hasAttribute('data-i18n-title')).toBe(true);
            expect(document.getElementById('user-profile-btn').hasAttribute('data-i18n-title')).toBe(true);
        });

        it('verifies user profile dropdown options (Switch User, Sign Out) are cleanly localized', () => {
            const btnSwitch = document.getElementById('btn-switch-user');
            const btnLogout = document.getElementById('btn-logout');

            expect(btnSwitch.querySelector('[data-i18n="common.switch"]')).not.toBeNull();
            expect(btnLogout.querySelector('[data-i18n="common.logout"]')).not.toBeNull();
            expect(btnSwitch.textContent).not.toContain('•');
            expect(btnLogout.textContent).not.toContain('•');
        });
    });

    describe('Login Screen Localization', () => {
        it('verifies login screen elements have data-i18n attributes for single-language rendering', () => {
            const loginSubtitle = document.querySelector('#login-screen [data-i18n="login.subtitle"]');
            const loginTitle = document.querySelector('#login-screen [data-i18n="login.title"]');
            const usernameLabel = document.querySelector('label[data-i18n="login.username"]');
            const passwordLabel = document.querySelector('label[data-i18n="login.password"]');
            const usernameInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');
            const submitBtnText = document.querySelector('.login-btn-text');

            expect(loginSubtitle).not.toBeNull();
            expect(loginTitle).not.toBeNull();
            expect(usernameLabel).not.toBeNull();
            expect(passwordLabel).not.toBeNull();
            expect(usernameInput.getAttribute('data-i18n-placeholder')).toBe('login.username_placeholder');
            expect(passwordInput.getAttribute('data-i18n-placeholder')).toBe('login.password_placeholder');
            expect(submitBtnText.getAttribute('data-i18n')).toBe('login.submit');
        });

        it('dynamically localizes login screen when language is toggled to English and back to Arabic', () => {
            window.i18n.setLanguage('en');

            const loginTitle = document.querySelector('#login-screen [data-i18n="login.title"]');
            const loginSubtitle = document.querySelector('#login-screen [data-i18n="login.subtitle"]');
            const usernameInput = document.getElementById('login-username');

            expect(loginTitle.textContent).toBe('Sign In');
            expect(loginSubtitle.textContent).toBe('Housing Digital Archive Management');
            expect(usernameInput.placeholder).toBe('Enter your username');

            window.i18n.setLanguage('ar');
            expect(loginTitle.textContent).toBe('تسجيل الدخول');
            expect(loginSubtitle.textContent).toBe('نظام إدارة الوثائق السكنية');
            expect(usernameInput.placeholder).toBe('أدخل اسم المستخدم');
        });
    });

    describe('Keyboard Shortcuts Modal', () => {
        it('verifies shortcuts modal contains zero bilingual slash / bullet stacked titles', () => {
            const shortcutsModal = document.getElementById('keyboard-shortcuts-modal');
            expect(shortcutsModal).not.toBeNull();

            const title = document.getElementById('shortcuts-modal-title');
            expect(title.getAttribute('data-i18n')).toBe('shortcuts.title');
            expect(title.textContent).not.toContain('/');
            expect(title.textContent).not.toContain('•');

            const closeBtn = document.getElementById('btn-shortcuts-close');
            expect(closeBtn.textContent).not.toContain('/');
            expect(closeBtn.textContent).not.toContain('•');
            expect(closeBtn.querySelector('[data-i18n="common.close"]')).not.toBeNull();
        });

        it('switches shortcuts modal strings between English and Arabic cleanly', () => {
            window.i18n.setLanguage('en');
            const title = document.getElementById('shortcuts-modal-title');
            const subtitle = document.getElementById('shortcuts-subtitle');
            const closeBtn = document.getElementById('btn-shortcuts-close');

            expect(title.textContent).toBe('Keyboard Shortcuts Guide');
            expect(subtitle.textContent).toBe('Quickly navigate and operate the archive with key bindings.');
            expect(closeBtn.textContent.trim()).toBe('Close');

            window.i18n.setLanguage('ar');
            expect(title.textContent).toBe('دليل اختصارات لوحة المفاتيح');
            expect(subtitle.textContent).toBe('تنقل سريع وتشغيل فوري للأرشيف باستخدام مفاتيح الاختصار.');
            expect(closeBtn.textContent.trim()).toBe('إغلاق');
        });
    });

    describe('AuthManager & Dynamic Role Badge Localization', () => {
        it('renders single-language Admin role badge in Arabic mode without bullets or slashes', () => {
            window.i18n.setLanguage('ar');
            window.authManager.currentUser = { username: 'Emad', displayName: 'Emad', role: 'Admin' };
            window.authManager.updateNavbarProfile();

            const roleBadge = document.getElementById('user-role-badge');
            const dropdownRoleBadge = document.getElementById('dropdown-role-badge');

            expect(roleBadge.textContent).toBe('صلاحيات كاملة');
            expect(dropdownRoleBadge.textContent).toBe('مدير النظام');
            expect(roleBadge.textContent).not.toContain('•');
            expect(roleBadge.textContent).not.toContain('/');
        });

        it('renders single-language Admin role badge in English mode without bullets or slashes', () => {
            window.i18n.setLanguage('en');
            window.authManager.currentUser = { username: 'Emad', displayName: 'Emad', role: 'Admin' };
            window.authManager.updateNavbarProfile();

            const roleBadge = document.getElementById('user-role-badge');
            const dropdownRoleBadge = document.getElementById('dropdown-role-badge');

            expect(roleBadge.textContent).toBe('Full Access');
            expect(dropdownRoleBadge.textContent).toBe('System Administrator');
            expect(roleBadge.textContent).not.toContain('•');
            expect(roleBadge.textContent).not.toContain('/');
        });

        it('dynamically updates role badge and dropdown when language is toggled', () => {
            window.authManager.currentUser = { username: 'Nawaf', displayName: 'Nawaf', role: 'Contributor' };
            
            window.i18n.setLanguage('ar');
            expect(document.getElementById('user-role-badge').textContent).toBe('قراءة ورفع فقط');
            expect(document.getElementById('dropdown-role-badge').textContent).toBe('محرر ومراجع');

            window.i18n.setLanguage('en');
            expect(document.getElementById('user-role-badge').textContent).toBe('Read & Upload');
            expect(document.getElementById('dropdown-role-badge').textContent).toBe('Contributor & Reviewer');
        });
    });
});
