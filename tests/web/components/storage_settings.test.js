import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';

const rootDir = path.resolve(__dirname, '../../..');
const indexPath = path.join(rootDir, 'src/HousingApplication.Web/wwwroot/index.html');
const i18nPath = path.join(rootDir, 'src/HousingApplication.Web/wwwroot/js/i18n.js');
const storageJsPath = path.join(rootDir, 'src/HousingApplication.Web/wwwroot/js/storage-settings.js');
const distStorageJsPath = path.join(rootDir, 'dist/win-x64/wwwroot/js/storage-settings.js');

const indexHtmlContent = fs.readFileSync(indexPath, 'utf-8');
const i18nJsContent = fs.readFileSync(i18nPath, 'utf-8');
const storageJsContent = fs.readFileSync(storageJsPath, 'utf-8');

describe('Storage & Database Path Settings Modal (QCK-63)', () => {
    let store = {};
    let fetchMock;
    let currentRole = 'Admin';

    const localStorageMock = {
        getItem: vi.fn(key => (key in store ? store[key] : null)),
        setItem: vi.fn((key, val) => { store[key] = String(val); }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };

    beforeEach(() => {
        store = {};
        currentRole = 'Admin';
        vi.stubGlobal('localStorage', localStorageMock);

        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
        document.body.innerHTML = indexHtmlContent;

        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        window.showToast = vi.fn();
        window.loadTree = vi.fn().mockResolvedValue(undefined);
        window.loadDbInspector = vi.fn().mockResolvedValue(undefined);

        window.authManager = {
            isContributor: () => currentRole.toLowerCase() === 'contributor',
            isAdmin: () => currentRole.toLowerCase() === 'admin',
            toggleProfileDropdown: vi.fn()
        };

        const i18nFn = new Function('window', 'document', 'localStorage', i18nJsContent);
        i18nFn(window, document, window.localStorage);
        window.i18n.setLanguage('en');

        const storageFn = new Function('window', 'document', storageJsContent);
        storageFn(window, document);
        window._resetStorageSettingsForTests();
        window.initStorageSettings();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('keeps dist/win-x64/wwwroot/js/storage-settings.js byte-identical to src', () => {
        expect(fs.existsSync(distStorageJsPath)).toBe(true);
        const distContent = fs.readFileSync(distStorageJsPath, 'utf-8');
        expect(distContent).toBe(storageJsContent);
    });

    it('shows storage path triggers for Admin and hides them for Contributor accounts', () => {
        const menuBtn = document.getElementById('btn-open-storage-settings');
        const dbBtn = document.getElementById('db-change-paths-btn');

        expect(menuBtn.classList.contains('hidden')).toBe(false);
        expect(dbBtn.classList.contains('hidden')).toBe(false);

        currentRole = 'Contributor';
        window.dispatchEvent(new CustomEvent('auth:user-changed'));

        expect(menuBtn.classList.contains('hidden')).toBe(true);
        expect(dbBtn.classList.contains('hidden')).toBe(true);
    });

    it('localizes modal and trigger labels cleanly in both English and Arabic', () => {
        window.i18n.setLanguage('en');
        expect(document.querySelector('#btn-open-storage-settings [data-i18n="storage_settings.menu_btn"]').textContent)
            .toBe('Storage & Database Paths');
        expect(document.querySelector('#storage-settings-modal [data-i18n="storage_settings.modal_title"]').textContent)
            .toBe('Storage & Database Paths');

        window.i18n.setLanguage('ar');
        expect(document.querySelector('#btn-open-storage-settings [data-i18n="storage_settings.menu_btn"]').textContent)
            .toBe('مسارات الأرشيف وقاعدة البيانات');
        expect(document.querySelector('#storage-settings-modal [data-i18n="storage_settings.modal_title"]').textContent)
            .toBe('إعدادات مسارات الأرشيف وقاعدة البيانات');
    });

    it('loads current paths and database statistics when opened', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                areas_root_path: 'D:\\areas_v11',
                areas_root_exists: true,
                area_directory_count: 4,
                organizer_db_path: 'D:\\areas_v11\\organizer.db',
                organizer_db_exists: true,
                organizer_db_size_bytes: 2097152,
                tables: { houses: 42, documents: 310 }
            })
        });

        await window.openStorageSettingsModal();

        const modal = document.getElementById('storage-settings-modal');
        expect(modal.classList.contains('hidden')).toBe(false);
        expect(document.getElementById('storage-areas-path-input').value).toBe('D:\\areas_v11');
        expect(document.getElementById('storage-db-path-input').value).toBe('D:\\areas_v11\\organizer.db');
        expect(document.getElementById('storage-active-summary').textContent).toContain('42');
        expect(document.getElementById('storage-active-summary').textContent).toContain('2.00 MB');
    });

    it('computes organizer.db path inside Windows and POSIX areas folders accurately', () => {
        expect(window.joinOrganizerDbPath('"E:\\Archives\\areas_2027\\"')).toBe('E:\\Archives\\areas_2027\\organizer.db');
        expect(window.joinOrganizerDbPath('/mnt/nas/areas_v11/')).toBe('/mnt/nas/areas_v11/organizer.db');

        const areasInput = document.getElementById('storage-areas-path-input');
        const dbInput = document.getElementById('storage-db-path-input');
        areasInput.value = 'E:\\HousingArchive\\areas_v11';

        document.getElementById('btn-use-areas-db-path').click();
        expect(dbInput.value).toBe('E:\\HousingArchive\\areas_v11\\organizer.db');
    });

    it('browses server directories and updates areas + default database path when selecting a folder', async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    areas_root_path: 'C:\\OldAreas',
                    areas_root_exists: true,
                    area_directory_count: 1,
                    organizer_db_path: 'C:\\OldAreas\\organizer.db',
                    organizer_db_exists: true,
                    organizer_db_size_bytes: 4096,
                    tables: { houses: 1, documents: 2 }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    current_path: 'D:\\',
                    parent_path: null,
                    roots: ['C:\\', 'D:\\'],
                    entries: [
                        { name: 'areas_v11', path: 'D:\\areas_v11', is_directory: true, size_bytes: null }
                    ]
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    current_path: 'D:\\areas_v11',
                    parent_path: 'D:\\',
                    roots: ['C:\\', 'D:\\'],
                    entries: [
                        { name: 'القادسية', path: 'D:\\areas_v11\\القادسية', is_directory: true, size_bytes: null },
                        { name: 'organizer.db', path: 'D:\\areas_v11\\organizer.db', is_directory: false, size_bytes: 1048576 }
                    ]
                })
            });

        await window.openStorageSettingsModal();
        document.getElementById('btn-browse-areas-path').click();
        await vi.waitFor(() => {
            expect(document.querySelector('#storage-browser-entries button')).not.toBeNull();
        });

        // Click into D:\areas_v11 subfolder
        document.querySelector('#storage-browser-entries button').click();
        await vi.waitFor(() => {
            expect(document.getElementById('storage-browser-current-path').textContent).toBe('D:\\areas_v11');
        });

        // Confirm current folder
        document.getElementById('btn-storage-browser-select-current').click();

        expect(document.getElementById('storage-areas-path-input').value).toBe('D:\\areas_v11');
        expect(document.getElementById('storage-db-path-input').value).toBe('D:\\areas_v11\\organizer.db');
        expect(document.getElementById('storage-browser-panel').classList.contains('hidden')).toBe(true);
    });

    it('runs dry-run path verification and displays diagnostic counts', async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    areas_root_path: 'D:\\areas_v11',
                    areas_root_exists: true,
                    area_directory_count: 3,
                    organizer_db_path: 'D:\\areas_v11\\organizer.db',
                    organizer_db_exists: true,
                    organizer_db_size_bytes: 512000,
                    tables: { houses: 10, documents: 55 }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    valid: true,
                    message: 'Paths verified successfully.',
                    areas_root_path: 'E:\\Backup\\areas_v11',
                    areas_root_exists: true,
                    area_directory_count: 5,
                    sample_areas: ['الروضة', 'النزهة'],
                    organizer_db_path: 'E:\\Backup\\areas_v11\\organizer.db',
                    organizer_db_exists: true,
                    organizer_db_valid_sqlite: true,
                    organizer_db_size_bytes: 1048576,
                    tables: { houses: 25, documents: 180 }
                })
            });

        await window.openStorageSettingsModal();
        document.getElementById('storage-areas-path-input').value = 'E:\\Backup\\areas_v11';
        document.getElementById('storage-db-path-input').value = 'E:\\Backup\\areas_v11\\organizer.db';

        document.getElementById('btn-validate-storage-paths').click();
        await vi.waitFor(() => {
            const banner = document.getElementById('storage-feedback-banner');
            expect(banner.classList.contains('hidden')).toBe(false);
            expect(banner.textContent).toContain('25 houses');
            expect(banner.textContent).toContain('180 docs');
        });
    });

    it('submits updated paths via PUT /api/settings/paths and hot-reloads the archive tree', async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    areas_root_path: 'D:\\areas_v11',
                    areas_root_exists: true,
                    organizer_db_path: 'D:\\areas_v11\\organizer.db',
                    organizer_db_exists: true,
                    organizer_db_size_bytes: 1024,
                    tables: { houses: 1, documents: 1 }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    areas_root_path: 'F:\\NewArchive\\areas_v11',
                    areas_root_exists: true,
                    area_directory_count: 2,
                    organizer_db_path: 'F:\\NewArchive\\areas_v11\\organizer.db',
                    organizer_db_exists: true,
                    organizer_db_size_bytes: 8192,
                    tables: { houses: 8, documents: 30 }
                })
            });

        await window.openStorageSettingsModal();
        document.getElementById('storage-areas-path-input').value = 'F:\\NewArchive\\areas_v11';
        document.getElementById('storage-db-path-input').value = 'F:\\NewArchive\\areas_v11\\organizer.db';
        document.getElementById('storage-create-missing-checkbox').checked = true;

        const form = document.getElementById('storage-settings-form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(window.loadTree).toHaveBeenCalledTimes(1);
            expect(window.showToast).toHaveBeenCalledWith(
                'Storage & database paths updated and applied live.',
                'success'
            );
            expect(document.getElementById('storage-settings-modal').classList.contains('hidden')).toBe(true);
        });

        const putCall = fetchMock.mock.calls.find(c => c[0] === '/api/settings/paths' && c[1]?.method === 'PUT');
        expect(putCall).toBeDefined();
        expect(JSON.parse(putCall[1].body)).toEqual({
            areas_root_path: 'F:\\NewArchive\\areas_v11',
            organizer_db_path: 'F:\\NewArchive\\areas_v11\\organizer.db',
            create_if_missing: true
        });
    });

    it('shows clear build-windows.bat guidance if running an older precompiled binary (HTTP 405)', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 405,
            json: async () => ({})
        });

        await window.openStorageSettingsModal();

        const banner = document.getElementById('storage-feedback-banner');
        expect(banner.classList.contains('hidden')).toBe(false);
        expect(banner.textContent).toContain('scripts\\build-windows.bat');
    });
});
