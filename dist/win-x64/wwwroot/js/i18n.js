/**
 * Housing Application - Internationalization (i18n) Engine
 * Manages clean language separation between Arabic (ar) and English (en).
 * Handles persistent storage, document directionality (RTL/LTR),
 * dynamic translation lookups, and reactive DOM binding.
 */

(function (window) {
    'use strict';

    const STORAGE_KEY = 'app_language';
    const DEFAULT_LANG = 'ar';
    const SUPPORTED_LANGS = ['ar', 'en'];

    const translations = {
        ar: {
            // General & Common
            'app.title': 'نظام إدارة الوثائق السكنية',
            'common.close': 'إغلاق',
            'common.cancel': 'إلغاء',
            'common.save': 'حفظ',
            'common.delete': 'حذف',
            'common.confirm': 'تأكيد',
            'common.edit': 'تعديل',
            'common.rename': 'إعادة تسمية',
            'common.move': 'نقل',
            'common.copy': 'نسخ',
            'common.download': 'تحميل',
            'common.export': 'تصدير',
            'common.search': 'بحث...',
            'common.loading': 'جاري التحميل...',
            'common.error': 'حدث خطأ',
            'common.success': 'تم بنجاح',
            'common.all': 'الكل',
            'common.active': 'نشط',
            'common.vacant': 'شاغر',
            'common.houses': 'المنازل',
            'common.areas': 'الأحياء',
            'common.tenants': 'المستأجرون',
            'common.applicants': 'المتقدمون',
            'common.documents': 'الوثائق',
            'common.switch': 'تبديل',
            'common.logout': 'تسجيل الخروج',
            'common.permissions': 'الصلاحيات',
            'common.admin': 'مدير النظام',
            'common.contributor': 'محرر ومراجع',

            // Header & Navbar
            'nav.sidebar_toggle': 'تبديل الشريط الجانبي (Ctrl+B)',
            'nav.back_to_grid': 'المنازل',
            'nav.select_area': 'اختر حياً من القائمة',
            'nav.search_placeholder': 'البحث عن المنازل، المستأجرين...',
            'nav.search_shortcut': '⌘K',
            'nav.shortcuts_title': 'دليل اختصارات لوحة المفاتيح (?)',
            'nav.theme_toggle_dark': 'تفعيل الوضع الداكن (Shift+D)',
            'nav.theme_toggle_light': 'تفعيل الوضع الفاتح (Shift+D)',
            'nav.upload_doc': 'رفع وثيقة جديدة (⌘I)',
            'nav.user_profile': 'الملف الشخصي والصلاحيات',
            'nav.lang_toggle_title': 'التحويل إلى اللغة الإنجليزية',
            'nav.lang_indicator': 'EN',
            'nav.view_options': 'خيارات العرض',
            'nav.filter_houses': 'تصفية المنازل',
            'nav.sort_houses': 'ترتيب المنازل حسب',
            'nav.sort_house_num': 'رقم المنزل',
            'nav.sort_longest_stay': 'أطول فترة إقامة',
            'nav.sort_missing_first': 'النواقص أولاً',
            'nav.sort_complete_first': 'المكتملة أولاً',

            // Sidebar
            'sidebar.title': 'التنقل الرئيسي',
            'sidebar.db_inspector': 'فاحص قاعدة البيانات',
            'sidebar.areas': 'الأحياء السكنية',

            // Login
            'login.title': 'تسجيل الدخول',
            'login.subtitle': 'نظام إدارة الوثائق السكنية',
            'login.username': 'اسم المستخدم',
            'login.password': 'كلمة المرور',
            'login.username_placeholder': 'أدخل اسم المستخدم',
            'login.password_placeholder': 'أدخل كلمة المرور',
            'login.submit': 'دخول للنظام',
            'login.invalid': 'بيانات الاعتماد غير صحيحة',

            // House Profile & Tenancy Register
            'profile.tenancy_register': 'سجل المستأجرين المتعاقبين',
            'profile.tenants_section': 'المستأجرون الحاليون والسابقون',
            'profile.applicants_section': 'المتقدمون بطلبات سكن',
            'profile.archive_data': 'بيانات الأرشيف الرقمي',
            'profile.back_to_register': 'سجل المنزل',
            'profile.present_status': 'مقيم حالياً',
            'profile.vacated_status': 'أخلى المسكن',
            'profile.applicant_status': 'طلب سكن قيد الانتظار',
            'profile.auto_date': 'تلقائي (عند أول رفع)',
            'profile.start_date': 'تاريخ البداية',
            'profile.end_date': 'تاريخ الإخلاء',
            'profile.duration': 'المدة',
            'profile.doc_count': 'وثائق',
            'profile.open_folder': 'فتح المجلد',
            'profile.settings': 'إعدادات المنزل',
            'profile.export_archive': 'تصدير الأرشيف',

            // Folders & Categories
            'folder.01': '01 - الهوية والوثائق الشخصية',
            'folder.02': '02 - عقود الإيجار',
            'folder.03': '03 - المخالصات والإخلاءات',
            'folder.04': '04 - سندات القبض والدفع',
            'folder.05': '05 - المراسلات والإشعارات',
            'folder.06': '06 - الصيانة والترميم',
            'folder.07': '07 - وثائق الملكية والصكوك',
            'folder.08': '08 - أخرى',

            // Document Operations
            'doc.details': 'تفاصيل الوثيقة',
            'doc.view_pdf': 'عرض الوثيقة (مسافة)',
            'doc.change_date': 'تعديل تاريخ الوثيقة',
            'doc.move_copy': 'نقل / نسخ إلى مجلد آخر',
            'doc.reassign_tenant': 'إعادة تعيين للمستأجر',
            'doc.edit_pages': 'تحرير صفحات الوثيقة',
            'doc.delete_doc': 'حذف الوثيقة نهائياً',
            'doc.quick_look': 'معاينة سريعة',
            'doc.merge_docs': 'دمج الوثائق المحددة',
            'doc.empty_folder': 'لا توجد وثائق في هذا المجلد',
            'doc.empty_timeline': 'لا توجد وثائق في الخط الزمني',
            'doc.timeline_view': 'الخط الزمني الشامل',
            'doc.categories_view': 'مجلدات التصنيفات',

            // Shortcuts Modal
            'shortcuts.title': 'دليل اختصارات لوحة المفاتيح',
            'shortcuts.subtitle': 'تنقل سريع وتشغيل فوري للأرشيف باستخدام مفاتيح الاختصار.',
            'shortcuts.search_title': 'البحث الفوري الشامل',
            'shortcuts.search_desc': 'البحث السريع في المنازل والمستأجرين والوثائق',
            'shortcuts.sidebar_title': 'إظهار / إخفاء الشريط الجانبي',
            'shortcuts.sidebar_desc': 'تبديل عرض قائمة الأحياء والتنقل',
            'shortcuts.upload_title': 'رفع وإيداع وثيقة جديدة',
            'shortcuts.upload_desc': 'فتح نافذة الإيداع السريع للوثائق',
            'shortcuts.quicklook_title': 'المعاينة السريعة للوثائق',
            'shortcuts.quicklook_desc': 'استعراض سريع للوثيقة بدون فتح نافذة التحرير',
            'shortcuts.close_title': 'إغلاق النوافذ المنبثقة',
            'shortcuts.close_desc': 'إغلاق النافذة النشطة أو شاشة المعاينة',
            'shortcuts.theme_title': 'تبديل المظهر الداكن والفاتح',
            'shortcuts.theme_desc': 'التبديل الفوري بين الوضع الليلي والنهاري',
            'shortcuts.help_title': 'دليل الاختصارات',
            'shortcuts.help_desc': 'عرض هذه النافذة التعريفية بالمفاتيح',

            // Command Palette / Search
            'search.section_commands': 'الأوامر السريعة',
            'search.section_houses': 'المنازل',
            'search.section_tenants': 'المستأجرون',
            'search.section_documents': 'الوثائق',
            'search.no_results': 'لم يتم العثور على نتائج',
            'search.no_results_desc': 'جرّب البحث برقم منزل أو اسم مستأجر أو عنوان وثيقة مختلف.',
            'search.results_count': 'نتيجة',
            'search.command_theme': 'تبديل المظهر الداكن / الفاتح',
            'search.command_theme_desc': 'التبديل بين الوضع الليلي والنهاري (Shift+D)',

            // Auth & Roles
            'auth.full_access_badge': 'صلاحيات كاملة',
            'auth.read_upload_badge': 'قراءة ورفع فقط',
            'auth.admin_title': 'مدير النظام',
            'auth.contributor_title': 'محرر ومراجع',
            'auth.admin_desc': 'صلاحيات كاملة: قراءة، رفع، تعديل وحذف كافة الوثائق والمنازل.',
            'auth.contributor_desc': 'صلاحيات محدودة: قراءة واستعراض ورفع الوثائق. خاصية الحذف محجوبة بالكامل.',
            'auth.logged_out_success': 'تم تسجيل الخروج بنجاح',
            'auth.logged_out': 'تم تسجيل الخروج',
            'auth.not_logged_in': 'غير مسجل',
            'auth.login_cta': 'تسجيل الدخول'
        },
        en: {
            // General & Common
            'app.title': 'Housing Digital Archive System',
            'common.close': 'Close',
            'common.cancel': 'Cancel',
            'common.save': 'Save',
            'common.delete': 'Delete',
            'common.confirm': 'Confirm',
            'common.edit': 'Edit',
            'common.rename': 'Rename',
            'common.move': 'Move',
            'common.copy': 'Copy',
            'common.download': 'Download',
            'common.export': 'Export',
            'common.search': 'Search...',
            'common.loading': 'Loading...',
            'common.error': 'An error occurred',
            'common.success': 'Successful',
            'common.all': 'All',
            'common.active': 'Active',
            'common.vacant': 'Vacant',
            'common.houses': 'Houses',
            'common.areas': 'Areas',
            'common.tenants': 'Tenants',
            'common.applicants': 'Applicants',
            'common.documents': 'Documents',
            'common.switch': 'Switch',
            'common.logout': 'Sign Out',
            'common.permissions': 'Permissions',
            'common.admin': 'System Administrator',
            'common.contributor': 'Contributor & Reviewer',

            // Header & Navbar
            'nav.sidebar_toggle': 'Toggle Sidebar (Ctrl+B)',
            'nav.back_to_grid': 'Houses',
            'nav.select_area': 'Select an Area',
            'nav.search_placeholder': 'Search houses, tenants, documents...',
            'nav.search_shortcut': '⌘K',
            'nav.shortcuts_title': 'Keyboard Shortcuts Guide (?)',
            'nav.theme_toggle_dark': 'Switch to Dark Mode (Shift+D)',
            'nav.theme_toggle_light': 'Switch to Light Mode (Shift+D)',
            'nav.upload_doc': 'Upload Document (⌘I)',
            'nav.user_profile': 'User Profile & Permissions',
            'nav.lang_toggle_title': 'Switch to Arabic',
            'nav.lang_indicator': 'عربي',
            'nav.view_options': 'View Options',
            'nav.filter_houses': 'Filter Houses',
            'nav.sort_houses': 'Sort Houses By',
            'nav.sort_house_num': 'House Number',
            'nav.sort_longest_stay': 'Longest Stay',
            'nav.sort_missing_first': 'Compliance: Missing First',
            'nav.sort_complete_first': 'Compliance: Complete First',

            // Sidebar
            'sidebar.title': 'Navigation',
            'sidebar.db_inspector': 'Database Inspector',
            'sidebar.areas': 'Residential Areas',

            // Login
            'login.title': 'Sign In',
            'login.subtitle': 'Housing Digital Archive Management',
            'login.username': 'Username',
            'login.password': 'Password',
            'login.username_placeholder': 'Enter your username',
            'login.password_placeholder': 'Enter your password',
            'login.submit': 'Sign In',
            'login.invalid': 'Invalid credentials',

            // House Profile & Tenancy Register
            'profile.tenancy_register': 'House Tenancy Register',
            'profile.tenants_section': 'Current & Past Tenants',
            'profile.applicants_section': 'Housing Applicants',
            'profile.archive_data': 'Digital Archive Profile',
            'profile.back_to_register': 'House Register',
            'profile.present_status': 'Current Resident',
            'profile.vacated_status': 'Vacated',
            'profile.applicant_status': 'Pending Applicant',
            'profile.auto_date': 'Auto (on first upload)',
            'profile.start_date': 'Start Date',
            'profile.end_date': 'Vacated Date',
            'profile.duration': 'Duration',
            'profile.doc_count': 'documents',
            'profile.open_folder': 'Open Folder',
            'profile.settings': 'House Settings',
            'profile.export_archive': 'Export Archive',

            // Folders & Categories
            'folder.01': '01 - Identity & Personal Documents',
            'folder.02': '02 - Lease Contracts',
            'folder.03': '03 - Clearances & Evictions',
            'folder.04': '04 - Payment Receipts & Vouchers',
            'folder.05': '05 - Correspondence & Notices',
            'folder.06': '06 - Maintenance & Repairs',
            'folder.07': '07 - Ownership & Title Deeds',
            'folder.08': '08 - Other Documents',

            // Document Operations
            'doc.details': 'Document Details',
            'doc.view_pdf': 'View Document (Space)',
            'doc.change_date': 'Change Document Date',
            'doc.move_copy': 'Move / Copy to Folder',
            'doc.reassign_tenant': 'Reassign to Tenant',
            'doc.edit_pages': 'Edit Document Pages',
            'doc.delete_doc': 'Delete Document Permanently',
            'doc.quick_look': 'Quick Look',
            'doc.merge_docs': 'Merge Selected Documents',
            'doc.empty_folder': 'No documents found in this folder',
            'doc.empty_timeline': 'No documents found in the timeline',
            'doc.timeline_view': 'Chronological Timeline',
            'doc.categories_view': 'Category Folders',

            // Shortcuts Modal
            'shortcuts.title': 'Keyboard Shortcuts Guide',
            'shortcuts.subtitle': 'Quickly navigate and operate the archive with key bindings.',
            'shortcuts.search_title': 'Global Spotlight Search',
            'shortcuts.search_desc': 'Instant search across houses, tenants, and files',
            'shortcuts.sidebar_title': 'Toggle Sidebar Navigation',
            'shortcuts.sidebar_desc': 'Expand or collapse the areas navigation list',
            'shortcuts.upload_title': 'Ingest & Upload Document',
            'shortcuts.upload_desc': 'Open the fast document ingestion station',
            'shortcuts.quicklook_title': 'Spacebar Quick Look Preview',
            'shortcuts.quicklook_desc': 'Instantly inspect documents without opening edit dialogs',
            'shortcuts.close_title': 'Close Active Modal or Preview',
            'shortcuts.close_desc': 'Dismiss any open dialog or preview overlay',
            'shortcuts.theme_title': 'Toggle Dark / Light Mode',
            'shortcuts.theme_desc': 'Switch seamlessly between light and dark themes',
            'shortcuts.help_title': 'Keyboard Shortcuts Guide',
            'shortcuts.help_desc': 'Display this keyboard shortcuts reference dialog',

            // Command Palette / Search
            'search.section_commands': 'Commands',
            'search.section_houses': 'Houses',
            'search.section_tenants': 'Tenants',
            'search.section_documents': 'Documents',
            'search.no_results': 'No results found',
            'search.no_results_desc': 'Try searching with a different house number, tenant, or keyword.',
            'search.results_count': 'results',
            'search.command_theme': 'Toggle Dark / Light Theme',
            'search.command_theme_desc': 'Switch theme appearance (Shift+D)',

            // Auth & Roles
            'auth.full_access_badge': 'Full Access',
            'auth.read_upload_badge': 'Read & Upload',
            'auth.admin_title': 'System Administrator',
            'auth.contributor_title': 'Contributor & Reviewer',
            'auth.admin_desc': 'Full access: Read, upload, edit, and delete all documents and houses.',
            'auth.contributor_desc': 'Limited access: Read and upload documents. All deletion capabilities are restricted.',
            'auth.logged_out_success': 'Logged out successfully',
            'auth.logged_out': 'Logged out',
            'auth.not_logged_in': 'Guest',
            'auth.login_cta': 'Sign In'
        }
    };

    let currentLang = DEFAULT_LANG;

    function getStoredLanguage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && SUPPORTED_LANGS.includes(stored)) {
                return stored;
            }
        } catch (e) {
            console.warn('[i18n] Unable to read localStorage:', e);
        }
        return DEFAULT_LANG;
    }

    function persistLanguage(lang) {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            console.warn('[i18n] Unable to write localStorage:', e);
        }
    }

    function setDocumentDirection(lang) {
        const dir = lang === 'ar' ? 'rtl' : 'ltr';
        if (typeof document !== 'undefined' && document.documentElement) {
            document.documentElement.lang = lang;
            document.documentElement.dir = dir;
        }
        return dir;
    }

    function t(key, fallback = '') {
        const langDict = translations[currentLang] || translations[DEFAULT_LANG];
        if (langDict && key in langDict) {
            return langDict[key];
        }
        // Fallback to default language dictionary if key missing in current language
        const defaultDict = translations[DEFAULT_LANG];
        if (defaultDict && key in defaultDict) {
            return defaultDict[key];
        }
        return fallback !== '' ? fallback : key;
    }

    function updateLanguageToggleBtn() {
        if (typeof document === 'undefined') return;
        const btn = document.getElementById('lang-toggle-btn');
        if (!btn) return;

        const nextLang = currentLang === 'ar' ? 'en' : 'ar';
        const indicator = t('nav.lang_indicator', currentLang === 'ar' ? 'EN' : 'عربي');
        const title = t('nav.lang_toggle_title', currentLang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية');

        btn.setAttribute('title', title);
        btn.setAttribute('aria-label', title);

        const labelSpan = btn.querySelector('.lang-label');
        if (labelSpan) {
            labelSpan.textContent = indicator;
        } else {
            // Re-render button content cleanly
            btn.innerHTML = `
                <svg class="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span class="lang-label font-bold text-xs font-mono tracking-tight">${indicator}</span>
            `;
        }
    }

    function applyTranslations(root = null) {
        if (typeof document === 'undefined') return;
        const target = root || document;

        // 1. Text content
        const elements = target.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                const text = t(key);
                if (text) el.textContent = text;
            }
        });

        // 2. Titles / tooltips
        const titleElements = target.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                const val = t(key);
                if (val) el.setAttribute('title', val);
            }
        });

        // 3. Placeholders
        const placeholderElements = target.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                const val = t(key);
                if (val) el.setAttribute('placeholder', val);
            }
        });

        // 4. Aria labels
        const ariaElements = target.querySelectorAll('[data-i18n-aria]');
        ariaElements.forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (key) {
                const val = t(key);
                if (val) el.setAttribute('aria-label', val);
            }
        });

        updateLanguageToggleBtn();
    }

    function setLanguage(lang) {
        if (!SUPPORTED_LANGS.includes(lang)) {
            lang = DEFAULT_LANG;
        }
        currentLang = lang;
        persistLanguage(lang);
        const dir = setDocumentDirection(lang);
        applyTranslations();

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { lang, dir }
            }));
        }
        return lang;
    }

    function toggleLanguage() {
        const nextLang = currentLang === 'ar' ? 'en' : 'ar';
        return setLanguage(nextLang);
    }

    function init() {
        currentLang = getStoredLanguage();
        setDocumentDirection(currentLang);

        if (typeof document !== 'undefined') {
            const setupBtn = () => {
                const btn = document.getElementById('lang-toggle-btn');
                if (btn && !btn._hasI18nListener) {
                    btn._hasI18nListener = true;
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        toggleLanguage();
                    });
                }
                updateLanguageToggleBtn();
                applyTranslations();
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupBtn);
            } else {
                setupBtn();
            }
        }
    }

    const i18n = {
        init,
        getLanguage: () => currentLang,
        setLanguage,
        toggleLanguage,
        t,
        apply: applyTranslations,
        translations,
        SUPPORTED_LANGS,
        DEFAULT_LANG
    };

    window.i18n = i18n;
    init();

})(typeof window !== 'undefined' ? window : globalThis);
