// ── Sidebar & Area Tree Component ─────────────────────────────────────────
(function() {
    let activeLoadPromise = null;
    let returnToAddHouse = false;
    let targetAreaToDelete = null;

    function canCurrentUserDelete() {
        if (typeof window !== 'undefined' && window.authManager && typeof window.authManager.hasDeletePermission === 'function') {
            return window.authManager.hasDeletePermission();
        }
        return true;
    }

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
            const headerDelBtn = document.getElementById('btn-delete-area-header');
            if (headerDelBtn) {
                headerDelBtn.classList.add('hidden');
                headerDelBtn.classList.remove('flex');
            }
            return;
        }

        const activeArea = (typeof currentArea !== 'undefined' && currentArea)
            ? currentArea
            : (typeof window !== 'undefined' ? window.currentArea : null);
        const canDelete = canCurrentUserDelete();
        const deleteAreaLabel = hasI18n ? window.i18n.t('delete_area.title', 'Delete Area') : 'Delete Area';

        const ul = document.createElement('ul');
        ul.className = 'space-y-1';
        tree.forEach(areaNode => {
            const li = document.createElement('li');
            li.className = 'group flex items-center gap-1';
            const btn = document.createElement('button');
            btn.className = 'area-grid-btn flex-1 min-w-0 text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none flex items-center justify-between transition-colors border border-transparent cursor-pointer';
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
                <span class="text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-full flex-shrink-0">${houseCount} Houses</span>
            `;
            btn.onclick = (e) => {
                e.stopPropagation();
                if (typeof window.selectAreaGrid === 'function') {
                    window.selectAreaGrid(areaNode);
                }
            };
            li.appendChild(btn);

            if (!staticReadOnly && canDelete) {
                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'area-delete-btn opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 transition-all flex-shrink-0 cursor-pointer';
                delBtn.dataset.areaName = areaNode.name;
                delBtn.title = deleteAreaLabel;
                delBtn.setAttribute('aria-label', deleteAreaLabel);
                delBtn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
                delBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openDeleteAreaModal(areaNode.name);
                };
                li.appendChild(delBtn);
            }

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

    /**
     * Fallback when running against a precompiled/un-restarted server binary that
     * predates `POST /api/areas` (where ASP.NET Core's SPA fallback responds with 405).
     * Uses the existing `POST /api/areas/{areaId}/houses` + `DELETE /api/areas/{areaId}/houses/{tempId}`
     * endpoints to persist the area row in SQLite and scaffold its directory on disk.
     */
    async function createAreaViaLegacyFallback(areaName, areaCode, isLiveI18n) {
        let existingTree = getTreeState();
        if (!existingTree.length) {
            try {
                const treeRes = await fetch(typeof API_TREE !== 'undefined' ? API_TREE : '/api/tree');
                if (treeRes && treeRes.ok) {
                    const fetched = await treeRes.json();
                    if (Array.isArray(fetched)) existingTree = fetched;
                }
            } catch (_) {}
        }

        const lowerTarget = areaName.toLowerCase();
        const duplicate = existingTree.find(a => {
            const candidate = String(a.name || a.id || '').trim().toLowerCase();
            return candidate === lowerTarget;
        });
        if (duplicate) {
            const dupName = duplicate.name || duplicate.id || areaName;
            const dupTemplate = isLiveI18n
                ? window.i18n.t('add_area.err_exists', `Area '${dupName}' already exists.`)
                : `Area '${dupName}' already exists.`;
            throw new Error(dupTemplate.replace('{name}', dupName));
        }

        const currentRole = (typeof window !== 'undefined' &&
            window.authManager &&
            window.authManager.currentUser &&
            window.authManager.currentUser.role)
            ? String(window.authManager.currentUser.role).toLowerCase()
            : '';

        if (currentRole === 'contributor') {
            if (returnToAddHouse) {
                return {
                    status: 'success',
                    area_id: areaName,
                    code: areaCode || null,
                    deferred_until_house: true,
                };
            }
            const restartMsg = isLiveI18n
                ? window.i18n.t(
                    'add_area.err_server_update_contributor',
                    'Please restart or update the server binary to create an empty area with a Contributor account, or add its first house via Add House.'
                )
                : 'Please restart or update the server binary to create an empty area with a Contributor account, or add its first house via Add House.';
            throw new Error(restartMsg);
        }

        const tempHouseId = `__area_init_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        const encodedArea = encodeURIComponent(areaName);
        const encodedHouse = encodeURIComponent(tempHouseId);

        const createRes = await fetch(`/api/areas/${encodedArea}/houses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                house_id: tempHouseId,
                area_id: areaName,
                initial_tenant_name: null,
                start_date: null,
            }),
        });

        if (!createRes.ok) {
            let errText = `Error ${createRes.status}`;
            try {
                const errData = await createRes.json();
                errText = errData.detail || errData.error || errData.message || errText;
            } catch (_) {}
            throw new Error(errText);
        }

        const deleteRes = await fetch(`/api/areas/${encodedArea}/houses/${encodedHouse}`, {
            method: 'DELETE',
        });

        if (!deleteRes.ok) {
            let errText = `Error ${deleteRes.status}`;
            try {
                const errData = await deleteRes.json();
                errText = errData.detail || errData.error || errData.message || errText;
            } catch (_) {}
            throw new Error(errText);
        }

        return {
            status: 'success',
            area_id: areaName,
            code: null,
        };
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

            let data;
            if (res.status === 405) {
                data = await createAreaViaLegacyFallback(areaName, areaCode, isLiveI18n);
            } else if (!res.ok) {
                let errText = `Error ${res.status}`;
                try {
                    const errData = await res.json();
                    errText = errData.detail || errData.error || errData.message || errText;
                } catch (_) {}
                throw new Error(errText);
            } else {
                data = await res.json();
            }

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
                if (data && data.deferred_until_house) {
                    setTreeState([...tree, areaNode]);
                }
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

    function openDeleteAreaModal(areaNameOverride) {
        const hasI18n = typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function';
        const isAr = Boolean(hasI18n && typeof window.i18n.getLanguage === 'function' && window.i18n.getLanguage() === 'ar');

        if (!canCurrentUserDelete()) {
            const toastFn = (typeof showToast === 'function') ? showToast : (typeof window !== 'undefined' ? window.showToast : null);
            if (toastFn) {
                const msg = hasI18n
                    ? window.i18n.t('delete_area.toast_restricted', 'Area deletion is restricted for Contributor accounts.')
                    : 'Area deletion is restricted for Contributor accounts.';
                toastFn(msg, 'error');
            }
            return;
        }

        const resolvedArea = (typeof areaNameOverride === 'string' && areaNameOverride.trim())
            ? areaNameOverride.trim()
            : ((typeof currentArea !== 'undefined' && currentArea)
                ? currentArea
                : (typeof window !== 'undefined' ? (window.currentArea || '') : ''));
        if (!resolvedArea) return;

        const modal = document.getElementById('delete-area-modal');
        if (!modal) return;

        targetAreaToDelete = resolvedArea;

        const tree = getTreeState();
        const areaNode = tree.find(a => a.name === resolvedArea || a.id === resolvedArea);
        const houseCount = (areaNode && Array.isArray(areaNode.children)) ? areaNode.children.length : 0;

        const msgEl = document.getElementById('delete-area-msg');
        if (msgEl) {
            if (isAr) {
                msgEl.innerHTML = `هل أنت متأكد من رغبتك في حذف المنطقة <strong id="delete-area-target-name" class="text-slate-900 font-bold">${safeEscapeHtml(resolvedArea)}</strong> نهائياً؟ سيتم محو كافة المنازل والمستأجرين والوثائق والملفات التابعة لها من القرص.`;
            } else {
                msgEl.innerHTML = `Are you sure you want to permanently delete area <strong id="delete-area-target-name" class="text-slate-900 font-bold">${safeEscapeHtml(resolvedArea)}</strong>? All houses, tenants, documents, and files inside it will be removed from disk.`;
            }
        } else {
            const targetEl = document.getElementById('delete-area-target-name');
            if (targetEl) targetEl.textContent = resolvedArea;
        }

        const countInfoEl = document.getElementById('delete-area-house-count-info');
        if (countInfoEl) {
            if (houseCount > 0) {
                const tpl = hasI18n
                    ? window.i18n.t('delete_area.house_count_warning', 'This area contains {count} house(s) that will be permanently deleted.')
                    : 'This area contains {count} house(s) that will be permanently deleted.';
                countInfoEl.textContent = tpl.replace('{count}', String(houseCount));
            } else {
                countInfoEl.textContent = hasI18n
                    ? window.i18n.t('delete_area.empty_area_note', 'This area currently contains 0 houses.')
                    : 'This area currently contains 0 houses.';
            }
        }

        const confirmLabelEl = document.getElementById('delete-area-confirm-label');
        const expectedPhrase = `delete ${resolvedArea}`;
        if (confirmLabelEl) {
            if (isAr) {
                confirmLabelEl.innerHTML = `لتأكيد الحذف، اكتب <span id="delete-area-phrase-hint" class="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 font-bold select-all">${safeEscapeHtml(expectedPhrase)}</span> في الحقل أدناه:`;
            } else {
                confirmLabelEl.innerHTML = `To confirm deletion, type <span id="delete-area-phrase-hint" class="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 font-bold select-all">${safeEscapeHtml(expectedPhrase)}</span> in the field below:`;
            }
        } else {
            const hintEl = document.getElementById('delete-area-phrase-hint');
            if (hintEl) hintEl.textContent = expectedPhrase;
        }

        const confirmInput = document.getElementById('delete-area-confirm-input');
        const confirmBtn = document.getElementById('delete-area-confirm-btn');
        const statusEl = document.getElementById('delete-area-status');
        const spinnerEl = document.getElementById('delete-area-spinner');

        if (confirmInput) {
            confirmInput.value = '';
            confirmInput.disabled = false;
        }
        if (confirmBtn) confirmBtn.disabled = true;
        if (statusEl) {
            statusEl.classList.add('hidden');
            statusEl.textContent = '';
        }
        if (spinnerEl) spinnerEl.classList.add('hidden');

        modal.classList.remove('hidden');
        if (confirmInput && typeof confirmInput.focus === 'function') {
            confirmInput.focus();
        }
    }

    function closeDeleteAreaModal() {
        const modal = document.getElementById('delete-area-modal');
        if (modal) modal.classList.add('hidden');
        const confirmInput = document.getElementById('delete-area-confirm-input');
        const statusEl = document.getElementById('delete-area-status');
        const spinnerEl = document.getElementById('delete-area-spinner');
        if (confirmInput) {
            confirmInput.value = '';
            confirmInput.disabled = false;
        }
        if (statusEl) {
            statusEl.classList.add('hidden');
            statusEl.textContent = '';
        }
        if (spinnerEl) spinnerEl.classList.add('hidden');
        targetAreaToDelete = null;
    }

    function handleDeleteAreaConfirmInput() {
        const confirmInput = document.getElementById('delete-area-confirm-input');
        const confirmBtn = document.getElementById('delete-area-confirm-btn');
        if (!confirmInput || !confirmBtn || !targetAreaToDelete) return;
        const typed = confirmInput.value.trim().toLowerCase();
        const expected = (`delete ${targetAreaToDelete}`).trim().toLowerCase();
        confirmBtn.disabled = (typed !== expected);
    }

    async function executeDeleteArea() {
        const hasI18n = typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function';
        const isAr = Boolean(hasI18n && typeof window.i18n.getLanguage === 'function' && window.i18n.getLanguage() === 'ar');

        if (!canCurrentUserDelete()) {
            const toastFn = (typeof showToast === 'function') ? showToast : (typeof window !== 'undefined' ? window.showToast : null);
            if (toastFn) {
                toastFn(hasI18n ? window.i18n.t('delete_area.toast_restricted', 'Area deletion is restricted for Contributor accounts.') : 'Area deletion is restricted for Contributor accounts.', 'error');
            }
            return;
        }

        if (!targetAreaToDelete) return;
        const confirmBtn = document.getElementById('delete-area-confirm-btn');
        const confirmInput = document.getElementById('delete-area-confirm-input');
        const statusEl = document.getElementById('delete-area-status');
        const spinnerEl = document.getElementById('delete-area-spinner');

        if (!confirmBtn || confirmBtn.disabled) return;

        confirmBtn.disabled = true;
        if (confirmInput) confirmInput.disabled = true;
        if (spinnerEl) spinnerEl.classList.remove('hidden');
        if (statusEl) {
            statusEl.classList.add('hidden');
            statusEl.textContent = '';
        }

        const areaBeingDeleted = targetAreaToDelete;
        const activeAreaBefore = (typeof currentArea !== 'undefined' && currentArea)
            ? currentArea
            : (typeof window !== 'undefined' ? window.currentArea : null);

        try {
            const res = (typeof window !== 'undefined' && typeof window.deleteAreaApi === 'function')
                ? await window.deleteAreaApi(areaBeingDeleted)
                : await fetch(`/api/areas/${encodeURIComponent(areaBeingDeleted)}`, { method: 'DELETE' });

            if (!res.ok) {
                if (res.status === 403) {
                    const restrictedMsg = hasI18n
                        ? window.i18n.t('delete_area.toast_restricted', 'Area deletion is restricted for Contributor accounts.')
                        : 'Area deletion is restricted for Contributor accounts.';
                    throw new Error(restrictedMsg);
                }
                const errData = await res.json().catch(() => ({}));
                const fallbackMsg = hasI18n
                    ? window.i18n.t('delete_area.err_failed', 'Failed to delete area')
                    : 'Failed to delete area';
                throw new Error(errData.detail || errData.error || `${fallbackMsg} (${res.status})`);
            }

            closeDeleteAreaModal();

            await loadTree();
            const remainingTree = getTreeState();

            if (activeAreaBefore === areaBeingDeleted) {
                if (typeof currentHouse !== 'undefined') currentHouse = null;
                if (typeof window !== 'undefined') window.currentHouse = null;
                if (typeof currentTenant !== 'undefined') currentTenant = null;
                if (typeof window !== 'undefined') window.currentTenant = null;

                if (remainingTree.length > 0 && typeof window !== 'undefined' && typeof window.selectAreaGrid === 'function') {
                    window.selectAreaGrid(remainingTree[0]);
                    renderSidebar();
                } else {
                    if (typeof currentArea !== 'undefined') currentArea = null;
                    if (typeof window !== 'undefined') window.currentArea = null;
                    try {
                        if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
                            history.replaceState(null, null, window.location.pathname);
                        }
                    } catch (_) {}

                    const hideIds = [
                        'area-grid-panel',
                        'document-list-panel',
                        'document-viewer-panel',
                        'resizer-2',
                        'stats-badge',
                        'grid-area-stats',
                        'btn-delete-area-header',
                        'grid-tenure-legend',
                        'grid-house-sort-container',
                        'grid-view-options-wrapper',
                        'grid-integrity-toolbar',
                        'open-add-house-modal-btn',
                        'back-to-grid-btn',
                        'tab-back-to-tenants',
                        'document-empty-state'
                    ];
                    hideIds.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            el.classList.add('hidden');
                            el.classList.remove('flex', 'inline-flex', 'grid', 'block');
                        }
                    });

                    const welcomePanel = document.getElementById('welcome-panel');
                    if (welcomePanel) welcomePanel.classList.remove('hidden');

                    const currentHouseTitle = document.getElementById('current-house-title');
                    if (currentHouseTitle) {
                        currentHouseTitle.textContent = hasI18n
                            ? window.i18n.t('nav.select_area', 'Select an Area')
                            : 'Select an Area';
                    }

                    renderSidebar();
                }
            } else {
                renderSidebar();
            }

            const toastFn = (typeof showToast === 'function') ? showToast : (typeof window !== 'undefined' ? window.showToast : null);
            if (toastFn) {
                const msg = isAr
                    ? `تم حذف المنطقة '${areaBeingDeleted}' بنجاح`
                    : (hasI18n ? `${window.i18n.t('delete_area.toast_deleted', 'Area deleted successfully')}: ${areaBeingDeleted}` : `Area '${areaBeingDeleted}' deleted successfully`);
                toastFn(msg, 'success');
            }
        } catch (err) {
            if (statusEl) {
                statusEl.textContent = err.message || 'Failed to delete area.';
                statusEl.classList.remove('hidden');
            }
            if (spinnerEl) spinnerEl.classList.add('hidden');
            if (confirmInput) confirmInput.disabled = false;
            if (confirmBtn) confirmBtn.disabled = false;
        }
    }

    function initDeleteAreaModal() {
        const headerBtn = document.getElementById('btn-delete-area-header');
        if (headerBtn) {
            headerBtn.onclick = (e) => {
                e.preventDefault();
                openDeleteAreaModal();
            };
        }

        const closeBtn = document.getElementById('delete-area-modal-close');
        if (closeBtn) closeBtn.onclick = closeDeleteAreaModal;

        const cancelBtn = document.getElementById('delete-area-cancel');
        if (cancelBtn) cancelBtn.onclick = closeDeleteAreaModal;

        const confirmInput = document.getElementById('delete-area-confirm-input');
        if (confirmInput) {
            confirmInput.oninput = handleDeleteAreaConfirmInput;
            confirmInput.onkeydown = (e) => {
                const confirmBtn = document.getElementById('delete-area-confirm-btn');
                if (e.key === 'Enter' && confirmBtn && !confirmBtn.disabled) {
                    e.preventDefault();
                    executeDeleteArea();
                }
            };
        }

        const confirmBtn = document.getElementById('delete-area-confirm-btn');
        if (confirmBtn) confirmBtn.onclick = executeDeleteArea;

        const modal = document.getElementById('delete-area-modal');
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) closeDeleteAreaModal();
            };
        }

        if (typeof window !== 'undefined') {
            if (window._deleteAreaEscapeHandler) {
                document.removeEventListener('keydown', window._deleteAreaEscapeHandler);
            }
            window._deleteAreaEscapeHandler = (e) => {
                if (e.key === 'Escape') {
                    const m = document.getElementById('delete-area-modal');
                    if (m && !m.classList.contains('hidden')) {
                        closeDeleteAreaModal();
                    }
                }
            };
            document.addEventListener('keydown', window._deleteAreaEscapeHandler);

            if (window._sidebarAuthHandler) {
                window.removeEventListener('auth:user-changed', window._sidebarAuthHandler);
            }
            window._sidebarAuthHandler = () => {
                if (!getTreeLoadingState() && (typeof currentViewMode === 'undefined' || currentViewMode !== 'db')) {
                    renderSidebar();
                }
            };
            window.addEventListener('auth:user-changed', window._sidebarAuthHandler);
        }
    }

    if (typeof document !== 'undefined') {
        const initAll = () => {
            initSidebarCollapse();
            initAddAreaModal();
            initDeleteAreaModal();
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
    window.openDeleteAreaModal = openDeleteAreaModal;
    window.closeDeleteAreaModal = closeDeleteAreaModal;
    window.executeDeleteArea = executeDeleteArea;
    window.initDeleteAreaModal = initDeleteAreaModal;
    window.isSidebarCollapsed = isSidebarCollapsed;
    window.toggleSidebar = toggleSidebar;
    window.initSidebarCollapse = initSidebarCollapse;
})();
