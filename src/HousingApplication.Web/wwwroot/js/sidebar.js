// ── Sidebar & Area Tree Component ─────────────────────────────────────────
(function() {
    let activeLoadPromise = null;
    let returnToAddHouse = false;

    function safeEscapeHtml(str) {
        if (typeof escapeHtml === 'function') return escapeHtml(str);
        if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') return window.escapeHtml(str);
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getTreeState() {
        if (typeof globalTreeData !== 'undefined' && Array.isArray(globalTreeData)) {
            return globalTreeData;
        }
        if (typeof window !== 'undefined' && Array.isArray(window.globalTreeData)) {
            return window.globalTreeData;
        }
        return [];
    }

    function setTreeState(treeData) {
        if (typeof globalTreeData !== 'undefined') {
            globalTreeData = treeData;
        }
        if (typeof window !== 'undefined') {
            window.globalTreeData = treeData;
        }
    }

    function getTreeLoadingState() {
        if (typeof isTreeLoading !== 'undefined') {
            return isTreeLoading;
        }
        return Boolean(typeof window !== 'undefined' && window.isTreeLoading);
    }

    function setTreeLoadingState(loading) {
        if (typeof isTreeLoading !== 'undefined') {
            isTreeLoading = loading;
        }
        if (typeof window !== 'undefined') {
            window.isTreeLoading = loading;
        }
    }

    async function loadTree() {
        if (activeLoadPromise) return activeLoadPromise;
        setTreeLoadingState(true);
        renderSidebar();
        activeLoadPromise = (async () => {
            try {
                let res = null;
                const treeEndpoint = (typeof API_TREE !== 'undefined' && API_TREE) ? API_TREE : '/api/tree';
                try {
                    res = await fetch(treeEndpoint);
                    if (!res.ok) throw new Error();
                } catch (e) {
                    res = await fetch('./tree.json');
                    if (res && res.ok) {
                        if (typeof isStaticMode !== 'undefined') isStaticMode = true;
                        if (typeof window !== 'undefined') window.isStaticMode = true;
                    }
                }
                if (!res || !res.ok) throw new Error('Failed to load tree');
                const treeData = await res.json();
                setTreeState(treeData);
                setTreeLoadingState(false);

                renderSidebar();
                if (typeof window.handleHashChange === 'function') {
                    window.handleHashChange();
                }
            } catch (err) {
                setTreeLoadingState(false);
                const houseListEl = document.getElementById('house-list');
                if (houseListEl) {
                    houseListEl.innerHTML = '<div class="p-2 text-rose-500 text-xs">Error loading data. <button onclick="window.loadTree()" class="ml-1 underline text-blue-500 hover:text-blue-700">Retry</button></div>';
                }
            } finally {
                activeLoadPromise = null;
            }
        })();
        return activeLoadPromise;
    }

    function renderSidebar() {
        const houseListEl = document.getElementById('house-list');
        const areaGridPanel = document.getElementById('area-grid-panel');
        if (!houseListEl) return;
        houseListEl.innerHTML = '';

        const hasI18n = typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function';

        if (getTreeLoadingState()) {
            const loadingText = hasI18n ? window.i18n.t('sidebar.loading', 'Loading...') : 'Loading...';
            houseListEl.innerHTML = `<p class="text-slate-500 text-xs px-2 py-1">${safeEscapeHtml(loadingText)}</p>`;
            return;
        }

        const tree = getTreeState();
        const staticReadOnly = (typeof isStaticMode !== 'undefined' && isStaticMode) || (typeof window !== 'undefined' && Boolean(window.isStaticMode));

        if (!tree || tree.length === 0) {
            const noAreasText = hasI18n ? window.i18n.t('sidebar.no_areas', 'No areas found.') : 'No areas found.';
            const addAreaText = hasI18n ? window.i18n.t('add_area.title', 'Add New Area') : 'Add New Area';
            houseListEl.innerHTML = `
                <div class="px-2 py-2 space-y-2.5">
                    <p class="text-slate-500 text-xs">${safeEscapeHtml(noAreasText)}</p>
                    ${staticReadOnly ? '' : `
                    <button id="sidebar-empty-add-area-btn" type="button" class="w-full py-1.5 px-3 text-xs font-semibold text-blue-400 hover:text-white bg-slate-800/80 hover:bg-blue-600 border border-dashed border-slate-700 hover:border-blue-500 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>+</span>
                        <span>${safeEscapeHtml(addAreaText)}</span>
                    </button>`}
                </div>
            `;
            const emptyAddBtn = document.getElementById('sidebar-empty-add-area-btn');
            if (emptyAddBtn) {
                emptyAddBtn.onclick = () => openAddAreaModal();
            }
            return;
        }

        const activeArea = (typeof currentArea !== 'undefined' && currentArea)
            ? currentArea
            : (typeof window !== 'undefined' ? window.currentArea : null);

        const ul = document.createElement('ul');
        ul.className = 'space-y-1';
        tree.forEach(areaNode => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'area-grid-btn w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none flex items-center justify-between transition-colors border border-transparent';
            btn.dataset.areaName = areaNode.name;
            if (activeArea === areaNode.name && areaGridPanel && !areaGridPanel.classList.contains('hidden')) {
                btn.classList.add('bg-slate-800', 'text-white', 'border-slate-700');
                btn.classList.remove('text-slate-300');
            }
            const houseCount = (areaNode.children || []).length;
            btn.innerHTML = `
                <div class="flex items-center gap-2 truncate">
                    <span class="text-slate-400 flex-shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                    </span>
                    <span class="truncate">${safeEscapeHtml(areaNode.name)}</span>
                </div>
                <span class="text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-full">${houseCount} Houses</span>
            `;
            btn.onclick = (e) => {
                e.stopPropagation();
                if (typeof window.selectAreaGrid === 'function') {
                    window.selectAreaGrid(areaNode);
                }
            };
            li.appendChild(btn);
            ul.appendChild(li);
        });
        houseListEl.appendChild(ul);
    }

    function showAreaModalError(msg) {
        const statusEl = document.getElementById('add-area-status');
        if (statusEl) {
            statusEl.className = 'p-2.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200';
            statusEl.textContent = msg;
            statusEl.classList.remove('hidden');
        }
    }

    function openAddAreaModal(options = {}) {
        const modal = document.getElementById('add-area-modal');
        if (!modal) return;

        returnToAddHouse = Boolean(options && options.returnToAddHouse);
        if (returnToAddHouse) {
            const addHouseModal = document.getElementById('add-house-modal');
            if (addHouseModal) addHouseModal.classList.add('hidden');
        }

        const nameInput = document.getElementById('add-area-name-input');
        const codeInput = document.getElementById('add-area-code-input');
        const statusEl = document.getElementById('add-area-status');
        const spinner = document.getElementById('add-area-spinner');
        const submitBtn = document.getElementById('btn-add-area-submit');

        if (statusEl) {
            statusEl.classList.add('hidden');
            statusEl.textContent = '';
            statusEl.className = 'p-2.5 rounded-lg text-xs font-medium hidden';
        }
        if (spinner) spinner.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;

        if (nameInput) nameInput.value = '';
        if (codeInput) codeInput.value = '';

        modal.classList.remove('hidden');
        if (nameInput && typeof nameInput.focus === 'function') {
            setTimeout(() => nameInput.focus(), 50);
        }
    }

    function closeAddAreaModal(options = {}) {
        const modal = document.getElementById('add-area-modal');
        if (modal) modal.classList.add('hidden');

        const shouldReopenHouse = returnToAddHouse && !(options && options.created);
        returnToAddHouse = false;

        if (shouldReopenHouse && typeof window !== 'undefined' && typeof window.openAddHouseModal === 'function') {
            window.openAddHouseModal();
        }
    }

    async function handleAddAreaSubmit(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();

        const nameInput = document.getElementById('add-area-name-input');
        const codeInput = document.getElementById('add-area-code-input');
        const statusEl = document.getElementById('add-area-status');
        const spinner = document.getElementById('add-area-spinner');
        const submitBtn = document.getElementById('btn-add-area-submit');

        const areaName = nameInput ? nameInput.value.trim() : '';
        const areaCode = codeInput ? codeInput.value.trim() : '';

        const isLiveI18n = (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function');

        if (!areaName) {
            const errMsg = isLiveI18n
                ? window.i18n.t('add_area.err_name_required', 'Area name is required.')
                : 'يرجى إدخال اسم المنطقة / Area name is required.';
            showAreaModalError(errMsg);
            if (nameInput && typeof nameInput.focus === 'function') nameInput.focus();
            return;
        }

        if (areaName === '.' || areaName === '..' || areaName.endsWith('.') || /[/\\:*?"<>|\x00-\x1f]/.test(areaName)) {
            const invalidMsg = isLiveI18n
                ? window.i18n.t('add_area.err_invalid_chars', 'Area name contains invalid characters.')
                : 'اسم المنطقة يحتوي على رموز غير مسموح بها / Area name contains invalid characters.';
            showAreaModalError(invalidMsg);
            if (nameInput && typeof nameInput.focus === 'function') nameInput.focus();
            return;
        }

        if (statusEl) {
            statusEl.classList.add('hidden');
            statusEl.textContent = '';
        }
        if (spinner) spinner.classList.remove('hidden');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const payload = {
                area_id: areaName,
                name: areaName,
                code: areaCode || null,
            };

            const res = await fetch('/api/areas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let errText = `Error ${res.status}`;
                try {
                    const errData = await res.json();
                    errText = errData.detail || errData.error || errData.message || errText;
                } catch (_) {}
                throw new Error(errText);
            }

            const data = await res.json();
            const createdAreaName = (data && data.area_id) ? data.area_id : areaName;
            const reopenAddHouse = returnToAddHouse;

            closeAddAreaModal({ created: true });

            const successMsg = isLiveI18n
                ? window.i18n.t('add_area.toast_created', 'Area added successfully')
                : 'تمت إضافة المنطقة بنجاح';
            if (typeof showToast === 'function') {
                showToast(successMsg, 'success');
            } else if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast(successMsg, 'success');
            }

            if (typeof currentViewMode !== 'undefined' && currentViewMode === 'db' && typeof window.switchToViewMode === 'function') {
                window.switchToViewMode('overview');
            }

            if (typeof currentArea !== 'undefined') currentArea = createdAreaName;
            if (typeof window !== 'undefined') window.currentArea = createdAreaName;
            window.location.hash = `#/area/${encodeURIComponent(createdAreaName)}`;

            if (typeof window.loadTree === 'function') {
                await window.loadTree();
            }

            const tree = getTreeState();
            let areaNode = tree.find(a => a.name === createdAreaName || a.id === createdAreaName);
            if (!areaNode) {
                areaNode = {
                    id: createdAreaName,
                    name: createdAreaName,
                    type: 'area',
                    children: [],
                };
            }

            if (typeof window.selectAreaGrid === 'function') {
                window.selectAreaGrid(areaNode);
            }
            renderSidebar();

            if (reopenAddHouse && typeof window.openAddHouseModal === 'function') {
                window.openAddHouseModal(createdAreaName);
            }

            return data;
        } catch (err) {
            const failDefault = isLiveI18n
                ? window.i18n.t('add_area.err_failed', 'Failed to create area')
                : 'فشل إضافة المنطقة / Failed to create area';
            showAreaModalError(err.message || failDefault);
        } finally {
            if (spinner) spinner.classList.add('hidden');
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    function initAddAreaModal() {
        const openBtn = document.getElementById('open-add-area-modal-btn');
        if (openBtn) {
            openBtn.onclick = () => openAddAreaModal();
        }

        const welcomeBtn = document.getElementById('welcome-add-area-btn');
        if (welcomeBtn) {
            welcomeBtn.onclick = () => openAddAreaModal();
        }

        const closeBtn = document.getElementById('add-area-close');
        if (closeBtn) {
            closeBtn.onclick = () => closeAddAreaModal();
        }

        const cancelBtn = document.getElementById('btn-add-area-cancel');
        if (cancelBtn) {
            cancelBtn.onclick = () => closeAddAreaModal();
        }

        const submitBtn = document.getElementById('btn-add-area-submit');
        if (submitBtn) {
            submitBtn.onclick = handleAddAreaSubmit;
        }

        const form = document.getElementById('add-area-form');
        if (form) {
            form.onsubmit = handleAddAreaSubmit;
        }

        const modal = document.getElementById('add-area-modal');
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) closeAddAreaModal();
            };
        }

        if (typeof window !== 'undefined') {
            if (window._addAreaEscapeHandler) {
                document.removeEventListener('keydown', window._addAreaEscapeHandler);
            }
            window._addAreaEscapeHandler = (e) => {
                if (e.key === 'Escape') {
                    const m = document.getElementById('add-area-modal');
                    if (m && !m.classList.contains('hidden')) {
                        closeAddAreaModal();
                    }
                }
            };
            document.addEventListener('keydown', window._addAreaEscapeHandler);
        }
    }

    function isSidebarCollapsed() {
        const sidebar = document.getElementById('main-sidebar');
        if (!sidebar) return false;
        return sidebar.classList.contains('hidden');
    }

    function toggleSidebar(forceCollapsed) {
        const sidebar = document.getElementById('main-sidebar');
        const resizer = document.getElementById('resizer-1');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (!sidebar) return;

        const currentCollapsed = isSidebarCollapsed();
        const willCollapse = typeof forceCollapsed === 'boolean' ? forceCollapsed : !currentCollapsed;

        if (willCollapse) {
            if (sidebar.style.width && sidebar.style.width !== '0px') {
                try {
                    localStorage.setItem('sidebar_width', sidebar.style.width);
                } catch (e) {}
            }
            sidebar.classList.add('hidden');
            if (resizer) resizer.classList.add('hidden');

            if (toggleBtn) {
                toggleBtn.title = (typeof window !== 'undefined' && window.i18n) ? window.i18n.t('toast.expand_sidebar') : 'Expand sidebar (Ctrl+B)';
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.classList.add('text-blue-600', 'dark:text-blue-400', 'bg-blue-50', 'dark:bg-blue-900/30', 'border-blue-200', 'dark:border-blue-800');
            }
            try {
                localStorage.setItem('sidebar_collapsed', 'true');
            } catch (e) {}
        } else {
            try {
                const savedWidth = localStorage.getItem('sidebar_width');
                if (savedWidth) {
                    sidebar.style.width = savedWidth;
                }
            } catch (e) {}

            sidebar.classList.remove('hidden');
            if (resizer) resizer.classList.remove('hidden');

            if (toggleBtn) {
                toggleBtn.title = (typeof window !== 'undefined' && window.i18n) ? window.i18n.t('toast.collapse_sidebar') : 'Collapse sidebar (Ctrl+B)';
                toggleBtn.setAttribute('aria-expanded', 'true');
                toggleBtn.classList.remove('text-blue-600', 'dark:text-blue-400', 'bg-blue-50', 'dark:bg-blue-900/30', 'border-blue-200', 'dark:border-blue-800');
            }
            try {
                localStorage.setItem('sidebar_collapsed', 'false');
            } catch (e) {}
        }
    }

    function initSidebarCollapse() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const collapseBtn = document.getElementById('sidebar-collapse-btn');

        if (toggleBtn && !toggleBtn._hasSidebarListener) {
            toggleBtn._hasSidebarListener = true;
            toggleBtn.onclick = (e) => {
                e.preventDefault();
                toggleSidebar();
            };
        }

        if (collapseBtn && !collapseBtn._hasSidebarListener) {
            collapseBtn._hasSidebarListener = true;
            collapseBtn.onclick = (e) => {
                e.preventDefault();
                toggleSidebar(true);
            };
        }

        try {
            const savedState = localStorage.getItem('sidebar_collapsed');
            if (savedState === 'true') {
                toggleSidebar(true);
            }
        } catch (e) {}

        if (typeof window !== 'undefined' && !window._sidebarLangListenerAttached) {
            window._sidebarLangListenerAttached = true;
            window.addEventListener('languageChanged', () => {
                const s = document.getElementById('main-sidebar') || document.getElementById('sidebar');
                const isCollapsed = s && s.classList.contains('hidden');
                const btn = document.getElementById('sidebar-toggle-btn');
                if (btn && window.i18n) {
                    btn.title = window.i18n.t(isCollapsed ? 'toast.expand_sidebar' : 'toast.collapse_sidebar');
                }
                if (!getTreeLoadingState() && (typeof currentViewMode === 'undefined' || currentViewMode !== 'db')) {
                    renderSidebar();
                }
            });
        }

        if (typeof window !== 'undefined') {
            if (window._sidebarShortcutHandler) {
                document.removeEventListener('keydown', window._sidebarShortcutHandler);
            }
            window._sidebarShortcutHandler = (e) => {
                const isB = e.code === 'KeyB' || (e.key && e.key.toLowerCase() === 'b');
                if (isB && (e.ctrlKey || e.metaKey) && !e.altKey) {
                    const activeEl = document.activeElement;
                    const tag = ((activeEl && activeEl.tagName) || (e.target && e.target.tagName) || '').toLowerCase();
                    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (activeEl && activeEl.isContentEditable) || (e.target && e.target.isContentEditable)) {
                        return;
                    }
                    e.preventDefault();
                    toggleSidebar();
                }
            };
            document.addEventListener('keydown', window._sidebarShortcutHandler);
        }
    }

    if (typeof document !== 'undefined') {
        const initAll = () => {
            initSidebarCollapse();
            initAddAreaModal();
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

    window.loadTree = loadTree;
    window.renderSidebar = renderSidebar;
    window.openAddAreaModal = openAddAreaModal;
    window.closeAddAreaModal = closeAddAreaModal;
    window.handleAddAreaSubmit = handleAddAreaSubmit;
    window.initAddAreaModal = initAddAreaModal;
    window.isSidebarCollapsed = isSidebarCollapsed;
    window.toggleSidebar = toggleSidebar;
    window.initSidebarCollapse = initSidebarCollapse;
})();
