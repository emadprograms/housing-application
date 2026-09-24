import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const i18nJsContent = fs.readFileSync(
    path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/i18n.js'),
    'utf-8'
);
const docViewerJsContent = fs.readFileSync(
    path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/doc-viewer.js'),
    'utf-8'
);
const docManagerJsContent = fs.readFileSync(
    path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/doc-manager.js'),
    'utf-8'
);
const docPageEditorJsContent = fs.readFileSync(
    path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/doc-page-editor.js'),
    'utf-8'
);

describe('Phase 123: Modals, Actions, Ingestion Station & System Messages Localization', () => {
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
            <div id="viewer-container">
                <button id="viewer-translate-btn" title=""></button>
                <button id="viewer-expand-btn" title="">
                    <svg id="viewer-expand-icon"></svg>
                    <svg id="viewer-collapse-icon" class="hidden"></svg>
                </button>
                <button id="viewer-mode-toggle" title=""></button>
            </div>
            <div id="merge-docs-count-badge"></div>
            <div id="merge-preview-cards"></div>
            <div id="merge-reorder-list"></div>
            <label id="merge-delete-sources-container">
                <input type="checkbox" id="merge-delete-sources" />
            </label>
            <div id="doc-page-editor-modal" class="hidden">
                <span id="doc-page-editor-title"></span>
                <span id="doc-page-editor-subtitle"></span>
                <span id="doc-page-editor-count-badge"></span>
                <div id="doc-page-editor-grid"></div>
                <div id="doc-page-editor-loading" class="hidden"></div>
                <span id="doc-page-editor-selected-count"></span>
                <button id="btn-editor-delete-selected"><span class="btn-text"></span></button>
                <button id="btn-editor-rotate-selected"><span class="btn-text"></span></button>
                <button id="btn-editor-copy-selected"><span class="btn-text"></span></button>
                <button id="btn-editor-extract-selected"><span class="btn-text"></span></button>
            </div>
            <div id="extract-pages-submodal" class="hidden">
                <span id="extract-pages-count-badge"></span>
                <select id="extract-category-select"></select>
                <select id="extract-tenant-select"></select>
                <input id="extract-title-input" />
                <input id="extract-date-input" />
                <textarea id="extract-notes-input"></textarea>
                <button id="btn-extract-confirm"><span id="btn-extract-confirm-text"></span></button>
            </div>
        `;

        // Initialize i18n
        const i18nFn = new Function('window', 'document', 'localStorage', i18nJsContent);
        i18nFn(window, document, window.localStorage);
        window.i18n.init();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('verifies that no bilingual bullet intermixed strings remain in JS sources', () => {
        expect(docViewerJsContent.includes(' • ')).toBe(false);
        // doc-manager must contain zero bilingual strings
        expect(docManagerJsContent.includes('Move earlier • تقديم')).toBe(false);
        expect(docManagerJsContent.includes('Move later • تأخير')).toBe(false);
        expect(docManagerJsContent.includes('Swap order • تبديل الترتيب')).toBe(false);
        expect(docManagerJsContent.includes('Remove document • إزالة')).toBe(false);
        expect(docManagerJsContent.includes('عذراً: ليس لديك صلاحية حذف الوثائق (قراءة ورفع فقط) • Deletion is restricted for Contributor accounts.')).toBe(false);
        expect(docManagerJsContent.includes('حذف المستندات المصدر محجوب للموظفين • Deletion restricted for Contributors')).toBe(false);
        expect(docManagerJsContent.includes('Edit, split, reorder, or delete pages in this document • تعديل وفصل الصفحات')).toBe(false);

        // doc-page-editor must contain zero bilingual strings
        expect(docPageEditorJsContent.includes('Delete page • حذف الصفحة')).toBe(false);
        expect(docPageEditorJsContent.includes('Rotate 90° clockwise • تدوير الصفحة 90 درجة')).toBe(false);
        expect(docPageEditorJsContent.includes('Move earlier • تقديم الصفحة')).toBe(false);
        expect(docPageEditorJsContent.includes('Move later • تأخير الصفحة')).toBe(false);
        expect(docPageEditorJsContent.includes('selected • محدد')).toBe(false);
        expect(docPageEditorJsContent.includes('Rotate 90° (تدوير)')).toBe(false);
        expect(docPageEditorJsContent.includes('Please select at least one page to separate • يرجى تحديد صفحة واحدة على الأقل')).toBe(false);
        expect(docPageEditorJsContent.includes('كامل المنزل (عام) • General House Document')).toBe(false);
        expect(docPageEditorJsContent.includes('صفحة محددة • ')).toBe(false);
        expect(docPageEditorJsContent.includes('صفحة • ')).toBe(false);
    });

    it('verifies that i18n translation dictionary covers all modal, viewer, and editor keys symmetrically', () => {
        const requiredKeys = [
            'editor.title',
            'editor.loading',
            'editor.select_all',
            'editor.deselect',
            'editor.delete_selected',
            'editor.rotate_selected',
            'editor.rotate_tooltip',
            'editor.copy_selected',
            'editor.extract_selected',
            'editor.move_earlier',
            'editor.move_later',
            'editor.delete_page',
            'editor.general_house',
            'merge.title',
            'merge.swap',
            'merge.move_earlier',
            'merge.move_later',
            'merge.remove_doc',
            'toast.delete_doc_restricted',
            'toast.delete_page_restricted',
            'toast.viewer_tab_mode',
            'toast.viewer_pc_mode',
            'toast.viewer_fullscreen',
            'toast.viewer_exit_fullscreen',
            'toast.viewer_peek_scan',
            'toast.viewer_translate_active',
            'toast.viewer_translate_btn',
            'vacated.msg_prefix',
            'vacated.msg_suffix'
        ];

        window.i18n.setLanguage('ar');
        for (const k of requiredKeys) {
            const arVal = window.i18n.t(k);
            expect(arVal).toBeTruthy();
            expect(arVal).not.toBe(k);
            expect(arVal.includes(' • ')).toBe(false);
        }

        window.i18n.setLanguage('en');
        for (const k of requiredKeys) {
            const enVal = window.i18n.t(k);
            expect(enVal).toBeTruthy();
            expect(enVal).not.toBe(k);
            expect(enVal.includes(' • ')).toBe(false);
        }
    });

    it('verifies dynamic viewer button titles in Arabic and English modes', () => {
        // In Arabic mode
        window.i18n.setLanguage('ar');
        expect(window.i18n.t('toast.viewer_fullscreen')).toBe('شاشة كاملة');
        expect(window.i18n.t('toast.viewer_exit_fullscreen')).toBe('تصغير الشاشة');
        expect(window.i18n.t('toast.viewer_peek_scan')).toBe('إظهار / إخفاء الأصل');
        expect(window.i18n.t('toast.viewer_translate_btn')).toBe('ترجمة المستند للإنجليزية');
        expect(window.i18n.t('toast.viewer_tab_mode')).toBe('وضع التابلت — انقر للتبديل إلى وضع الكمبيوتر');
        expect(window.i18n.t('toast.viewer_pc_mode')).toBe('وضع الكمبيوتر — انقر للتبديل إلى وضع التابلت');

        // Switch to English mode
        window.i18n.setLanguage('en');
        expect(window.i18n.t('toast.viewer_fullscreen')).toBe('Toggle fullscreen');
        expect(window.i18n.t('toast.viewer_exit_fullscreen')).toBe('Exit fullscreen');
        expect(window.i18n.t('toast.viewer_peek_scan')).toBe('Toggle scan visibility');
        expect(window.i18n.t('toast.viewer_translate_btn')).toBe('Translate document to English (Offline)');
        expect(window.i18n.t('toast.viewer_tab_mode')).toBe('Using Tab viewer — Click to switch to Computer viewer');
        expect(window.i18n.t('toast.viewer_pc_mode')).toBe('Using Computer viewer — Click to switch to Tab viewer');
    });

    it('verifies document deletion restriction message in Arabic and English modes', () => {
        window.i18n.setLanguage('ar');
        expect(window.i18n.t('toast.delete_doc_restricted')).toBe('عذراً: ليس لديك صلاحية حذف الوثائق (قراءة ورفع فقط).');
        expect(window.i18n.t('toast.delete_page_restricted')).toBe('عذراً: ليس لديك صلاحية حذف صفحات الوثائق (قراءة ورفع فقط).');

        window.i18n.setLanguage('en');
        expect(window.i18n.t('toast.delete_doc_restricted')).toBe('Document deletion is restricted for Contributor accounts.');
        expect(window.i18n.t('toast.delete_page_restricted')).toBe('Page deletion is restricted for Contributor accounts.');
    });

    it('verifies merge action titles in Arabic and English modes', () => {
        window.i18n.setLanguage('ar');
        expect(window.i18n.t('merge.move_earlier')).toBe('تقديم');
        expect(window.i18n.t('merge.move_later')).toBe('تأخير');
        expect(window.i18n.t('merge.swap')).toBe('تبديل الترتيب');
        expect(window.i18n.t('merge.remove_doc')).toBe('إزالة المستند');

        window.i18n.setLanguage('en');
        expect(window.i18n.t('merge.move_earlier')).toBe('Move earlier');
        expect(window.i18n.t('merge.move_later')).toBe('Move later');
        expect(window.i18n.t('merge.swap')).toBe('Swap Order');
        expect(window.i18n.t('merge.remove_doc')).toBe('Remove document');
    });

    it('verifies editor general house document option and labels in Arabic and English', () => {
        window.i18n.setLanguage('ar');
        expect(window.i18n.t('editor.general_house')).toBe('كامل المنزل (عام)');

        window.i18n.setLanguage('en');
        expect(window.i18n.t('editor.general_house')).toBe('General House Document');
    });
});
