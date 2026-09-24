import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const i18nJsContent = fs.readFileSync(
    path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/i18n.js'),
    'utf-8'
);
const houseProfileJsContent = fs.readFileSync(
    path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/house-profile.js'),
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

describe('House Profile, Tenancy Register & Category Folders Localization (Phase 122)', () => {
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
            <div id="house-stats-badge" class="hidden"></div>
            <div id="document-list"></div>
            <div id="export-archive-modal" class="hidden">
                <select id="export-archive-tenant-select"></select>
                <div id="export-archive-spinner" class="hidden"></div>
                <button id="export-opt-zip" type="button"></button>
                <button id="export-opt-pdf" type="button"></button>
                <span id="export-radio-zip"></span>
                <span id="export-radio-pdf" class="hidden"></span>
                <button id="export-archive-modal-close" type="button"></button>
                <button id="btn-cancel-export-archive" type="button"></button>
                <button id="btn-confirm-export-archive" type="button"></button>
            </div>
            <button id="btn-export-house-archive" type="button"></button>
        `;

        // Initialize i18n engine
        const i18nFn = new Function('window', 'document', 'localStorage', i18nJsContent);
        i18nFn(window, document, window.localStorage);

        // Initialize house profile
        const hpFn = new Function('window', 'document', 'localStorage', houseProfileJsContent);
        hpFn(window, document, window.localStorage);

        // Initialize categories view
        const cvFn = new Function('window', 'document', 'localStorage', categoriesViewJsContent);
        cvFn(window, document, window.localStorage);

        // Initialize timeline view
        const tvFn = new Function('window', 'document', 'localStorage', timelineViewJsContent);
        tvFn(window, document, window.localStorage);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const sampleProfile = {
        area_id: 'Al-Rawdah',
        house_id: '101',
        active_resident: 'Salem Al-Harbi',
        tenants: [
            {
                id: 1,
                name: 'Salem Al-Harbi',
                is_active: true,
                is_resident: 1,
                start_date: '2020-01-15',
                end_date: null,
                duration_str_ar: 'بدء الإيجار 2020 (مستمر)',
                document_count: 8,
                category_count: 5,
                category_counts: {
                    '02 - بيانات شخصية': 1,
                    '03 - أمر تخصيص': 1,
                    '04 - محضر تسليم مفتاح': 1,
                    '05 - عقود': 1,
                    '07 - استقطاع إيجار': 1
                }
            },
            {
                id: 2,
                name: 'Ahmed Al-Ghamdi',
                is_active: false,
                is_resident: 1,
                start_date: '2016-03-01',
                end_date: '2019-12-31',
                duration_str_ar: 'من 2016 إلى 2019 (3 سنوات)',
                document_count: 4,
                category_count: 2
            },
            {
                id: 3,
                name: 'Fahad Al-Otaibi',
                is_active: false,
                is_resident: 0,
                start_date: '2024-05-10',
                end_date: null,
                duration_str_ar: 'متقدم (لم يسكن)',
                document_count: 2,
                category_count: 1
            }
        ],
        archive: {
            total_documents: 14,
            total_pages: 35,
            categories: [
                { category: '01 - بيانات أساسية', document_count: 2 },
                { category: '02 - بيانات شخصية', document_count: 2 }
            ]
        }
    };

    describe('Tenancy Register Localization & Directionality', () => {
        it('renders tenancy register in Arabic when language is Arabic', () => {
            window.i18n.setLanguage('ar');
            window.renderHouseProfile(sampleProfile);

            const docList = document.getElementById('document-list');
            const container = docList.firstElementChild;
            expect(container.dir).toBe('rtl');

            // Header titles
            const residentsHeader = docList.querySelector('.residents-header');
            expect(residentsHeader.textContent).toContain('المستأجرون');

            const applicantsHeader = docList.querySelector('.applicants-header');
            expect(applicantsHeader.textContent).toContain('المتقدمون');

            // Status badges
            const currentBadge = docList.querySelector('.tenant-profile-card [title="المستأجر الحالي"]');
            expect(currentBadge).not.toBeNull();
            expect(currentBadge.textContent).toContain('حالي');

            const pastBadge = docList.querySelector('.tenant-profile-card [title="مستأجر سابق"]');
            expect(pastBadge).not.toBeNull();
            expect(pastBadge.textContent).toContain('سابق');

            const applicantBadge = docList.querySelector('.applicant-badge');
            expect(applicantBadge.textContent).toContain('📋 متقدم (لم يسكن)');

            // Zero bilingual intermixed text
            expect(docList.textContent).not.toMatch(/[\u0600-\u06FF]+.*[•\/].*[a-zA-Z]+/);
        });

        it('renders tenancy register cleanly in English when language is English', () => {
            window.i18n.setLanguage('en');
            window.renderHouseProfile(sampleProfile);

            const docList = document.getElementById('document-list');
            const container = docList.firstElementChild;
            expect(container.dir).toBe('ltr');

            // Header titles
            const residentsHeader = docList.querySelector('.residents-header');
            expect(residentsHeader.textContent).toContain('Tenants');

            const applicantsHeader = docList.querySelector('.applicants-header');
            expect(applicantsHeader.textContent).toContain('Applicants');

            // Status badges
            const currentBadge = docList.querySelector('.tenant-profile-card [title="Current Resident"]');
            expect(currentBadge).not.toBeNull();
            expect(currentBadge.textContent).toContain('Current');

            const pastBadge = docList.querySelector('.tenant-profile-card [title="Past Resident"]');
            expect(pastBadge).not.toBeNull();
            expect(pastBadge.textContent).toContain('Vacated');

            const applicantBadge = docList.querySelector('.applicant-badge');
            expect(applicantBadge.textContent).toContain('📋 Applicant (Pending)');

            // Card contents
            const cards = docList.querySelectorAll('.tenant-profile-card');
            expect(cards.length).toBe(3);

            // Document tooltips in English
            const docBadges = docList.querySelectorAll('[title$="documents"]');
            expect(docBadges.length).toBeGreaterThan(0);

            // No Arabic text in English tenancy register labels
            expect(residentsHeader.textContent).not.toMatch(/[\u0600-\u06FF]+/);
            expect(applicantsHeader.textContent).not.toMatch(/[\u0600-\u06FF]+/);
            expect(currentBadge.textContent).not.toMatch(/[\u0600-\u06FF]+/);
            expect(pastBadge.textContent).not.toMatch(/[\u0600-\u06FF]+/);
            expect(applicantBadge.textContent).not.toMatch(/[\u0600-\u06FF]+/);
        });

        it('dynamically formats tenure durations in both languages', () => {
            window.i18n.setLanguage('ar');
            const arActive = window.i18n.formatTenureDuration('2020', null, false, true);
            const arPast = window.i18n.formatTenureDuration('2016', '2019', false, false);
            const arApplicant = window.i18n.formatTenureDuration(null, null, true, false);

            expect(arActive).toContain('بدء الإيجار 2020 (مستمر)');
            expect(arPast).toContain('من 2016 إلى 2019 (3 سنوات)');
            expect(arApplicant).toBe('متقدم (لم يسكن)');

            window.i18n.setLanguage('en');
            const enActive = window.i18n.formatTenureDuration('2020', null, false, true);
            const enPast = window.i18n.formatTenureDuration('2016', '2019', false, false);
            const enApplicant = window.i18n.formatTenureDuration(null, null, true, false);

            expect(enActive).toContain('Lease started 2020 (Current)');
            expect(enPast).toContain('From 2016 to 2019 (3 years)');
            expect(enApplicant).toBe('Applicant (Pending)');
        });
    });

    describe('Tenant File Compliance Audit Localization', () => {
        it('renders compliance banner in Arabic with Arabic labels and score', () => {
            window.i18n.setLanguage('ar');
            window.renderHouseProfile(sampleProfile);

            const compCard = document.querySelector('.tenant-compliance-card');
            expect(compCard).not.toBeNull();
            expect(compCard.textContent).toContain('فحص اكتمال ملف الساكن');
            expect(compCard.textContent).toContain('مكتمل 5/5 ✓');

            const toggleBtn = compCard.querySelector('.btn-toggle-compliance');
            expect(toggleBtn.textContent).toContain('إخفاء');

            const compItems = compCard.querySelectorAll('.compliance-item');
            expect(compItems.length).toBe(5);
            expect(compItems[0].textContent).toContain('بيانات شخصية');
            expect(compItems[0].textContent).toContain('متوفر');
        });

        it('renders compliance banner in English with English labels, buttons and score', () => {
            window.i18n.setLanguage('en');
            window.renderHouseProfile(sampleProfile);

            const compCard = document.querySelector('.tenant-compliance-card');
            expect(compCard).not.toBeNull();
            expect(compCard.textContent).toContain('Tenant File Compliance Audit');
            expect(compCard.textContent).toContain('Complete 5/5 ✓');

            const toggleBtn = compCard.querySelector('.btn-toggle-compliance');
            expect(toggleBtn.textContent).toContain('Hide');

            const compItems = compCard.querySelectorAll('.compliance-item');
            expect(compItems.length).toBe(5);
            expect(compItems[0].textContent).toContain('Personal Details');
            expect(compItems[0].textContent).toContain('Available');
            expect(compItems[1].textContent).toContain('Allotment Order');
            expect(compItems[2].textContent).toContain('Key Handover');
            expect(compItems[3].textContent).toContain('Contracts');
            expect(compItems[4].textContent).toContain('Rent Deduction');

            // No Arabic text in English compliance items
            compItems.forEach(item => {
                expect(item.textContent).not.toMatch(/[\u0600-\u06FF]+/);
            });
        });

        it('renders vacant house compliance banner cleanly in English', () => {
            window.i18n.setLanguage('en');
            const vacantProfile = {
                ...sampleProfile,
                tenants: []
            };
            window.renderHouseProfile(vacantProfile);

            const compCard = document.querySelector('.tenant-compliance-card');
            expect(compCard.textContent).toContain('Tenant File Compliance Audit');
            expect(compCard.textContent).toContain('House is currently vacant');
            expect(compCard.textContent).toContain('Vacant');
            expect(compCard.textContent).not.toContain('شاغر');
        });
    });

    describe('Stats Badge & Export Modal Clean Separation', () => {
        it('renders stats badge in English without intermixed Arabic', async () => {
            window.i18n.setLanguage('en');
            await window.loadHouseProfile('Al-Rawdah', '101', sampleProfile);

            const badge = document.getElementById('house-stats-badge');
            expect(badge.textContent).toBe('2 Tenants · 1 Applicants · 14 Documents');
            expect(badge.textContent).not.toMatch(/[\u0600-\u06FF]+/);
        });

        it('renders stats badge in Arabic when switched to Arabic', async () => {
            window.i18n.setLanguage('ar');
            await window.loadHouseProfile('Al-Rawdah', '101', sampleProfile);

            const badge = document.getElementById('house-stats-badge');
            expect(badge.textContent).toBe('2 مستأجرين · 1 طلبات تخصيص · 14 وثيقة');
        });

        it('eliminates intermixed "كامل السجل • All Records" in export archive modal tenant dropdown', () => {
            window.i18n.setLanguage('en');
            window.openExportArchiveModal(sampleProfile);

            const select = document.getElementById('export-archive-tenant-select');
            expect(select.options[0].textContent).toBe('All Records');
            expect(select.options[0].textContent).not.toContain('•');
            expect(select.options[1].textContent).toMatch(/\(Current/);
            expect(select.options[1].textContent).not.toContain('المستأجر الحالي');

            window.i18n.setLanguage('ar');
            window.openExportArchiveModal(sampleProfile);
            expect(select.options[0].textContent).toBe('كامل السجل');
            expect(select.options[0].textContent).not.toContain('•');
            expect(select.options[1].textContent).toMatch(/مستمر|المستأجر الحالي/);
            expect(select.options[1].textContent).not.toContain('Current');
        });
    });

    describe('Category Folders Localization', () => {
        const mockCategories = [
            {
                name: '01 - بيانات أساسية',
                document_count: 1,
                documents: [
                    { vault_id: 'doc1', category: '01 - بيانات أساسية', primary_title: 'Document 1' }
                ]
            },
            {
                name: '05 - عقود',
                document_count: 0,
                documents: []
            },
            {
                name: 'Custom Folder',
                document_count: 0,
                documents: []
            }
        ];

        it('translates standard category names dynamically via localizeCategory', () => {
            window.i18n.setLanguage('ar');
            expect(window.i18n.localizeCategory('01 - بيانات أساسية')).toBe('01 - بيانات أساسية');
            expect(window.i18n.localizeCategory('03 - أمر تخصيص')).toBe('03 - أمر تخصيص');

            window.i18n.setLanguage('en');
            expect(window.i18n.localizeCategory('01 - بيانات أساسية')).toBe('01 - Basic Master Data');
            expect(window.i18n.localizeCategory('03 - أمر تخصيص')).toBe('03 - Allotment Order');
            expect(window.i18n.localizeCategory('05 - عقود')).toBe('05 - Contracts & Leases');
            expect(window.i18n.localizeCategory('13 - رسائل متنوعة')).toBe('13 - Miscellaneous Letters');
            expect(window.i18n.localizeCategory('Custom Folder')).toBe('Custom Folder');
        });

        it('renders category folders in English with English standard names and dropzone hint', () => {
            window.i18n.setLanguage('en');
            window.renderCategories(mockCategories);

            const docList = document.getElementById('document-list');
            const titles = Array.from(docList.querySelectorAll('.category-folder-card h4')).map(h => h.textContent);

            expect(titles).toContain('01 - Basic Master Data');
            expect(titles).toContain('05 - Contracts & Leases');
            expect(titles).toContain('Custom Folder');

            // Dropzone hint has zero bilingual bullets or slashes
            const emptyHint = docList.querySelector('.empty-folder-drop-hint');
            expect(emptyHint.textContent).toBe('Drag and drop files here');
            expect(emptyHint.textContent).not.toContain('•');
            expect(emptyHint.textContent).not.toContain('/');

            // Top bar
            const topBar = docList.querySelector('.text-\\[11px\\].font-medium');
            expect(topBar.textContent).toBe('Category Folders');
        });

        it('renders category folders in Arabic with Arabic standard names and dropzone hint', () => {
            window.i18n.setLanguage('ar');
            window.renderCategories(mockCategories);

            const docList = document.getElementById('document-list');
            const titles = Array.from(docList.querySelectorAll('.category-folder-card h4')).map(h => h.textContent);

            expect(titles).toContain('01 - بيانات أساسية');
            expect(titles).toContain('05 - عقود');

            const emptyHint = docList.querySelector('.empty-folder-drop-hint');
            expect(emptyHint.textContent).toBe('اسحب وأفلت الملفات هنا');
            expect(emptyHint.textContent).not.toContain('•');
            expect(emptyHint.textContent).not.toContain('/');
        });
    });

    describe('Timeline View Localization', () => {
        const mockTimelineDocs = [
            {
                vault_id: 'doc1',
                primary_title: 'Allotment Letter',
                dates: ['2023-01-01'],
                primary_tenant: 'Fahad Al-Otaibi',
                is_resident: 0
            },
            {
                vault_id: 'doc2',
                primary_title: 'Contract',
                dates: ['2020-05-15'],
                primary_tenant: 'Salem Al-Harbi',
                is_resident: 1
            }
        ];

        it('localizes applicant badge title cleanly in English and Arabic', () => {
            window.i18n.setLanguage('en');
            window.renderTimeline(mockTimelineDocs);

            const applicantBadge = document.querySelector('.bg-purple-50');
            expect(applicantBadge).not.toBeNull();
            expect(applicantBadge.getAttribute('title')).toBe('Pending Applicant');

            window.i18n.setLanguage('ar');
            window.renderTimeline(mockTimelineDocs);

            const arApplicantBadge = document.querySelector('.bg-purple-50');
            expect(arApplicantBadge.getAttribute('title')).toBe('طلب سكن قيد الانتظار');
        });
    });
});
