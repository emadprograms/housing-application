import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const i18nJsContent = fs.readFileSync(
    path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/i18n.js'),
    'utf-8'
);
const routerJsContent = fs.readFileSync(
    path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/router.js'),
    'utf-8'
);
const categoriesViewJsContent = fs.readFileSync(
    path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/categories-view.js'),
    'utf-8'
);
const timelineViewJsContent = fs.readFileSync(
    path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/timeline-view.js'),
    'utf-8'
);

describe('Milestone v18.1 UI & Localization Consistency Polish (Phase 128)', () => {
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
        document.body.innerHTML = `
            <div id="stats-badge" class="hidden"></div>
            <div id="document-list-panel">
                <button id="tab-back-to-tenants" class="hidden" title="Back to Tenant Register"></button>
                <button id="tab-categories">
                    <svg id="tab-categories-icon" class="w-3.5 h-3.5"></svg>
                    <span id="tab-categories-label">Folders</span>
                </button>
                <button id="tab-timeline">
                    <svg class="w-3.5 h-3.5"></svg>
                    <span id="tab-timeline-label">Timeline</span>
                </button>
                <div id="document-list"></div>
            </div>
            <div id="back-to-grid-btn" class="hidden"><span>Back</span></div>
            <div id="current-house-title"></div>
            <div id="area-grid-panel" class="hidden"></div>
            <div id="welcome-panel" class="hidden"></div>
            <div id="document-viewer-panel" class="hidden"></div>
            <div id="resizer-2" class="hidden"></div>
        `;

        global.currentArea = '';
        global.currentHouse = '';
        global.currentTenant = '';
        global.currentTab = 'categories';
        global.currentCategories = [];
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
        window.globalTreeData = [];
        window.refreshCurrentTab = vi.fn();
        window.loadHouseProfile = vi.fn();
        window.loadCategories = vi.fn();
        window.loadTimeline = vi.fn();

        eval(i18nJsContent);
        eval(routerJsContent);
        eval(categoriesViewJsContent);
        eval(timelineViewJsContent);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    describe('MOVE-01..03: Move & Copy Modals Category & Folder Options Localization', () => {
        it('translates standard folders accurately between Arabic and English', () => {
            window.i18n.setLanguage('ar');
            expect(window.i18n.localizeCategory('05 - عقود')).toBe('05 - عقود');
            expect(window.i18n.localizeCategory('01 - بيانات أساسية')).toBe('01 - بيانات أساسية');

            window.i18n.setLanguage('en');
            expect(window.i18n.localizeCategory('05 - عقود')).toBe('05 - Contracts & Leases');
            expect(window.i18n.localizeCategory('01 - بيانات أساسية')).toBe('01 - Basic Master Data');
            expect(window.i18n.localizeCategory('13 - رسائل متنوعة')).toBe('13 - Miscellaneous Letters');
        });

        it('preserves custom non-standard category names untouched', () => {
            window.i18n.setLanguage('en');
            expect(window.i18n.localizeCategory('14 - أرشيف خاص')).toBe('14 - أرشيف خاص');
            expect(window.i18n.localizeCategory('Custom Docs')).toBe('Custom Docs');
        });

        it('provides localized batch and action strings in dictionaries', () => {
            window.i18n.setLanguage('ar');
            expect(window.i18n.t('batch.standard_folders')).toBe('المجلدات القياسية');
            expect(window.i18n.t('batch.custom_folders')).toBe('مجلدات مخصصة');
            expect(window.i18n.t('batch.create_new_folder')).toBe('+ إنشاء مجلد جديد...');

            window.i18n.setLanguage('en');
            expect(window.i18n.t('batch.standard_folders')).toBe('Standard Folders');
            expect(window.i18n.t('batch.custom_folders')).toBe('Custom Folders');
            expect(window.i18n.t('batch.create_new_folder')).toBe('+ Create New Folder...');
        });
    });

    describe('TAB-01..03: Segmented Navigation Tabs Dynamic Localization', () => {
        it('renders pure Arabic tab labels in house view without English side-by-side leak', async () => {
            window.i18n.setLanguage('ar');
            await window.selectHouse('Safra C', '500', null);

            const catLabel = document.getElementById('tab-categories-label');
            const timelineLabel = document.getElementById('tab-timeline-label');

            expect(catLabel.textContent).toBe('سجل المستأجرين');
            expect(timelineLabel.textContent).toBe('التسلسل الزمني للمنزل');
            expect(timelineLabel.textContent).not.toBe('House Timeline');
        });

        it('renders pure English tab labels in house view', async () => {
            window.i18n.setLanguage('en');
            await window.selectHouse('Safra C', '500', null);

            const catLabel = document.getElementById('tab-categories-label');
            const timelineLabel = document.getElementById('tab-timeline-label');

            expect(catLabel.textContent).toBe('Tenants');
            expect(timelineLabel.textContent).toBe('House Timeline');
        });

        it('renders pure Arabic and English tab labels in tenant drill-down view', async () => {
            window.i18n.setLanguage('ar');
            await window.selectHouse('Safra C', '500', 'علي الحداد');

            expect(document.getElementById('tab-categories-label').textContent).toBe('المجلدات');
            expect(document.getElementById('tab-timeline-label').textContent).toBe('التسلسل الزمني للمستأجر');

            window.i18n.setLanguage('en');
            expect(document.getElementById('tab-categories-label').textContent).toBe('Folders');
            expect(document.getElementById('tab-timeline-label').textContent).toBe('Tenant Timeline');
        });

        it('dynamically switches tab labels when languageChanged event fires without re-navigating', async () => {
            window.i18n.setLanguage('ar');
            await window.selectHouse('Safra C', '500', null);
            expect(document.getElementById('tab-timeline-label').textContent).toBe('التسلسل الزمني للمنزل');

            // Switch language to English
            window.i18n.setLanguage('en');
            // updateNavTabLabels responds to languageChanged
            expect(document.getElementById('tab-timeline-label').textContent).toBe('House Timeline');
            expect(document.getElementById('tab-categories-label').textContent).toBe('Tenants');

            // Switch back to Arabic
            window.i18n.setLanguage('ar');
            expect(document.getElementById('tab-timeline-label').textContent).toBe('التسلسل الزمني للمنزل');
            expect(document.getElementById('tab-categories-label').textContent).toBe('سجل المستأجرين');
        });
    });

    describe('TSEL-01..02: Tenant Suffixes & Header Stats Badge Localization', () => {
        it('formats active tenant suffix purely in Arabic and English in formatBatchTenantLabel', () => {
            const resident = { name: 'فواز الخالدي', is_resident: 1, is_active: 1 };

            window.i18n.setLanguage('ar');
            expect(window.formatBatchTenantLabel(resident)).toBe('فواز الخالدي (المستأجر الحالي)');

            window.i18n.setLanguage('en');
            expect(window.formatBatchTenantLabel(resident)).toBe('فواز الخالدي (Current Tenant)');
        });

        it('formats applicant suffix purely in Arabic and English in formatBatchTenantLabel', () => {
            const applicant = { name: 'سارة خالد', is_resident: 0 };

            window.i18n.setLanguage('ar');
            expect(window.formatBatchTenantLabel(applicant)).toBe('📋 سارة خالد (متقدم - لم يسكن)');

            window.i18n.setLanguage('en');
            expect(window.formatBatchTenantLabel(applicant)).toBe('📋 سارة خالد (Applicant - Did not reside)');
        });

        it('localizes categories stats badge in Categories view between Arabic and English', () => {
            window.i18n.setLanguage('ar');
            const arStats = window.formatCategoriesStatsBadge ? window.formatCategoriesStatsBadge(5, 23) : '';
            expect(arStats).toBe('5 مجلدات (23 وثائق)');

            window.i18n.setLanguage('en');
            const enStats = window.formatCategoriesStatsBadge ? window.formatCategoriesStatsBadge(5, 23) : '';
            expect(enStats).toBe('5 Categories (23 Docs)');
        });
    });

    describe('EDGE-01..02: Management Modals & Mode Buttons Clean-up', () => {
        it('verifies dictionary definitions for single document action modal mode buttons', () => {
            window.i18n.setLanguage('ar');
            expect(window.i18n.t('doc_action.apply_changes')).toContain('تطبيق التغييرات');
            expect(window.i18n.t('doc_action.duplicate_doc')).toContain('نسخ المستند');

            window.i18n.setLanguage('en');
            expect(window.i18n.t('doc_action.apply_changes')).toContain('Apply Changes');
            expect(window.i18n.t('doc_action.duplicate_doc')).toContain('Duplicate Document');
        });

        it('verifies Manage Tenants tooltips eliminate bilingual bullet concatenation in localized mode', () => {
            window.i18n.setLanguage('ar');
            const startAr = window.i18n.t('house_settings.start_date_tooltip');
            expect(startAr).not.toContain(' • ');
            expect(startAr).toContain('تاريخ البدء');

            window.i18n.setLanguage('en');
            const startEn = window.i18n.t('house_settings.start_date_tooltip');
            expect(startEn).not.toContain(' • ');
            expect(startEn).toContain('Start date is always selected');
        });
    });
});
