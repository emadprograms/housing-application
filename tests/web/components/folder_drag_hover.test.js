import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const {
    createCategoryCardElement,
    clearAllCategoryDropHighlights,
} = require('../../../src/HousingApplication.Web/wwwroot/js/categories-view.js');

const {
    initIngestStation,
    resetDragCounter,
} = require('../../../src/HousingApplication.Web/wwwroot/js/ingest-station.js');

function setupDOM() {
    document.body.innerHTML = `
        <div id="top-navbar">
            <button id="btn-ingest-trigger"></button>
        </div>
        <div id="ingest-dropzone-overlay" class="fixed inset-0 z-50 bg-blue-900/40 backdrop-blur-xs border-4 border-dashed border-blue-400 hidden flex items-center justify-center pointer-events-none transition-all">
            <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-blue-200 pointer-events-none flex flex-col items-center">
                <h3 class="text-lg font-bold text-slate-900 mb-1">Upload Document</h3>
                <p id="ingest-dropzone-prompt" class="text-sm text-blue-700 font-semibold">Drop PDF to Upload into [Area / House]</p>
            </div>
        </div>
        <div id="ingest-station-modal" class="hidden">
            <div id="ingest-station-card">
                <button id="btn-ingest-close">Close</button>
                <div id="section-mode-single"></div>
                <div id="section-mode-broadcast" class="hidden"></div>
                <div id="section-mode-housebatch" class="hidden"></div>
                <input id="ingest-file-input" type="file" />
                <span id="ingest-submit-text">Upload Document</span>
                <button id="btn-ingest-cancel">Cancel</button>
                <button id="btn-ingest-submit"></button>
            </div>
        </div>
        <div id="categories-container"></div>
    `;
}

describe('Folder Drag Hover and Upload Direct Filing UX', () => {
    beforeEach(() => {
        setupDOM();
        window.currentArea = 'Area 1';
        window.currentHouse = '101';
        window.currentTenant = 'Tenant A';
        window.draggedDoc = null;
        window.isDraggingFiles = false;
        window.isHoveringCategoryFolder = false;

        initIngestStation();
    });

    afterEach(() => {
        resetDragCounter();
        clearAllCategoryDropHighlights();
        vi.restoreAllMocks();
    });

    function createMockDragEvent(type, types = ['Files'], files = []) {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'dataTransfer', {
            value: {
                types,
                files,
                dropEffect: 'none',
            },
            writable: true,
        });
        return event;
    }

    it('1. Displays global dropzone overlay when dragging external files into window when not over category', () => {
        const overlay = document.getElementById('ingest-dropzone-overlay');
        expect(overlay.classList.contains('hidden')).toBe(true);

        const dragEnterEvent = createMockDragEvent('dragenter', ['Files']);
        window.dispatchEvent(dragEnterEvent);

        expect(overlay.classList.contains('hidden')).toBe(false);
        expect(window.isDraggingFiles).toBe(true);
        expect(document.body.classList.contains('is-dragging-file')).toBe(true);
    });

    it('2. When hovering over a category folder card, hides global overlay, highlights the folder, and displays "Drop to upload to this folder" EXACTLY ONCE', () => {
        const overlay = document.getElementById('ingest-dropzone-overlay');
        overlay.classList.remove('hidden');
        window.isDraggingFiles = true;

        const catData = {
            name: '05 - عقود',
            document_count: 0,
            documents: []
        };
        const card = createCategoryCardElement(catData);
        document.getElementById('categories-container').appendChild(card);

        // Hover over category card with external file
        const dragOverEvent = createMockDragEvent('dragover', ['Files']);
        card.ondragover(dragOverEvent);

        // Global overlay must yield and hide
        expect(overlay.classList.contains('hidden')).toBe(true);
        expect(window.isHoveringCategoryFolder).toBe(true);

        // Folder must be highlighted
        expect(card.classList.contains('ring-2')).toBe(true);
        expect(card.classList.contains('ring-blue-500')).toBe(true);
        expect(card.classList.contains('border-blue-500')).toBe(true);

        // Drop hint must be shown with exact required text
        const hint = card.querySelector('.category-drop-hint');
        expect(hint).not.toBeNull();
        expect(hint.classList.contains('hidden')).toBe(false);
        expect(hint.textContent).toBe('Drop to upload to this folder');

        // MUST NOT duplicate: "Drop to upload to this folder" must appear EXACTLY ONCE on the entire card
        const occurrences = (card.innerHTML.match(/Drop to upload to this folder/g) || []).length;
        expect(occurrences).toBe(1);

        // Verify no emojis in hint
        const emojiRegex = /[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
        expect(emojiRegex.test(hint.textContent)).toBe(false);
    });

    it('3. When moving away from the category folder card into empty space, removes highlight and restores global overlay', async () => {
        const overlay = document.getElementById('ingest-dropzone-overlay');
        window.isDraggingFiles = true;

        const catData = { name: '01 - بيانات أساسية', documents: [] };
        const card = createCategoryCardElement(catData);
        document.getElementById('categories-container').appendChild(card);

        // Enter
        const dragOverEvent = createMockDragEvent('dragover', ['Files']);
        card.ondragover(dragOverEvent);
        expect(card.classList.contains('ring-2')).toBe(true);
        expect(overlay.classList.contains('hidden')).toBe(true);

        // Leave into neutral space
        const dragLeaveEvent = createMockDragEvent('dragleave', ['Files']);
        card.ondragleave(dragLeaveEvent);

        // Highlight removed immediately
        expect(card.classList.contains('ring-2')).toBe(false);
        const hint = card.querySelector('.category-drop-hint');
        expect(hint.classList.contains('hidden')).toBe(true);

        // Overlay is restored after transition timeout
        await new Promise(r => setTimeout(r, 60));
        expect(overlay.classList.contains('hidden')).toBe(false);
    });

    it('4. When moving directly from Category A to Category B, transitions highlight smoothly while keeping overlay hidden', async () => {
        const overlay = document.getElementById('ingest-dropzone-overlay');
        window.isDraggingFiles = true;

        const cardA = createCategoryCardElement({ name: '01 - بيانات أساسية', documents: [] });
        const cardB = createCategoryCardElement({ name: '02 - بيانات شخصية', documents: [] });
        document.getElementById('categories-container').appendChild(cardA);
        document.getElementById('categories-container').appendChild(cardB);

        // Hover Card A
        const dragOverA = createMockDragEvent('dragover', ['Files']);
        cardA.ondragover(dragOverA);
        expect(cardA.classList.contains('ring-2')).toBe(true);
        expect(overlay.classList.contains('hidden')).toBe(true);

        // Move to Card B (dragleave on A with relatedTarget = cardB)
        const dragLeaveA = createMockDragEvent('dragleave', ['Files']);
        dragLeaveA.relatedTarget = cardB;
        cardA.ondragleave(dragLeaveA);

        const dragOverB = createMockDragEvent('dragover', ['Files']);
        cardB.ondragover(dragOverB);

        expect(cardA.classList.contains('ring-2')).toBe(false);
        expect(cardB.classList.contains('ring-2')).toBe(true);
        expect(overlay.classList.contains('hidden')).toBe(true);

        await new Promise(r => setTimeout(r, 60));
        expect(overlay.classList.contains('hidden')).toBe(true);
    });

    it('5. Dropping file on category card clears highlight and triggers handleDirectCategoryDrop', () => {
        window.handleDirectCategoryDrop = vi.fn();

        const catData = { name: '05 - عقود', documents: [] };
        const card = createCategoryCardElement(catData);
        document.getElementById('categories-container').appendChild(card);

        // Hover
        const dragOver = createMockDragEvent('dragover', ['Files']);
        card.ondragover(dragOver);
        expect(card.classList.contains('ring-2')).toBe(true);

        // Drop
        const testFile = new File(['%PDF-1.4 test'], 'contract.pdf', { type: 'application/pdf' });
        const dropEvent = createMockDragEvent('drop', ['Files'], [testFile]);
        card.ondrop(dropEvent);

        // Highlight must be removed
        expect(card.classList.contains('ring-2')).toBe(false);
        expect(card.querySelector('.category-drop-hint').classList.contains('hidden')).toBe(true);

        // Overlay stays hidden
        const overlay = document.getElementById('ingest-dropzone-overlay');
        expect(overlay.classList.contains('hidden')).toBe(true);

        // Direct category drop invoked with file and category name
        expect(window.handleDirectCategoryDrop).toHaveBeenCalledWith(
            [testFile],
            '05 - عقود',
            '101',
            'Area 1',
            'Tenant A'
        );
    });

    it('6. clearAllCategoryDropHighlights removes all drop highlights across all category cards', () => {
        const card1 = createCategoryCardElement({ name: '01 - بيانات أساسية', documents: [] });
        const card2 = createCategoryCardElement({ name: '02 - بيانات شخصية', documents: [] });
        document.getElementById('categories-container').appendChild(card1);
        document.getElementById('categories-container').appendChild(card2);

        card1.classList.add('ring-2', 'ring-blue-500');
        card1.querySelector('.category-drop-hint').classList.remove('hidden');
        card2.classList.add('ring-2', 'ring-blue-500');
        card2.querySelector('.category-drop-hint').classList.remove('hidden');

        clearAllCategoryDropHighlights();

        expect(card1.classList.contains('ring-2')).toBe(false);
        expect(card1.querySelector('.category-drop-hint').classList.contains('hidden')).toBe(true);
        expect(card2.classList.contains('ring-2')).toBe(false);
        expect(card2.querySelector('.category-drop-hint').classList.contains('hidden')).toBe(true);
    });
});
