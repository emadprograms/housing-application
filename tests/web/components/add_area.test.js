import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const indexHtmlPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/index.html');
const cssPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/css/styles.css');
const i18nPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/i18n.js');
const sidebarPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/sidebar.js');
const areaGridPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/area-grid.js');
const routerPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/router.js');

const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const i18nCode = fs.readFileSync(i18nPath, 'utf8');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');
const areaGridCode = fs.readFileSync(areaGridPath, 'utf8');
const routerCode = fs.readFileSync(routerPath, 'utf8');

describe('+ Add Area Feature (Sidebar, Welcome Panel, Add House Inline & Modal)', () => {
  let store = {};
  const localStorageMock = {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', localStorageMock);
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.body.innerHTML = indexHtmlContent;

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
          { id: '500', name: '500', type: 'house', children: [] }
        ]
      }
    ];
    window.globalTreeData = global.globalTreeData;
    window.isTreeLoading = false;
    window.isStaticMode = false;
    window.currentArea = 'Safra C';
    window.showToast = vi.fn();
    global.showToast = window.showToast;
    global.escapeHtml = (s) => (s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '');
    window.escapeHtml = global.escapeHtml;

    const i18nFn = new Function('window', 'document', 'localStorage', i18nCode);
    i18nFn(window, document, window.localStorage);
    window.i18n.setLanguage('en');

    eval(areaGridCode);
    eval(routerCode);
    eval(sidebarCode);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders #open-add-area-modal-btn in sidebar and opens #add-area-modal on click', () => {
    const openBtn = document.getElementById('open-add-area-modal-btn');
    const modal = document.getElementById('add-area-modal');

    expect(openBtn).not.toBeNull();
    expect(modal).not.toBeNull();
    expect(modal.classList.contains('hidden')).toBe(true);

    openBtn.click();
    expect(modal.classList.contains('hidden')).toBe(false);
  });

  it('renders #sidebar-empty-add-area-btn when globalTreeData is empty and opens modal on click', () => {
    global.globalTreeData = [];
    window.globalTreeData = [];
    window.renderSidebar();

    const houseList = document.getElementById('house-list');
    expect(houseList.textContent).toContain('No areas found.');

    const emptyAddBtn = document.getElementById('sidebar-empty-add-area-btn');
    expect(emptyAddBtn).not.toBeNull();

    emptyAddBtn.click();
    const modal = document.getElementById('add-area-modal');
    expect(modal.classList.contains('hidden')).toBe(false);
  });

  it('opens #add-area-modal from #welcome-add-area-btn on the welcome screen', () => {
    const welcomeBtn = document.getElementById('welcome-add-area-btn');
    const modal = document.getElementById('add-area-modal');

    expect(welcomeBtn).not.toBeNull();
    expect(modal.classList.contains('hidden')).toBe(true);

    welcomeBtn.click();
    expect(modal.classList.contains('hidden')).toBe(false);
  });

  it('closes #add-area-modal via cancel button, close button, Escape key, and backdrop click', () => {
    const modal = document.getElementById('add-area-modal');

    window.openAddAreaModal();
    expect(modal.classList.contains('hidden')).toBe(false);
    document.getElementById('btn-add-area-cancel').click();
    expect(modal.classList.contains('hidden')).toBe(true);

    window.openAddAreaModal();
    document.getElementById('add-area-close').click();
    expect(modal.classList.contains('hidden')).toBe(true);

    window.openAddAreaModal();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modal.classList.contains('hidden')).toBe(true);

    window.openAddAreaModal();
    modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(modal.classList.contains('hidden')).toBe(true);
  });

  it('validates empty area name and invalid path characters before making API request', async () => {
    global.fetch = vi.fn();
    window.openAddAreaModal();

    const nameInput = document.getElementById('add-area-name-input');
    const statusEl = document.getElementById('add-area-status');

    // Empty name
    nameInput.value = '   ';
    await window.handleAddAreaSubmit();
    expect(statusEl.classList.contains('hidden')).toBe(false);
    expect(statusEl.textContent).toBe('Area name is required.');
    expect(global.fetch).not.toHaveBeenCalled();

    // Path traversal / invalid character
    nameInput.value = '../SecretArea';
    await window.handleAddAreaSubmit();
    expect(statusEl.classList.contains('hidden')).toBe(false);
    expect(statusEl.textContent).toBe('Area name contains invalid characters.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits POST /api/areas, reloads tree, shows toast, and selects newly created area', async () => {
    window.openAddAreaModal();

    const nameInput = document.getElementById('add-area-name-input');
    const codeInput = document.getElementById('add-area-code-input');
    const modal = document.getElementById('add-area-modal');

    nameInput.value = 'Safra E';
    codeInput.value = 'SE';

    const updatedTree = [
      ...global.globalTreeData,
      { id: 'Safra E', name: 'Safra E', type: 'area', children: [] }
    ];

    global.fetch = vi.fn().mockImplementation(async (url, opts) => {
      if (url === '/api/areas' && opts && opts.method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            area_id: 'Safra E',
            code: 'SE',
            message: "Area 'Safra E' registered successfully."
          })
        };
      }
      if (url === '/api/tree') {
        return {
          ok: true,
          json: async () => updatedTree
        };
      }
      return { ok: false, status: 404 };
    });

    await window.handleAddAreaSubmit();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/areas',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area_id: 'Safra E',
          name: 'Safra E',
          code: 'SE'
        })
      })
    );

    expect(modal.classList.contains('hidden')).toBe(true);
    expect(window.showToast).toHaveBeenCalledWith('Area added successfully', 'success');
    expect(window.currentArea).toBe('Safra E');
    expect(window.location.hash).toBe('#/area/Safra%20E');

    // Area grid should display the dashed + Add New House card for the newly created empty area
    const addHouseCard = document.getElementById('add-house-grid-card');
    expect(addHouseCard).not.toBeNull();

    // Sidebar should list and highlight Safra E
    const activeAreaBtn = document.querySelector('.area-grid-btn[data-area-name="Safra E"]');
    expect(activeAreaBtn).not.toBeNull();
    expect(activeAreaBtn.classList.contains('bg-slate-800')).toBe(true);
  });

  it('displays conflict error inside modal when area already exists (409)', async () => {
    window.openAddAreaModal();
    const nameInput = document.getElementById('add-area-name-input');
    const statusEl = document.getElementById('add-area-status');
    const submitBtn = document.getElementById('btn-add-area-submit');

    nameInput.value = 'Safra C';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Area 'Safra C' already exists.", detail: "Area 'Safra C' already exists." })
    });

    await window.handleAddAreaSubmit();

    expect(statusEl.classList.contains('hidden')).toBe(false);
    expect(statusEl.textContent).toContain("Area 'Safra C' already exists.");
    expect(submitBtn.disabled).toBe(false);
  });

  it('supports inline "+ New Area" flow from #add-house-modal and returns with new area preselected', async () => {
    window.openAddHouseModal('Safra C');
    const addHouseModal = document.getElementById('add-house-modal');
    const addAreaModal = document.getElementById('add-area-modal');
    const inlineNewAreaBtn = document.getElementById('btn-add-house-new-area');

    expect(addHouseModal.classList.contains('hidden')).toBe(false);
    expect(inlineNewAreaBtn).not.toBeNull();

    // Click "+ New Area" inside Add House modal
    inlineNewAreaBtn.click();
    expect(addHouseModal.classList.contains('hidden')).toBe(true);
    expect(addAreaModal.classList.contains('hidden')).toBe(false);

    // Cancel returns back to Add House modal
    document.getElementById('btn-add-area-cancel').click();
    expect(addAreaModal.classList.contains('hidden')).toBe(true);
    expect(addHouseModal.classList.contains('hidden')).toBe(false);

    // Open again and create "Al-Yasmin"
    inlineNewAreaBtn.click();
    document.getElementById('add-area-name-input').value = 'Al-Yasmin';

    const updatedTree = [
      ...global.globalTreeData,
      { id: 'Al-Yasmin', name: 'Al-Yasmin', type: 'area', children: [] }
    ];

    global.fetch = vi.fn().mockImplementation(async (url, opts) => {
      if (url === '/api/areas' && opts && opts.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ status: 'success', area_id: 'Al-Yasmin', code: null })
        };
      }
      if (url === '/api/tree') {
        return { ok: true, json: async () => updatedTree };
      }
      return { ok: false, status: 404 };
    });

    await window.handleAddAreaSubmit();

    // Add Area modal closes and Add House modal reopens with Al-Yasmin selected
    expect(addAreaModal.classList.contains('hidden')).toBe(true);
    expect(addHouseModal.classList.contains('hidden')).toBe(false);
    const areaSelect = document.getElementById('add-house-area-select');
    expect(areaSelect.value).toBe('Al-Yasmin');
  });

  it('hides #open-add-area-modal-btn in DB Inspector mode and restores it in Overview mode', () => {
    const openAddAreaBtn = document.getElementById('open-add-area-modal-btn');
    expect(openAddAreaBtn.classList.contains('hidden')).toBe(false);

    window.switchToViewMode('db');
    expect(openAddAreaBtn.classList.contains('hidden')).toBe(true);

    window.switchToViewMode('overview');
    expect(openAddAreaBtn.classList.contains('hidden')).toBe(false);
  });

  it('localizes all Add Area elements cleanly in Arabic and English and defines dark mode CSS', () => {
    window.i18n.setLanguage('ar');
    expect(document.getElementById('add-area-modal-title').textContent).toBe('إضافة منطقة جديدة');
    expect(document.getElementById('add-area-submit-text').textContent).toBe('إضافة المنطقة');
    expect(document.querySelector('#open-add-area-modal-btn [data-i18n="sidebar.add_area"]').textContent).toBe('منطقة جديدة');

    window.i18n.setLanguage('en');
    expect(document.getElementById('add-area-modal-title').textContent).toBe('Add New Area');
    expect(document.getElementById('add-area-submit-text').textContent).toBe('Create Area');
    expect(document.querySelector('#open-add-area-modal-btn [data-i18n="sidebar.add_area"]').textContent).toBe('Add Area');

    // Dark mode CSS selectors
    expect(cssContent).toContain('html.dark #add-area-modal > div');
    expect(cssContent).toContain('html.dark #btn-add-area-cancel');
    expect(cssContent).toContain('html.dark #add-area-close');
  });
});
