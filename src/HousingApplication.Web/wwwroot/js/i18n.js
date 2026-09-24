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

            // Navigation & Tabs
            'tabs.tenants': 'سجل المستأجرين',
            'tabs.folders': 'المجلدات',
            'tabs.house_timeline': 'التسلسل الزمني للمنزل',
            'tabs.tenant_timeline': 'التسلسل الزمني للمستأجر',
            'tabs.back_to_tenants_title': 'الرجوع إلى سجل المستأجرين',
            'tabs.back_to_houses': 'منازل {area}',

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
            'profile.tenants': 'المستأجرون',
            'profile.applicants': 'المتقدمون',
            'profile.archive_data': 'بيانات الأرشيف الرقمي',
            'profile.back_to_register': 'سجل المنزل',
            'profile.present_status': 'مقيم حالياً',
            'profile.vacated_status': 'أخلى المسكن',
            'profile.applicant_status': 'طلب سكن قيد الانتظار',
            'profile.current_resident': 'حالي',
            'profile.vacated_resident': 'سابق',
            'profile.applicant_badge': '📋 متقدم (لم يسكن)',
            'profile.no_tenants': 'لا يوجد مستأجرون مسجلون لهذا المنزل حالياً.',
            'profile.no_applicants': 'لا يوجد متقدمون مسجلون لهذا المنزل.',
            'profile.stats_tenants': 'مستأجرين',
            'profile.stats_applicants': 'طلبات تخصيص',
            'profile.stats_docs': 'وثيقة',
            'profile.compliance_title': 'فحص اكتمال ملف الساكن',
            'profile.compliance_vacant_desc': 'المنزل شاغر حالياً — لا يوجد ساكن حالي لإجراء فحص الاكتمال.',
            'profile.compliance_complete': 'مكتمل 5/5 ✓',
            'profile.compliance_incomplete': 'ناقص ⚠️',
            'profile.compliance_show': 'عرض',
            'profile.compliance_hide': 'إخفاء',
            'profile.compliance_available': 'متوفر',
            'profile.compliance_upload': 'رفع',
            'profile.all_records': 'كامل السجل',
            'profile.current_tenant_suffix': '(المستأجر الحالي)',
            'profile.applicant_label_suffix': '(متقدم - لم يسكن)',
            'profile.first_doc': 'أول وثيقة: ',
            'profile.awaiting_upload': 'بانتظار أول رفع',
            'profile.lease_started': 'بدء الإيجار',
            'profile.lease_ongoing': '(مستمر)',
            'profile.years_count': 'سنوات',
            'profile.year_single': 'سنة واحدة',
            'profile.years_two': 'سنتين',
            'profile.under_year': 'أقل من سنة',
            'profile.auto_date': 'تلقائي (عند أول رفع)',
            'profile.start_date': 'تاريخ البداية',
            'profile.end_date': 'تاريخ الإخلاء',
            'profile.duration': 'المدة',
            'profile.doc_count': 'وثائق',
            'profile.open_folder': 'فتح المجلد',
            'profile.settings': 'إعدادات المنزل',
            'profile.export_archive': 'تصدير الأرشيف',
            'profile.loading_register': 'جاري تحميل سجل المنزل والأرشيف...',
            'profile.error_loading_register': 'خطأ أثناء تحميل سجل المستأجرين',

            // Folders & Categories (All 13 Standard Categories)
            'folder.01': '01 - بيانات أساسية',
            'folder.02': '02 - بيانات شخصية',
            'folder.03': '03 - أمر تخصيص',
            'folder.04': '04 - محضر تسليم مفتاح',
            'folder.05': '05 - عقود',
            'folder.06': '06 - كهرباء وماء',
            'folder.07': '07 - استقطاع إيجار',
            'folder.08': '08 - وقف استقطاع بدل',
            'folder.09': '09 - إشعارات',
            'folder.10': '10 - صيانة',
            'folder.11': '11 - صور ومعاينات',
            'folder.12': '12 - تعديلات',
            'folder.13': '13 - رسائل متنوعة',
            'folder.dropzone_hint': 'اسحب وأفلت الملفات هنا',
            'folder.dropzone_sub': 'أو انقر لاختيار ملفات من جهازك',
            'folder.delete_restricted': 'عذراً: ليس لديك صلاحية حذف المجلدات (قراءة ورفع فقط)',
            'folder.doc_delete_restricted': 'عذراً: ليس لديك صلاحية حذف الوثائق (قراءة ورفع فقط)',
            'folder.select_two_to_merge': 'يرجى تحديد وثيقتين على الأقل للدمج',
            'folder.doc_copied': 'تم نسخ الوثيقة بنجاح',
            'folder.docs_copied': 'تم نسخ الوثائق المحددة بنجاح',

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
            'doc.loading': 'جاري تحميل الوثيقة...',
            'doc.retry': 'إعادة المحاولة',
            'doc.open_direct': 'فتح مباشرة',
            'doc.translate': 'ترجمة المستند للإنجليزية',

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
            'auth.login_cta': 'تسجيل الدخول',

            // House Settings & Tenants Modal
            'house_settings.title': 'إعدادات المنزل',
            'house_settings.subtitle': 'تهيئة الفترات الإيجارية للمستأجرين وإعدادات المنزل',
            'house_settings.tenants': 'المستأجرون',
            'house_settings.residency_timelines': 'الفترات الإيجارية للمطابقة التلقائية مع الوثائق',
            'house_settings.add_tenant': 'إضافة مستأجر',
            'house_settings.tenant_name': 'اسم المستأجر',
            'house_settings.tenant_type': 'النوع',
            'house_settings.start_date': 'تاريخ البدء',
            'house_settings.end_date': 'تاريخ الانتهاء',
            'house_settings.present': 'حالي',
            'house_settings.delete': 'حذف',
            'house_settings.start_date_tooltip': 'تاريخ البدء يُحدّد دائماً من أول وثيقة، ويكون تلقائياً عند عدم وجود وثائق.',
            'house_settings.end_date_tooltip': 'تاريخ الانتهاء يُحدّد دائماً من تاريخ آخر وثيقة. إذا كان يسكن حالياً، حدد (حالي).',
            'house_settings.danger_zone': 'منطقة الخطر',
            'house_settings.delete_house': 'حذف المنزل',
            'house_settings.delete_house_desc': 'حذف هذا المنزل نهائياً مع كافة المستأجرين والوثائق والملفات من القرص. لا يمكن التراجع عن هذا الإجراء.',
            'house_settings.delete_house_btn': 'حذف المنزل',
            'house_settings.load_error': 'حدث خطأ أثناء تحميل المستأجرين.',
            'house_settings.auto_first_upload': 'تلقائي (عند أول رفع)',
            'house_settings.auto_on_upload': 'تلقائي (عند الرفع)',
            'house_settings.error_loading_tenants': 'حدث خطأ أثناء تحميل المستأجرين.',
            'house_settings.app_order_date': 'تاريخ الطلب/التخصيص',
            'house_settings.did_not_reside': 'لم يسكن',
            'house_settings.tenant_type_resident': '🏠 ساكن',
            'house_settings.tenant_type_applicant': '📋 متقدم',

            // Delete House Modal
            'delete_house.title': 'حذف المنزل',
            'delete_house.irreversible': 'لا يمكن التراجع عن هذا الإجراء.',
            'delete_house.confirm_msg': 'هل أنت متأكد من رغبتك في حذف هذا المنزل نهائياً؟ سيتم محو كافة المستأجرين والوثائق والملفات من القرص.',
            'delete_house.warning': 'سيتم حذف جميع سجلات قاعدة البيانات والملفات في مجلدات vault و batches بشكل دائم.',
            'delete_house.phrase_instruction': 'لتأكيد الحذف، اكتب العبارة في الحقل أدناه:',
            'delete_house.confirm_placeholder': 'اكتب عبارة التأكيد...',
            'delete_house.btn_confirm': '🗑️ حذف نهائي',

            // Add House Modal
            'add_house.title': 'إضافة منزل جديد',
            'add_house.subtitle': 'تسجيل المنزل وتهيئة مجلدات التخزين له.',
            'add_house.area': 'المنطقة',
            'add_house.area_select': 'اختر المنطقة...',
            'add_house.house_id': 'رقم أو اسم المنزل',
            'add_house.house_id_placeholder': 'مثال: 515 أو Villa 12',
            'add_house.initial_tenant': 'اسم الساكن الأولي (اختياري)',
            'add_house.initial_tenant_placeholder': 'مثال: عبد الله خالد الشمري',
            'add_house.start_date': 'تاريخ بدء العقد (اختياري)',
            'add_house.submit_btn': 'إضافة المنزل',

            // Document Actions Modal
            'doc_action.title': 'إدارة الوثيقة',
            'doc_action.subtitle': 'إعادة التسمية أو تنظيم المجلدات أو التعيين للمستأجر.',
            'doc_action.manually_assigned': 'تعيين يدوي:',
            'doc_action.protected_reallocation': 'محمي من إعادة التوزيع التلقائي.',
            'doc_action.reset_auto': 'إعادة للوضع التلقائي',
            'doc_action.doc_title': 'اسم الوثيقة',
            'doc_action.doc_title_placeholder': 'اسم المستند...',
            'doc_action.doc_date': 'تاريخ الوثيقة',
            'doc_action.category_folder': 'مجلد التصنيف',
            'doc_action.move': 'نقل',
            'doc_action.copy': 'نسخ (تكرار)',
            'doc_action.new_folder_placeholder': 'أدخل اسم المجلد الجديد (مثال: مستندات بنكية)...',
            'doc_action.new_folder_hint': 'سيتم ترقيم المجلد تلقائياً بالرقم التسلسلي التالي (مثال: 14 - ...).',
            'doc_action.assigned_tenant': 'المستأجر المحدد (داخل المنزل)',
            'doc_action.general_house': 'كامل المنزل (عام)',
            'doc_action.delete_doc': 'حذف الوثيقة',
            'doc_action.edit_pages': '✂️ تحرير الصفحات',
            'doc_action.apply_changes': '💾 تطبيق التغييرات',
            'doc_action.duplicate_doc': '📄 نسخ المستند',

            // Change Document Date Modal
            'change_date.title': 'تعديل تاريخ الوثيقة',
            'change_date.subtitle': 'تحديث تاريخ الوثيقة',
            'change_date.label': 'تاريخ الوثيقة',
            'change_date.hint': 'يُحدّث ترتيب الوثيقة في الخط الزمني وتوزيع الإقامة للمستأجرين.',
            'change_date.save_btn': 'حفظ التاريخ',

            // Batch Operations
            'batch.selected_count': 'محدد',
            'batch.action_move': 'نقل المحدد',
            'batch.action_copy': 'نسخ المحدد',
            'batch.action_merge': '🔗 دمج المحدد',
            'batch.action_delete': 'حذف المحدد',
            'batch.action_deselect': 'إلغاء التحديد',
            'batch.move_title': 'نقل الوثائق المحددة',
            'batch.move_subtitle': 'نقل الوثائق إلى مجلد تصنيف محدد.',
            'batch.copy_title': 'نسخ الوثائق المحددة',
            'batch.copy_subtitle': 'إضافة الوثائق إلى مجلد تصنيف آخر.',
            'batch.target_tenant': 'المستأجر المستهدف',
            'batch.target_folder': 'مجلد التصنيف المستهدف',
            'batch.move_btn': 'نقل الوثائق',
            'batch.copy_btn': 'نسخ الوثائق',
            'batch.standard_folders': 'المجلدات القياسية',
            'batch.custom_folders': 'مجلدات مخصصة',
            'batch.create_new_folder': '+ إنشاء مجلد جديد...',
            'batch.move_single_subtitle': 'نقل "{name}" إلى مجلد تصنيف محدد.',
            'batch.move_multiple_subtitle': 'نقل {count} مستندات إلى مجلد تصنيف محدد.',
            'batch.copy_single_subtitle': 'نسخ "{name}" إلى مجلد تصنيف محدد.',
            'batch.copy_multiple_subtitle': 'نسخ {count} مستندات إلى مجلد تصنيف محدد.',
            'batch.move_success_single': 'تم نقل المستند بنجاح إلى "{category}"',
            'batch.move_success_multiple': 'تم نقل {count} مستندات بنجاح إلى "{category}"',
            'batch.copy_success_single': 'تم نسخ الوثيقة بنجاح',
            'batch.copy_success_multiple': 'تم نسخ الوثائق المحددة بنجاح',
            'batch.select_target_folder_error': 'يرجى اختيار مجلد التصنيف المستهدف.',
            'batch.delete_title': 'حذف الوثائق المحددة',
            'batch.delete_subtitle': 'لا يمكن التراجع عن هذا الإجراء.',
            'batch.delete_message': 'هل أنت متأكد من رغبتك في حذف الوثائق المحددة نهائياً؟ سيتم مسح كافة الملفات وسجلات قاعدة البيانات المرتبطة بها.',
            'batch.delete_warning': 'سيتم حذف كل من سجلات قاعدة البيانات وملفات PDF من الخزينة نهائياً.',
            'batch.delete_btn': '🗑️ حذف نهائي',

            // Merge Documents Modal
            'merge.title': 'دمج المستندات',
            'merge.subtitle': 'دمج ملفات PDF بالتسلسل المطلوب مع معاينة كاملة',
            'merge.zoom_out': 'تصغير البطاقات',
            'merge.zoom_in': 'تكبير البطاقات',
            'merge.zoom_reset': 'استعادة الحجم الافتراضي',
            'merge.reorder_step_title': 'ترتيب المستندات',
            'merge.reorder_step_desc': 'استخدم أزرار الأسهم على البطاقات للتقديم والتأخير',
            'merge.continue_to_save': 'متابعة للحفظ',
            'merge.preview_title': 'معاينة المستندات بالتسلسل',
            'merge.swap': 'تبديل الترتيب',
            'merge.doc_name': 'اسم المستند المدمج',
            'merge.doc_name_placeholder': 'اسم المستند...',
            'merge.target_folder': 'حفظ في مجلد',
            'merge.new_folder_placeholder': 'اسم المجلد الجديد...',
            'merge.target_tenant': 'المستأجر',
            'merge.delete_original': 'حذف المستندات الأصلية بعد الدمج',
            'merge.back': '← رجوع',
            'merge.confirm_btn': '⚡ دمج المستندات',
            'merge.move_earlier': 'تقديم',
            'merge.move_later': 'تأخير',
            'merge.remove_doc': 'إزالة المستند',
            'merge.start_doc': '#1 (البداية)',
            'merge.end_doc': '#2 (النهاية)',

            // Export Archive Modal
            'export.title': 'تصدير الأرشيف',
            'export.format': 'صيغة التصدير',
            'export.format_zip_desc': 'مجلدات',
            'export.format_pdf_desc': 'تسلسل زمني',
            'export.tenant': 'المستأجر',
            'export.all_records': 'كامل السجل',
            'export.download_btn': '⬇️ تحميل',

            // Vacated Tenant Modal
            'vacated.title': 'تضارب تاريخ المستأجر المنتهي',
            'vacated.subtitle': 'تحذير تضارب تواريخ السكن',
            'vacated.options_title': 'خيارات المعالجة:',
            'vacated.option_extend': 'تمديد التاريخ: تحديث تاريخ إخلاء المستأجر إلى تاريخ الوثيقة.',
            'vacated.option_proceed': 'المتابعة دون تمديد: حفظ الوثيقة مع إبقاء المستأجر كمنتهي الإقامة.',
            'vacated.option_cancel': 'إلغاء: تعديل تاريخ الوثيقة أو اختيار مستأجر آخر.',
            'vacated.btn_extend': 'تمديد تاريخ المستأجر ورفع الوثيقة',
            'vacated.btn_proceed': 'رفع دون تمديد',
            'vacated.btn_cancel': 'إلغاء',
            'vacated.msg_prefix': 'هذا الشخص غادر المنزل في تاريخ',
            'vacated.msg_mid': 'وأنت تحاول إضافة وثيقة بتاريخ',
            'vacated.msg_suffix': 'هل تريد تمديد فترة إقامته؟',

            // Document Page Editor Modal
            'editor.title': 'محرر صفحات الوثيقة',
            'editor.loading': 'جاري معالجة الصفحات...',
            'editor.select_all': 'تحديد الكل',
            'editor.deselect': 'إلغاء التحديد',
            'editor.delete_selected': 'حذف الصفحات المحددة',
            'editor.rotate_selected': 'تدوير 90°',
            'editor.rotate_tooltip': 'تدوير الصفحات المحددة 90 درجة باتجاه عقارب الساعة',
            'editor.copy_selected': 'نسخ الصفحات...',
            'editor.extract_selected': 'فصل ونقل...',
            'editor.zoom_in': 'تكبير الصفحات',
            'editor.zoom_out': 'تصغير الصفحات',
            'editor.zoom_reset': 'استعادة الحجم الافتراضي',
            'editor.close': 'إغلاق المحرر',
            'editor.move_earlier': 'تقديم الصفحة',
            'editor.move_later': 'تأخير الصفحة',
            'editor.delete_page': 'حذف الصفحة',
            'editor.page_label': 'صفحة',
            'editor.extract_title': 'فصل ونقل الصفحات',
            'editor.extract_desc': 'فصل أو نسخ الصفحات إلى وثيقة جديدة',
            'editor.op_mode': 'نوع العملية',
            'editor.op_move': '🚚 نقل وفصل',
            'editor.op_move_sub': 'يحذف الصفحة من الأصل',
            'editor.op_copy': '📋 نسخ فقط',
            'editor.op_copy_sub': 'يبقي الأصل دون تغيير',
            'editor.target_category': 'المجلد الجديد',
            'editor.new_folder_placeholder': 'أدخل اسم المجلد الجديد...',
            'editor.target_tenant': 'المستأجر',
            'editor.doc_title': 'عنوان الوثيقة',
            'editor.doc_title_placeholder': 'مثال: محضر تسليم مفتاح',
            'editor.doc_date': 'التاريخ',
            'editor.notes': 'ملاحظات (اختياري)',
            'editor.notes_placeholder': 'ملاحظات (اختياري)...',
            'editor.confirm_move': 'تأكيد النقل والفصل',
            'editor.confirm_copy': 'تأكيد النسخ',
            'editor.general_house': 'كامل المنزل (عام)',

            // Ingest Station
            'ingest.title': 'رفع وثيقة جديدة',
            'ingest.subtitle': 'إضافة وثائق للأرشيف بإيداع فردي فوري أو دفعات متعددة',
            'ingest.tab_single': '📄 وثيقة فردية',
            'ingest.tab_single_sub': 'ملف واحد ← منزل واحد',
            'ingest.tab_broadcast': '📢 إشعار عام',
            'ingest.tab_broadcast_sub': 'ملف واحد ← عدة منازل',
            'ingest.tab_batch': '📁 دفعة للمنزل',
            'ingest.tab_batch_sub': 'عدة ملفات ← منزل واحد',
            'ingest.drop_single': 'انقر لاختيار ملف PDF أو اسحب وأفلت هنا',
            'ingest.drop_single_hint': 'يقبل ملفات PDF حتى حجم 50 ميجابايت',
            'ingest.change_file': 'تغيير',
            'ingest.preview_title': 'معاينة الوثيقة',
            'ingest.target_area': 'الحي المستهدف',
            'ingest.target_house': 'المنزل المستهدف',
            'ingest.select_area': 'اختر الحي...',
            'ingest.select_house': 'اختر المنزل...',
            'ingest.assigned_tenant': 'المستأجر المحدد',
            'ingest.add_new_tenant': '+ إضافة مستأجر جديد',
            'ingest.auto_detect_tenant': '(تحديد تلقائي أو اختر مستأجر)',
            'ingest.new_tenant_placeholder': 'أدخل اسم المستأجر الجديد...',
            'ingest.tenant_type_title': 'نوع المستأجر',
            'ingest.tenant_type_resident': '🏠 ساكن',
            'ingest.tenant_type_applicant': '📋 متقدم',
            'ingest.new_tenant_hint': 'سيتم تسجيله تلقائياً كساكن أو متقدم في هذا المنزل.',
            'ingest.doc_category': 'تصنيف الوثيقة',
            'ingest.doc_title': 'عنوان الوثيقة',
            'ingest.doc_title_placeholder': 'مثال: عقد إيجار موثق',
            'ingest.doc_date': 'تاريخ الوثيقة الرئيسي',
            'ingest.notes': 'ملاحظات',
            'ingest.notes_placeholder': 'ملاحظات اختيارية...',
            'ingest.drop_broadcast': 'انقر لاختيار ملف PDF أو اسحب وأفلت هنا',
            'ingest.drop_broadcast_hint': 'إشعار واحد بصيغة PDF للبث إلى عدة منازل',
            'ingest.broadcast_scope': 'نطاق البث والمنازل المستهدفة',
            'ingest.all_houses_in_area': 'كافة منازل الحي',
            'ingest.selected_houses_only': 'منازل محددة فقط',
            'ingest.drop_batch': 'اسحب وأفلت عدة ملفات PDF هنا أو انقر للاختيار',
            'ingest.drop_batch_hint': 'رفع ما يصل إلى 100 وثيقة دفعة واحدة لمنزل محدد',
            'ingest.queue_title': 'قائمة الانتظار والمعالجة',
            'ingest.queue_file': 'الملف',
            'ingest.queue_category': 'التصنيف',
            'ingest.queue_title_col': 'العنوان',
            'ingest.queue_date': 'التاريخ',
            'ingest.queue_tenant': 'المستأجر',
            'ingest.queue_status': 'الحالة',
            'ingest.clear_queue': 'تفريغ القائمة',
            'ingest.upload_btn': 'رفع الوثيقة',
            'ingest.broadcast_btn': 'بث الإشعار للمنازل',
            'ingest.process_batch_btn': 'معالجة ورفع الدفعة',
            'ingest.overlay_prompt': 'أفلت الوثيقة على مجلد للتصنيف المباشر، أو في أي مكان للرفع',

            // Toasts & System Messages
            'toast.delete_house_restricted': 'عذراً: ليس لديك صلاحية حذف المنازل (قراءة ورفع فقط).',
            'toast.delete_doc_restricted': 'عذراً: ليس لديك صلاحية حذف الوثائق (قراءة ورفع فقط).',
            'toast.delete_page_restricted': 'عذراً: ليس لديك صلاحية حذف صفحات الوثائق (قراءة ورفع فقط).',
            'toast.delete_folder_restricted': 'عذراً: ليس لديك صلاحية حذف المجلدات (قراءة ورفع فقط).',
            'toast.merge_min_docs': 'يرجى تحديد وثيقتين على الأقل للدمج.',
            'toast.merge_cancelled_few': 'تم إلغاء الدمج لقلة المستندات المحددة.',
            'toast.rotate_success': 'تم تدوير وحفظ الصفحات بنجاح.',
            'toast.rotate_failed': 'فشل تدوير الصفحات.',
            'toast.delete_pages_success': 'تم حذف الصفحات المحددة بنجاح.',
            'toast.separate_success': 'تم فصل الصفحات وإنشاء الوثيقة الجديدة بنجاح.',
            'toast.copy_pages_success': 'تم نسخ الصفحات وإنشاء الوثيقة الجديدة بنجاح.',
            'toast.pdf_only': 'يُقبل فقط ملفات PDF للإيداع والرفع.',
            'toast.upload_success': 'تم رفع الوثيقة بنجاح.',
            'toast.tenancy_extended': 'تم تمديد تاريخ المستأجر ورفع الوثيقة بنجاح.',
            'toast.switch_theme_light': 'تفعيل الوضع الفاتح (Shift+D)',
            'toast.switch_theme_dark': 'تفعيل الوضع الداكن (Shift+D)',
            'toast.expand_sidebar': 'توسيع الشريط الجانبي (Ctrl+B)',
            'toast.collapse_sidebar': 'طي الشريط الجانبي (Ctrl+B)',
            'toast.viewer_tab_mode': 'وضع التابلت — انقر للتبديل إلى وضع الكمبيوتر',
            'toast.viewer_pc_mode': 'وضع الكمبيوتر — انقر للتبديل إلى وضع التابلت',
            'toast.viewer_fullscreen': 'شاشة كاملة',
            'toast.viewer_exit_fullscreen': 'تصغير الشاشة',
            'toast.viewer_peek_scan': 'إظهار / إخفاء الأصل',
            'toast.delete_house_success': 'تم حذف المنزل بنجاح',
            'toast.viewer_translate_active': 'الترجمة مفعلة — انقر لإظهار المسح الأصلي',
            'toast.viewer_translate_btn': 'ترجمة المستند للإنجليزية'
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

            // Navigation & Tabs
            'tabs.tenants': 'Tenants',
            'tabs.folders': 'Folders',
            'tabs.house_timeline': 'House Timeline',
            'tabs.tenant_timeline': 'Tenant Timeline',
            'tabs.back_to_tenants_title': 'Back to Tenant Register',
            'tabs.back_to_houses': '{area} Houses',

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
            'profile.tenants': 'Tenants',
            'profile.applicants': 'Applicants',
            'profile.archive_data': 'Digital Archive Profile',
            'profile.back_to_register': 'House Register',
            'profile.present_status': 'Current Resident',
            'profile.vacated_status': 'Vacated',
            'profile.applicant_status': 'Pending Applicant',
            'profile.current_resident': 'Current',
            'profile.vacated_resident': 'Vacated',
            'profile.applicant_badge': '📋 Applicant (Pending)',
            'profile.no_tenants': 'No tenants currently registered for this house.',
            'profile.no_applicants': 'No applicants registered for this house.',
            'profile.stats_tenants': 'Tenants',
            'profile.stats_applicants': 'Applicants',
            'profile.stats_docs': 'Documents',
            'profile.compliance_title': 'Tenant File Compliance Audit',
            'profile.compliance_vacant_desc': 'House is currently vacant — no active resident to audit.',
            'profile.compliance_complete': 'Complete 5/5 ✓',
            'profile.compliance_incomplete': 'Incomplete ⚠️',
            'profile.compliance_show': 'Show',
            'profile.compliance_hide': 'Hide',
            'profile.compliance_available': 'Available',
            'profile.compliance_upload': 'Upload',
            'profile.all_records': 'All Records',
            'profile.current_tenant_suffix': '(Current Tenant)',
            'profile.applicant_label_suffix': '(Applicant - Did not reside)',
            'profile.first_doc': 'First document: ',
            'profile.awaiting_upload': 'Awaiting first upload',
            'profile.lease_started': 'Lease started',
            'profile.lease_ongoing': '(Current)',
            'profile.years_count': 'years',
            'profile.year_single': '1 year',
            'profile.years_two': '2 years',
            'profile.under_year': 'Less than a year',
            'profile.auto_date': 'Auto (on first upload)',
            'profile.start_date': 'Start Date',
            'profile.end_date': 'Vacated Date',
            'profile.duration': 'Duration',
            'profile.doc_count': 'documents',
            'profile.open_folder': 'Open Folder',
            'profile.settings': 'House Settings',
            'profile.export_archive': 'Export Archive',
            'profile.loading_register': 'Loading house register and archive...',
            'profile.error_loading_register': 'Error loading tenancy register',

            // Folders & Categories (All 13 Standard Categories)
            'folder.01': '01 - Basic Master Data',
            'folder.02': '02 - Personal & Identity Data',
            'folder.03': '03 - Allotment Order',
            'folder.04': '04 - Key Handover Record',
            'folder.05': '05 - Contracts & Leases',
            'folder.06': '06 - Electricity & Water',
            'folder.07': '07 - Rent Deduction',
            'folder.08': '08 - Allowance Deduction Stop',
            'folder.09': '09 - Notices & Alerts',
            'folder.10': '10 - Maintenance & Repairs',
            'folder.11': '11 - Photos & Inspections',
            'folder.12': '12 - Modifications & Alterations',
            'folder.13': '13 - Miscellaneous Letters',
            'folder.dropzone_hint': 'Drag and drop files here',
            'folder.dropzone_sub': 'or click to browse from device',
            'folder.delete_restricted': 'Folder deletion is restricted for Contributor accounts.',
            'folder.doc_delete_restricted': 'Deletion is restricted for Contributor accounts.',
            'folder.select_two_to_merge': 'Please select at least 2 documents to merge',
            'folder.doc_copied': 'Document copied successfully',
            'folder.docs_copied': 'Selected documents copied successfully',

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
            'doc.loading': 'Loading document...',
            'doc.retry': 'Retry',
            'doc.open_direct': 'Open Directly',
            'doc.translate': 'Translate document to English (Offline)',

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
            'auth.login_cta': 'Sign In',

            // House Settings & Tenants Modal
            'house_settings.title': 'House Settings',
            'house_settings.subtitle': 'Configure tenant residency timelines and house configuration',
            'house_settings.tenants': 'Tenants',
            'house_settings.residency_timelines': 'Residency timelines for automatic document matching',
            'house_settings.add_tenant': 'Add Tenant',
            'house_settings.tenant_name': 'Tenant Name',
            'house_settings.tenant_type': 'Type',
            'house_settings.start_date': 'Start Date',
            'house_settings.end_date': 'End Date',
            'house_settings.present': 'Present',
            'house_settings.delete': 'Delete',
            'house_settings.start_date_tooltip': 'Start date is always selected as the first document and is auto if there is no document.',
            'house_settings.end_date_tooltip': 'End date is always selected as the last document. If currently residing, check Present.',
            'house_settings.danger_zone': 'Danger Zone',
            'house_settings.delete_house': 'Delete House',
            'house_settings.delete_house_desc': 'Permanently delete this house along with all tenants, documents, and files from disk. This action cannot be undone.',
            'house_settings.delete_house_btn': 'Delete House',
            'house_settings.auto_first_upload': 'Auto (on first upload)',
            'house_settings.auto_on_upload': 'Auto (on upload)',
            'house_settings.error_loading_tenants': 'Error loading tenants.',
            'house_settings.app_order_date': 'Application / Order Date',
            'house_settings.did_not_reside': 'N/A (Did not reside)',
            'house_settings.tenant_type_resident': '🏠 Resident',
            'house_settings.tenant_type_applicant': '📋 Applicant',

            // Delete House Modal
            'delete_house.title': 'Delete House',
            'delete_house.irreversible': 'This action cannot be undone.',
            'delete_house.confirm_msg': 'Are you sure you want to permanently delete this house? All associated tenants, documents, and files will be removed from disk.',
            'delete_house.warning': 'Both database entries and physical files in the vault and batch folders will be permanently deleted.',
            'delete_house.phrase_instruction': 'To confirm deletion, type the phrase in the field below:',
            'delete_house.confirm_placeholder': 'Type confirmation phrase...',
            'delete_house.btn_confirm': '🗑️ Delete Permanently',

            // Add House Modal
            'add_house.title': 'Add New House',
            'add_house.subtitle': 'Register house and scaffold storage directories.',
            'add_house.area': 'Area',
            'add_house.area_select': 'Select Area...',
            'add_house.house_id': 'House Number or Name',
            'add_house.house_id_placeholder': 'e.g. 515 or Villa 12',
            'add_house.initial_tenant': 'Initial Tenant Name (Optional)',
            'add_house.initial_tenant_placeholder': 'e.g. Abdullah Khalid Al-Shammari',
            'add_house.start_date': 'Start Date (Optional)',
            'add_house.submit_btn': 'Create House',

            // Document Actions Modal
            'doc_action.title': 'Manage Document',
            'doc_action.subtitle': 'Rename, reorganize folders, or assign to tenant.',
            'doc_action.manually_assigned': 'Manually Assigned:',
            'doc_action.protected_reallocation': 'Protected from automatic reallocation.',
            'doc_action.reset_auto': 'Reset to Auto',
            'doc_action.doc_title': 'Document Title',
            'doc_action.doc_title_placeholder': 'Document title...',
            'doc_action.doc_date': 'Document Date',
            'doc_action.category_folder': 'Folder (Category)',
            'doc_action.move': 'Move',
            'doc_action.copy': 'Copy (Duplicate)',
            'doc_action.new_folder_placeholder': 'Enter new folder name (e.g. Bank Statements)...',
            'doc_action.new_folder_hint': 'Will be automatically assigned the next sequential number (e.g. 14 - ...).',
            'doc_action.assigned_tenant': 'Assigned Tenant (Within House)',
            'doc_action.general_house': 'General House Document',
            'doc_action.delete_doc': 'Delete Document',
            'doc_action.edit_pages': '✂️ Edit Pages',
            'doc_action.apply_changes': '💾 Apply Changes',
            'doc_action.duplicate_doc': '📄 Duplicate Document',

            // Change Document Date Modal
            'change_date.title': 'Change Document Date',
            'change_date.subtitle': 'Update document date',
            'change_date.label': 'Document Date',
            'change_date.hint': 'Updates document timeline ordering and residency allocation.',
            'change_date.save_btn': 'Save Date',

            // Batch Operations
            'batch.selected_count': 'selected',
            'batch.action_move': 'Move Selected',
            'batch.action_copy': 'Copy Selected',
            'batch.action_merge': '🔗 Merge Selected',
            'batch.action_delete': 'Delete Selected',
            'batch.action_deselect': 'Deselect',
            'batch.move_title': 'Move Selected Documents',
            'batch.move_subtitle': 'Move documents to a target category folder.',
            'batch.copy_title': 'Copy Selected Documents',
            'batch.copy_subtitle': 'Add documents to another category folder.',
            'batch.target_tenant': 'Target Tenant',
            'batch.target_folder': 'Target Category Folder',
            'batch.move_btn': 'Move Documents',
            'batch.copy_btn': 'Copy Documents',
            'batch.standard_folders': 'Standard Folders',
            'batch.custom_folders': 'Custom Folders',
            'batch.create_new_folder': '+ Create New Folder...',
            'batch.move_single_subtitle': 'Move "{name}" to a target category folder.',
            'batch.move_multiple_subtitle': 'Move {count} documents to a target category folder.',
            'batch.copy_single_subtitle': 'Copy "{name}" to a target category folder.',
            'batch.copy_multiple_subtitle': 'Copy {count} documents to a target category folder.',
            'batch.move_success_single': 'Successfully moved document to "{category}"',
            'batch.move_success_multiple': 'Successfully moved {count} documents to "{category}"',
            'batch.copy_success_single': 'Successfully copied document to "{category}"',
            'batch.copy_success_multiple': 'Successfully copied {count} documents to "{category}"',
            'batch.select_target_folder_error': 'Please select or specify a target category folder.',
            'batch.delete_title': 'Delete Selected Documents',
            'batch.delete_subtitle': 'This action cannot be undone.',
            'batch.delete_message': 'Are you sure you want to permanently delete the selected documents? All associated files and database records will be removed.',
            'batch.delete_warning': 'Both database entries and PDF vault files will be permanently erased.',
            'batch.delete_btn': '🗑️ Delete Permanently',

            // Merge Documents Modal
            'merge.title': 'Merge Documents',
            'merge.subtitle': 'Merge PDF files in desired sequence with full preview',
            'merge.zoom_out': 'Zoom out cards',
            'merge.zoom_in': 'Zoom in cards',
            'merge.zoom_reset': 'Reset card size',
            'merge.reorder_step_title': 'Reorder Documents',
            'merge.reorder_step_desc': 'Use arrows on cards to reorder',
            'merge.continue_to_save': 'Continue to Save',
            'merge.preview_title': 'Document Preview',
            'merge.swap': 'Swap Order',
            'merge.doc_name': 'Merged Document Name',
            'merge.doc_name_placeholder': 'Document name...',
            'merge.target_folder': 'Target Category Folder',
            'merge.new_folder_placeholder': 'New folder name...',
            'merge.target_tenant': 'Target Tenant',
            'merge.delete_original': 'Delete original documents after merging',
            'merge.back': '← Back',
            'merge.confirm_btn': '⚡ Merge Documents',
            'merge.move_earlier': 'Move earlier',
            'merge.move_later': 'Move later',
            'merge.remove_doc': 'Remove document',
            'merge.start_doc': '#1 (Start)',
            'merge.end_doc': '#2 (End)',

            // Export Archive Modal
            'export.title': 'Export Archive',
            'export.format': 'Export Format',
            'export.format_zip_desc': 'Folders',
            'export.format_pdf_desc': 'Timeline',
            'export.tenant': 'Tenant',
            'export.all_records': 'All Records',
            'export.download_btn': '⬇️ Download',

            // Vacated Tenant Modal
            'vacated.title': 'Tenancy Date Conflict Warning',
            'vacated.subtitle': 'Tenancy Date Conflict Warning',
            'vacated.options_title': 'Resolution Options:',
            'vacated.option_extend': 'Extend Date: Update resident vacated date to document date.',
            'vacated.option_proceed': 'Proceed Without Extending: Save document keeping resident marked as vacated.',
            'vacated.option_cancel': 'Cancel: Change document date or select a different tenant.',
            'vacated.btn_extend': 'Extend Tenancy Date & Upload',
            'vacated.btn_proceed': 'Upload Without Extending',
            'vacated.btn_cancel': 'Cancel',
            'vacated.msg_prefix': 'This tenant vacated the house on',
            'vacated.msg_mid': 'and you are adding a document dated',
            'vacated.msg_suffix': 'Would you like to extend their tenancy period?',

            // Document Page Editor Modal
            'editor.title': 'Document Page Editor',
            'editor.loading': 'Rendering pages...',
            'editor.select_all': 'Select All',
            'editor.deselect': 'Deselect',
            'editor.delete_selected': 'Delete Selected',
            'editor.rotate_selected': 'Rotate 90°',
            'editor.rotate_tooltip': 'Rotate selected pages 90° clockwise',
            'editor.copy_selected': 'Copy Pages...',
            'editor.extract_selected': 'Separate & Move...',
            'editor.zoom_in': 'Zoom in pages',
            'editor.zoom_out': 'Zoom out pages',
            'editor.zoom_reset': 'Reset page size',
            'editor.close': 'Close editor',
            'editor.move_earlier': 'Move earlier',
            'editor.move_later': 'Move later',
            'editor.delete_page': 'Delete page',
            'editor.page_label': 'Page',
            'editor.extract_title': 'Separate & Move Pages',
            'editor.extract_desc': 'Extract or copy selected pages into a new document',
            'editor.op_mode': 'Operation Mode',
            'editor.op_move': '🚚 Move (Separate)',
            'editor.op_move_sub': 'Deletes pages from original document',
            'editor.op_copy': '📋 Copy Only',
            'editor.op_copy_sub': 'Keeps original document intact',
            'editor.target_category': 'Target Category',
            'editor.new_folder_placeholder': 'Enter custom category name...',
            'editor.target_tenant': 'Tenant',
            'editor.doc_title': 'Document Title',
            'editor.doc_title_placeholder': 'e.g. Certified Lease Agreement',
            'editor.doc_date': 'Date',
            'editor.notes': 'Notes (Optional)',
            'editor.notes_placeholder': 'Optional notes...',
            'editor.confirm_move': 'Confirm & Move',
            'editor.confirm_copy': 'Confirm & Copy',
            'editor.general_house': 'General House Document',

            // Ingest Station
            'ingest.title': 'Upload Document',
            'ingest.subtitle': 'Add documents to archive with instant single or batch multi-file filing',
            'ingest.tab_single': '📄 Single Document',
            'ingest.tab_single_sub': '1 file → 1 house',
            'ingest.tab_broadcast': '📢 Broadcast Notice',
            'ingest.tab_broadcast_sub': '1 file → Multiple houses',
            'ingest.tab_batch': '📁 House Batch',
            'ingest.tab_batch_sub': 'Multiple files → 1 house',
            'ingest.drop_single': 'Click to choose PDF or drag & drop',
            'ingest.drop_single_hint': 'Accepts PDF documents up to 50MB',
            'ingest.change_file': 'Change',
            'ingest.preview_title': 'Document Preview',
            'ingest.target_area': 'Target Area',
            'ingest.target_house': 'Target House',
            'ingest.select_area': 'Select Area...',
            'ingest.select_house': 'Select House...',
            'ingest.assigned_tenant': 'Assigned Tenant',
            'ingest.add_new_tenant': '+ Add New Tenant',
            'ingest.auto_detect_tenant': '(Auto-detect or Select Tenant)',
            'ingest.new_tenant_placeholder': 'Enter new tenant name...',
            'ingest.tenant_type_title': 'Tenant Type',
            'ingest.tenant_type_resident': '🏠 Resident',
            'ingest.tenant_type_applicant': '📋 Applicant',
            'ingest.new_tenant_hint': 'Will be automatically registered as a resident or applicant in this house.',
            'ingest.doc_category': 'Document Category',
            'ingest.doc_title': 'Document Title',
            'ingest.doc_title_placeholder': 'e.g. Certified Lease Agreement',
            'ingest.doc_date': 'Primary Date',
            'ingest.notes': 'Notes',
            'ingest.notes_placeholder': 'Optional notes or context...',
            'ingest.drop_broadcast': 'Click to choose PDF or drag & drop',
            'ingest.drop_broadcast_hint': '1 Notice PDF to broadcast to multiple houses',
            'ingest.broadcast_scope': 'Broadcast Target Scope',
            'ingest.all_houses_in_area': 'All Houses in Area',
            'ingest.selected_houses_only': 'Selected Houses Only',
            'ingest.drop_batch': 'Drop multiple PDF files here or click to browse',
            'ingest.drop_batch_hint': 'Upload up to 100 documents in one batch for a house',
            'ingest.queue_title': 'Batch Ingestion Queue',
            'ingest.queue_file': 'File',
            'ingest.queue_category': 'Category',
            'ingest.queue_title_col': 'Title',
            'ingest.queue_date': 'Date',
            'ingest.queue_tenant': 'Tenant',
            'ingest.queue_status': 'Status',
            'ingest.clear_queue': 'Clear Queue',
            'ingest.upload_btn': 'Upload Document',
            'ingest.broadcast_btn': 'Broadcast Notice',
            'ingest.process_batch_btn': 'Process & Upload Batch',
            'ingest.overlay_prompt': 'Drop on a folder to file, or drop anywhere to upload',

            // Toasts & System Messages
            'toast.delete_house_restricted': 'House deletion is restricted for Contributor accounts.',
            'toast.delete_doc_restricted': 'Document deletion is restricted for Contributor accounts.',
            'toast.delete_page_restricted': 'Page deletion is restricted for Contributor accounts.',
            'toast.delete_folder_restricted': 'Folder deletion is restricted for Contributor accounts.',
            'toast.merge_min_docs': 'Please select at least 2 documents to merge.',
            'toast.merge_cancelled_few': 'Merge cancelled: fewer than 2 documents.',
            'toast.rotate_success': 'Pages rotated and saved successfully.',
            'toast.rotate_failed': 'Failed to rotate pages.',
            'toast.delete_pages_success': 'Selected pages deleted successfully.',
            'toast.separate_success': 'Pages separated and new document created successfully.',
            'toast.copy_pages_success': 'Pages copied and new document created successfully.',
            'toast.pdf_only': 'Only PDF files are supported for ingestion.',
            'toast.upload_success': 'Document uploaded successfully.',
            'toast.tenancy_extended': 'Tenancy extended and document uploaded successfully.',
            'toast.switch_theme_light': 'Switch to Light Mode (Shift+D)',
            'toast.switch_theme_dark': 'Switch to Dark Mode (Shift+D)',
            'toast.expand_sidebar': 'Expand sidebar (Ctrl+B)',
            'toast.collapse_sidebar': 'Collapse sidebar (Ctrl+B)',
            'toast.viewer_tab_mode': 'Using Tab viewer — Click to switch to Computer viewer',
            'toast.viewer_pc_mode': 'Using Computer viewer — Click to switch to Tab viewer',
            'toast.viewer_fullscreen': 'Toggle fullscreen',
            'toast.viewer_exit_fullscreen': 'Exit fullscreen',
            'toast.viewer_peek_scan': 'Toggle scan visibility',
            'toast.delete_house_success': 'House was deleted successfully',
            'toast.viewer_translate_active': 'Translation active (English overlay enabled) — Click to view original scan',
            'toast.viewer_translate_btn': 'Translate document to English (Offline)'
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

    const CATEGORY_MAP = [
        { id: '01', ar: '01 - بيانات أساسية', en: '01 - Basic Master Data' },
        { id: '02', ar: '02 - بيانات شخصية', en: '02 - Personal & Identity Data' },
        { id: '03', ar: '03 - أمر تخصيص', en: '03 - Allotment Order' },
        { id: '04', ar: '04 - محضر تسليم مفتاح', en: '04 - Key Handover Record' },
        { id: '05', ar: '05 - عقود', en: '05 - Contracts & Leases' },
        { id: '06', ar: '06 - كهرباء وماء', en: '06 - Electricity & Water' },
        { id: '07', ar: '07 - استقطاع إيجار', en: '07 - Rent Deduction' },
        { id: '08', ar: '08 - وقف استقطاع بدل', en: '08 - Allowance Deduction Stop' },
        { id: '09', ar: '09 - إشعارات', en: '09 - Notices & Alerts' },
        { id: '10', ar: '10 - صيانة', en: '10 - Maintenance & Repairs' },
        { id: '11', ar: '11 - صور ومعاينات', en: '11 - Photos & Inspections' },
        { id: '12', ar: '12 - تعديلات', en: '12 - Modifications & Alterations' },
        { id: '13', ar: '13 - رسائل متنوعة', en: '13 - Miscellaneous Letters' }
    ];

    function localizeCategory(categoryName) {
        if (!categoryName) return '';
        const isEn = currentLang === 'en';
        const trimmed = String(categoryName).trim();

        for (const cat of CATEGORY_MAP) {
            if (trimmed === cat.ar || trimmed === cat.en || trimmed.startsWith(cat.id + ' - ') || trimmed.startsWith(cat.id + '-')) {
                return isEn ? cat.en : cat.ar;
            }
            const arBare = cat.ar.replace(/^\d+\s*-\s*/, '');
            const enBare = cat.en.replace(/^\d+\s*-\s*/, '');
            if (trimmed === arBare || trimmed === enBare) {
                return isEn ? enBare : arBare;
            }
        }
        return trimmed;
    }

    function formatTenureDuration(startYear, endYear, isApplicant, isActive) {
        const isEn = currentLang === 'en';
        if (isApplicant) {
            return isEn ? 'Applicant (Pending)' : 'متقدم (لم يسكن)';
        }
        if (isActive) {
            if (!startYear) return isEn ? 'Current Resident' : 'المستأجر الحالي';
            return isEn ? `Lease started ${startYear} (Current)` : `بدء الإيجار ${startYear} (مستمر)`;
        }
        if (!startYear || !endYear) {
            return isEn ? 'Vacated' : 'سابق';
        }
        const s = parseInt(startYear, 10);
        const e = parseInt(endYear, 10);
        const years = (!isNaN(s) && !isNaN(e) && e >= s) ? (e - s) : 0;

        if (isEn) {
            let yrStr = `${years} years`;
            if (years === 0) yrStr = 'Less than 1 year';
            else if (years === 1) yrStr = '1 year';
            else if (years === 2) yrStr = '2 years';
            return `From ${startYear} to ${endYear} (${yrStr})`;
        } else {
            let yrStr = `${years} سنوات`;
            if (years === 0) yrStr = 'أقل من سنة';
            else if (years === 1) yrStr = 'سنة واحدة';
            else if (years === 2) yrStr = 'سنتين';
            return `من ${startYear} إلى ${endYear} (${yrStr})`;
        }
    }

    const i18n = {
        init,
        getLanguage: () => currentLang,
        getCurrentLanguage: () => currentLang,
        setLanguage,
        toggleLanguage,
        t,
        apply: applyTranslations,
        localizeCategory,
        formatTenureDuration,
        CATEGORY_MAP,
        translations,
        SUPPORTED_LANGS,
        DEFAULT_LANG
    };

    window.i18n = i18n;
    init();

})(typeof window !== 'undefined' ? window : globalThis);
