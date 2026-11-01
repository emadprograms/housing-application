/**
 * Storage & Database Path Settings Controller (Admin-only)
 * Enables viewing, server-side folder/.db browsing, dry-run validation,
 * and live hot-swapping of AREAS_ROOT_PATH and ORGANIZER_DB_PATH.
 */
(function () {
    'use strict';

    let browserTargetMode = 'areas'; // 'areas' | 'db'
    let browserCurrentPath = '';
    let browserParentPath = null;
    let lastLoadedAreasPath = '';
    let isInitialized = false;

    function tr(key, fallback) {
        if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
            const val = window.i18n.t(key, fallback || '');
            return val || fallback || key;
        }
        return fallback || key;
    }

    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatBytes(bytes) {
        const num = Number(bytes) || 0;
        if (num <= 0) return '0 B';
        if (num < 1024) return `${num} B`;
        if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
        return `${(num / (1024 * 1024)).toFixed(2)} MB`;
    }

    function cleanPathString(raw) {
        if (!raw) return '';
        return String(raw).trim().replace(/^["']+|["']+$/g, '').trim();
    }

    function joinOrganizerDbPath(areasPath) {
        const clean = cleanPathString(areasPath).replace(/[\\/]+$/, '');
        if (!clean) return 'organizer.db';
        const sep = (clean.includes('\\') || /^[A-Za-z]:/.test(clean)) ? '\\' : '/';
        return `${clean}${sep}organizer.db`;
    }

    function isContributorAccount() {
        return Boolean(
            typeof window !== 'undefined' &&
            window.authManager &&
            typeof window.authManager.isContributor === 'function' &&
            window.authManager.isContributor()
        );
    }

    function syncRbacVisibility() {
        const hideAdminControls = isContributorAccount();
        const menuBtn = document.getElementById('btn-open-storage-settings');
        if (menuBtn) {
            menuBtn.classList.toggle('hidden', hideAdminControls);
        }
        const dbBtn = document.getElementById('db-change-paths-btn');
        if (dbBtn) {
            dbBtn.classList.toggle('hidden', hideAdminControls);
        }
    }

    function showFeedback(type, title, detailsHtml) {
        const banner = document.getElementById('storage-feedback-banner');
        if (!banner) return;

        const styles = type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200'
            : type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200';

        banner.className = `rounded-xl border p-3 text-xs space-y-1.5 ${styles}`;
        banner.innerHTML = `
            <div class="font-bold flex items-center gap-1.5">
                <span>${type === 'error' ? '⚠️' : '✓'}</span>
                <span>${esc(title)}</span>
            </div>
            ${detailsHtml ? `<div class="text-[11px] opacity-90 space-y-1">${detailsHtml}</div>` : ''}
        `;
        banner.classList.remove('hidden');
    }

    function clearFeedback() {
        const banner = document.getElementById('storage-feedback-banner');
        if (banner) {
            banner.classList.add('hidden');
            banner.innerHTML = '';
        }
    }

    function renderActiveSummary(settings) {
        const container = document.getElementById('storage-active-summary');
        if (!container || !settings) return;

        const areasOk = Boolean(settings.areas_root_exists);
        const dbOk = Boolean(settings.organizer_db_exists);
        const tables = settings.tables || {};
        const housesCount = tables.houses !== undefined ? tables.houses : 0;
        const docsCount = tables.documents !== undefined ? tables.documents : 0;
        const areaDirs = settings.area_directory_count !== undefined ? settings.area_directory_count : 0;

        const areasStatusLabel = areasOk
            ? `${tr('storage_settings.status_exists', 'Exists')} · ${areaDirs} ${tr('common.areas', 'Areas')}`
            : tr('storage_settings.status_missing', 'Missing');

        const dbStatusLabel = dbOk
            ? `${tr('storage_settings.status_connected', 'Connected')} · ${formatBytes(settings.organizer_db_size_bytes)} · ${housesCount} ${tr('common.houses', 'Houses')} / ${docsCount} ${tr('common.documents', 'Documents')}`
            : tr('storage_settings.status_missing', 'Missing');

        container.innerHTML = `
            <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300">${esc(tr('storage_settings.areas_label', 'Areas Archive Folder Path'))}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${areasOk ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'}">${esc(areasStatusLabel)}</span>
                </div>
                <div dir="ltr" class="font-mono text-[11px] text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 truncate">${esc(settings.areas_root_path || '')}</div>
            </div>
            <div class="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300">${esc(tr('storage_settings.db_label', 'SQLite Database File Path'))}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${dbOk ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'}">${esc(dbStatusLabel)}</span>
                </div>
                <div dir="ltr" class="font-mono text-[11px] text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 truncate">${esc(settings.organizer_db_path || '')}</div>
            </div>
        `;
    }

    async function loadCurrentStorageSettings() {
        const areasInput = document.getElementById('storage-areas-path-input');
        const dbInput = document.getElementById('storage-db-path-input');

        try {
            const res = await fetch('/api/settings/paths');
            if (res.status === 404 || res.status === 405) {
                showFeedback(
                    'error',
                    tr('storage_settings.verify_fail_title', 'Path verification failed'),
                    esc(tr('storage_settings.outdated_binary_error', 'Run scripts\\build-windows.bat once to enable path configuration.'))
                );
                return;
            }
            if (res.status === 403) {
                showFeedback(
                    'error',
                    tr('storage_settings.admin_only_error', 'Administrator privileges are required to modify storage paths.'),
                    ''
                );
                return;
            }
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            lastLoadedAreasPath = data.areas_root_path || '';

            if (areasInput) areasInput.value = data.areas_root_path || '';
            if (dbInput) dbInput.value = data.organizer_db_path || '';

            renderActiveSummary(data);
        } catch (err) {
            showFeedback(
                'error',
                tr('common.error', 'An error occurred'),
                esc(err && err.message ? err.message : String(err))
            );
        }
    }

    async function openStorageSettingsModal() {
        if (isContributorAccount()) {
            if (typeof window.showToast === 'function') {
                window.showToast(tr('storage_settings.admin_only_error', 'Administrator privileges are required to modify storage paths.'), 'error');
            }
            return;
        }

        // Close profile dropdown if open
        if (window.authManager && typeof window.authManager.toggleProfileDropdown === 'function') {
            window.authManager.toggleProfileDropdown(false);
        } else {
            const dropdown = document.getElementById('user-profile-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
        }

        const modal = document.getElementById('storage-settings-modal');
        if (!modal) return;

        clearFeedback();
        closeServerBrowser();

        const createMissingCheckbox = document.getElementById('storage-create-missing-checkbox');
        if (createMissingCheckbox) createMissingCheckbox.checked = false;

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');

        if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
            window.i18n.applyTranslations(modal);
        }

        await loadCurrentStorageSettings();
    }

    function closeStorageSettingsModal() {
        const modal = document.getElementById('storage-settings-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        closeServerBrowser();
    }

    function closeServerBrowser() {
        const panel = document.getElementById('storage-browser-panel');
        if (panel) panel.classList.add('hidden');
    }

    async function openServerBrowser(mode) {
        browserTargetMode = mode === 'db' ? 'db' : 'areas';
        const panel = document.getElementById('storage-browser-panel');
        if (!panel) return;

        panel.classList.remove('hidden');

        const areasInput = document.getElementById('storage-areas-path-input');
        const dbInput = document.getElementById('storage-db-path-input');
        const seedPath = browserTargetMode === 'db'
            ? (cleanPathString(dbInput && dbInput.value) || cleanPathString(areasInput && areasInput.value))
            : cleanPathString(areasInput && areasInput.value);

        await loadBrowserDirectory(seedPath);
    }

    async function loadBrowserDirectory(targetPath) {
        const entriesContainer = document.getElementById('storage-browser-entries');
        const rootsContainer = document.getElementById('storage-browser-roots');
        const currentPathEl = document.getElementById('storage-browser-current-path');
        const upBtn = document.getElementById('btn-storage-browser-up');

        if (entriesContainer) {
            entriesContainer.innerHTML = `<div class="py-4 text-center text-xs text-slate-400">${esc(tr('common.loading', 'Loading...'))}</div>`;
        }

        try {
            const params = new URLSearchParams();
            if (targetPath) params.set('path', targetPath);
            params.set('includeDbFiles', 'true');

            const res = await fetch(`/api/settings/browse?${params.toString()}`);
            if (res.status === 404 || res.status === 405) {
                showFeedback(
                    'error',
                    tr('storage_settings.verify_fail_title', 'Path verification failed'),
                    esc(tr('storage_settings.outdated_binary_error', 'Run scripts\\build-windows.bat once to enable path configuration.'))
                );
                closeServerBrowser();
                return;
            }
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            browserCurrentPath = data.current_path || '';
            browserParentPath = data.parent_path || null;

            if (currentPathEl) currentPathEl.textContent = browserCurrentPath;
            if (upBtn) upBtn.disabled = !browserParentPath;

            if (rootsContainer) {
                rootsContainer.innerHTML = '';
                (data.roots || []).forEach(rootPath => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.dir = 'ltr';
                    btn.className = 'px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer';
                    btn.textContent = rootPath;
                    btn.addEventListener('click', () => loadBrowserDirectory(rootPath));
                    rootsContainer.appendChild(btn);
                });
            }

            if (entriesContainer) {
                entriesContainer.innerHTML = '';
                const entries = data.entries || [];
                if (entries.length === 0) {
                    entriesContainer.innerHTML = `<div class="py-4 text-center text-xs text-slate-400">${esc(tr('storage_settings.browser_empty', 'No subdirectories or SQLite files found in this location.'))}</div>`;
                    return;
                }

                entries.forEach(entry => {
                    const row = document.createElement('button');
                    row.type = 'button';
                    row.dir = 'ltr';
                    row.className = 'w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer';

                    if (entry.is_directory) {
                        row.innerHTML = `
                            <span class="flex items-center gap-2 min-w-0 font-medium text-slate-800 dark:text-slate-200 truncate">
                                <span class="text-amber-500 flex-shrink-0">📁</span>
                                <span class="font-mono truncate">${esc(entry.name)}</span>
                            </span>
                            <span class="text-[10px] text-slate-400 flex-shrink-0">→</span>
                        `;
                        row.addEventListener('click', () => loadBrowserDirectory(entry.path));
                    } else {
                        row.innerHTML = `
                            <span class="flex items-center gap-2 min-w-0 font-semibold text-indigo-700 dark:text-indigo-300 truncate">
                                <span class="flex-shrink-0">🗄️</span>
                                <span class="font-mono truncate">${esc(entry.name)}</span>
                            </span>
                            <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex-shrink-0">${esc(formatBytes(entry.size_bytes))}</span>
                        `;
                        row.addEventListener('click', () => {
                            const dbInput = document.getElementById('storage-db-path-input');
                            const areasInput = document.getElementById('storage-areas-path-input');
                            if (dbInput) dbInput.value = entry.path;
                            if (browserTargetMode === 'areas' && areasInput && browserCurrentPath) {
                                areasInput.value = browserCurrentPath;
                                lastLoadedAreasPath = browserCurrentPath;
                            }
                            closeServerBrowser();
                        });
                    }

                    entriesContainer.appendChild(row);
                });
            }
        } catch (err) {
            if (entriesContainer) {
                entriesContainer.innerHTML = `<div class="py-3 text-center text-xs text-rose-500">${esc(err && err.message ? err.message : String(err))}</div>`;
            }
        }
    }

    function applyCurrentBrowserFolder() {
        if (!browserCurrentPath) return;

        const areasInput = document.getElementById('storage-areas-path-input');
        const dbInput = document.getElementById('storage-db-path-input');

        if (browserTargetMode === 'areas') {
            const prevAreas = cleanPathString(areasInput && areasInput.value) || lastLoadedAreasPath;
            const prevDefaultDb = prevAreas ? joinOrganizerDbPath(prevAreas) : '';
            if (areasInput) areasInput.value = browserCurrentPath;

            if (dbInput) {
                const currentDbVal = cleanPathString(dbInput.value);
                if (!currentDbVal || (prevDefaultDb && currentDbVal.toLowerCase() === prevDefaultDb.toLowerCase())) {
                    dbInput.value = joinOrganizerDbPath(browserCurrentPath);
                }
            }
            lastLoadedAreasPath = browserCurrentPath;
        } else if (dbInput) {
            dbInput.value = joinOrganizerDbPath(browserCurrentPath);
        }

        closeServerBrowser();
    }

    function collectFormPayload() {
        const areasInput = document.getElementById('storage-areas-path-input');
        const dbInput = document.getElementById('storage-db-path-input');
        const createMissingCheckbox = document.getElementById('storage-create-missing-checkbox');

        const areasVal = cleanPathString(areasInput && areasInput.value);
        const dbVal = cleanPathString(dbInput && dbInput.value);

        return {
            areas_root_path: areasVal,
            organizer_db_path: dbVal || (areasVal ? joinOrganizerDbPath(areasVal) : ''),
            create_if_missing: Boolean(createMissingCheckbox && createMissingCheckbox.checked)
        };
    }

    async function verifyStoragePaths() {
        const verifyBtn = document.getElementById('btn-validate-storage-paths');
        const verifyLabel = verifyBtn ? verifyBtn.querySelector('[data-i18n]') : null;
        const payload = collectFormPayload();

        if (verifyBtn) verifyBtn.disabled = true;
        if (verifyLabel) verifyLabel.textContent = tr('storage_settings.verifying_btn', 'Verifying...');

        try {
            const res = await fetch('/api/settings/paths/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 404 || res.status === 405) {
                showFeedback(
                    'error',
                    tr('storage_settings.verify_fail_title', 'Path verification failed'),
                    esc(tr('storage_settings.outdated_binary_error', 'Run scripts\\build-windows.bat once to enable path configuration.'))
                );
                return;
            }

            const result = await res.json();
            const tables = result.tables || {};
            const sampleAreasText = (result.sample_areas && result.sample_areas.length > 0)
                ? ` (${result.sample_areas.map(esc).join(', ')})`
                : '';

            const details = `
                <div dir="ltr" class="font-mono break-all">📁 ${esc(result.areas_root_path || payload.areas_root_path)} — <strong>${result.areas_root_exists ? `${result.area_directory_count || 0} area(s)` : 'missing'}</strong>${sampleAreasText}</div>
                <div dir="ltr" class="font-mono break-all">🗄️ ${esc(result.organizer_db_path || payload.organizer_db_path)} — <strong>${result.organizer_db_exists ? `${formatBytes(result.organizer_db_size_bytes)} · ${tables.houses ?? 0} houses · ${tables.documents ?? 0} docs` : 'new / missing'}</strong></div>
                ${result.message ? `<div>${esc(result.message)}</div>` : ''}
            `;

            if (result.valid) {
                showFeedback('success', tr('storage_settings.verify_ok_title', 'Paths verified and ready to apply'), details);
            } else {
                showFeedback('error', tr('storage_settings.verify_fail_title', 'Path verification failed'), details);
            }
        } catch (err) {
            showFeedback(
                'error',
                tr('storage_settings.verify_fail_title', 'Path verification failed'),
                esc(err && err.message ? err.message : String(err))
            );
        } finally {
            if (verifyBtn) verifyBtn.disabled = false;
            if (verifyLabel) verifyLabel.textContent = tr('storage_settings.verify_btn', 'Verify Paths');
        }
    }

    async function saveStoragePaths(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();

        const saveBtn = document.getElementById('btn-save-storage-paths');
        const saveLabel = saveBtn ? saveBtn.querySelector('[data-i18n]') : null;
        const payload = collectFormPayload();

        if (saveBtn) saveBtn.disabled = true;
        if (saveLabel) saveLabel.textContent = tr('storage_settings.saving_btn', 'Applying...');

        try {
            const res = await fetch('/api/settings/paths', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 404 || res.status === 405) {
                showFeedback(
                    'error',
                    tr('storage_settings.verify_fail_title', 'Path verification failed'),
                    esc(tr('storage_settings.outdated_binary_error', 'Run scripts\\build-windows.bat once to enable path configuration.'))
                );
                return;
            }

            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                showFeedback(
                    'error',
                    tr('storage_settings.verify_fail_title', 'Path verification failed'),
                    esc(body.error || `HTTP ${res.status}`)
                );
                return;
            }

            renderActiveSummary(body);
            lastLoadedAreasPath = body.areas_root_path || payload.areas_root_path;

            // Reset stale archive selection and hot-reload tree & database inspector
            if (typeof currentArea !== 'undefined') currentArea = null;
            if (typeof currentHouse !== 'undefined') currentHouse = null;
            if (typeof currentTenant !== 'undefined') currentTenant = null;
            if (typeof searchIndexData !== 'undefined') searchIndexData = null;

            if (window.location.hash && window.location.hash !== '#/') {
                window.location.hash = '#/';
            }

            if (typeof window.loadTree === 'function') {
                await window.loadTree();
            }
            if (typeof currentViewMode !== 'undefined' && currentViewMode === 'db' && typeof window.loadDbInspector === 'function') {
                await window.loadDbInspector();
            }

            closeStorageSettingsModal();

            if (typeof window.showToast === 'function') {
                window.showToast(tr('storage_settings.save_success', 'Storage & database paths updated and applied live.'), 'success');
            }
        } catch (err) {
            showFeedback(
                'error',
                tr('common.error', 'An error occurred'),
                esc(err && err.message ? err.message : String(err))
            );
        } finally {
            if (saveBtn) saveBtn.disabled = false;
            if (saveLabel) saveLabel.textContent = tr('storage_settings.save_btn', 'Save & Apply Now');
        }
    }

    function initStorageSettings() {
        if (isInitialized) {
            syncRbacVisibility();
            return;
        }
        isInitialized = true;

        const openMenuBtn = document.getElementById('btn-open-storage-settings');
        if (openMenuBtn) {
            openMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openStorageSettingsModal();
            });
        }

        const closeBtn = document.getElementById('btn-close-storage-settings');
        if (closeBtn) closeBtn.addEventListener('click', closeStorageSettingsModal);

        const cancelBtn = document.getElementById('btn-cancel-storage-settings');
        if (cancelBtn) cancelBtn.addEventListener('click', closeStorageSettingsModal);

        const modal = document.getElementById('storage-settings-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeStorageSettingsModal();
            });
        }

        const useAreasDbBtn = document.getElementById('btn-use-areas-db-path');
        if (useAreasDbBtn) {
            useAreasDbBtn.addEventListener('click', () => {
                const areasInput = document.getElementById('storage-areas-path-input');
                const dbInput = document.getElementById('storage-db-path-input');
                if (dbInput && areasInput) {
                    dbInput.value = joinOrganizerDbPath(areasInput.value);
                }
            });
        }

        const browseAreasBtn = document.getElementById('btn-browse-areas-path');
        if (browseAreasBtn) {
            browseAreasBtn.addEventListener('click', () => openServerBrowser('areas'));
        }

        const browseDbBtn = document.getElementById('btn-browse-db-path');
        if (browseDbBtn) {
            browseDbBtn.addEventListener('click', () => openServerBrowser('db'));
        }

        const browserUpBtn = document.getElementById('btn-storage-browser-up');
        if (browserUpBtn) {
            browserUpBtn.addEventListener('click', () => {
                if (browserParentPath) loadBrowserDirectory(browserParentPath);
            });
        }

        const browserSelectBtn = document.getElementById('btn-storage-browser-select-current');
        if (browserSelectBtn) {
            browserSelectBtn.addEventListener('click', applyCurrentBrowserFolder);
        }

        const browserCloseBtn = document.getElementById('btn-storage-browser-close');
        if (browserCloseBtn) {
            browserCloseBtn.addEventListener('click', closeServerBrowser);
        }

        const verifyBtn = document.getElementById('btn-validate-storage-paths');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', verifyStoragePaths);
        }

        const form = document.getElementById('storage-settings-form');
        if (form) {
            form.addEventListener('submit', saveStoragePaths);
        }

        window.addEventListener('auth:user-changed', syncRbacVisibility);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                closeStorageSettingsModal();
            }
        });

        syncRbacVisibility();
    }

    window.initStorageSettings = initStorageSettings;
    window.openStorageSettingsModal = openStorageSettingsModal;
    window.closeStorageSettingsModal = closeStorageSettingsModal;
    window.joinOrganizerDbPath = joinOrganizerDbPath;
    window._resetStorageSettingsForTests = function () {
        isInitialized = false;
        browserTargetMode = 'areas';
        browserCurrentPath = '';
        browserParentPath = null;
        lastLoadedAreasPath = '';
    };
})();
