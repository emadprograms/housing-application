import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Header Bar Low Resolution Compression & Compact Tenure Legend', () => {
    const htmlPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/index.html');
    const cssPath = path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/css/styles.css');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    describe('1. HTML Structure & Component Markup', () => {
        beforeEach(() => {
            document.body.innerHTML = htmlContent;
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        it('verifies #top-navbar contains a responsive actions container #top-navbar-actions', () => {
            const topNavbar = document.getElementById('top-navbar');
            expect(topNavbar).not.toBeNull();

            const actionsContainer = document.getElementById('top-navbar-actions');
            expect(actionsContainer).not.toBeNull();
            expect(actionsContainer.classList.contains('min-w-0')).toBe(true);
            expect(topNavbar.contains(actionsContainer)).toBe(true);
        });

        it('verifies #grid-tenure-legend markup includes full and short labels for responsive compression', () => {
            const legend = document.getElementById('grid-tenure-legend');
            expect(legend).not.toBeNull();

            // Verify informative title tooltip on container
            expect(legend.getAttribute('title')).toContain('Tenure Duration');

            // Verify legend items
            const items = legend.querySelectorAll('.legend-item');
            expect(items.length).toBe(4);

            // Full text content requirements
            const fullLabels = legend.querySelectorAll('.legend-text-full');
            expect(fullLabels.length).toBe(4);
            expect(fullLabels[0].textContent).toContain('< 5y');
            expect(fullLabels[1].textContent).toContain('5–10y');
            expect(fullLabels[2].textContent).toContain('> 10y');
            expect(fullLabels[3].textContent).toContain('Vacant');

            // Short text content requirements for compact mode
            const shortLabels = legend.querySelectorAll('.legend-text-short');
            expect(shortLabels.length).toBe(4);
            expect(shortLabels[0].textContent).toBe('<5y');
            expect(shortLabels[1].textContent).toBe('5–10y');
            expect(shortLabels[2].textContent).toBe('>10y');
            expect(shortLabels[3].textContent).toBe('Vac');

            // Verify dividers exist
            const dividers = legend.querySelectorAll('.legend-divider');
            expect(dividers.length).toBe(3);

            // Tooltip title attributes on individual color dots/items
            expect(items[0].getAttribute('title')).toContain('< 5');
            expect(items[1].getAttribute('title')).toContain('5–10');
            expect(items[2].getAttribute('title')).toContain('> 10');
            expect(items[3].getAttribute('title')).toContain('Vacant');
        });

        it('verifies search trigger has fluid responsive width and shrink behavior', () => {
            const searchTrigger = document.getElementById('btn-search-trigger');
            expect(searchTrigger).not.toBeNull();
            expect(searchTrigger.classList.contains('flex-shrink')).toBe(true);
            expect(searchTrigger.classList.contains('min-w-[110px]')).toBe(true);
        });

        it('verifies user profile button has #user-profile-details wrapper for graceful hiding on narrow screens', () => {
            const profileBtn = document.getElementById('user-profile-btn');
            expect(profileBtn).not.toBeNull();

            const details = document.getElementById('user-profile-details');
            expect(details).not.toBeNull();
            expect(profileBtn.contains(details)).toBe(true);

            const displayName = document.getElementById('user-display-name');
            const roleBadge = document.getElementById('user-role-badge');
            expect(details.contains(displayName)).toBe(true);
            expect(details.contains(roleBadge)).toBe(true);
        });
    });

    describe('2. CSS Responsive Compression Rules in styles.css', () => {
        it('defines base flex and min-width constraints for navbar components', () => {
            expect(cssContent).toContain('#top-navbar {');
            expect(cssContent).toContain('#top-navbar-actions {');
            expect(cssContent).toContain('#current-house-title {');
            expect(cssContent).toContain('#btn-search-trigger {');
            expect(cssContent).toContain('min-width: 0;');
        });

        it('defines responsive compression rules for 1024px–1366px screens (@media max-width: 1366px)', () => {
            expect(cssContent).toContain('@media (max-width: 1366px)');
            
            // Search trigger scaling
            expect(cssContent).toMatch(/@media\s*\(max-width:\s*1366px\)[^}]*\{[\s\S]*#btn-search-trigger\s*\{[\s\S]*max-width:\s*180px\s*!important/);

            // Compact legend with short labels and hidden dividers
            expect(cssContent).toMatch(/#grid-tenure-legend\s*\.legend-divider\s*\{[^}]*display:\s*none\s*!important/);
            expect(cssContent).toMatch(/#grid-tenure-legend\s*\.legend-text-full\s*\{[^}]*display:\s*none\s*!important/);
            expect(cssContent).toMatch(/#grid-tenure-legend\s*\.legend-text-short\s*\{[^}]*display:\s*inline\s*!important/);
        });

        it('defines compact viewport rules for <= 1200px (@media max-width: 1200px)', () => {
            expect(cssContent).toContain('@media (max-width: 1200px)');
            expect(cssContent).toMatch(/@media\s*\(max-width:\s*1200px\)[^}]*\{[\s\S]*#user-profile-details\s*\{[^}]*display:\s*none\s*!important/);
        });

        it('defines compact dots pill rules for <= 1120px (@media max-width: 1120px)', () => {
            expect(cssContent).toContain('@media (max-width: 1120px)');
            expect(cssContent).toMatch(/#grid-tenure-legend\s*\{[\s\S]*border-radius:\s*9999px\s*!important/);
            expect(cssContent).toMatch(/#grid-tenure-legend\s*\.legend-text\s*\{[^}]*display:\s*none\s*!important/);
        });
    });

    describe('3. Dynamic Lifecycle & Route Transitions', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <header id="top-navbar">
                    <button id="sidebar-toggle-btn"></button>
                    <button id="back-to-grid-btn" class="hidden"></button>
                    <h1 id="current-house-title">Select an Area</h1>
                    <span id="grid-area-title" class="hidden"></span>
                    <div id="stats-badge" class="hidden"></div>
                    <div id="grid-area-stats" class="hidden">0 Houses</div>
                    <div id="top-navbar-actions">
                        <div id="grid-tenure-legend" class="hidden"></div>
                        <div id="grid-view-options-wrapper" class="hidden"></div>
                        <div id="grid-house-sort-container" class="hidden"></div>
                        <div id="grid-integrity-toolbar" class="hidden"></div>
                        <button id="btn-search-trigger"></button>
                    </div>
                </header>
                <div id="welcome-panel" class="hidden"></div>
                <div id="document-list-panel" class="hidden"></div>
                <div id="document-viewer-panel" class="hidden"></div>
                <div id="database-inspector-panel" class="hidden"></div>
                <div id="resizer-2" class="hidden"></div>
                <div id="tab-back-to-tenants" class="hidden"></div>
                <div id="area-grid-panel" class="hidden">
                    <div id="area-grid-container"></div>
                </div>
            `;

            global.currentArea = '';
            global.currentHouse = null;
            global.currentTenant = null;
            global.currentTab = 'categories';
            global.currentViewMode = 'overview';
            window.currentArea = '';
            window.currentHouse = null;
            window.currentTenant = null;

            const areaGridCode = fs.readFileSync(
                path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/area-grid.js'),
                'utf8'
            );
            eval(areaGridCode);

            const routerCode = fs.readFileSync(
                path.resolve(__dirname, '../../../src/HousingApplication.Web/wwwroot/js/router.js'),
                'utf8'
            );
            eval(routerCode);
        });

        afterEach(() => {
            document.body.innerHTML = '';
            vi.restoreAllMocks();
        });

        it('displays tenure legend in flex mode when area grid is rendered', () => {
            const areaNode = {
                name: 'Zone Alpha',
                children: [
                    { id: 'H1', name: 'House 1', duration_category: 'short', tenants: [] }
                ]
            };

            window.renderAreaGrid(areaNode);

            const legend = document.getElementById('grid-tenure-legend');
            expect(legend.classList.contains('hidden')).toBe(false);
            expect(legend.classList.contains('flex')).toBe(true);
        });

        it('hides tenure legend when navigating to a specific house from grid', () => {
            const areaNode = {
                name: 'Zone Alpha',
                children: [
                    { id: 'H1', name: 'House 1', duration_category: 'short', tenants: [] }
                ]
            };

            window.renderAreaGrid(areaNode);
            const legend = document.getElementById('grid-tenure-legend');
            expect(legend.classList.contains('hidden')).toBe(false);

            window.openHouseFromGrid('Zone Alpha', 'H1');
            expect(legend.classList.contains('hidden')).toBe(true);
        });

        it('hides tenure legend when switching to database inspector mode', () => {
            const areaNode = {
                name: 'Zone Alpha',
                children: [
                    { id: 'H1', name: 'House 1', duration_category: 'short', tenants: [] }
                ]
            };

            window.renderAreaGrid(areaNode);
            window.switchToViewMode('db');

            const legend = document.getElementById('grid-tenure-legend');
            expect(legend.classList.contains('hidden')).toBe(true);
        });
    });
});
