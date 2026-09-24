# Phase 122: House Profile, Tenancy Register & Category Folders English Localization - Context

## Objective
Introduce comprehensive English localization for the House Profile, Tenancy Register, and Category Folders so users experience a 100% native English environment when English mode is selected. In Arabic mode, the traditional Arabic terminology remains fully preserved. Intermixed bilingual strings are completely eliminated.

## Key Focus Areas

1. **House Tenancy Register (`house-profile.js`):**
   - Tenancy headers: `المستأجرون` (AR) vs `Tenants` (EN); `المتقدمون` (AR) vs `Applicants` (EN).
   - Status indicators: `حالي` (AR) vs `Current` (EN); `سابق` (AR) vs `Vacated` (EN); `📋 متقدم (لم يسكن)` (AR) vs `📋 Applicant (Pending)` (EN).
   - Tenure duration strings: `بدء الإيجار 2020 (مستمر)` (AR) vs `Lease started 2020 (Current)` (EN); duration counters (e.g. `من 2018 إلى 2022 (4 سنوات)` vs `From 2018 to 2022 (4 years)`).
   - Stats summary badge: `${residents.length} مستأجرين · ${applicants.length} طلبات تخصيص · ${totalDocs} وثيقة` vs `${residents.length} Tenants · ${applicants.length} Applicants · ${totalDocs} Documents`.
   - Empty state messages: `لا يوجد مستأجرون مسجلون لهذا المنزل حالياً.` vs `No tenants currently registered for this house.`.
   - Compliance audit banner:
     - Header: `فحص اكتمال ملف الساكن` vs `Tenant File Compliance Audit`.
     - Subtitle: `المنزل شاغر حالياً — لا يوجد ساكن حالي لإجراء فحص الاكتمال` vs `House is currently vacant — no active resident to audit.`.
     - Counter: `مكتمل 5/5 ✓` vs `Complete 5/5 ✓`; `${compliance.presentCount}/5 ناقص ⚠️` vs `${compliance.presentCount}/5 Incomplete ⚠️`.
     - Toggle: `عرض` / `إخفاء` vs `Show` / `Hide`.

2. **Category Folders (`categories-view.js`):**
   - 13 Standard category folder names translated dynamically according to active language:
     1. `01 - بيانات أساسية` ↔ `01 - Basic Master Data`
     2. `02 - بيانات شخصية` ↔ `02 - Personal & Identity Data`
     3. `03 - أمر تخصيص` ↔ `03 - Allotment Order`
     4. `04 - محضر تسليم مفتاح` ↔ `04 - Key Handover Record`
     5. `05 - عقود` ↔ `05 - Contracts & Leases`
     6. `06 - كهرباء وماء` ↔ `06 - Electricity & Water`
     7. `07 - استقطاع إيجار` ↔ `07 - Rent Deduction`
     8. `08 - وقف استقطاع بدل` ↔ `08 - Allowance Deduction Stop`
     9. `09 - إشعارات` ↔ `09 - Notices & Alerts`
     10. `10 - صيانة` ↔ `10 - Maintenance & Repairs`
     11. `11 - صور ومعاينات` ↔ `11 - Photos & Inspections`
     12. `12 - تعديلات` ↔ `12 - Modifications & Alterations`
     13. `13 - رسائل متنوعة` ↔ `13 - Miscellaneous Letters`
   - Category folder view titles, drag-and-drop dropzone hints (`اسحب وأفلت الملفات هنا` vs `Drag and drop files here`), and tenant selection dropdowns (`(المستأجر الحالي)` vs `(Current Resident)`).

3. **Elimination of Remaining Intermixed Strings:**
   - Toast notifications in `categories-view.js` (e.g. deletion restricted, merge documents alert) made single-language.
   - Dropzone placeholders stripped of ` • `.

4. **Testing & Parity:**
   - Component test `tests/web/components/house_profile_categories_i18n.test.js` validating both Arabic and English modes.
   - Parity sync to `dist/win-x64/wwwroot/`.
   - Full Vitest suite run with 0 regressions.
