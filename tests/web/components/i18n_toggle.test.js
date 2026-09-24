import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';

const indexPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/index.html');
const indexHtmlContent = fs.readFileSync(indexPath, 'utf-8');

describe('Language Switcher & Directionality Engine (Phase 120)', () => {
    let store = {};
    const localStorageMock = {
        getItem: vi.fn(key => (key in store ? store[key] : null)),
        setItem: vi.fn((key, val) => { store[key] = String(val); }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };

    let i18n;

    function loadI18nModule() {
        const i18nScriptPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/i18n.js');
        const code = fs.readFileSync(i18nScriptPath, 'utf-8');
        // Execute script in current jsdom window context
        const fn = new Function('window', 'document', 'localStorage', code);
        fn(window, document, window.localStorage);
        return window.i18n;
    }

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', localStorageMock);
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
        document.body.innerHTML = `
            <header id="top-navbar">
                <button id="lang-toggle-btn" type="button" aria-label="Toggle Language">
                    <span class="lang-label">EN</span>
                </button>
            </header>
            <div id="content">
                <span id="title-el" data-i18n="app.title">Title</span>
                <button id="btn-el" data-i18n="common.save" data-i18n-title="common.save">Save</button>
                <input id="input-el" data-i18n-placeholder="common.search" />
            </div>
        `;
        i18n = loadI18nModule();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('verifies index.html includes #lang-toggle-btn in #top-navbar', () => {
        expect(indexHtmlContent).toContain('id="lang-toggle-btn"');
        expect(indexHtmlContent).toContain('data-i18n');
        expect(indexHtmlContent).toContain('js/i18n.js');
        expect(indexHtmlContent).toContain('localStorage.getItem(\'app_language\')');
    });

    it('initializes with Arabic ("ar") and "rtl" direction by default', () => {
        i18n.init();
        expect(i18n.getLanguage()).toBe('ar');
        expect(document.documentElement.lang).toBe('ar');
        expect(document.documentElement.dir).toBe('rtl');
    });

    it('loads stored language from localStorage if present', () => {
        store['app_language'] = 'en';
        i18n.init();
        expect(i18n.getLanguage()).toBe('en');
        expect(document.documentElement.lang).toBe('en');
        expect(document.documentElement.dir).toBe('ltr');
    });

    it('toggles language from Arabic to English, updating direction and storage', () => {
        i18n.setLanguage('ar');
        expect(i18n.getLanguage()).toBe('ar');
        expect(document.documentElement.dir).toBe('rtl');

        const newLang = i18n.toggleLanguage();
        expect(newLang).toBe('en');
        expect(i18n.getLanguage()).toBe('en');
        expect(document.documentElement.lang).toBe('en');
        expect(document.documentElement.dir).toBe('ltr');
        expect(store['app_language']).toBe('en');

        // Toggle back to Arabic
        const backLang = i18n.toggleLanguage();
        expect(backLang).toBe('ar');
        expect(i18n.getLanguage()).toBe('ar');
        expect(document.documentElement.lang).toBe('ar');
        expect(document.documentElement.dir).toBe('rtl');
        expect(store['app_language']).toBe('ar');
    });

    it('dispatches custom event "languageChanged" with new language and direction', () => {
        const handler = vi.fn();
        window.addEventListener('languageChanged', handler);

        i18n.setLanguage('en');
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail).toEqual({ lang: 'en', dir: 'ltr' });

        i18n.setLanguage('ar');
        expect(handler).toHaveBeenCalledTimes(2);
        expect(handler.mock.calls[1][0].detail).toEqual({ lang: 'ar', dir: 'rtl' });

        window.removeEventListener('languageChanged', handler);
    });

    it('translates keys correctly using i18n.t() and supports fallback', () => {
        i18n.setLanguage('ar');
        expect(i18n.t('common.save')).toBe('حفظ');
        expect(i18n.t('non.existent.key', 'Fallback Text')).toBe('Fallback Text');

        i18n.setLanguage('en');
        expect(i18n.t('common.save')).toBe('Save');
    });

    it('applies translations to DOM elements with data-i18n attributes', () => {
        i18n.setLanguage('en');
        const titleEl = document.getElementById('title-el');
        const btnEl = document.getElementById('btn-el');
        const inputEl = document.getElementById('input-el');

        expect(titleEl.textContent).toBe('Housing Digital Archive System');
        expect(btnEl.textContent).toBe('Save');
        expect(btnEl.getAttribute('title')).toBe('Save');
        expect(inputEl.getAttribute('placeholder')).toBe('Search...');

        i18n.setLanguage('ar');
        expect(titleEl.textContent).toBe('نظام إدارة الوثائق السكنية');
        expect(btnEl.textContent).toBe('حفظ');
        expect(btnEl.getAttribute('title')).toBe('حفظ');
        expect(inputEl.getAttribute('placeholder')).toBe('بحث...');
    });

    it('toggles language when #lang-toggle-btn is clicked', () => {
        i18n.setLanguage('ar');
        const btn = document.getElementById('lang-toggle-btn');
        btn.click();
        expect(i18n.getLanguage()).toBe('en');
        expect(document.documentElement.dir).toBe('ltr');
    });
});
