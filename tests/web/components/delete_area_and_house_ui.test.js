import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const indexHtmlPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/index.html');
const cssPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/css/styles.css');
const i18nPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/i18n.js');
const apiPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/api.js');
const sidebarPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/sidebar.js');
const areaGridPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/area-grid.js');
const tenantMgrPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/tenant-manager.js');
const routerPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/router.js');

const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const i18nCode = fs.readFileSync(i18nPath, 'utf8');
const apiCode = fs.readFileSync(apiPath, 'utf8');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');
const areaGridCode = fs.readFileSync(areaGridPath, 'utf8');
const tenantMgrCode = fs.readFileSync(tenantMgrPath, 'utf8');
const routerCode = fs.readFileSync(routerPath, 'utf8');

describe('Delete Area & Discoverable Delete House UI (Quick Task 261101-6bf)', () => {
  let store = {};
  const localStorageMock = {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };

  let mockCanDelete = true;

  beforeEach(() => {
    store = {};
    mockCanDelete = true;
    vi.stubGlobal('localStorage', localStorageMock);
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    document.body.innerHTML = indexHtmlContent;

    global.fetch = vi.fn();
    window.authManager = {
      currentUser: { username: 'Emad', role: 'Admin', canDelete: true },
      hasDeletePermission: () => mockCanDelete
    };

    eval(apiCode);

    global.API_TREE = '/api/tree';
    global.API_HOUSES_BASE = '/api/houses';
    global.isStaticMode = false;
    global.currentArea = 'Safra C';
    global.currentHouse = null;
    global.currentTenant = null;
    global.currentTab = 'categories';
    global.currentViewMode = 'overview';
    global.isTreeLoading = false;
    global.globalTreeData = [
      {
        id: 'Safra C',
        name: 'Safra C',
        type: 'area',
        children: [
          { id: '500', name: '500', type: 'house', total_documents: 3, children: [] },
          { id: '501', name: '501', type: 'house', total_documents: 1, children: [] }
        ]
      },
      {
        id: 'Safra D',
        name: 'Safra D',
        type: 'area',
        children: []
      }
    ];
    window.globalTreeData = global.globalTreeData;
    window.isTreeLoading = false;
    window.isStaticMode = false;
    window.currentArea = 'Safra C';
    window.currentHouse = null;
    window.showToast = vi.fn();
    global.showToast = window.showToast;

    const i18nFn = new Function('window', 'document', 'localStorage', i18nCode);
    i18nFn(window, document, window.localStorage);
    window.i18n.setLanguage('en');

    eval(areaGridCode);
    eval(sidebarCode);
    eval(tenantMgrCode);
    eval(routerCode);

    window.renderSidebar();
    window.selectAreaGrid(window.globalTreeData[0]);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete window.authManager;
    vi.restoreAllMocks();
  });

  it('includes Delete Area modal, navbar Delete Area trigger, House header quick Delete trigger, and dark-mode CSS', () => {
    expect(document.getElementById('delete-area-modal')).not.toBeNull();
    expect(document.getElementById('btn-delete-area-header')).not.toBeNull();
    expect(document.getElementById('btn-delete-house-quick')).not.toBeNull();

    expect(cssContent).toContain('html.dark #delete-area-modal > div');
    expect(cssContent).toContain('html.dark #delete-area-modal > div > div:first-child');
    expect(cssContent).toContain('html.dark #delete-area-modal > div > div:last-child');
    expect(cssContent).toContain('html.dark #delete-area-cancel');
    expect(cssContent).toContain('html.dark #delete-area-modal-close');
    expect(cssContent).toContain('.area-delete-btn');
    expect(cssContent).toContain('.house-card-delete-btn');
  });

  it('provides clean single-language Arabic and English translations for delete_area.* keys', () => {
    window.i18n.setLanguage('en');
    expect(window.i18n.t('delete_area.title')).toBe('Delete Area');
    expect(window.i18n.t('delete_area.house_count_warning')).toContain('{count}');

    window.openDeleteAreaModal('Safra C');
    expect(document.getElementById('delete-area-msg').textContent).toContain('Safra C');
    expect(document.getElementById('delete-area-house-count-info').textContent).toContain('2');
    expect(document.getElementById('delete-area-phrase-hint').textContent).toBe('delete Safra C');
    window.closeDeleteAreaModal();

    window.i18n.setLanguage('ar');
    expect(window.i18n.t('delete_area.title')).toBe('حذف المنطقة');
    window.openDeleteAreaModal('Safra D');
    expect(document.getElementById('delete-area-msg').textContent).toContain('Safra D');
    expect(document.getElementById('delete-area-house-count-info').textContent).toContain('لا تحتوي على أي منازل');
    expect(document.getElementById('delete-area-phrase-hint').textContent).toBe('delete Safra D');
  });

  it('opens Delete Area modal from sidebar .area-delete-btn without changing active area selection', () => {
    const selectAreaSpy = vi.spyOn(window, 'selectAreaGrid');
    const safraDDeleteBtn = document.querySelector('.area-delete-btn[data-area-name="Safra D"]');
    expect(safraDDeleteBtn).not.toBeNull();

    safraDDeleteBtn.click();

    expect(selectAreaSpy).not.toHaveBeenCalled();
    const modal = document.getElementById('delete-area-modal');
    expect(modal.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('delete-area-target-name').textContent).toBe('Safra D');
    expect(document.getElementById('delete-area-phrase-hint').textContent).toBe('delete Safra D');
  });

  it('enforces typed phrase confirmation and deletes active area with fallback to remaining area', async () => {
    const headerBtn = document.getElementById('btn-delete-area-header');
    expect(headerBtn.classList.contains('hidden')).toBe(false);
    headerBtn.click();

    const modal = document.getElementById('delete-area-modal');
    const confirmInput = document.getElementById('delete-area-confirm-input');
    const confirmBtn = document.getElementById('delete-area-confirm-btn');

    expect(modal.classList.contains('hidden')).toBe(false);
    expect(confirmBtn.disabled).toBe(true);

    confirmInput.value = 'delete Safra D';
    confirmInput.dispatchEvent(new Event('input'));
    expect(confirmBtn.disabled).toBe(true);

    confirmInput.value = 'DELETE Safra C ';
    confirmInput.dispatchEvent(new Event('input'));
    expect(confirmBtn.disabled).toBe(false);

    const remainingTree = [
      { id: 'Safra D', name: 'Safra D', type: 'area', children: [] }
    ];

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', area_id: 'Safra C' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => remainingTree
      });

    confirmBtn.click();
    await new Promise((r) => setTimeout(r, 25));

    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/areas/Safra%20C', { method: 'DELETE' });
    expect(modal.classList.contains('hidden')).toBe(true);
    expect(window.currentArea).toBe('Safra D');
    expect(document.querySelectorAll('.area-grid-btn').length).toBe(1);
    expect(window.showToast).toHaveBeenCalledWith(expect.stringContaining('Safra C'), 'success');
  });

  it('resets cleanly to welcome panel and empty sidebar state when the last remaining area is deleted', async () => {
    window.openDeleteAreaModal('Safra C');
    const confirmInput = document.getElementById('delete-area-confirm-input');
    const confirmBtn = document.getElementById('delete-area-confirm-btn');

    confirmInput.value = 'delete Safra C';
    confirmInput.dispatchEvent(new Event('input'));

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', area_id: 'Safra C' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => []
      });

    confirmBtn.click();
    await new Promise((r) => setTimeout(r, 25));

    expect(window.currentArea).toBeNull();
    expect(document.getElementById('welcome-panel').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('area-grid-panel').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('btn-delete-area-header').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('sidebar-empty-add-area-btn')).not.toBeNull();
  });

  it('surfaces Delete House directly on Area Grid house cards without opening the house on click', async () => {
    const cardDeleteBtns = document.querySelectorAll('.house-card-delete-btn');
    expect(cardDeleteBtns.length).toBe(2);

    const house501Btn = document.querySelector('.house-card-delete-btn[data-house-id="501"]');
    expect(house501Btn).not.toBeNull();

    house501Btn.click();

    // Should NOT navigate into house 501
    expect(window.currentHouse).toBeNull();
    expect(document.getElementById('area-grid-panel').classList.contains('hidden')).toBe(false);

    // Should open #delete-house-modal targeting house 501 in Safra C
    const deleteHouseModal = document.getElementById('delete-house-modal');
    expect(deleteHouseModal.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('delete-house-target-name').textContent).toBe('501');
    expect(document.getElementById('delete-house-phrase-hint').textContent).toBe('delete 501');

    const confirmInput = document.getElementById('delete-house-confirm-input');
    const confirmBtn = document.getElementById('delete-house-confirm-btn');
    confirmInput.value = 'delete 501';
    confirmInput.dispatchEvent(new Event('input'));
    expect(confirmBtn.disabled).toBe(false);

    const updatedTree = [
      {
        id: 'Safra C',
        name: 'Safra C',
        type: 'area',
        children: [{ id: '500', name: '500', type: 'house', total_documents: 3, children: [] }]
      },
      { id: 'Safra D', name: 'Safra D', type: 'area', children: [] }
    ];

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedTree
      });

    confirmBtn.click();
    await new Promise((r) => setTimeout(r, 25));

    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/areas/Safra%20C/houses/501', { method: 'DELETE' });
    expect(deleteHouseModal.classList.contains('hidden')).toBe(true);
    expect(document.querySelectorAll('.house-card').length).toBe(1);
  });

  it('opens Delete House modal in one click from #btn-delete-house-quick inside House view and hides #btn-delete-area-header', () => {
    window.renderHouseProfile = vi.fn();
    window.openHouseFromGrid('Safra C', '500');
    global.currentArea = 'Safra C';
    global.currentHouse = '500';
    window.currentArea = 'Safra C';
    window.currentHouse = '500';

    expect(document.getElementById('btn-delete-area-header').classList.contains('hidden')).toBe(true);
    const quickBtn = document.getElementById('btn-delete-house-quick');
    expect(quickBtn.classList.contains('hidden')).toBe(false);

    quickBtn.click();

    expect(document.getElementById('tenant-modal').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('delete-house-modal').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('delete-house-target-name').textContent).toBe('500');
  });

  it('hides all Delete Area and Delete House triggers and blocks modal execution for Contributor accounts', () => {
    mockCanDelete = false;
    window.authManager.currentUser = { username: 'Nawaf', role: 'Contributor', canDelete: false };
    window.dispatchEvent(new CustomEvent('auth:user-changed', {
      detail: { user: window.authManager.currentUser, canDelete: false }
    }));

    expect(document.querySelectorAll('.area-delete-btn').length).toBe(0);
    expect(document.querySelectorAll('.house-card-delete-btn').length).toBe(0);
    expect(document.getElementById('btn-delete-area-header').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('btn-delete-house-quick').classList.contains('hidden')).toBe(true);

    // Programmatic invocation is also blocked with error toast
    window.openDeleteAreaModal('Safra C');
    expect(document.getElementById('delete-area-modal').classList.contains('hidden')).toBe(true);
    expect(window.showToast).toHaveBeenCalledWith(expect.any(String), 'error');

    window.showToast.mockClear();
    window.openDeleteHouseModal('Safra C', '500');
    expect(document.getElementById('delete-house-modal').classList.contains('hidden')).toBe(true);
    expect(window.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
    expect(global.fetch).not.toHaveBeenCalled();

    // Switching back to Admin restores delete triggers dynamically
    mockCanDelete = true;
    window.authManager.currentUser = { username: 'Emad', role: 'Admin', canDelete: true };
    window.dispatchEvent(new CustomEvent('auth:user-changed', {
      detail: { user: window.authManager.currentUser, canDelete: true }
    }));

    expect(document.querySelectorAll('.area-delete-btn').length).toBe(2);
    expect(document.querySelectorAll('.house-card-delete-btn').length).toBe(2);
    expect(document.getElementById('btn-delete-area-header').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('btn-delete-house-quick').classList.contains('hidden')).toBe(false);
  });
});
