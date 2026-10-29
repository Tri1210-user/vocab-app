// ==========================================================================
// VOCABMASTER - CORE APPLICATION LOGIC
// ==========================================================================

// Helper: Detect and exclude deprecated default sample presets
function isSamplePresetTitle(title) {
    if (!title) return false;
    return title.startsWith("TOEIC #1:") || title.startsWith("TOEIC #2:") || title.startsWith("TOEIC #3:") || title === "VOCABULARY TOEIC READING #1";
}

// Preset Folder Customization Options
const PRESET_FOLDER_ICONS = [
    '📁', '📂', '📚', '💼', '🎓', '🌟', '🎯', '💡',
    '🚀', '🏷️', '🌐', '💻', '📝', '🔥', '☕', '🏆',
    '✈️', '🔬', '🎨', '🎵', '🏥', '⚖️'
];

const PRESET_FOLDER_COLORS = [
    { hex: '#3b82f6', name: 'Xanh dương' },
    { hex: '#10b981', name: 'Xanh ngọc lục' },
    { hex: '#6366f1', name: 'Tím Indigo' },
    { hex: '#8b5cf6', name: 'Tím Violet' },
    { hex: '#ec4899', name: 'Hồng tươi' },
    { hex: '#ef4444', name: 'Đỏ san hô' },
    { hex: '#f97316', name: 'Cam rực rỡ' },
    { hex: '#eab308', name: 'Vàng tươi' },
    { hex: '#06b6d4', name: 'Xanh Cyan' },
    { hex: '#14b8a6', name: 'Xanh Teal' },
    { hex: '#64748b', name: 'Xám Slate' },
    { hex: '#0f172a', name: 'Đen Slate' }
];

function normalizeFolderData(raw) {
    if (!raw || !Array.isArray(raw)) return [];
    const list = raw.map(item => {
        if (typeof item === 'string') {
            let color = '#3b82f6';
            let icon = '📁';
            if (item === 'Chưa phân loại') {
                color = '#64748b';
                icon = '📁';
            }
            return { name: item, color, icon };
        }
        return {
            name: item.name || 'Chưa phân loại',
            color: item.color || '#3b82f6',
            icon: item.icon || '📁'
        };
    });

    if (!list.some(f => f.name === 'Chưa phân loại')) {
        list.unshift({ name: 'Chưa phân loại', color: '#64748b', icon: '📁' });
    }
    return list;
}

// ==========================================================================
// 1. STATE & STORAGE MANAGEMENT
// ==========================================================================

let appData = JSON.parse(localStorage.getItem('toeicAppData')) || [];
if (Array.isArray(appData)) {
    // Purge old sample presets if present
    appData = appData.filter(s => !isSamplePresetTitle(s.title));
    localStorage.setItem('toeicAppData', JSON.stringify(appData));
} else {
    appData = [];
    localStorage.setItem('toeicAppData', JSON.stringify(appData));
}

let rawFolderData = JSON.parse(localStorage.getItem('toeicFolderData'));
let folderData = normalizeFolderData(rawFolderData);
if (folderData.some(f => f.name === 'TOEIC Căn Bản' || f.name === 'Môi trường công sở')) {
    folderData = folderData.filter(f => f.name !== 'TOEIC Căn Bản' && f.name !== 'Môi trường công sở');
}
if (!folderData || folderData.length === 0) {
    const existingFolderNames = new Set(["Chưa phân loại", ...appData.map(s => s.folder).filter(Boolean)]);
    folderData = normalizeFolderData(Array.from(existingFolderNames));
}
localStorage.setItem('toeicFolderData', JSON.stringify(folderData));

function saveAppData() {
    localStorage.setItem('toeicAppData', JSON.stringify(appData));
    if (typeof triggerCloudSync === 'function') {
        triggerCloudSync();
    }
}

function saveFolderData() {
    localStorage.setItem('toeicFolderData', JSON.stringify(folderData));
    if (typeof triggerCloudSync === 'function') {
        triggerCloudSync();
    }
}

function getFolderMeta(folderName) {
    const target = folderName || 'Chưa phân loại';
    const found = folderData.find(f => f.name === target);
    if (found) return found;
    return { name: target, color: '#64748b', icon: '📁' };
}

// Lightweight Toast Notification
window.showToast = function(message) {
    if (!message) return;
    try {
        let toast = document.getElementById('appToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'appToast';
            toast.className = 'app-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        if (window._toastTimer) clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => {
            if (toast) toast.classList.remove('show');
        }, 2200);
    } catch (e) {
        console.log('[Toast]', message);
    }
};

// ==========================================================================
// LEVEL 2 UNDO / REDO ENGINE (Ctrl+Z & Ctrl+Y / Ctrl+Shift+Z)
// ==========================================================================
const MAX_UNDO_DEPTH = 35;
const undoStack = [];
const redoStack = [];

function pushUndoAction(action) {
    if (!action || !action.type) return;
    undoStack.push(action);
    if (undoStack.length > MAX_UNDO_DEPTH) {
        undoStack.shift();
    }
    // Clear redo history on any new user action
    redoStack.length = 0;
}

window.undoStack = undoStack;
window.redoStack = redoStack;
window.pushUndoAction = pushUndoAction;

function executeUndo(action) {
    switch (action.type) {
        case 'CLEAR_STUDY_RESULTS': {
            const { setIndex, items } = action.data;
            const answers = loadStudyAnswers(setIndex);
            const results = loadStudyResults(setIndex);
            const set = setIndex === 'starred_hub' ? getStarredHubVirtualSet() : appData[setIndex];

            items.forEach(item => {
                answers[item.wordIndex] = item.answer;
                results[item.wordIndex] = item.result;

                if (currentSetIndex === setIndex && currentView === 'detail' && currentSetTab === 'study') {
                    const input = document.querySelector(`#vocabTable .answer-input[data-index="${item.wordIndex}"]`);
                    if (input) {
                        input.value = item.answer || '';
                        input.classList.remove('input-correct', 'input-wrong', 'input-revealed');
                        if (item.result === 'correct') input.classList.add('input-correct');
                        else if (item.result === 'wrong') input.classList.add('input-wrong');
                        else if (item.result === 'revealed') input.classList.add('input-revealed');
                    }

                    const resultCell = document.querySelector(`.result-cell[data-result-for="${item.wordIndex}"]`);
                    if (resultCell && set && set.words[item.wordIndex]) {
                        const wordVie = set.words[item.wordIndex].vie;
                        if (item.result === 'correct') {
                            resultCell.innerHTML = `
                                <div class="result-cell-content">
                                    <span class="result-correct">✅ Đúng</span>
                                    <button class="btn-clear-single-res" onclick="clearSingleRowResult(${item.wordIndex}, event)" title="Xóa kết quả dòng này">✕</button>
                                </div>`;
                        } else if (item.result === 'wrong') {
                            resultCell.innerHTML = `
                                <div class="result-cell-content">
                                    <span class="result-wrong">❌ Sai</span> <span class="result-expected">(${escapeHtml(wordVie)})</span>
                                    <button class="btn-clear-single-res" onclick="clearSingleRowResult(${item.wordIndex}, event)" title="Xóa kết quả dòng này">✕</button>
                                </div>`;
                        } else if (item.result === 'revealed') {
                            resultCell.innerHTML = `
                                <div class="result-cell-content">
                                    <span class="result-revealed">💡 Đáp án:</span> <span class="result-expected">(${escapeHtml(wordVie)})</span>
                                    <button class="btn-clear-single-res" onclick="clearSingleRowResult(${item.wordIndex}, event)" title="Xóa kết quả dòng này">✕</button>
                                </div>`;
                        } else {
                            resultCell.innerHTML = `<button class="btn-show-hint" onclick="revealStudyAnswer(${item.wordIndex})" title="Xem đáp án (Ctrl+Enter hoặc F2)">💡 Đáp án</button>`;
                        }
                    }
                }
            });

            saveStudyAnswers(setIndex, answers);
            saveStudyResults(setIndex, results);
            if (currentSetIndex === setIndex) {
                updateStudyStats();
            }
            if (typeof clearRowSelection === 'function') {
                clearRowSelection(true);
            }
            break;
        }

        case 'CLEAR_ALL_STUDY_RESULTS': {
            const { setIndex, previousAnswers, previousResults } = action.data;
            saveStudyAnswers(setIndex, previousAnswers);
            saveStudyResults(setIndex, previousResults);
            if (currentSetIndex === setIndex && currentView === 'detail' && currentSetTab === 'study') {
                renderStudyTable();
            }
            if (typeof clearRowSelection === 'function') {
                clearRowSelection(true);
            }
            break;
        }

        case 'TOGGLE_STAR': {
            const { setIndex, wordIndex, prevStarred, isVirtual, originalSetIndex, originalWordIndex } = action.data;
            const targetSet = setIndex === 'starred_hub' ? getStarredHubVirtualSet() : appData[setIndex];
            if (targetSet && targetSet.words[wordIndex]) {
                targetSet.words[wordIndex].starred = prevStarred;
            }
            if (isVirtual && typeof originalSetIndex === 'number' && appData[originalSetIndex]?.words[originalWordIndex]) {
                appData[originalSetIndex].words[originalWordIndex].starred = prevStarred;
            }
            saveAppData();

            if (currentView === 'detail') {
                if (currentSetTab === 'study') {
                    const tr = document.querySelector(`tr[data-word-index="${wordIndex}"]`);
                    if (tr) {
                        tr.classList.toggle('row-starred', prevStarred);
                        const btn = tr.querySelector('.star-btn');
                        if (btn) {
                            btn.classList.toggle('active', prevStarred);
                            btn.innerHTML = prevStarred ? '⭐' : '☆';
                            btn.title = prevStarred ? 'Bỏ đánh dấu (Alt+S)' : 'Đánh dấu cần ôn (Alt+S)';
                        }
                    }
                    updateStudyFilterCounts();
                    if (currentStudyFilter === 'starred') renderStudyTable();
                } else if (currentSetTab === 'list') {
                    renderWordListTable();
                }
            }
            break;
        }

        case 'DELETE_WORD': {
            const { setIndex, wordIndex, word, savedAnswer, savedResult } = action.data;
            if (appData[setIndex]) {
                appData[setIndex].words.splice(wordIndex, 0, word);
                saveAppData();

                const ans = loadStudyAnswers(setIndex);
                ans.splice(wordIndex, 0, savedAnswer);
                saveStudyAnswers(setIndex, ans);

                const res = loadStudyResults(setIndex);
                res.splice(wordIndex, 0, savedResult);
                saveStudyResults(setIndex, res);

                if (currentView === 'detail' && currentSetIndex === setIndex) {
                    renderSetDetail();
                }
            }
            break;
        }

        case 'DELETE_SET': {
            const { setIndex, set, savedAnswers, savedResults } = action.data;
            const insertIdx = Math.min(setIndex, appData.length);
            appData.splice(insertIdx, 0, set);
            saveAppData();

            if (savedAnswers && savedAnswers.length > 0) {
                saveStudyAnswers(insertIdx, savedAnswers);
            }
            if (savedResults && savedResults.length > 0) {
                saveStudyResults(insertIdx, savedResults);
            }

            renderLibrary();
            break;
        }

        case 'DELETE_FOLDER': {
            const { folder, affectedSetIndices } = action.data;
            if (!folderData.some(f => f.name === folder.name)) {
                folderData.push(folder);
                saveFolderData();
            }
            (affectedSetIndices || []).forEach(idx => {
                if (appData[idx]) {
                    appData[idx].folder = folder.name;
                }
            });
            saveAppData();
            renderLibrary();
            break;
        }
    }
}

function executeRedo(action) {
    switch (action.type) {
        case 'CLEAR_STUDY_RESULTS': {
            const { setIndex, items } = action.data;
            const indices = items.map(it => it.wordIndex);
            if (currentSetIndex === setIndex && currentView === 'detail' && currentSetTab === 'study') {
                clearStudyResultsForIndices(indices, true);
            } else {
                const answers = loadStudyAnswers(setIndex);
                const results = loadStudyResults(setIndex);
                indices.forEach(wIdx => {
                    answers[wIdx] = '';
                    results[wIdx] = null;
                });
                saveStudyAnswers(setIndex, answers);
                saveStudyResults(setIndex, results);
            }
            if (typeof clearRowSelection === 'function') {
                clearRowSelection(true);
            }
            break;
        }

        case 'CLEAR_ALL_STUDY_RESULTS': {
            const { setIndex } = action.data;
            clearStudyAnswersForSet(setIndex);
            if (currentSetIndex === setIndex && currentView === 'detail' && currentSetTab === 'study') {
                renderStudyTable();
            }
            if (typeof clearRowSelection === 'function') {
                clearRowSelection(true);
            }
            break;
        }

        case 'TOGGLE_STAR': {
            const { setIndex, wordIndex, newStarred, isVirtual, originalSetIndex, originalWordIndex } = action.data;
            const targetSet = setIndex === 'starred_hub' ? getStarredHubVirtualSet() : appData[setIndex];
            if (targetSet && targetSet.words[wordIndex]) {
                targetSet.words[wordIndex].starred = newStarred;
            }
            if (isVirtual && typeof originalSetIndex === 'number' && appData[originalSetIndex]?.words[originalWordIndex]) {
                appData[originalSetIndex].words[originalWordIndex].starred = newStarred;
            }
            saveAppData();

            if (currentView === 'detail') {
                if (currentSetTab === 'study') {
                    const tr = document.querySelector(`tr[data-word-index="${wordIndex}"]`);
                    if (tr) {
                        tr.classList.toggle('row-starred', newStarred);
                        const btn = tr.querySelector('.star-btn');
                        if (btn) {
                            btn.classList.toggle('active', newStarred);
                            btn.innerHTML = newStarred ? '⭐' : '☆';
                            btn.title = newStarred ? 'Bỏ đánh dấu (Alt+S)' : 'Đánh dấu cần ôn (Alt+S)';
                        }
                    }
                    updateStudyFilterCounts();
                    if (currentStudyFilter === 'starred') renderStudyTable();
                } else if (currentSetTab === 'list') {
                    renderWordListTable();
                }
            }
            break;
        }

        case 'DELETE_WORD': {
            const { setIndex, wordIndex } = action.data;
            if (appData[setIndex] && appData[setIndex].words[wordIndex]) {
                appData[setIndex].words.splice(wordIndex, 1);
                saveAppData();

                const ans = loadStudyAnswers(setIndex);
                if (ans && ans.length > wordIndex) {
                    ans.splice(wordIndex, 1);
                    saveStudyAnswers(setIndex, ans);
                }

                const res = loadStudyResults(setIndex);
                if (res && res.length > wordIndex) {
                    res.splice(wordIndex, 1);
                    saveStudyResults(setIndex, res);
                }

                if (currentView === 'detail' && currentSetIndex === setIndex) {
                    renderSetDetail();
                }
            }
            break;
        }

        case 'DELETE_SET': {
            const { setIndex, set } = action.data;
            let targetIdx = appData.findIndex(s => s.title === set.title);
            if (targetIdx === -1) targetIdx = Math.min(setIndex, appData.length - 1);
            if (targetIdx >= 0 && targetIdx < appData.length) {
                clearStudyAnswersForSet(targetIdx);
                appData.splice(targetIdx, 1);
                saveAppData();
                if (currentSetIndex >= appData.length) {
                    currentSetIndex = Math.max(0, appData.length - 1);
                }
                saveNavState();
                renderLibrary();
            }
            break;
        }

        case 'DELETE_FOLDER': {
            const { folder } = action.data;
            appData.forEach(set => {
                if (set.folder === folder.name) {
                    set.folder = "Chưa phân loại";
                }
            });
            saveAppData();
            folderData = folderData.filter(f => f.name !== folder.name);
            saveFolderData();
            if (currentOpenedFolder === folder.name) {
                closeFolderContents();
            } else {
                renderLibrary();
            }
            break;
        }
    }
}

window.performUndo = function() {
    if (undoStack.length === 0) {
        showToast('ℹ️ Không có thao tác nào để hoàn tác.');
        return;
    }

    const action = undoStack.pop();
    try {
        executeUndo(action);
        redoStack.push(action);
        showToast(`↩️ Đã hoàn tác: ${action.description}`);
    } catch (err) {
        console.error('Lỗi khi thực hiện hoàn tác:', err);
        showToast('⚠️ Không thể hoàn tác thao tác này.');
    }
};

window.performRedo = function() {
    if (redoStack.length === 0) {
        showToast('ℹ️ Không có thao tác nào để làm lại.');
        return;
    }

    const action = redoStack.pop();
    try {
        executeRedo(action);
        undoStack.push(action);
        showToast(`↪️ Đã làm lại: ${action.description}`);
    } catch (err) {
        console.error('Lỗi khi thực hiện làm lại:', err);
        showToast('⚠️ Không thể làm lại thao tác này.');
    }
};

// Current App View State
let currentView = 'library'; // 'library', 'detail', 'test'
let currentLibraryTab = 'sets'; // 'sets', 'folders'
let currentOpenedFolder = null; // null if browsing all folders, or string folderName when inside a folder
let currentSetIndex = 0;
let currentSetTab = 'study'; // 'study', 'manage', 'list'
let isAutoSpeakEnabled = true;
let currentStudyFilter = 'all'; // 'all', 'starred'
let currentListFilterStarred = false; // boolean for list tab

function getCurrentSet() {
    if (currentSetIndex === 'starred_hub') {
        return getStarredHubVirtualSet();
    }
    return appData[currentSetIndex];
}

function getStarredHubVirtualSet() {
    const starredWords = [];
    appData.forEach((set, sIdx) => {
        (set.words || []).forEach((w, wIdx) => {
            if (w.starred) {
                starredWords.push({
                    ...w,
                    _originalSetIndex: sIdx,
                    _originalWordIndex: wIdx,
                    _originSetTitle: set.title
                });
            }
        });
    });
    return {
        title: "⭐ Sổ tay các từ cần ôn",
        folder: "Tổng hợp",
        isVirtualStarredSet: true,
        words: starredWords
    };
}

window.openStarredHubSet = function() {
    const hubSet = getStarredHubVirtualSet();
    if (hubSet.words.length === 0) {
        alert("Bạn chưa có từ nào được đánh dấu ⭐. Hãy bấm vào biểu tượng ngôi sao bên cạnh mỗi từ vựng để thêm vào sổ tay cần ôn nhé!");
        return;
    }
    currentSetIndex = 'starred_hub';
    currentSetTab = 'study';
    currentStudyFilter = 'all';
    navigateTo('detail');
    switchSetTab('study');
    saveNavState();
};

// Folder Modal State
let folderModalEditingName = null; // null = create new, string = editing target
let folderModalSelectedIcon = '📁';
let folderModalSelectedColor = '#3b82f6';

// Active Test State
let activeTestState = {
    selectedSetIndices: [],
    questions: [],
    currentIndex: 0,
    answers: [],
    results: [], // null, true, false
    direction: 'en-vi', // 'en-vi' | 'vi-en'
    layout: 'table', // 'table' | 'card'
    autoSpeak: true,
    wrongQuestions: []
};

// ==========================================================================
// 2. THEME & NAVIGATION CONTROLS
// ==========================================================================

function initTheme() {
    const savedTheme = localStorage.getItem('vocab_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('vocab_theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const darkIcon = document.querySelector('.theme-icon-dark');
    const lightIcon = document.querySelector('.theme-icon-light');
    if (darkIcon && lightIcon) {
        darkIcon.style.display = theme === 'dark' ? 'inline' : 'none';
        lightIcon.style.display = theme === 'light' ? 'inline' : 'none';
    }
}

// --- NAVIGATION & VIEW STATE PERSISTENCE ---
function saveNavState() {
    try {
        const state = {
            currentView,
            currentLibraryTab,
            currentOpenedFolder,
            currentSetIndex,
            currentSetTab,
            isAutoSpeakEnabled
        };
        localStorage.setItem('toeicNavState', JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save nav state:', e);
    }
}

window.navigateTo = function(viewName) {
    currentView = viewName;
    
    // Hide all view sections
    document.getElementById('libraryView').style.display = 'none';
    document.getElementById('createSetView').style.display = 'none';
    document.getElementById('setDetailView').style.display = 'none';
    document.getElementById('testView').style.display = 'none';

    // Update main nav buttons
    document.getElementById('navBtnLibrary').classList.toggle('active', viewName === 'library');
    document.getElementById('navBtnTest').classList.toggle('active', viewName === 'test');

    if (viewName === 'library') {
        document.getElementById('libraryView').style.display = 'flex';
        renderLibrary();
    } else if (viewName === 'createSet') {
        document.getElementById('createSetView').style.display = 'flex';
    } else if (viewName === 'detail') {
        document.getElementById('setDetailView').style.display = 'flex';
        renderSetDetail();
    } else if (viewName === 'test') {
        document.getElementById('testView').style.display = 'flex';
        initTestSetup();
    }

    saveNavState();
};

// ==========================================================================
// 3. LIBRARY VIEW (SETS & FOLDERS)
// ==========================================================================

window.switchLibraryTab = function(tabName) {
    currentLibraryTab = tabName;
    document.getElementById('libTabSets').classList.toggle('active', tabName === 'sets');
    document.getElementById('libTabFolders').classList.toggle('active', tabName === 'folders');

    document.getElementById('setsContainer').style.display = tabName === 'sets' ? 'block' : 'none';
    document.getElementById('foldersContainer').style.display = tabName === 'folders' ? 'block' : 'none';

    renderLibrary();
    saveNavState();
};

function renderLibrary() {
    // Sync counts
    document.getElementById('totalSetsCount').textContent = appData.length;
    document.getElementById('totalFoldersCount').textContent = folderData.length;

    // Populate folder dropdown filter
    const folderFilterSelect = document.getElementById('folderFilterSelect');
    const currentSelectedFilter = folderFilterSelect.value;
    folderFilterSelect.innerHTML = '<option value="">Tất cả thư mục</option>';
    folderData.forEach(folder => {
        const fName = typeof folder === 'string' ? folder : folder.name;
        const fIcon = typeof folder === 'string' ? '📁' : (folder.icon || '📁');
        folderFilterSelect.innerHTML += `<option value="${escapeHtml(fName)}" ${currentSelectedFilter === fName ? 'selected' : ''}>${fIcon} ${escapeHtml(fName)}</option>`;
    });

    if (currentLibraryTab === 'sets') {
        renderSetsCards();
    } else {
        if (currentOpenedFolder) {
            document.getElementById('foldersOverview').style.display = 'none';
            document.getElementById('folderContentsView').style.display = 'block';
            renderFolderContentsView();
        } else {
            document.getElementById('foldersOverview').style.display = 'block';
            document.getElementById('folderContentsView').style.display = 'none';
            renderFoldersCards();
        }
    }
}

function renderSetsCards() {
    const setsList = document.getElementById('setsList');
    const emptyState = document.getElementById('emptySetsState');
    const searchQuery = (document.getElementById('setSearchInput').value || '').trim().toLowerCase();
    const folderFilter = document.getElementById('folderFilterSelect').value;

    setsList.innerHTML = '';

    // Count total starred words across all sets
    let totalStarredWords = 0;
    appData.forEach(s => {
        (s.words || []).forEach(w => {
            if (w.starred) totalStarredWords++;
        });
    });

    const filtered = appData.map((set, originalIndex) => ({ set, originalIndex })).filter(({ set }) => {
        const matchSearch = set.title.toLowerCase().includes(searchQuery);
        const matchFolder = !folderFilter || set.folder === folderFilter;
        return matchSearch && matchFolder;
    });

    const showStarredHubCard = totalStarredWords > 0 && !folderFilter && (!searchQuery || 'sổ tay các từ cần ôn'.includes(searchQuery));

    if (filtered.length === 0 && !showStarredHubCard) {
        setsList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    setsList.style.display = 'grid';
    emptyState.style.display = 'none';

    // Render Starred Hub Card at top if available
    if (showStarredHubCard) {
        const hubCard = document.createElement('div');
        hubCard.className = 'set-card starred-hub-card';
        hubCard.onclick = () => openStarredHubSet();
        hubCard.innerHTML = `
            <div>
                <div class="set-card-meta flex-between">
                    <span class="set-card-folder starred-folder-tag">
                        ⭐ Ôn tập tập trung
                    </span>
                    <span class="badge-smart-hub">Tự động tổng hợp</span>
                </div>
                <h3 class="set-card-title text-starred-title">⭐ Sổ tay các từ cần ôn</h3>
                <p class="starred-card-desc">Gồm tất cả các từ bạn đã đánh dấu từ các học phần</p>
            </div>
            <div class="set-card-footer">
                <span class="set-card-count text-starred-count">⭐ <strong>${totalStarredWords}</strong> từ cần ôn</span>
                <div class="set-card-actions">
                    <button class="btn btn-sm btn-practice-starred" onclick="event.stopPropagation(); openStarredHubSet()">
                        Luyện ngay 🚀
                    </button>
                </div>
            </div>
        `;
        setsList.appendChild(hubCard);
    }

    filtered.forEach(({ set, originalIndex }) => {
        const folderName = set.folder || 'Chưa phân loại';
        const fMeta = getFolderMeta(folderName);
        const card = document.createElement('div');
        card.className = 'set-card';
        card.onclick = () => openSet(originalIndex);
        card.innerHTML = `
            <div>
                <div class="set-card-meta">
                    <span class="set-card-folder" style="color: ${fMeta.color}; background: ${fMeta.color}15; border: 1px solid ${fMeta.color}35;">
                        ${fMeta.icon} ${escapeHtml(folderName)}
                    </span>
                </div>
                <h3 class="set-card-title">${escapeHtml(set.title)}</h3>
            </div>
            <div class="set-card-footer">
                <span class="set-card-count">📚 <strong>${set.words.length}</strong> thuật ngữ</span>
                <div class="set-card-actions">
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); openEditSetModal(${originalIndex})" title="Đổi tên / Chuyển thư mục">Sửa</button>
                    <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openDeleteSetModal(${originalIndex})" title="Xóa học phần" style="color: var(--danger);">Xóa</button>
                </div>
            </div>
        `;
        setsList.appendChild(card);
    });
}

window.filterSets = function() {
    renderSetsCards();
};

// ==========================================
// FOLDERS OVERVIEW (LIST OF ALL FOLDERS)
// ==========================================
function renderFoldersCards() {
    const foldersList = document.getElementById('foldersList');
    const emptyState = document.getElementById('emptyFoldersState');
    const searchQuery = (document.getElementById('folderSearchInput')?.value || '').trim().toLowerCase();
    foldersList.innerHTML = '';

    const filtered = folderData.filter(folder => {
        return !searchQuery || folder.name.toLowerCase().includes(searchQuery);
    });

    if (filtered.length === 0) {
        foldersList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    foldersList.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach(folder => {
        const setsInFolder = appData.filter(s => s.folder === folder.name);
        const totalWords = setsInFolder.reduce((sum, s) => sum + s.words.length, 0);

        const folderCard = document.createElement('div');
        folderCard.className = 'folder-card';
        folderCard.style.setProperty('--folder-accent', folder.color);
        folderCard.style.setProperty('--folder-icon-bg', `${folder.color}18`);
        folderCard.style.setProperty('--folder-icon-border', `${folder.color}35`);

        // Clicking card opens the folder explorer view (like Windows Explorer!)
        folderCard.onclick = () => openFolderContents(folder.name);

        folderCard.innerHTML = `
            <div>
                <div class="folder-card-header">
                    <div class="folder-icon">${folder.icon || '📁'}</div>
                    <div style="flex: 1; min-width: 0;">
                        <div class="folder-name" title="${escapeHtml(folder.name)}">
                            ${escapeHtml(folder.name)}
                        </div>
                        <div class="folder-count-badge">${setsInFolder.length} học phần • ${totalWords} từ vựng</div>
                    </div>
                </div>
            </div>
            <div class="folder-card-footer">
                <span class="folder-open-hint">
                    Mở thư mục ➔
                </span>
                <div style="display: flex; gap: 6px;" onclick="event.stopPropagation();">
                    <button class="btn btn-outline btn-sm" onclick="openEditFolderModal('${escapeJsString(folder.name)}')" title="Đổi tên, màu sắc, biểu tượng">
                        ✏️ Sửa
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="openFolderManageModal('${escapeJsString(folder.name)}')" title="Thêm học phần vào thư mục này">
                        ⚙️ Thêm
                    </button>
                    ${folder.name !== 'Chưa phân loại' ? `
                        <button class="btn btn-ghost btn-sm" onclick="deleteFolder('${escapeJsString(folder.name)}')" style="color: var(--danger);" title="Xóa thư mục">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        foldersList.appendChild(folderCard);
    });
}

window.filterFolders = function() {
    renderFoldersCards();
};

// ==========================================
// FOLDER CONTENTS EXPLORER (WINDOWS STYLE)
// ==========================================
window.openFolderContents = function(folderName) {
    currentOpenedFolder = folderName;
    document.getElementById('foldersOverview').style.display = 'none';
    document.getElementById('folderContentsView').style.display = 'block';

    // Clear inner search
    const innerSearch = document.getElementById('folderInnerSearchInput');
    if (innerSearch) innerSearch.value = '';

    renderFolderContentsView();
    saveNavState();
};

window.closeFolderContents = function() {
    currentOpenedFolder = null;
    document.getElementById('foldersOverview').style.display = 'block';
    document.getElementById('folderContentsView').style.display = 'none';
    renderFoldersCards();
    saveNavState();
};

function renderFolderContentsView() {
    if (!currentOpenedFolder) {
        closeFolderContents();
        return;
    }

    const folder = getFolderMeta(currentOpenedFolder);

    // 1. Update Breadcrumb
    document.getElementById('explorerFolderIcon').textContent = folder.icon;
    document.getElementById('explorerFolderName').textContent = folder.name;

    // 2. Update Banner Card
    const banner = document.getElementById('folderExplorerBanner');
    banner.style.setProperty('--folder-accent', folder.color);
    banner.style.setProperty('--folder-icon-bg', `${folder.color}20`);
    banner.style.setProperty('--folder-icon-border', `${folder.color}45`);

    const bannerIcon = document.getElementById('folderBannerIcon');
    bannerIcon.textContent = folder.icon;
    bannerIcon.style.color = folder.color;

    document.getElementById('folderBannerTitle').textContent = folder.name;

    // Delete button inside banner (hidden if Chưa phân loại)
    const deleteBannerBtn = document.getElementById('btnDeleteFolderInBanner');
    if (deleteBannerBtn) {
        deleteBannerBtn.style.display = folder.name === 'Chưa phân loại' ? 'none' : 'inline-flex';
    }

    // 3. Find sets inside this folder
    const allSetsInFolder = [];
    appData.forEach((set, originalIndex) => {
        if (set.folder === folder.name) {
            allSetsInFolder.push({ set, originalIndex });
        }
    });

    const totalWords = allSetsInFolder.reduce((sum, item) => sum + item.set.words.length, 0);
    document.getElementById('folderBannerSetCount').textContent = `${allSetsInFolder.length} học phần`;
    document.getElementById('folderBannerWordCount').textContent = `${totalWords} từ vựng`;

    // 4. Filter by inner search
    const searchQuery = (document.getElementById('folderInnerSearchInput')?.value || '').trim().toLowerCase();
    const filteredSets = allSetsInFolder.filter(item => {
        return !searchQuery || item.set.title.toLowerCase().includes(searchQuery);
    });

    const countBadge = document.getElementById('folderInnerCountBadge');
    if (countBadge) {
        countBadge.textContent = `${filteredSets.length} học phần`;
    }

    const setsGrid = document.getElementById('folderSetsList');
    const emptyState = document.getElementById('folderSetsEmptyState');
    setsGrid.innerHTML = '';

    if (filteredSets.length === 0) {
        setsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        document.getElementById('folderEmptyIcon').textContent = folder.icon || '📂';
        return;
    }

    setsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    filteredSets.forEach(({ set, originalIndex }) => {
        const card = document.createElement('div');
        card.className = 'set-card';
        card.onclick = () => openSet(originalIndex);
        card.innerHTML = `
            <div>
                <div class="set-card-meta">
                    <span class="set-card-folder" style="color: ${folder.color}; background: ${folder.color}15; border: 1px solid ${folder.color}35;">
                        ${folder.icon} ${escapeHtml(folder.name)}
                    </span>
                </div>
                <h3 class="set-card-title">${escapeHtml(set.title)}</h3>
            </div>
            <div class="set-card-footer">
                <span class="set-card-count">📚 <strong>${set.words.length}</strong> thuật ngữ</span>
                <div class="set-card-actions">
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); openEditSetModal(${originalIndex})" title="Đổi tên / Chuyển thư mục">Sửa</button>
                    <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); removeSetFromFolder(${originalIndex})" title="Gỡ khỏi thư mục này">Gỡ</button>
                    <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openDeleteSetModal(${originalIndex})" title="Xóa học phần" style="color: var(--danger);">Xóa</button>
                </div>
            </div>
        `;
        setsGrid.appendChild(card);
    });
}

window.filterInnerFolderSets = function() {
    renderFolderContentsView();
};

window.createNewSetInCurrentFolder = function() {
    openCreateSetView(currentOpenedFolder);
};

window.removeSetFromFolder = function(setIndex) {
    if (confirm(`Gỡ học phần "${appData[setIndex].title}" khỏi thư mục "${currentOpenedFolder}"? (Học phần sẽ được chuyển về "Chưa phân loại")`)) {
        appData[setIndex].folder = 'Chưa phân loại';
        saveAppData();
        renderFolderContentsView();
    }
};

window.testCurrentFolderSets = function() {
    const indicesInFolder = [];
    appData.forEach((set, index) => {
        if (set.folder === currentOpenedFolder && set.words.length > 0) {
            indicesInFolder.push(index);
        }
    });

    if (indicesInFolder.length === 0) {
        alert(`Thư mục "${currentOpenedFolder}" chưa có từ vựng nào để kiểm tra!`);
        return;
    }

    activeTestState.selectedSetIndices = indicesInFolder;
    navigateTo('test');
};

window.openEditCurrentFolderModal = function() {
    if (currentOpenedFolder) {
        openEditFolderModal(currentOpenedFolder);
    }
};

window.deleteCurrentFolder = function() {
    if (currentOpenedFolder) {
        deleteFolder(currentOpenedFolder);
    }
};

// ==========================================
// FOLDER CREATION & EDIT MODAL LOGIC
// ==========================================
window.openCreateFolderModal = function() {
    folderModalEditingName = null;
    folderModalSelectedIcon = '📁';
    folderModalSelectedColor = '#3b82f6';

    document.getElementById('folderModalTitle').textContent = '📁 Tạo thư mục mới';
    document.getElementById('folderModalNameInput').value = '';
    document.getElementById('folderCustomIconInput').value = '';
    document.getElementById('folderCustomColorInput').value = '#3b82f6';
    document.getElementById('btnSaveFolderModal').textContent = 'Tạo thư mục';

    renderFolderModalControls();
    updateFolderModalPreview();
    document.getElementById('editFolderModal').style.display = 'flex';
    document.getElementById('folderModalNameInput').focus();
};

window.openEditFolderModal = function(folderName) {
    folderModalEditingName = folderName;
    const meta = getFolderMeta(folderName);
    folderModalSelectedIcon = meta.icon || '📁';
    folderModalSelectedColor = meta.color || '#3b82f6';

    document.getElementById('folderModalTitle').textContent = `✏️ Chỉnh sửa thư mục: ${folderName}`;
    document.getElementById('folderModalNameInput').value = folderName;
    document.getElementById('folderCustomIconInput').value = PRESET_FOLDER_ICONS.includes(meta.icon) ? '' : meta.icon;
    document.getElementById('folderCustomColorInput').value = meta.color || '#3b82f6';
    document.getElementById('btnSaveFolderModal').textContent = 'Lưu thay đổi';

    renderFolderModalControls();
    updateFolderModalPreview();
    document.getElementById('editFolderModal').style.display = 'flex';
    document.getElementById('folderModalNameInput').focus();
};

window.closeFolderEditModal = function() {
    document.getElementById('editFolderModal').style.display = 'none';
    folderModalEditingName = null;
};

function renderFolderModalControls() {
    // 1. Render Icon Grid
    const iconGrid = document.getElementById('folderIconGrid');
    iconGrid.innerHTML = '';
    PRESET_FOLDER_ICONS.forEach(icon => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `icon-item-btn ${icon === folderModalSelectedIcon ? 'selected' : ''}`;
        btn.textContent = icon;
        btn.onclick = () => selectFolderModalIcon(icon);
        iconGrid.appendChild(btn);
    });

    // 2. Render Color Swatches
    const colorGrid = document.getElementById('folderColorSwatches');
    colorGrid.innerHTML = '';
    PRESET_FOLDER_COLORS.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `color-swatch-btn ${c.hex.toLowerCase() === folderModalSelectedColor.toLowerCase() ? 'selected' : ''}`;
        btn.style.backgroundColor = c.hex;
        btn.title = c.name;
        btn.textContent = c.hex.toLowerCase() === folderModalSelectedColor.toLowerCase() ? '✓' : '';
        btn.onclick = () => selectFolderModalColor(c.hex);
        colorGrid.appendChild(btn);
    });
}

window.selectFolderModalIcon = function(icon) {
    folderModalSelectedIcon = icon;
    document.getElementById('folderCustomIconInput').value = '';
    renderFolderModalControls();
    updateFolderModalPreview();
};

window.handleCustomIconInput = function(val) {
    const clean = val.trim();
    if (clean) {
        folderModalSelectedIcon = clean;
    } else {
        folderModalSelectedIcon = '📁';
    }
    renderFolderModalControls();
    updateFolderModalPreview();
};

window.selectFolderModalColor = function(hex) {
    folderModalSelectedColor = hex;
    document.getElementById('folderCustomColorInput').value = hex;
    renderFolderModalControls();
    updateFolderModalPreview();
};

window.handleCustomColorChange = function(hex) {
    folderModalSelectedColor = hex;
    renderFolderModalControls();
    updateFolderModalPreview();
};

window.updateFolderModalPreview = function() {
    const inputName = document.getElementById('folderModalNameInput').value.trim() || 'Tên thư mục';
    document.getElementById('folderPreviewName').textContent = inputName;
    document.getElementById('folderPreviewIcon').textContent = folderModalSelectedIcon;

    const previewCard = document.getElementById('folderModalPreviewCard');
    previewCard.style.setProperty('--folder-preview-accent', folderModalSelectedColor);

    const previewIcon = document.getElementById('folderPreviewIcon');
    previewIcon.style.backgroundColor = `${folderModalSelectedColor}18`;
    previewIcon.style.borderColor = `${folderModalSelectedColor}35`;
    previewIcon.style.color = folderModalSelectedColor;

    // Count info
    let countText = '0 học phần • 0 từ';
    if (folderModalEditingName) {
        const setsCount = appData.filter(s => s.folder === folderModalEditingName).length;
        const wordsCount = appData.filter(s => s.folder === folderModalEditingName).reduce((sum, s) => sum + s.words.length, 0);
        countText = `${setsCount} học phần • ${wordsCount} từ`;
    }
    document.getElementById('folderPreviewMeta').textContent = countText;
};

window.saveFolderModalData = function() {
    const nameInput = document.getElementById('folderModalNameInput');
    const newName = nameInput.value.trim();

    if (!newName) {
        alert("Vui lòng nhập tên thư mục!");
        nameInput.focus();
        return;
    }

    // CREATE MODE
    if (folderModalEditingName === null) {
        if (folderData.some(f => f.name.toLowerCase() === newName.toLowerCase())) {
            alert(`Thư mục "${newName}" đã tồn tại! Vui lòng chọn tên khác.`);
            nameInput.focus();
            return;
        }

        folderData.push({
            name: newName,
            color: folderModalSelectedColor,
            icon: folderModalSelectedIcon
        });
        saveFolderData();
        closeFolderEditModal();
        renderLibrary();
        return;
    }

    // EDIT MODE
    const oldName = folderModalEditingName;
    const isNameChanged = oldName.toLowerCase() !== newName.toLowerCase();

    if (isNameChanged && folderData.some(f => f.name.toLowerCase() === newName.toLowerCase())) {
        alert(`Tên thư mục "${newName}" đã tồn tại! Vui lòng chọn tên khác.`);
        nameInput.focus();
        return;
    }

    // Prevent renaming "Chưa phân loại" to something else if preferred
    if (oldName === 'Chưa phân loại' && isNameChanged) {
        alert('Không thể đổi tên thư mục mặc định "Chưa phân loại", nhưng bạn có thể đổi màu sắc và biểu tượng.');
        return;
    }

    // Update folder object in folderData
    const folderObj = folderData.find(f => f.name === oldName);
    if (folderObj) {
        folderObj.name = newName;
        folderObj.color = folderModalSelectedColor;
        folderObj.icon = folderModalSelectedIcon;
    }

    // If name changed, update all sets in appData!
    if (isNameChanged) {
        appData.forEach(set => {
            if (set.folder === oldName) {
                set.folder = newName;
            }
        });
        saveAppData();

        if (currentOpenedFolder === oldName) {
            currentOpenedFolder = newName;
        }
    }

    saveFolderData();
    closeFolderEditModal();
    renderLibrary();
};

window.createNewFolder = function() {
    openCreateFolderModal();
};

// ==========================================
// CREATE SET STUDIO LOGIC
// ==========================================

const WORD_TEMPLATES = {
    contracts: {
        title: "TOEIC: Hợp đồng & Pháp lý (Contracts)",
        words: [
            { eng: "abide by", type: "v", vie: "tuân theo, chịu theo" },
            { eng: "agreement", type: "n", vie: "hợp đồng, thỏa thuận" },
            { eng: "assurance", type: "n", vie: "sự cam đoan, bảo đảm" },
            { eng: "cancellation", type: "n", vie: "sự hủy bỏ" },
            { eng: "determine", type: "v", vie: "xác định, quyết định" },
            { eng: "engage", type: "v", vie: "tham gia, cam kết" },
            { eng: "establish", type: "v", vie: "thiết lập, thành lập" },
            { eng: "obligate", type: "v", vie: "bắt buộc, ép buộc" },
            { eng: "party", type: "n", vie: "bên tham gia hợp đồng" },
            { eng: "provision", type: "n", vie: "điều khoản, dự phòng" }
        ]
    },
    marketing: {
        title: "TOEIC: Tiếp thị & Quảng cáo (Marketing)",
        words: [
            { eng: "attract", type: "v", vie: "thu hút, hấp dẫn" },
            { eng: "compare", type: "v", vie: "so sánh" },
            { eng: "competition", type: "n", vie: "sự cạnh tranh" },
            { eng: "consume", type: "v", vie: "tiêu thụ, tiêu dùng" },
            { eng: "convince", type: "v", vie: "thuyết phục" },
            { eng: "currently", type: "adv", vie: "hiện tại, hiện nay" },
            { eng: "fad", type: "n", vie: "mốt nhất thời" },
            { eng: "inspire", type: "v", vie: "truyền cảm hứng" },
            { eng: "persuasion", type: "n", vie: "sự thuyết phục" },
            { eng: "productive", type: "adj", vie: "năng suất, hiệu quả" }
        ]
    },
    office: {
        title: "TOEIC: Văn phòng & Hội họp (Office Life)",
        words: [
            { eng: "agenda", type: "n", vie: "chương trình nghị sự, lịch trình" },
            { eng: "colleague", type: "n", vie: "đồng nghiệp" },
            { eng: "deadline", type: "n", vie: "hạn chót hoàn thành" },
            { eng: "equipment", type: "n", vie: "trang thiết bị máy móc" },
            { eng: "facilitate", type: "v", vie: "tạo điều kiện thuận lợi" },
            { eng: "implement", type: "v", vie: "thực thi, triển khai" },
            { eng: "schedule", type: "n", vie: "lịch trình công tác" },
            { eng: "supervise", type: "v", vie: "giám sát, quản lý" },
            { eng: "task", type: "n", vie: "nhiệm vụ, công việc" },
            { eng: "verify", type: "v", vie: "xác minh, kiểm chứng" }
        ]
    },
    shopping: {
        title: "TOEIC: Mua sắm & Bảo hành (Shopping & Warranty)",
        words: [
            { eng: "bargain", type: "n", vie: "món hời, giá rẻ" },
            { eng: "bear", type: "v", vie: "chịu đựng, gánh vác" },
            { eng: "checkout", type: "n", vie: "quầy thanh toán tiền" },
            { eng: "comfort", type: "n", vie: "sự thoải mái, tiện nghi" },
            { eng: "expand", type: "v", vie: "mở rộng quy mô" },
            { eng: "explore", type: "v", vie: "thăm dò, khám phá" },
            { eng: "item", type: "n", vie: "món đồ, mặt hàng" },
            { eng: "mandatory", type: "adj", vie: "bắt buộc theo quy định" },
            { eng: "merchandise", type: "n", vie: "hàng hóa thương mại" },
            { eng: "refund", type: "n", vie: "tiền hoàn lại, tiền trả lại" }
        ]
    }
};

let createSetRowIdCounter = 0;
let createSetRows = [];
let editingSetIndex = null; // null = create new, number = edit existing set

window.createNewSet = function() {
    openCreateSetView(currentOpenedFolder || null);
};

window.openCreateSetView = function(preselectedFolder = null, editIndex = null) {
    editingSetIndex = editIndex;
    createSetRows = [];
    createSetRowIdCounter = 0;

    const mainHeading = document.getElementById('createSetMainHeading');
    const saveBtn = document.getElementById('btnSaveCreatedSet');
    const titleInput = document.getElementById('newSetTitleInput');
    const descInput = document.getElementById('newSetDescInput');
    const folderSelect = document.getElementById('newSetFolderSelect');

    // Populate folders dropdown
    folderSelect.innerHTML = '';
    folderData.forEach(folder => {
        const fName = typeof folder === 'string' ? folder : folder.name;
        const fIcon = typeof folder === 'string' ? '📁' : (folder.icon || '📁');
        folderSelect.innerHTML += `<option value="${escapeHtml(fName)}">${fIcon} ${escapeHtml(fName)}</option>`;
    });

    let targetFolder = preselectedFolder || 'Chưa phân loại';

    if (editIndex !== null && appData[editIndex]) {
        const set = appData[editIndex];
        mainHeading.textContent = '✏️ Chỉnh sửa học phần';
        saveBtn.textContent = '💾 Lưu thay đổi';
        titleInput.value = set.title || '';
        descInput.value = set.description || '';
        targetFolder = set.folder || 'Chưa phân loại';

        // Load existing words
        if (set.words && set.words.length > 0) {
            set.words.forEach(w => {
                createSetRowIdCounter++;
                createSetRows.push({
                    id: createSetRowIdCounter,
                    eng: w.eng || '',
                    type: w.type || '',
                    vie: w.vie || ''
                });
            });
        } else {
            for (let i = 0; i < 4; i++) {
                createSetRowIdCounter++;
                createSetRows.push({ id: createSetRowIdCounter, eng: '', type: '', vie: '' });
            }
        }
    } else {
        mainHeading.textContent = '✨ Tạo học phần mới';
        saveBtn.textContent = '🚀 Hoàn tất & Tạo học phần';
        titleInput.value = '';
        descInput.value = '';

        // Default 4 empty rows
        for (let i = 0; i < 4; i++) {
            createSetRowIdCounter++;
            createSetRows.push({ id: createSetRowIdCounter, eng: '', type: '', vie: '' });
        }
    }

    folderSelect.value = targetFolder;

    navigateTo('createSet');
    renderCreateSetWordRows();
    setTimeout(() => {
        if (!titleInput.value) titleInput.focus();
    }, 80);
};

function renderCreateSetWordRows() {
    const container = document.getElementById('createSetWordRowsList');
    container.innerHTML = '';

    const badge = document.getElementById('createSetCardCountBadge');
    badge.textContent = `${createSetRows.length} thẻ từ vựng`;

    createSetRows.forEach((row, index) => {
        const card = document.createElement('div');
        card.className = 'create-word-card';
        card.setAttribute('data-row-id', row.id);
        card.innerHTML = `
            <div class="create-word-card-header">
                <span class="create-word-number">${index + 1}</span>
                <div class="create-word-card-tools">
                    <button type="button" class="icon-btn-sm" onclick="speakCreateWordRow(${row.id})" title="Nghe phát âm">🔊</button>
                    <button type="button" class="icon-btn-sm" onclick="moveCreateWordRow(${row.id}, -1)" ${index === 0 ? 'disabled style="opacity:0.3;cursor:default;"' : ''} title="Di chuyển lên">↑</button>
                    <button type="button" class="icon-btn-sm" onclick="moveCreateWordRow(${row.id}, 1)" ${index === createSetRows.length - 1 ? 'disabled style="opacity:0.3;cursor:default;"' : ''} title="Di chuyển xuống">↓</button>
                    <button type="button" class="icon-btn-sm text-danger" onclick="deleteCreateWordRow(${row.id})" title="Xóa thẻ này">🗑️</button>
                </div>
            </div>
            <div class="create-word-card-inputs">
                <div class="create-input-group col-eng">
                    <input type="text" class="create-word-input input-eng" placeholder="Nhập từ tiếng Anh..." value="${escapeHtml(row.eng)}" oninput="handleCreateWordInput(${row.id}, 'eng', this.value)" autocomplete="off">
                    <span class="create-input-label">THUẬT NGỮ (TIẾNG ANH)</span>
                </div>
                <div class="create-input-group col-type">
                    <input type="text" class="create-word-input input-type text-center" placeholder="n, v, adj..." value="${escapeHtml(row.type)}" oninput="handleCreateWordInput(${row.id}, 'type', this.value)" autocomplete="off">
                    <div class="quick-type-mini-chips">
                        <span onclick="setRowType(${row.id}, 'n')">n</span>
                        <span onclick="setRowType(${row.id}, 'v')">v</span>
                        <span onclick="setRowType(${row.id}, 'adj')">adj</span>
                        <span onclick="setRowType(${row.id}, 'adv')">adv</span>
                    </div>
                    <span class="create-input-label">LOẠI TỪ</span>
                </div>
                <div class="create-input-group col-vie">
                    <input type="text" class="create-word-input input-vie" placeholder="Nhập định nghĩa tiếng Việt..." value="${escapeHtml(row.vie)}" oninput="handleCreateWordInput(${row.id}, 'vie', this.value)" onkeydown="handleCreateWordKeydown(event, ${row.id})" autocomplete="off">
                    <span class="create-input-label">ĐỊNH NGHĨA (TIẾNG VIỆT)</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

window.handleCreateWordInput = function(id, field, value) {
    const row = createSetRows.find(r => r.id === id);
    if (row) {
        row[field] = value;
    }
};

window.handleCreateWordKeydown = function(event, id) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const index = createSetRows.findIndex(r => r.id === id);
        if (index === createSetRows.length - 1) {
            addCreateSetRow(true);
        } else {
            const nextRow = createSetRows[index + 1];
            const nextInput = document.querySelector(`.create-word-card[data-row-id="${nextRow.id}"] .input-eng`);
            nextInput?.focus();
        }
    } else if (event.key === 'Tab' && !event.shiftKey) {
        const index = createSetRows.findIndex(r => r.id === id);
        if (index === createSetRows.length - 1) {
            event.preventDefault();
            addCreateSetRow(true);
        }
    }
};

window.addCreateSetRow = function(focus = false) {
    createSetRowIdCounter++;
    const newId = createSetRowIdCounter;
    createSetRows.push({ id: newId, eng: '', type: '', vie: '' });
    renderCreateSetWordRows();

    if (focus) {
        setTimeout(() => {
            const input = document.querySelector(`.create-word-card[data-row-id="${newId}"] .input-eng`);
            input?.focus();
        }, 50);
    }
};

window.addMultipleCreateSetRows = function(count = 5) {
    for (let i = 0; i < count; i++) {
        createSetRowIdCounter++;
        createSetRows.push({ id: createSetRowIdCounter, eng: '', type: '', vie: '' });
    }
    renderCreateSetWordRows();
};

window.deleteCreateWordRow = function(id) {
    createSetRows = createSetRows.filter(r => r.id !== id);
    if (createSetRows.length === 0) {
        createSetRowIdCounter++;
        createSetRows.push({ id: createSetRowIdCounter, eng: '', type: '', vie: '' });
    }
    renderCreateSetWordRows();
};

window.moveCreateWordRow = function(id, delta) {
    const index = createSetRows.findIndex(r => r.id === id);
    if (index === -1) return;
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= createSetRows.length) return;

    const temp = createSetRows[index];
    createSetRows[index] = createSetRows[newIndex];
    createSetRows[newIndex] = temp;

    renderCreateSetWordRows();
};

window.setRowType = function(id, type) {
    const row = createSetRows.find(r => r.id === id);
    if (row) {
        row.type = type;
        const input = document.querySelector(`.create-word-card[data-row-id="${id}"] .input-type`);
        if (input) input.value = type;
    }
};

window.speakCreateWordRow = function(id) {
    const row = createSetRows.find(r => r.id === id);
    if (row && row.eng.trim()) {
        speakWord(row.eng);
    }
};

window.applyTitleSuggestion = function(title) {
    document.getElementById('newSetTitleInput').value = title;
};

window.swapCreateSetColumns = function() {
    createSetRows.forEach(row => {
        const temp = row.eng;
        row.eng = row.vie;
        row.vie = temp;
    });
    renderCreateSetWordRows();
};

window.cleanEmptyCreateSetRows = function() {
    createSetRows = createSetRows.filter(r => r.eng.trim() !== '' || r.vie.trim() !== '');
    if (createSetRows.length === 0) {
        createSetRowIdCounter++;
        createSetRows.push({ id: createSetRowIdCounter, eng: '', type: '', vie: '' });
    }
    renderCreateSetWordRows();
};

window.clearAllCreateSetRows = function() {
    if (confirm("Bạn có chắc chắn muốn xóa tất cả các thẻ đang soạn thảo không?")) {
        createSetRows = [];
        for (let i = 0; i < 3; i++) {
            createSetRowIdCounter++;
            createSetRows.push({ id: createSetRowIdCounter, eng: '', type: '', vie: '' });
        }
        renderCreateSetWordRows();
    }
};

window.toggleDropdown = function(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-wrap')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

window.insertWordTemplate = function(type) {
    const template = WORD_TEMPLATES[type];
    if (!template) return;

    const titleInput = document.getElementById('newSetTitleInput');
    if (!titleInput.value.trim()) {
        titleInput.value = template.title;
    }

    // Filter out completely empty trailing rows
    createSetRows = createSetRows.filter(r => r.eng.trim() !== '' || r.vie.trim() !== '');

    template.words.forEach(w => {
        createSetRowIdCounter++;
        createSetRows.push({
            id: createSetRowIdCounter,
            eng: w.eng,
            type: w.type || '',
            vie: w.vie
        });
    });

    renderCreateSetWordRows();
    document.getElementById('templateDropdown').style.display = 'none';
};

window.triggerCreateSetTxtUpload = function() {
    document.getElementById('createSetTxtFileInput').click();
};

window.handleCreateSetTxtFile = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);
        let addedCount = 0;

        // Clean out empty rows first
        createSetRows = createSetRows.filter(r => r.eng.trim() !== '' || r.vie.trim() !== '');

        lines.forEach(line => {
            const clean = line.trim();
            if (!clean) return;

            let parts = clean.split('#');
            if (parts.length === 1 && clean.includes('\t')) parts = clean.split('\t');

            if (parts.length >= 3) {
                createSetRowIdCounter++;
                createSetRows.push({
                    id: createSetRowIdCounter,
                    eng: parts[0].trim(),
                    type: parts[1].trim(),
                    vie: parts.slice(2).join('#').trim()
                });
                addedCount++;
            } else if (parts.length === 2) {
                createSetRowIdCounter++;
                createSetRows.push({
                    id: createSetRowIdCounter,
                    eng: parts[0].trim(),
                    type: '',
                    vie: parts[1].trim()
                });
                addedCount++;
            }
        });

        const titleInput = document.getElementById('newSetTitleInput');
        if (!titleInput.value.trim()) {
            titleInput.value = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        }

        renderCreateSetWordRows();
        alert(`Đã nhập thành công ${addedCount} từ vựng từ file .txt!`);
    };
    reader.readAsText(file);
    event.target.value = '';
};

window.openCreateSetBulkDrawer = function() {
    document.getElementById('createSetBulkDrawer').style.display = 'block';
    document.getElementById('createSetBulkInput').focus();
};

window.closeCreateSetBulkDrawer = function() {
    document.getElementById('createSetBulkDrawer').style.display = 'none';
};

window.applyCreateSetBulkPaste = function() {
    const raw = document.getElementById('createSetBulkInput').value.trim();
    if (!raw) return;

    createSetRows = createSetRows.filter(r => r.eng.trim() !== '' || r.vie.trim() !== '');

    const lines = raw.split(/\r?\n/);
    let count = 0;

    lines.forEach(line => {
        const clean = line.trim();
        if (!clean) return;

        let parts = clean.split('#');
        if (parts.length >= 3) {
            createSetRowIdCounter++;
            createSetRows.push({
                id: createSetRowIdCounter,
                eng: parts[0].trim(),
                type: parts[1].trim(),
                vie: parts.slice(2).join('#').trim()
            });
            count++;
        } else if (parts.length === 2) {
            createSetRowIdCounter++;
            createSetRows.push({
                id: createSetRowIdCounter,
                eng: parts[0].trim(),
                type: '',
                vie: parts[1].trim()
            });
            count++;
        }
    });

    document.getElementById('createSetBulkInput').value = '';
    closeCreateSetBulkDrawer();
    renderCreateSetWordRows();
    alert(`Đã thêm ${count} thẻ từ văn bản dán hàng loạt!`);
};

window.saveNewSet = function() {
    const titleInput = document.getElementById('newSetTitleInput');
    const title = titleInput.value.trim();

    if (!title) {
        alert("Vui lòng nhập tiêu đề cho học phần!");
        titleInput.focus();
        return;
    }

    const folder = document.getElementById('newSetFolderSelect').value || 'Chưa phân loại';
    const description = document.getElementById('newSetDescInput').value.trim();

    // Clean valid words: require at least eng or vie
    const cleanWords = [];
    createSetRows.forEach(r => {
        const eng = r.eng.trim();
        const type = r.type.trim();
        const vie = r.vie.trim();
        if (eng || vie) {
            cleanWords.push({ eng, type, vie });
        }
    });

    if (cleanWords.length === 0) {
        if (!confirm("Học phần này hiện chưa có thẻ từ vựng nào. Bạn có chắc muốn tạo học phần trống không?")) {
            return;
        }
    }

    if (editingSetIndex !== null && appData[editingSetIndex]) {
        // UPDATE EXISTING SET
        appData[editingSetIndex].title = title;
        appData[editingSetIndex].folder = folder;
        appData[editingSetIndex].description = description;
        appData[editingSetIndex].words = cleanWords;
        saveAppData();
        openSet(editingSetIndex);
    } else {
        // CREATE NEW SET
        const newSet = {
            title,
            folder,
            description,
            words: cleanWords
        };
        appData.push(newSet);
        saveAppData();
        openSet(appData.length - 1);
    }
};

window.cancelCreateSet = function() {
    const hasContent = document.getElementById('newSetTitleInput').value.trim() !== '' ||
        createSetRows.some(r => r.eng.trim() !== '' || r.vie.trim() !== '');

    if (hasContent) {
        if (!confirm("Bạn có các thay đổi chưa lưu. Bạn có chắc chắn muốn hủy bỏ không?")) {
            return;
        }
    }

    if (currentOpenedFolder) {
        navigateTo('library');
        switchLibraryTab('folders');
    } else {
        navigateTo('library');
    }
};

window.deleteFolder = function(folderName) {
    if (folderName === 'Chưa phân loại') {
        alert('Không thể xóa thư mục mặc định "Chưa phân loại".');
        return;
    }

    if (confirm(`Bạn có chắc muốn xóa thư mục "${folderName}" không?\n\nLưu ý: Các học phần bên trong sẽ được chuyển về "Chưa phân loại" chứ KHÔNG bị xóa.`)) {
        const deletedFolderObj = folderData.find(f => f.name === folderName);
        const folderCopy = deletedFolderObj ? JSON.parse(JSON.stringify(deletedFolderObj)) : { name: folderName, color: '#3b82f6', icon: '📁' };

        const affectedSetIndices = [];
        appData.forEach((set, idx) => {
            if (set.folder === folderName) {
                affectedSetIndices.push(idx);
                set.folder = "Chưa phân loại";
            }
        });
        saveAppData();

        folderData = folderData.filter(f => f.name !== folderName);
        saveFolderData();

        pushUndoAction({
            type: 'DELETE_FOLDER',
            description: `Xóa thư mục "${folderName}"`,
            data: {
                folder: folderCopy,
                affectedSetIndices: affectedSetIndices
            }
        });

        if (currentOpenedFolder === folderName) {
            closeFolderContents();
        } else {
            renderLibrary();
        }
    }
};

// ==========================================
// FOLDER MANAGE MODAL (ADD SETS TO FOLDER)
// ==========================================
let targetFolderForModal = '';

window.openFolderManageModal = function(folderName) {
    targetFolderForModal = folderName;
    const meta = getFolderMeta(folderName);
    document.getElementById('folderManageTitle').innerHTML = `${meta.icon} Quản lý thư mục: ${escapeHtml(folderName)}`;
    document.getElementById('folderManageModal').style.display = 'flex';
    renderFolderSetsSelection();
};

window.closeFolderManageModal = function() {
    document.getElementById('folderManageModal').style.display = 'none';
    targetFolderForModal = '';
    renderLibrary();
};

function renderFolderSetsSelection() {
    const container = document.getElementById('folderSetsSelectionList');
    container.innerHTML = '';

    appData.forEach((set, index) => {
        const isInFolder = set.folder === targetFolderForModal;
        const item = document.createElement('div');
        item.className = 'material-item';
        item.innerHTML = `
            <div class="material-item-left">
                <div class="material-item-icon">📄</div>
                <div>
                    <div class="material-item-title">${escapeHtml(set.title)}</div>
                    <div class="material-item-desc">${set.words.length} từ • Hiện tại: ${escapeHtml(set.folder || 'Chưa phân loại')}</div>
                </div>
            </div>
            <button class="btn-circle-toggle ${isInFolder ? 'active' : ''}" onclick="toggleSetFolderMembership(${index})">
                ${isInFolder ? '✓' : '+'}
            </button>
        `;
        container.appendChild(item);
    });
}

window.toggleSetFolderMembership = function(index) {
    if (appData[index].folder === targetFolderForModal) {
        appData[index].folder = 'Chưa phân loại';
    } else {
        appData[index].folder = targetFolderForModal;
    }
    saveAppData();
    renderFolderSetsSelection();
};

// ==========================================================================
// 4. SET DETAIL VIEW (PRACTICE, MANAGEMENT, WORD LIST)
// ==========================================================================

window.openSet = function(index) {
    currentSetIndex = index;
    currentSetTab = 'study';
    navigateTo('detail');
    switchSetTab('study');
    saveNavState();
};

window.goBackFromSetDetail = function() {
    if (typeof clearRowSelection === 'function') clearRowSelection(false);
    navigateTo('library');
    if (currentOpenedFolder) {
        switchLibraryTab('folders');
    }
    saveNavState();
};

function renderSetDetail() {
    const set = getCurrentSet();
    if (!set) {
        navigateTo('library');
        return;
    }

    const isHub = currentSetIndex === 'starred_hub';
    const manageTabBtn = document.getElementById('setTabManage');
    if (manageTabBtn) {
        manageTabBtn.style.display = isHub ? 'none' : 'inline-flex';
    }

    const fMeta = getFolderMeta(set.folder);
    document.getElementById('detailSetTitle').textContent = set.title;
    const detailFolderEl = document.getElementById('detailSetFolder');
    detailFolderEl.textContent = `${fMeta.icon} ${set.folder || 'Chưa phân loại'}`;
    detailFolderEl.style.color = isHub ? '#f59e0b' : fMeta.color;
    document.getElementById('detailWordCount').textContent = isHub ? `${set.words.length} từ cần ôn` : `${set.words.length} thuật ngữ`;
    document.getElementById('setListWordCount').textContent = set.words.length;

    if (currentSetTab === 'study') {
        renderStudyTable();
    } else if (currentSetTab === 'manage') {
        if (isHub) {
            switchSetTab('study');
        } else {
            updateBulkPreview();
        }
    } else if (currentSetTab === 'list') {
        renderWordListTable();
    }
}

window.switchSetTab = function(tabName) {
    if (typeof clearRowSelection === 'function') clearRowSelection(false);
    currentSetTab = tabName;
    document.getElementById('setTabStudy').classList.toggle('active', tabName === 'study');
    document.getElementById('setTabManage').classList.toggle('active', tabName === 'manage');
    document.getElementById('setTabList').classList.toggle('active', tabName === 'list');

    document.getElementById('setStudySection').style.display = tabName === 'study' ? 'block' : 'none';
    document.getElementById('setManageSection').style.display = tabName === 'manage' ? 'block' : 'none';
    document.getElementById('setListSection').style.display = tabName === 'list' ? 'block' : 'none';

    renderSetDetail();
    saveNavState();
};

// --- STUDY ANSWERS & RESULTS PERSISTENCE (LOCALSTORAGE) ---
function getStudyStorageKey(index) {
    if (index === 'starred_hub') return 'toeic_study_answers_starred_hub';
    const set = appData[index];
    if (set && set.title) {
        const safeTitle = (set.title || '').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_').slice(0, 40);
        return `toeic_study_answers_${index}_${safeTitle}`;
    }
    return `studyAnswers_${index}`;
}

function getStudyResultsKey(index) {
    if (index === 'starred_hub') return 'toeic_study_results_starred_hub';
    const set = appData[index];
    if (set && set.title) {
        const safeTitle = (set.title || '').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_').slice(0, 40);
        return `toeic_study_results_${index}_${safeTitle}`;
    }
    return `studyResults_${index}`;
}

function loadStudyAnswers(index) {
    const primaryKey = getStudyStorageKey(index);
    const legacyKey = `studyAnswers_${index}`;
    
    let raw = localStorage.getItem(primaryKey);
    if (!raw) {
        raw = localStorage.getItem(legacyKey);
    }
    // Backward compatibility: import legacy answers from sessionStorage if found
    if (!raw) {
        try {
            raw = sessionStorage.getItem(legacyKey);
            if (raw) {
                localStorage.setItem(primaryKey, raw);
                localStorage.setItem(legacyKey, raw);
            }
        } catch (e) {}
    }
    
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            console.warn('Failed to parse saved study answers:', e);
        }
    }
    return [];
}

function saveStudyAnswers(index, answersArray, triggerSync = true) {
    const primaryKey = getStudyStorageKey(index);
    const legacyKey = `studyAnswers_${index}`;
    const serialized = JSON.stringify(answersArray);
    try {
        localStorage.setItem(primaryKey, serialized);
        localStorage.setItem(legacyKey, serialized);
        sessionStorage.setItem(legacyKey, serialized);
        localStorage.setItem(`toeic_study_time_${index}`, Date.now().toString());
    } catch (e) {
        console.warn('Failed to save study answers:', e);
    }
    if (triggerSync && typeof triggerCloudSync === 'function') {
        triggerCloudSync();
    }
}

function loadStudyResults(index) {
    const primaryKey = getStudyResultsKey(index);
    const legacyKey = `studyResults_${index}`;
    let raw = localStorage.getItem(primaryKey);
    if (!raw) raw = localStorage.getItem(legacyKey);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            console.warn('Failed to parse saved study results:', e);
        }
    }
    return [];
}

function saveStudyResults(index, resultsArray, triggerSync = true) {
    const primaryKey = getStudyResultsKey(index);
    const legacyKey = `studyResults_${index}`;
    const serialized = JSON.stringify(resultsArray);
    try {
        localStorage.setItem(primaryKey, serialized);
        localStorage.setItem(legacyKey, serialized);
        localStorage.setItem(`toeic_study_time_${index}`, Date.now().toString());
    } catch (e) {
        console.warn('Failed to save study results:', e);
    }
    if (triggerSync && typeof triggerCloudSync === 'function') {
        triggerCloudSync();
    }
}

function clearStudyAnswersForSet(index, triggerSync = true) {
    const primaryAnsKey = getStudyStorageKey(index);
    const legacyAnsKey = `studyAnswers_${index}`;
    const primaryResKey = getStudyResultsKey(index);
    const legacyResKey = `studyResults_${index}`;
    try {
        localStorage.removeItem(primaryAnsKey);
        localStorage.removeItem(legacyAnsKey);
        localStorage.removeItem(primaryResKey);
        localStorage.removeItem(legacyResKey);
        sessionStorage.removeItem(legacyAnsKey);
        localStorage.setItem(`toeic_study_time_${index}`, Date.now().toString());
    } catch (e) {}
    if (triggerSync && typeof triggerCloudSync === 'function') {
        triggerCloudSync();
    }
}

// --- STARRED FILTER & STUDY CONTROLS ---
window.setStudyFilter = function(filterType) {
    if (typeof clearRowSelection === 'function') clearRowSelection(false);
    currentStudyFilter = filterType;
    const btnAll = document.getElementById('filterAllWordsBtn');
    const btnStarred = document.getElementById('filterStarredWordsBtn');
    if (btnAll && btnStarred) {
        btnAll.classList.toggle('active', filterType === 'all');
        btnStarred.classList.toggle('active', filterType === 'starred');
    }
    renderStudyTable();
};

function updateStudyFilterCounts() {
    const set = getCurrentSet();
    const totalWords = set ? set.words.length : 0;
    const starredWords = set ? set.words.filter(w => w.starred).length : 0;

    const chipAll = document.getElementById('chipCountAll');
    const chipStarred = document.getElementById('chipCountStarred');
    if (chipAll) chipAll.textContent = totalWords;
    if (chipStarred) chipStarred.textContent = starredWords;
}

window.toggleStarWord = function(index, event, skipPushUndo = false) {
    if (event) event.stopPropagation();
    const set = getCurrentSet();
    if (!set || !set.words[index]) return;

    const word = set.words[index];
    const prevStarred = !!word.starred;
    const newStarred = !prevStarred;
    word.starred = newStarred;

    const wordEng = word.eng || 'thuật ngữ';

    // If inside virtual starred hub, update the source set word
    if (set.isVirtualStarredSet && typeof word._originalSetIndex === 'number') {
        const origSet = appData[word._originalSetIndex];
        if (origSet && origSet.words[word._originalWordIndex]) {
            origSet.words[word._originalWordIndex].starred = word.starred;
        }
    }

    saveAppData(); // Persists to localStorage and triggers Firebase Cloud Sync

    if (!skipPushUndo) {
        pushUndoAction({
            type: 'TOGGLE_STAR',
            description: newStarred ? `Đánh dấu sao ⭐ "${escapeHtml(wordEng)}"` : `Bỏ đánh dấu sao "${escapeHtml(wordEng)}"`,
            data: {
                setIndex: currentSetIndex,
                wordIndex: index,
                prevStarred: prevStarred,
                newStarred: newStarred,
                isVirtual: !!set.isVirtualStarredSet,
                originalSetIndex: word._originalSetIndex,
                originalWordIndex: word._originalWordIndex
            }
        });
    }

    // Update row in DOM
    const tr = document.querySelector(`tr[data-word-index="${index}"]`);
    if (tr) {
        tr.classList.toggle('row-starred', word.starred);
        const btn = tr.querySelector('.star-btn');
        if (btn) {
            btn.classList.toggle('active', word.starred);
            btn.innerHTML = word.starred ? '⭐' : '☆';
            btn.title = word.starred ? 'Bỏ đánh dấu (Alt+S)' : 'Đánh dấu cần ôn (Alt+S)';
        }
    }

    updateStudyFilterCounts();

    // If in 'starred' filter mode and word is unstarred, refresh after brief animation
    if (currentStudyFilter === 'starred' && !word.starred && tr) {
        tr.style.opacity = '0.35';
        tr.style.transition = 'opacity 0.25s ease';
        setTimeout(() => {
            renderStudyTable();
        }, 280);
    }
};

// --- ROW SELECTION & MULTI-ROW RESULT CLEARING STATE ---
let selectedStudyIndices = new Set();
let lastSelectedDisplayIndex = null;
let isRowDragSelecting = false;
let dragStartIndex = null;
let wasRowDragged = false;

// --- STUDY TAB (TABLE TYPING PRACTICE) ---
function renderStudyTable() {
    const set = getCurrentSet();
    const tbody = document.getElementById('vocabBody');
    tbody.innerHTML = '';

    updateStudyFilterCounts();

    if (!set || set.words.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Chưa có từ vựng nào trong phần này.
        </td></tr>`;
        updateStudyStats();
        updateRowSelectionUI();
        return;
    }

    let wordsToRender = set.words.map((item, originalIndex) => ({ item, originalIndex }));
    if (currentStudyFilter === 'starred') {
        wordsToRender = wordsToRender.filter(({ item }) => item.starred);
    }

    if (wordsToRender.length === 0 && currentStudyFilter === 'starred') {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
            <div style="font-size: 36px; margin-bottom: 10px;">⭐</div>
            <strong style="font-size: 15px; color: var(--text-main);">Chưa có từ nào được đánh dấu cần ôn!</strong>
            <p style="margin-top: 6px; font-size: 13px;">Bấm vào biểu tượng ngôi sao <strong>☆</strong> hoặc phím tắt <strong>Alt + S</strong> ở bất kỳ dòng nào để đánh dấu các từ bạn cần tập trung ôn luyện.</p>
            <button class="btn btn-outline btn-sm" style="margin-top: 14px;" onclick="setStudyFilter('all')">Xem tất cả từ</button>
        </td></tr>`;
        updateStudyStats();
        updateRowSelectionUI();
        return;
    }

    // Clean up any stale selected indices out of bounds
    for (const idx of selectedStudyIndices) {
        if (idx >= set.words.length) {
            selectedStudyIndices.delete(idx);
        }
    }

    const savedAnswers = loadStudyAnswers(currentSetIndex);
    const savedResults = loadStudyResults(currentSetIndex);

    wordsToRender.forEach(({ item, originalIndex }, displayIndex) => {
        const oldAns = savedAnswers[originalIndex] || '';
        const oldRes = savedResults[originalIndex] || null;
        const isStarred = !!item.starred;
        const isSelected = selectedStudyIndices.has(originalIndex);

        let inputClass = 'answer-input';
        let resultHtml = '';

        if (oldRes === 'correct') {
            inputClass += ' input-correct';
            resultHtml = `
                <div class="result-cell-content">
                    <span class="result-correct">✅ Đúng</span>
                    <button class="btn-clear-single-res" onclick="clearSingleRowResult(${originalIndex}, event)" title="Xóa kết quả dòng này">✕</button>
                </div>`;
        } else if (oldRes === 'wrong') {
            inputClass += ' input-wrong';
            resultHtml = `
                <div class="result-cell-content">
                    <span class="result-wrong">❌ Sai</span> <span class="result-expected">(${escapeHtml(item.vie)})</span>
                    <button class="btn-clear-single-res" onclick="clearSingleRowResult(${originalIndex}, event)" title="Xóa kết quả dòng này">✕</button>
                </div>`;
        } else if (oldRes === 'revealed') {
            inputClass += ' input-revealed';
            resultHtml = `
                <div class="result-cell-content">
                    <span class="result-revealed">💡 Đáp án:</span> <span class="result-expected">(${escapeHtml(item.vie)})</span>
                    <button class="btn-clear-single-res" onclick="clearSingleRowResult(${originalIndex}, event)" title="Xóa kết quả dòng này">✕</button>
                </div>`;
        } else {
            resultHtml = `<button class="btn-show-hint" onclick="revealStudyAnswer(${originalIndex})" title="Xem đáp án (Ctrl+Enter hoặc F2)">💡 Đáp án</button>`;
        }

        const tr = document.createElement('tr');
        if (isStarred) {
            tr.classList.add('row-starred');
        }
        if (isSelected) {
            tr.classList.add('row-selected');
        }
        tr.setAttribute('data-word-index', originalIndex);
        tr.setAttribute('data-display-index', displayIndex);

        // Click or drag anywhere on the row to select / drag-select
        tr.addEventListener('mousedown', (e) => handleStudyRowMouseDown(displayIndex, originalIndex, e));
        tr.addEventListener('mouseenter', (e) => handleStudyRowMouseEnter(displayIndex, originalIndex, e));
        tr.addEventListener('click', (e) => handleStudyRowClick(displayIndex, originalIndex, e));

        tr.innerHTML = `
            <td class="star-cell" style="text-align: center;">
                <button class="star-btn ${isStarred ? 'active' : ''}" onclick="toggleStarWord(${originalIndex}, event)" title="${isStarred ? 'Bỏ đánh dấu (Alt+S)' : 'Đánh dấu cần ôn (Alt+S)'}">
                    ${isStarred ? '⭐' : '☆'}
                </button>
            </td>
            <td class="stt-cell" data-display-index="${displayIndex}" data-word-index="${originalIndex}">
                <span class="stt-num">${displayIndex + 1}</span>
                <span class="stt-check-indicator">✓</span>
            </td>
            <td>
                <span class="word-prompt">
                    ${escapeHtml(item.eng)}
                    <button class="speak-icon-btn" onclick="speakWord('${escapeJsString(item.eng)}')" title="Nghe phát âm (hoặc bấm Tab)">🔊</button>
                </span>
            </td>
            <td><span class="type-badge">${escapeHtml(item.type || '-')}</span></td>
            <td>
                <input type="text" class="${inputClass}" placeholder="Gõ nghĩa rồi Enter... (F2: đáp án, Alt+S: đánh dấu ⭐)" value="${escapeHtml(oldAns)}" data-index="${originalIndex}">
            </td>
            <td class="result-cell" data-result-for="${originalIndex}">
                ${resultHtml}
            </td>
        `;
        tbody.appendChild(tr);
    });

    setupStudyEvents();
    updateStudyStats();
    updateRowSelectionUI();
}

function checkStudyScore(input, index) {
    const set = getCurrentSet();
    if (!set || !set.words[index]) return;

    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = (set.words[index]?.vie || '').trim().toLowerCase();
    const resultCell = document.querySelector(`.result-cell[data-result-for="${index}"]`);

    const savedAnswers = loadStudyAnswers(currentSetIndex);
    const savedResults = loadStudyResults(currentSetIndex);

    savedAnswers[index] = input.value;

    if (userAnswer === '') {
        savedResults[index] = null;
        if (resultCell) {
            resultCell.innerHTML = `<button class="btn-show-hint" onclick="revealStudyAnswer(${index})" title="Xem đáp án (Ctrl+Enter hoặc F2)">💡 Đáp án</button>`;
        }
        input.classList.remove('input-correct', 'input-wrong', 'input-revealed');
    } else if (isAnswerFuzzyMatch(userAnswer, correctAnswer)) {
        savedResults[index] = 'correct';
        if (resultCell) {
            resultCell.innerHTML = `
                <div class="result-cell-content">
                    <span class="result-correct">✅ Đúng</span>
                    <button class="btn-clear-single-res" onclick="clearSingleRowResult(${index}, event)" title="Xóa kết quả dòng này">✕</button>
                </div>`;
        }
        input.classList.add('input-correct');
        input.classList.remove('input-wrong', 'input-revealed');
    } else {
        savedResults[index] = 'wrong';
        if (resultCell) {
            resultCell.innerHTML = `
                <div class="result-cell-content">
                    <span class="result-wrong">❌ Sai</span> <span class="result-expected">(${escapeHtml(set.words[index].vie)})</span>
                    <button class="btn-clear-single-res" onclick="clearSingleRowResult(${index}, event)" title="Xóa kết quả dòng này">✕</button>
                </div>`;
        }
        input.classList.add('input-wrong');
        input.classList.remove('input-correct', 'input-revealed');
    }

    saveStudyAnswers(currentSetIndex, savedAnswers);
    saveStudyResults(currentSetIndex, savedResults);
    updateStudyStats();
}

window.revealStudyAnswer = function(index) {
    const set = getCurrentSet();
    if (!set || !set.words[index]) return;

    const input = document.querySelector(`#vocabTable .answer-input[data-index="${index}"]`);
    const resultCell = document.querySelector(`.result-cell[data-result-for="${index}"]`);

    const savedAnswers = loadStudyAnswers(currentSetIndex);
    const savedResults = loadStudyResults(currentSetIndex);

    savedResults[index] = 'revealed';
    saveStudyResults(currentSetIndex, savedResults);

    if (resultCell) {
        resultCell.innerHTML = `
            <div class="result-cell-content">
                <span class="result-revealed">💡 Đáp án:</span> <span class="result-expected">(${escapeHtml(set.words[index].vie)})</span>
                <button class="btn-clear-single-res" onclick="clearSingleRowResult(${index}, event)" title="Xóa kết quả dòng này">✕</button>
            </div>`;
    }

    if (input) {
        input.classList.add('input-revealed');
        input.classList.remove('input-correct', 'input-wrong');
        input.focus();
    }

    updateStudyStats();
};

function setupStudyEvents() {
    const inputs = document.querySelectorAll('#vocabTable .answer-input');
    const set = getCurrentSet();
    if (!set) return;

    inputs.forEach((input, seqIndex) => {
        const wordIndex = parseInt(input.getAttribute('data-index'), 10);

        input.addEventListener('focus', () => {
            if (selectedStudyIndices.size > 0) {
                clearRowSelection(false);
            }
            if (isAutoSpeakEnabled && set.words[wordIndex]) {
                speakWord(set.words[wordIndex].eng);
            }
        });

        // Real-time autosave text ONLY
        input.addEventListener('input', () => {
            const savedAnswers = loadStudyAnswers(currentSetIndex);
            const savedResults = loadStudyResults(currentSetIndex);

            savedAnswers[wordIndex] = input.value;
            savedResults[wordIndex] = null;

            saveStudyAnswers(currentSetIndex, savedAnswers);
            saveStudyResults(currentSetIndex, savedResults);

            const resultCell = document.querySelector(`.result-cell[data-result-for="${wordIndex}"]`);
            if (resultCell) {
                resultCell.innerHTML = `<button class="btn-show-hint" onclick="revealStudyAnswer(${wordIndex})" title="Xem đáp án (Ctrl+Enter hoặc F2)">💡 Đáp án</button>`;
            }
            input.classList.remove('input-correct', 'input-wrong', 'input-revealed');

            updateStudyStats();
        });

        input.addEventListener('keydown', (e) => {
            // A. Shortcut to toggle Star: Alt + S
            if (e.altKey && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                toggleStarWord(wordIndex);
                return;
            }

            // B. Shortcut to clear current row: Alt + Delete or Ctrl + Delete
            if ((e.altKey || e.ctrlKey) && (e.key === 'Delete' || e.key === 'Backspace')) {
                e.preventDefault();
                clearSingleRowResult(wordIndex);
                return;
            }

            // C. Shortcut to reveal answer: F2, Ctrl+Enter, Alt+Enter, or Alt+H
            if (e.key === 'F2' || ((e.ctrlKey || e.altKey) && e.key === 'Enter') || (e.altKey && (e.key === 'h' || e.key === 'H'))) {
                e.preventDefault();
                revealStudyAnswer(wordIndex);
                return;
            }

            // D. Tab: Pronounce English word
            if (e.key === 'Tab') {
                e.preventDefault();
                if (set.words[wordIndex]) speakWord(set.words[wordIndex].eng);
                return;
            }

            // E. Enter: Submit answer & validate ONLY when Enter is pressed
            if (e.key === 'Enter') {
                e.preventDefault();
                checkStudyScore(input, wordIndex);

                if (seqIndex + 1 < inputs.length) {
                    inputs[seqIndex + 1].focus();
                }
                return;
            }

            // F. Arrow Up / Down navigation
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (seqIndex + 1 < inputs.length) inputs[seqIndex + 1].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (seqIndex - 1 >= 0) inputs[seqIndex - 1].focus();
            }
        });
    });
}

function updateStudyStats() {
    const visibleRows = document.querySelectorAll('#vocabBody tr[data-word-index]');
    const total = visibleRows.length;
    let correct = 0;
    let wrong = 0;

    visibleRows.forEach(row => {
        const cell = row.querySelector('.result-cell');
        if (cell) {
            if (cell.querySelector('.result-correct')) {
                correct++;
            } else if (cell.querySelector('.result-wrong') || cell.querySelector('.result-revealed')) {
                wrong++;
            }
        }
    });

    const answered = correct + wrong;
    const remaining = Math.max(0, total - answered);

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCorrect').textContent = correct;
    document.getElementById('statWrong').textContent = wrong;
    document.getElementById('statPercent').textContent = answered > 0 ? Math.round((correct / answered) * 100) + '%' : '0%';

    const remainingEl = document.getElementById('statRemaining');
    if (remainingEl) remainingEl.textContent = remaining;

    const progCorrect = document.getElementById('studyProgressCorrect');
    const progWrong = document.getElementById('studyProgressWrong');
    if (progCorrect && progWrong) {
        const correctPct = total > 0 ? (correct / total) * 100 : 0;
        const wrongPct = total > 0 ? (wrong / total) * 100 : 0;
        progCorrect.style.width = `${correctPct}%`;
        progWrong.style.width = `${wrongPct}%`;
    }
}

window.scrollToNextUnanswered = function() {
    const inputs = document.querySelectorAll('#vocabTable .answer-input');
    const results = loadStudyResults(currentSetIndex);

    for (let i = 0; i < inputs.length; i++) {
        const wordIdx = parseInt(inputs[i].getAttribute('data-index'), 10);
        if (!results[wordIdx] || inputs[i].value.trim() === '') {
            inputs[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
            inputs[i].focus();
            return;
        }
    }

    if (inputs.length > 0) {
        inputs[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputs[0].focus();
    }
};

// --- ROW SELECTION & GOOGLE SHEETS-LIKE RESULT CLEARING IMPLEMENTATION ---

window.handleStudyRowClick = function(displayIndex, originalIndex, event) {
    // If clicked on an interactive control (input or button), let that control handle its action
    if (event.target.closest('button, input, a, select')) return;

    // If mouse was dragged across rows, dragging already set the selection
    if (wasRowDragged) {
        wasRowDragged = false;
        return;
    }

    if (event.shiftKey && lastSelectedDisplayIndex !== null) {
        // Range selection between lastSelectedDisplayIndex and displayIndex
        const visibleRows = Array.from(document.querySelectorAll('#vocabBody tr[data-word-index]'));
        const minIdx = Math.min(lastSelectedDisplayIndex, displayIndex);
        const maxIdx = Math.max(lastSelectedDisplayIndex, displayIndex);

        visibleRows.forEach(row => {
            const dIdx = parseInt(row.getAttribute('data-display-index'), 10);
            const wIdx = parseInt(row.getAttribute('data-word-index'), 10);
            if (dIdx >= minIdx && dIdx <= maxIdx) {
                selectedStudyIndices.add(wIdx);
            }
        });
    } else if (event.ctrlKey || event.metaKey) {
        // Toggle single row
        if (selectedStudyIndices.has(originalIndex)) {
            selectedStudyIndices.delete(originalIndex);
        } else {
            selectedStudyIndices.add(originalIndex);
        }
        lastSelectedDisplayIndex = displayIndex;
    } else {
        // Single row click without modifier:
        // If clicking on an already selected row, deselect it (support "bấm bất cứ đâu để hủy chọn")
        if (selectedStudyIndices.has(originalIndex)) {
            clearRowSelection();
            return;
        } else {
            // Select this row
            selectedStudyIndices.clear();
            selectedStudyIndices.add(originalIndex);
            lastSelectedDisplayIndex = displayIndex;
        }
    }
    updateRowSelectionUI();
};

window.handleStudyRowMouseDown = function(displayIndex, originalIndex, event) {
    if (event.button !== 0) return; // Only left mouse button
    // Ignore clicks on buttons, inputs, links
    if (event.target.closest('button, input, a, select')) return;
    if (event.shiftKey || event.ctrlKey || event.metaKey) return;

    isRowDragSelecting = true;
    dragStartIndex = displayIndex;
    wasRowDragged = false;
};

window.handleStudyRowMouseEnter = function(displayIndex, originalIndex, event) {
    if (!isRowDragSelecting || dragStartIndex === null) return;
    if (displayIndex !== dragStartIndex) {
        wasRowDragged = true;
    }

    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();

    const visibleRows = Array.from(document.querySelectorAll('#vocabBody tr[data-word-index]'));
    const minIdx = Math.min(dragStartIndex, displayIndex);
    const maxIdx = Math.max(dragStartIndex, displayIndex);

    selectedStudyIndices.clear();
    visibleRows.forEach(row => {
        const dIdx = parseInt(row.getAttribute('data-display-index'), 10);
        const wIdx = parseInt(row.getAttribute('data-word-index'), 10);
        if (dIdx >= minIdx && dIdx <= maxIdx) {
            selectedStudyIndices.add(wIdx);
        }
    });
    lastSelectedDisplayIndex = displayIndex;
    updateRowSelectionUI();
};

document.addEventListener('mouseup', () => {
    if (isRowDragSelecting) {
        isRowDragSelecting = false;
        dragStartIndex = null;
        setTimeout(() => { wasRowDragged = false; }, 50);
    }
});

// Click anywhere to deselect ("có thể bấm bất cứ đâu để hủy chọn")
document.addEventListener('mousedown', (e) => {
    if (selectedStudyIndices.size === 0) return;

    // Do NOT deselect if clicking inside the floating selection bar (e.g. clicking "Xóa kết quả" or "Bỏ chọn")
    if (e.target.closest('#studySelectionBar')) return;

    // Do NOT deselect if clicking the STT header
    if (e.target.closest('.stt-header')) return;

    // If clicking an input field: deselect immediately so user can type freely
    if (e.target.closest('input')) {
        clearRowSelection();
        return;
    }

    // If clicking a button in a row (e.g. star, speak, hint, delete single): deselect rows
    if (e.target.closest('button')) {
        clearRowSelection();
        return;
    }

    // If clicking inside a row (not on input or button), handleStudyRowMouseDown & handleStudyRowClick will handle it
    const row = e.target.closest('#vocabBody tr[data-word-index]');
    if (row) return;

    // Clicked anywhere outside the rows: deselect all!
    clearRowSelection();
});

window.toggleSelectAllStudyRows = function() {
    const visibleRows = Array.from(document.querySelectorAll('#vocabBody tr[data-word-index]'));
    if (visibleRows.length === 0) return;

    const allSelected = visibleRows.every(row => {
        const wIdx = parseInt(row.getAttribute('data-word-index'), 10);
        return selectedStudyIndices.has(wIdx);
    });

    if (allSelected) {
        selectedStudyIndices.clear();
        lastSelectedDisplayIndex = null;
    } else {
        visibleRows.forEach(row => {
            const wIdx = parseInt(row.getAttribute('data-word-index'), 10);
            selectedStudyIndices.add(wIdx);
        });
    }
    updateRowSelectionUI();
};

window.updateRowSelectionUI = function() {
    const visibleRows = document.querySelectorAll('#vocabBody tr[data-word-index]');
    let count = 0;

    visibleRows.forEach(row => {
        const wIdx = parseInt(row.getAttribute('data-word-index'), 10);
        const isSelected = selectedStudyIndices.has(wIdx);
        row.classList.toggle('row-selected', isSelected);
        if (isSelected) count++;
    });

    const bar = document.getElementById('studySelectionBar');
    const countText = document.getElementById('studySelectedCountText');
    const sttHeader = document.querySelector('.stt-header');

    if (bar && countText) {
        if (count > 0) {
            bar.style.display = 'flex';
            countText.textContent = `Đã chọn ${count} hàng`;
        } else {
            bar.style.display = 'none';
        }
    }

    if (sttHeader) {
        const totalVisible = visibleRows.length;
        if (totalVisible > 0 && count === totalVisible) {
            sttHeader.title = "Bấm để bỏ chọn tất cả các dòng";
            sttHeader.classList.add('all-selected');
        } else {
            sttHeader.title = "Bấm để chọn tất cả hoặc bỏ chọn tất cả các dòng";
            sttHeader.classList.remove('all-selected');
        }
    }
};

window.clearRowSelection = function(shouldUpdate = true) {
    selectedStudyIndices.clear();
    lastSelectedDisplayIndex = null;
    if (shouldUpdate) {
        updateRowSelectionUI();
    }
};

window.clearSingleRowResult = function(wordIndex, event) {
    if (event) event.stopPropagation();
    try {
        clearStudyResultsForIndices([wordIndex]);
    } finally {
        if (selectedStudyIndices.has(wordIndex)) {
            selectedStudyIndices.delete(wordIndex);
        }
        updateRowSelectionUI();
    }
};

window.clearStudyResultsForIndices = function(indices, skipPushUndo = false) {
    if (!indices || indices.length === 0) return;
    const indexArray = Array.isArray(indices) ? indices : Array.from(indices);
    if (indexArray.length === 0) return;

    try {
        const savedAnswers = loadStudyAnswers(currentSetIndex);
        const savedResults = loadStudyResults(currentSetIndex);

        if (!skipPushUndo) {
            const itemsToRecord = [];
            indexArray.forEach(wordIndex => {
                const ans = savedAnswers[wordIndex] || '';
                const res = savedResults[wordIndex] || null;
                if (ans !== '' || res !== null) {
                    itemsToRecord.push({
                        wordIndex: wordIndex,
                        answer: ans,
                        result: res
                    });
                }
            });

            if (itemsToRecord.length > 0) {
                const desc = itemsToRecord.length === 1
                    ? `Xóa kết quả dòng #${itemsToRecord[0].wordIndex + 1}`
                    : `Xóa kết quả ${itemsToRecord.length} dòng`;
                pushUndoAction({
                    type: 'CLEAR_STUDY_RESULTS',
                    description: desc,
                    data: {
                        setIndex: currentSetIndex,
                        items: itemsToRecord
                    }
                });
            }
        }

        indexArray.forEach(wordIndex => {
            savedAnswers[wordIndex] = '';
            savedResults[wordIndex] = null;

            const input = document.querySelector(`#vocabTable .answer-input[data-index="${wordIndex}"]`);
            if (input) {
                input.value = '';
                input.classList.remove('input-correct', 'input-wrong', 'input-revealed');
            }

            const resultCell = document.querySelector(`.result-cell[data-result-for="${wordIndex}"]`);
            if (resultCell) {
                resultCell.innerHTML = `<button class="btn-show-hint" onclick="revealStudyAnswer(${wordIndex})" title="Xem đáp án (Ctrl+Enter hoặc F2)">💡 Đáp án</button>`;
            }
        });

        saveStudyAnswers(currentSetIndex, savedAnswers);
        saveStudyResults(currentSetIndex, savedResults);
        updateStudyStats();

        if (typeof showToast === 'function') {
            showToast(`Đã xóa kết quả của ${indexArray.length} hàng từ đã chọn.`);
        }
    } catch (e) {
        console.warn('Error clearing study results:', e);
    }
};

// Clear selected rows and automatically deselect! ("sau khi xóa thì hãy tự động bỏ chọn")
window.clearSelectedRowsResults = function() {
    if (selectedStudyIndices.size === 0) return;
    const toClear = Array.from(selectedStudyIndices);
    try {
        clearStudyResultsForIndices(toClear);
    } finally {
        // ALWAYS and unconditionally deselect all rows after clearing results!
        clearRowSelection();
    }
};

// Global Keyboard Handler for Undo/Redo & Row Selection Delete / Escape
document.addEventListener('keydown', (e) => {
    // 0. Level 2 Global Undo (Ctrl + Z) & Redo (Ctrl + Y or Ctrl + Shift + Z)
    const isUndo = (e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey;
    const isRedo = ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
                   ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'));

    if (isUndo || isRedo) {
        const activeEl = document.activeElement;
        const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

        if (isInput) {
            // Standard non-study input fields: preserve native browser undo/redo
            if (!activeEl.classList.contains('answer-input')) {
                return;
            }

            // In study answer-input: if typing text and not in multi-row select mode, allow native typing undo
            if (activeEl.value.trim() !== '' && selectedStudyIndices.size === 0) {
                return;
            }
        }

        e.preventDefault();
        if (isUndo) {
            performUndo();
        } else {
            performRedo();
        }
        return;
    }

    // 1. Delete or Backspace when rows are selected
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStudyIndices.size > 0) {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isEditingNonStudyInput = (activeTag === 'input' || activeTag === 'textarea') && !document.activeElement.classList.contains('answer-input');
        if (!isEditingNonStudyInput) {
            e.preventDefault();
            clearSelectedRowsResults(); // Deletes and automatically deselects!
            return;
        }
    }

    // 2. Escape clears row selection
    if (e.key === 'Escape' && selectedStudyIndices.size > 0) {
        e.preventDefault();
        clearRowSelection();
        return;
    }
});

window.clearStudyAnswers = function(skipPushUndo = false) {
    try {
        clearRowSelection(true);

        const savedAnswers = loadStudyAnswers(currentSetIndex);
        const savedResults = loadStudyResults(currentSetIndex);
        const hasData = (savedAnswers && savedAnswers.some(a => a)) || (savedResults && savedResults.some(r => r));

        if (!skipPushUndo && hasData) {
            pushUndoAction({
                type: 'CLEAR_ALL_STUDY_RESULTS',
                description: 'Xóa toàn bộ kết quả bài học',
                data: {
                    setIndex: currentSetIndex,
                    previousAnswers: [...savedAnswers],
                    previousResults: [...savedResults]
                }
            });
        }

        document.querySelectorAll('#vocabTable .answer-input').forEach(input => {
            input.value = '';
            input.classList.remove('input-correct', 'input-wrong', 'input-revealed');
        });
        document.querySelectorAll('#vocabTable .result-cell').forEach((cell, idx) => {
            const row = cell.closest('tr');
            const wordIdx = row && row.hasAttribute('data-word-index') ? parseInt(row.getAttribute('data-word-index'), 10) : idx;
            cell.innerHTML = `<button class="btn-show-hint" onclick="revealStudyAnswer(${wordIdx})" title="Xem đáp án (Ctrl+Enter hoặc F2)">💡 Đáp án</button>`;
        });
        clearStudyAnswersForSet(currentSetIndex);
        updateStudyStats();
        if (typeof showToast === 'function') {
            showToast('Đã xóa tất cả kết quả của bài học.');
        }
    } finally {
        clearRowSelection(true);
    }
};

window.toggleAutoSpeak = function() {
    isAutoSpeakEnabled = !isAutoSpeakEnabled;
    document.getElementById('speakIcon').textContent = isAutoSpeakEnabled ? '🔊' : '🔇';
    document.getElementById('speakStatusText').textContent = isAutoSpeakEnabled ? 'Tự động đọc: BẬT' : 'Tự động đọc: TẮT';
    saveNavState();
};

// --- MANAGEMENT TAB (DIRECT ADD, TXT FILE, BULK PASTE) ---

// 1. Direct Add Form
window.handleQuickAddWord = function(event) {
    event.preventDefault();
    const engInput = document.getElementById('quickEng');
    const typeInput = document.getElementById('quickType');
    const vieInput = document.getElementById('quickVie');

    const eng = engInput.value.trim();
    const type = typeInput.value.trim();
    const vie = vieInput.value.trim();

    if (!eng || !vie) return;

    appData[currentSetIndex].words.push({ eng, type, vie });
    saveAppData();

    // Reset and focus
    engInput.value = '';
    typeInput.value = '';
    vieInput.value = '';
    engInput.focus();

    renderSetDetail();
};

// 2. TXT File Upload Handler
let uploadedParsedWords = [];

window.handleTxtFileSelect = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        parseTxtContent(content, file.name);
    };
    reader.readAsText(file);
};

// Support drag and drop on dropzone
const dropZone = document.getElementById('fileDropZone');
if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                parseTxtContent(ev.target.result, file.name);
            };
            reader.readAsText(file);
        } else {
            alert('Vui lòng chỉ chọn file văn bản .txt!');
        }
    });
}

function parseTxtContent(text, fileName) {
    const lines = text.split(/\r?\n/);
    uploadedParsedWords = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Split by # or fallback to tab
        let parts = trimmed.split('#');
        if (parts.length === 1 && trimmed.includes('\t')) {
            parts = trimmed.split('\t');
        }

        if (parts.length >= 3) {
            uploadedParsedWords.push({
                eng: parts[0].trim(),
                type: parts[1].trim(),
                vie: parts.slice(2).join('#').trim()
            });
        } else if (parts.length === 2) {
            uploadedParsedWords.push({
                eng: parts[0].trim(),
                type: '',
                vie: parts[1].trim()
            });
        }
    });

    if (uploadedParsedWords.length > 0) {
        document.getElementById('fileStatusName').textContent = fileName;
        document.getElementById('fileParsedCount').textContent = `${uploadedParsedWords.length} từ hợp lệ`;
        document.getElementById('fileUploadSummary').style.display = 'block';
    } else {
        alert("Không tìm thấy dòng từ vựng hợp lệ theo định dạng 'từ # loại từ # nghĩa'. Vui lòng kiểm tra lại file .txt!");
    }
}

window.applyUploadedWords = function() {
    if (uploadedParsedWords.length > 0) {
        appData[currentSetIndex].words.push(...uploadedParsedWords);
        saveAppData();
        renderSetDetail();
        cancelUploadedWords();
        alert(`Thành công! Đã thêm ${uploadedParsedWords.length} từ vựng từ file .txt vào học phần.`);
    }
};

window.cancelUploadedWords = function() {
    uploadedParsedWords = [];
    document.getElementById('fileUploadSummary').style.display = 'none';
    document.getElementById('txtFileInput').value = '';
};

// 3. Bulk Text Import with Live Preview
function updateBulkPreview() {
    const rawText = document.getElementById('bulkText').value;
    const termSep = document.getElementById('termSeparator').value || '#';
    let cardSep = document.getElementById('cardSeparator').value.replace(/\\n/g, '\n');
    const previewContainer = document.getElementById('previewContainer');
    const previewCountEl = document.getElementById('previewCount');

    if (!rawText.trim()) {
        previewContainer.innerHTML = '<p class="preview-empty">Nhập hoặc dán nội dung ở trên để xem trước thẻ từ vựng</p>';
        previewCountEl.textContent = '0';
        return;
    }

    const cards = rawText.split(cardSep);
    let validCount = 0;
    let html = '';

    cards.forEach(card => {
        const cleanCard = card.trim();
        if (!cleanCard) return;

        const parts = cleanCard.split(termSep);
        const eng = parts[0]?.trim() || '';
        const type = parts.length >= 3 ? parts[1].trim() : '';
        const vie = parts.length >= 3 ? parts.slice(2).join(termSep).trim() : (parts[1]?.trim() || '');

        if (eng || vie) {
            validCount++;
            html += `
                <div class="preview-item">
                    <span class="preview-idx">${validCount}</span>
                    <div class="preview-col">
                        <strong>${escapeHtml(eng || '...')}</strong>
                        <small>Thuật ngữ</small>
                    </div>
                    <div class="preview-col" style="flex: 0.6;">
                        <em>${escapeHtml(type || '-')}</em><br>
                        <small>Loại từ</small>
                    </div>
                    <div class="preview-col">
                        <strong>${escapeHtml(vie || '...')}</strong>
                        <small>Định nghĩa</small>
                    </div>
                </div>
            `;
        }
    });

    previewContainer.innerHTML = html || '<p class="preview-empty">Chưa có thẻ nào hợp lệ với ký tự ngăn cách này</p>';
    previewCountEl.textContent = validCount;
}

document.getElementById('bulkText').addEventListener('input', updateBulkPreview);
document.getElementById('termSeparator').addEventListener('input', updateBulkPreview);
document.getElementById('cardSeparator').addEventListener('change', updateBulkPreview);

window.importBulkText = function() {
    const rawText = document.getElementById('bulkText').value;
    const termSep = document.getElementById('termSeparator').value || '#';
    let cardSep = document.getElementById('cardSeparator').value.replace(/\\n/g, '\n');

    if (!rawText.trim()) {
        alert("Vui lòng dán nội dung từ vựng vào ô!");
        return;
    }

    const cards = rawText.split(cardSep);
    let addedCount = 0;

    cards.forEach(card => {
        const clean = card.trim();
        if (!clean) return;

        const parts = clean.split(termSep);
        if (parts.length >= 3) {
            appData[currentSetIndex].words.push({
                eng: parts[0].trim(),
                type: parts[1].trim(),
                vie: parts.slice(2).join(termSep).trim()
            });
            addedCount++;
        } else if (parts.length === 2) {
            appData[currentSetIndex].words.push({
                eng: parts[0].trim(),
                type: '',
                vie: parts[1].trim()
            });
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveAppData();
        document.getElementById('bulkText').value = '';
        updateBulkPreview();
        renderSetDetail();
        alert(`Thành công! Đã thêm ${addedCount} từ vựng vào học phần.`);
    } else {
        alert("Không tìm thấy từ vựng nào. Vui lòng kiểm tra lại ký tự ngăn cách giữa Từ và Nghĩa!");
    }
};

// 4. Export Current Set as .TXT
window.exportCurrentSetTxt = function() {
    const set = appData[currentSetIndex];
    if (!set || set.words.length === 0) {
        alert("Học phần này chưa có từ vựng nào để xuất!");
        return;
    }

    const lines = set.words.map(w => `${w.eng} # ${w.type || ''} # ${w.vie}`);
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${set.title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
};

// --- WORDS LIST TAB ---
function renderWordListTable() {
    const set = getCurrentSet();
    const tbody = document.getElementById('wordListBody');
    const query = (document.getElementById('wordSearchInput').value || '').trim().toLowerCase();
    tbody.innerHTML = '';

    if (!set || set.words.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">Học phần này chưa có từ nào.</td></tr>`;
        return;
    }

    const filtered = set.words.map((w, originalIdx) => ({ w, originalIdx })).filter(({ w }) => {
        const matchesQuery = w.eng.toLowerCase().includes(query) || w.vie.toLowerCase().includes(query);
        const matchesStarred = !currentListFilterStarred || w.starred;
        return matchesQuery && matchesStarred;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">Không tìm thấy từ vựng nào khớp với bộ lọc.</td></tr>`;
        return;
    }

    filtered.forEach(({ w, originalIdx }, displayIdx) => {
        const tr = document.createElement('tr');
        const isStarred = !!w.starred;
        if (isStarred) {
            tr.classList.add('row-starred');
        }
        tr.setAttribute('data-word-index', originalIdx);

        tr.innerHTML = `
            <td class="star-cell" style="text-align: center;">
                <button class="star-btn ${isStarred ? 'active' : ''}" onclick="toggleStarWord(${originalIdx}, event); renderWordListTable();" title="${isStarred ? 'Bỏ đánh dấu' : 'Đánh dấu cần ôn'}">
                    ${isStarred ? '⭐' : '☆'}
                </button>
            </td>
            <td style="color: var(--text-muted); font-weight: 600;">${displayIdx + 1}</td>
            <td>
                <strong>${escapeHtml(w.eng)}</strong>
                <button class="speak-icon-btn" onclick="speakWord('${escapeJsString(w.eng)}')" title="Phát âm">🔊</button>
            </td>
            <td><span class="type-badge">${escapeHtml(w.type || '-')}</span></td>
            <td>${escapeHtml(w.vie)}</td>
            <td style="text-align: center;">
                <button class="btn btn-outline btn-sm" onclick="openEditWordModal(${originalIdx})">Sửa</button>
                <button class="btn btn-ghost btn-sm" onclick="openDeleteWordModal(${originalIdx})" style="color: var(--danger);">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.toggleListStarredFilter = function() {
    currentListFilterStarred = !currentListFilterStarred;
    const btn = document.getElementById('listFilterStarredBtn');
    if (btn) {
        btn.classList.toggle('active', currentListFilterStarred);
    }
    renderWordListTable();
};

window.filterWordList = function() {
    renderWordListTable();
};

// ==========================================================================
// 5. TAB KIỂM TRA (CUSTOM TEST / MULTI-SET QUIZ WITH SHUFFLE & SLIDER)
// ==========================================================================

function initTestSetup() {
    document.getElementById('testSetupScreen').style.display = 'block';
    document.getElementById('testActiveScreen').style.display = 'none';
    document.getElementById('testResultScreen').style.display = 'none';

    renderTestSetsSelection();
}

function renderTestSetsSelection() {
    const container = document.getElementById('testSetsSelectList');
    container.innerHTML = '';

    if (appData.length === 0) {
        container.innerHTML = `<p style="padding: 20px; color: var(--text-muted);">Chưa có học phần nào trong thư viện.</p>`;
        updateTestSummaryCounts();
        return;
    }

    appData.forEach((set, index) => {
        const isDefaultChecked = activeTestState.selectedSetIndices.length === 0 ? true : activeTestState.selectedSetIndices.includes(index);
        
        const item = document.createElement('label');
        item.className = `select-set-item ${isDefaultChecked ? 'selected' : ''}`;
        item.innerHTML = `
            <div class="set-check-wrap">
                <input type="checkbox" class="custom-checkbox" value="${index}" ${isDefaultChecked ? 'checked' : ''} onchange="handleSetSelectionChange()">
                <div>
                    <div class="set-check-title">${escapeHtml(set.title)}</div>
                    <div class="set-check-meta">📁 ${escapeHtml(set.folder || 'Chưa phân loại')}</div>
                </div>
            </div>
            <span class="badge ${set.words.length > 0 ? 'badge-info' : 'badge-danger'}">${set.words.length} từ</span>
        `;
        container.appendChild(item);
    });

    handleSetSelectionChange();
}

window.handleSetSelectionChange = function() {
    const checkboxes = document.querySelectorAll('#testSetsSelectList input[type="checkbox"]');
    const selected = [];
    checkboxes.forEach(cb => {
        const label = cb.closest('.select-set-item');
        if (cb.checked) {
            selected.push(parseInt(cb.value));
            label?.classList.add('selected');
        } else {
            label?.classList.remove('selected');
        }
    });

    activeTestState.selectedSetIndices = selected;
    updateTestSummaryCounts();
};

window.selectAllSetsForTest = function(shouldSelectAll) {
    const checkboxes = document.querySelectorAll('#testSetsSelectList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = shouldSelectAll);
    handleSetSelectionChange();
};

window.handleTestStarredFilterChange = function() {
    updateTestSummaryCounts();
};

function updateTestSummaryCounts() {
    const selectedSets = activeTestState.selectedSetIndices.map(i => appData[i]).filter(Boolean);
    const onlyStarred = document.getElementById('testOptOnlyStarred') ? document.getElementById('testOptOnlyStarred').checked : false;

    let totalWords = 0;
    if (onlyStarred) {
        selectedSets.forEach(s => {
            (s.words || []).forEach(w => {
                if (w.starred) totalWords++;
            });
        });
    } else {
        totalWords = selectedSets.reduce((sum, s) => sum + s.words.length, 0);
    }

    document.getElementById('testSummarySetsCount').textContent = selectedSets.length;
    document.getElementById('testSummaryTotalWords').textContent = totalWords;

    const countInput = document.getElementById('testWordCountInput');
    const countRange = document.getElementById('testWordCountRange');

    countRange.max = Math.max(totalWords, 1);
    countInput.max = Math.max(totalWords, 1);

    // Adjust value if exceeds max or is 0
    let currentVal = parseInt(countInput.value) || 10;
    if (totalWords === 0) {
        currentVal = 0;
    } else if (currentVal > totalWords || currentVal === 0) {
        currentVal = Math.min(10, totalWords);
    }

    countInput.value = currentVal;
    countRange.value = currentVal;

    document.getElementById('btnStartTest').disabled = totalWords === 0;
}

window.syncTestWordCount = function(source) {
    const countInput = document.getElementById('testWordCountInput');
    const countRange = document.getElementById('testWordCountRange');

    if (source === 'input') {
        let val = parseInt(countInput.value) || 1;
        const max = parseInt(countInput.max) || 100;
        if (val > max) val = max;
        if (val < 1) val = 1;
        countRange.value = val;
    } else {
        countInput.value = countRange.value;
    }
};

window.setQuickTestCount = function(val) {
    const countInput = document.getElementById('testWordCountInput');
    const countRange = document.getElementById('testWordCountRange');
    const max = parseInt(countRange.max) || 1;

    let target = val === 'all' ? max : parseInt(val);
    if (target > max) target = max;
    if (target < 1) target = 1;

    countInput.value = target;
    countRange.value = target;
};

// Shortcut: Start test immediately with current set
window.startTestWithCurrentSet = function() {
    activeTestState.selectedSetIndices = [currentSetIndex];
    navigateTo('test');
};

// START CUSTOM TEST EXECUTION
window.startCustomTest = function() {
    const selectedIndices = activeTestState.selectedSetIndices;
    if (selectedIndices.length === 0) {
        alert("Vui lòng tích chọn ít nhất 1 học phần để kiểm tra!");
        return;
    }

    const onlyStarred = document.getElementById('testOptOnlyStarred') ? document.getElementById('testOptOnlyStarred').checked : false;

    // Pool all words from selected sets
    let pool = [];
    selectedIndices.forEach(idx => {
        const set = appData[idx];
        if (set && set.words.length > 0) {
            set.words.forEach(w => {
                if (!onlyStarred || w.starred) {
                    pool.push({
                        eng: w.eng,
                        type: w.type || '',
                        vie: w.vie,
                        starred: !!w.starred,
                        sourceSet: set.title
                    });
                }
            });
        }
    });

    if (pool.length === 0) {
        if (onlyStarred) {
            alert("Các học phần đã chọn chưa có từ nào được đánh dấu ⭐. Vui lòng đánh dấu từ trước hoặc bỏ chọn tùy chọn 'Chỉ kiểm tra từ đã đánh dấu'!");
        } else {
            alert("Các học phần đã chọn không có từ vựng nào!");
        }
        return;
    }

    // Options
    const shouldShuffle = document.getElementById('testOptShuffle').checked;
    const direction = document.getElementById('testOptDirection').value;
    const autoSpeak = document.getElementById('testOptAutoSpeak').checked;
    const layout = document.getElementById('testOptLayout').value;
    const requestedCount = parseInt(document.getElementById('testWordCountInput').value) || pool.length;

    if (shouldShuffle) {
        pool = shuffleArray(pool);
    }

    const testQuestions = pool.slice(0, Math.min(requestedCount, pool.length));

    // Save into state
    activeTestState.questions = testQuestions;
    activeTestState.currentIndex = 0;
    activeTestState.direction = direction;
    activeTestState.layout = layout;
    activeTestState.autoSpeak = autoSpeak;
    activeTestState.answers = new Array(testQuestions.length).fill('');
    activeTestState.results = new Array(testQuestions.length).fill(null);
    activeTestState.wrongQuestions = [];

    // Switch screens
    document.getElementById('testSetupScreen').style.display = 'none';
    document.getElementById('testActiveScreen').style.display = 'block';
    document.getElementById('testResultScreen').style.display = 'none';

    // Toggle layout container
    document.getElementById('testLayoutTable').style.display = layout === 'table' ? 'block' : 'none';
    document.getElementById('testLayoutCard').style.display = layout === 'card' ? 'block' : 'none';

    document.getElementById('testProgressTotal').textContent = testQuestions.length;
    updateTestLiveStats();

    if (layout === 'table') {
        renderTestTable();
    } else {
        renderTestFocusCard();
    }
};

// --- TEST IN TABLE SHEET MODE ---
function renderTestTable() {
    const tbody = document.getElementById('testTableBody');
    tbody.innerHTML = '';

    activeTestState.questions.forEach((q, index) => {
        const promptText = activeTestState.direction === 'en-vi' ? q.eng : q.vie;
        const answerPlaceholder = activeTestState.direction === 'en-vi' ? 'Nhập nghĩa tiếng Việt...' : 'Nhập từ tiếng Anh...';
        const speakBtn = activeTestState.direction === 'en-vi'
            ? `<button class="speak-icon-btn" onclick="speakWord('${escapeJsString(q.eng)}')" title="Phát âm">🔊</button>`
            : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: var(--text-muted); font-weight: 600;">${index + 1}</td>
            <td>
                <span class="word-prompt">
                    ${escapeHtml(promptText)}
                    ${speakBtn}
                </span>
            </td>
            <td>
                <span class="type-badge">${escapeHtml(q.type || '-')}</span>
                <span style="font-size: 11px; color: var(--text-subtle); display: block; margin-top: 2px;">${escapeHtml(q.sourceSet)}</span>
            </td>
            <td>
                <input type="text" class="answer-input test-ans-input" placeholder="${answerPlaceholder}" data-test-idx="${index}" value="${escapeHtml(activeTestState.answers[index] || '')}">
            </td>
            <td class="result-cell" data-test-res-idx="${index}"></td>
        `;
        tbody.appendChild(tr);
    });

    setupTestTableEvents();

    // Focus first input
    const firstInput = document.querySelector('.test-ans-input[data-test-idx="0"]');
    firstInput?.focus();
}

function setupTestTableEvents() {
    const inputs = document.querySelectorAll('.test-ans-input');

    inputs.forEach((input, index) => {
        if (input.value.trim() !== '') {
            checkTestQuestionAnswer(input, index);
        }

        input.addEventListener('focus', () => {
            const q = activeTestState.questions[index];
            if (activeTestState.autoSpeak && activeTestState.direction === 'en-vi' && q) {
                speakWord(q.eng);
            }
        });

        input.addEventListener('input', () => {
            activeTestState.answers[index] = input.value;
            // Clear any previous evaluation while actively typing
            activeTestState.results[index] = null;
            const resultCell = document.querySelector(`.result-cell[data-test-res-idx="${index}"]`);
            if (resultCell) resultCell.innerHTML = '';
            input.classList.remove('input-correct', 'input-wrong');
            updateTestLiveStats();
        });

        input.addEventListener('keydown', (e) => {
            // Shortcut to reveal answer in test: F2, Ctrl+Enter, Alt+Enter
            if (e.key === 'F2' || ((e.ctrlKey || e.altKey) && e.key === 'Enter')) {
                e.preventDefault();
                revealTestQuestionAnswer(index);
                return;
            }

            if (e.key === 'Tab') {
                e.preventDefault();
                const q = activeTestState.questions[index];
                if (q) speakWord(q.eng);
            } else if (e.key === 'Enter') {
                checkTestQuestionAnswer(input, index);
                if (index + 1 < inputs.length) {
                    inputs[index + 1].focus();
                } else {
                    // Check if all are answered
                    const allAnswered = activeTestState.results.every(r => r !== null);
                    if (allAnswered) {
                        finishTest(false);
                    }
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (index + 1 < inputs.length) inputs[index + 1].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (index - 1 >= 0) inputs[index - 1].focus();
            }
        });
    });
}

function revealTestQuestionAnswer(index) {
    const q = activeTestState.questions[index];
    const input = document.querySelector(`.test-ans-input[data-test-idx="${index}"]`);
    const resultCell = document.querySelector(`.result-cell[data-test-res-idx="${index}"]`);
    const expected = activeTestState.direction === 'en-vi' ? q.vie : q.eng;

    activeTestState.results[index] = false;
    if (resultCell) {
        resultCell.innerHTML = `<span class="result-revealed">💡 Đáp án:</span> <span class="result-expected">(${escapeHtml(expected)})</span>`;
    }
    if (input) {
        input.classList.add('input-wrong');
        input.classList.remove('input-correct');
    }
    updateTestLiveStats();
}

function checkTestQuestionAnswer(input, index) {
    const q = activeTestState.questions[index];
    const userAns = input.value.trim().toLowerCase();
    const correctTarget = activeTestState.direction === 'en-vi' ? q.vie.toLowerCase() : q.eng.toLowerCase();
    const resultCell = document.querySelector(`.result-cell[data-test-res-idx="${index}"]`);

    activeTestState.answers[index] = input.value;

    if (userAns === '') {
        activeTestState.results[index] = null;
        if (resultCell) resultCell.innerHTML = '';
        input.classList.remove('input-correct', 'input-wrong');
    } else if (isAnswerFuzzyMatch(userAns, correctTarget)) {
        activeTestState.results[index] = true;
        if (resultCell) resultCell.innerHTML = `<span class="result-correct">✅ Đúng</span>`;
        input.classList.add('input-correct');
        input.classList.remove('input-wrong');
    } else {
        activeTestState.results[index] = false;
        const expected = activeTestState.direction === 'en-vi' ? q.vie : q.eng;
        if (resultCell) resultCell.innerHTML = `<span class="result-wrong">❌ Sai</span> <span class="result-expected">(${escapeHtml(expected)})</span>`;
        input.classList.add('input-wrong');
        input.classList.remove('input-correct');
    }

    updateTestLiveStats();
}

// --- TEST IN CARD FOCUS MODE ---
function renderTestFocusCard() {
    const idx = activeTestState.currentIndex;
    const q = activeTestState.questions[idx];
    if (!q) {
        finishTest(false);
        return;
    }

    const promptText = activeTestState.direction === 'en-vi' ? q.eng : q.vie;
    const answerPlaceholder = activeTestState.direction === 'en-vi' ? 'Nhập nghĩa tiếng Việt rồi Enter...' : 'Nhập từ tiếng Anh rồi Enter...';

    document.getElementById('cardSourceBadge').textContent = q.sourceSet;
    document.getElementById('cardPosBadge').textContent = `Câu ${idx + 1} / ${activeTestState.questions.length}`;
    document.getElementById('cardPromptWord').textContent = promptText;
    document.getElementById('cardPromptType').textContent = q.type ? `Loại từ: (${q.type})` : '';

    const speakBtn = document.getElementById('cardSpeakBtn');
    if (activeTestState.direction === 'en-vi') {
        speakBtn.style.display = 'flex';
    } else {
        speakBtn.style.display = 'none';
    }

    const input = document.getElementById('cardAnswerInput');
    input.placeholder = answerPlaceholder;
    input.value = activeTestState.answers[idx] || '';
    input.classList.remove('input-correct', 'input-wrong');

    document.getElementById('cardFeedbackBox').style.display = 'none';
    input.disabled = false;
    document.getElementById('cardSubmitBtn').style.display = 'inline-flex';

    input.focus();

    if (activeTestState.autoSpeak && activeTestState.direction === 'en-vi') {
        speakWord(q.eng);
    }
}

window.speakCurrentCardWord = function() {
    const idx = activeTestState.currentIndex;
    const q = activeTestState.questions[idx];
    if (q) speakWord(q.eng);
};

window.submitCardAnswer = function() {
    const idx = activeTestState.currentIndex;
    const q = activeTestState.questions[idx];
    const input = document.getElementById('cardAnswerInput');
    const userAns = input.value.trim().toLowerCase();
    const correctTarget = activeTestState.direction === 'en-vi' ? q.vie.toLowerCase() : q.eng.toLowerCase();
    const expected = activeTestState.direction === 'en-vi' ? q.vie : q.eng;

    if (!userAns) return;

    activeTestState.answers[idx] = input.value;
    const isCorrect = isAnswerFuzzyMatch(userAns, correctTarget);
    activeTestState.results[idx] = isCorrect;

    // Show feedback
    const feedbackBox = document.getElementById('cardFeedbackBox');
    const feedbackIcon = document.getElementById('cardFeedbackIcon');
    const feedbackStatus = document.getElementById('cardFeedbackStatus');
    const feedbackDetail = document.getElementById('cardFeedbackCorrect');

    feedbackBox.style.display = 'flex';
    input.disabled = true;
    document.getElementById('cardSubmitBtn').style.display = 'none';

    if (isCorrect) {
        feedbackIcon.textContent = '✅';
        feedbackStatus.textContent = 'Chính xác!';
        feedbackStatus.className = 'feedback-status text-success';
        feedbackDetail.textContent = `Đáp án: ${expected}`;
        input.classList.add('input-correct');
    } else {
        feedbackIcon.textContent = '❌';
        feedbackStatus.textContent = 'Chưa chính xác!';
        feedbackStatus.className = 'feedback-status text-danger';
        feedbackDetail.textContent = `Đáp án đúng là: ${expected}`;
        input.classList.add('input-wrong');
    }

    updateTestLiveStats();

    // Focus next button
    document.getElementById('cardNextBtn').focus();
};

window.goToNextCard = function() {
    if (activeTestState.currentIndex + 1 < activeTestState.questions.length) {
        activeTestState.currentIndex++;
        renderTestFocusCard();
    } else {
        finishTest(false);
    }
};

// Enter key binding in focus card
document.getElementById('cardAnswerInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        submitCardAnswer();
    }
});

function updateTestLiveStats() {
    const total = activeTestState.questions.length;
    let correct = 0;
    let wrong = 0;
    let answered = 0;

    activeTestState.results.forEach(res => {
        if (res === true) { correct++; answered++; }
        else if (res === false) { wrong++; answered++; }
    });

    document.getElementById('testLiveCorrect').textContent = correct;
    document.getElementById('testLiveWrong').textContent = wrong;
    document.getElementById('testProgressDone').textContent = answered;

    const percent = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    document.getElementById('testLivePercent').textContent = `${percent}%`;

    const progressPct = total > 0 ? Math.round((answered / total) * 100) : 0;
    document.getElementById('testProgressBar').style.width = `${progressPct}%`;
}

window.toggleTestAutoSpeak = function() {
    activeTestState.autoSpeak = !activeTestState.autoSpeak;
    const btn = document.getElementById('btnTestToggleSpeak');
    btn.innerHTML = activeTestState.autoSpeak ? '🔊 Đọc: BẬT' : '🔇 Đọc: TẮT';
};

window.confirmQuitTest = function() {
    if (confirm("Bạn có chắc chắn muốn dừng bài kiểm tra này không?")) {
        backToTestSetup();
    }
};

// FINISH & SUMMARY
window.finishTest = function(promptConfirm = false) {
    if (promptConfirm) {
        const answeredCount = activeTestState.results.filter(r => r !== null).length;
        const total = activeTestState.questions.length;
        if (answeredCount < total) {
            if (!confirm(`Bạn mới trả lời ${answeredCount}/${total} câu. Bạn có chắc muốn nộp bài sớm không?`)) {
                return;
            }
        }
    }

    // Tally wrong questions
    activeTestState.wrongQuestions = [];
    activeTestState.questions.forEach((q, idx) => {
        if (activeTestState.results[idx] !== true) {
            activeTestState.wrongQuestions.push(q);
        }
    });

    const total = activeTestState.questions.length;
    const correct = activeTestState.results.filter(r => r === true).length;
    const wrong = total - correct;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

    document.getElementById('testActiveScreen').style.display = 'none';
    document.getElementById('testResultScreen').style.display = 'block';

    document.getElementById('resultScorePercent').textContent = `${percent}%`;
    document.getElementById('resultCorrectCount').textContent = correct;
    document.getElementById('resultWrongCount').textContent = wrong;
    document.getElementById('resultTotalQuestions').textContent = total;

    // Headline & Trophy Icon
    const trophy = document.getElementById('resultTrophyIcon');
    const headline = document.getElementById('resultHeadline');
    const sub = document.getElementById('resultSub');

    if (percent === 100) {
        trophy.textContent = '🌟';
        headline.textContent = 'Hoàn hảo tuyệt đối!';
        sub.textContent = 'Bạn đã trả lời đúng tất cả các từ trong bài kiểm tra này!';
    } else if (percent >= 80) {
        trophy.textContent = '🎉';
        headline.textContent = 'Kết quả rất xuất sắc!';
        sub.textContent = 'Khả năng ghi nhớ từ vựng của bạn rất vững vàng.';
    } else if (percent >= 50) {
        trophy.textContent = '👍';
        headline.textContent = 'Đạt kết quả khá!';
        sub.textContent = 'Hãy ôn luyện lại các từ sai để củng cố thêm trí nhớ nhé.';
    } else {
        trophy.textContent = '💪';
        headline.textContent = 'Cần cố gắng thêm!';
        sub.textContent = 'Đừng nản lòng, từ vựng cần được lặp đi lặp lại nhiều lần.';
    }

    // Render list of wrong words
    const wrongBox = document.getElementById('wrongWordsReviewSection');
    const wrongList = document.getElementById('wrongWordsList');
    const btnWrongOnly = document.getElementById('btnReviewWrongOnly');

    if (activeTestState.wrongQuestions.length > 0) {
        wrongBox.style.display = 'block';
        btnWrongOnly.style.display = 'inline-flex';
        wrongList.innerHTML = '';

        activeTestState.wrongQuestions.forEach(q => {
            const item = document.createElement('div');
            item.className = 'wrong-word-item';
            item.innerHTML = `
                <div>
                    <strong>${escapeHtml(q.eng)}</strong>
                    <span class="type-badge">${escapeHtml(q.type || '')}</span>
                    <button class="speak-icon-btn" onclick="speakWord('${escapeJsString(q.eng)}')" title="Phát âm">🔊</button>
                </div>
                <div style="color: var(--text-muted);">
                    Đáp án đúng: <strong style="color: var(--text-main);">${escapeHtml(q.vie)}</strong>
                </div>
            `;
            wrongList.appendChild(item);
        });
    } else {
        wrongBox.style.display = 'none';
        btnWrongOnly.style.display = 'none';
    }
};

window.restartSameTest = function() {
    activeTestState.currentIndex = 0;
    activeTestState.answers = new Array(activeTestState.questions.length).fill('');
    activeTestState.results = new Array(activeTestState.questions.length).fill(null);

    document.getElementById('testResultScreen').style.display = 'none';
    document.getElementById('testActiveScreen').style.display = 'block';

    updateTestLiveStats();

    if (activeTestState.layout === 'table') {
        renderTestTable();
    } else {
        renderTestFocusCard();
    }
};

window.testWrongWordsOnly = function() {
    if (activeTestState.wrongQuestions.length === 0) return;

    activeTestState.questions = shuffleArray([...activeTestState.wrongQuestions]);
    activeTestState.currentIndex = 0;
    activeTestState.answers = new Array(activeTestState.questions.length).fill('');
    activeTestState.results = new Array(activeTestState.questions.length).fill(null);

    document.getElementById('testResultScreen').style.display = 'none';
    document.getElementById('testActiveScreen').style.display = 'block';

    document.getElementById('testProgressTotal').textContent = activeTestState.questions.length;
    updateTestLiveStats();

    if (activeTestState.layout === 'table') {
        renderTestTable();
    } else {
        renderTestFocusCard();
    }
};

window.backToTestSetup = function() {
    initTestSetup();
};

// ==========================================================================
// 6. MODALS LOGIC (EDIT / DELETE WORD, SET, ETC.)
// ==========================================================================

// Edit Word Modal
let wordIdxToEdit = -1;
window.openEditWordModal = function(index) {
    wordIdxToEdit = index;
    const word = appData[currentSetIndex].words[index];
    if (!word) return;

    document.getElementById('editEng').value = word.eng;
    document.getElementById('editType').value = word.type || '';
    document.getElementById('editVie').value = word.vie;
    document.getElementById('editWordModal').style.display = 'flex';
};

window.closeEditWordModal = function() {
    document.getElementById('editWordModal').style.display = 'none';
    wordIdxToEdit = -1;
};

document.getElementById('btnSaveWordEdit').onclick = function() {
    if (wordIdxToEdit > -1) {
        const eng = document.getElementById('editEng').value.trim();
        const type = document.getElementById('editType').value.trim();
        const vie = document.getElementById('editVie').value.trim();

        if (eng && vie) {
            appData[currentSetIndex].words[wordIdxToEdit] = { eng, type, vie };
            saveAppData();
            renderSetDetail();
            closeEditWordModal();
        }
    }
};

// Delete Word Modal
let wordIdxToDelete = -1;
window.openDeleteWordModal = function(index) {
    wordIdxToDelete = index;
    const word = appData[currentSetIndex].words[index];
    document.getElementById('deleteWordPrompt').innerHTML = `Bạn có chắc chắn muốn xóa từ <strong>"${escapeHtml(word.eng)}"</strong> khỏi học phần?`;
    document.getElementById('deleteWordModal').style.display = 'flex';
};

window.closeDeleteWordModal = function() {
    document.getElementById('deleteWordModal').style.display = 'none';
    wordIdxToDelete = -1;
};

document.getElementById('btnConfirmDeleteWord').onclick = function() {
    if (wordIdxToDelete > -1 && appData[currentSetIndex]?.words[wordIdxToDelete]) {
        const deletedWord = JSON.parse(JSON.stringify(appData[currentSetIndex].words[wordIdxToDelete]));

        // Sync saved study answers & results
        const saved = loadStudyAnswers(currentSetIndex);
        const deletedAns = (saved && saved[wordIdxToDelete]) ? saved[wordIdxToDelete] : '';
        if (saved && saved.length > wordIdxToDelete) {
            saved.splice(wordIdxToDelete, 1);
            saveStudyAnswers(currentSetIndex, saved);
        }
        const results = loadStudyResults(currentSetIndex);
        const deletedRes = (results && results[wordIdxToDelete]) ? results[wordIdxToDelete] : null;
        if (results && results.length > wordIdxToDelete) {
            results.splice(wordIdxToDelete, 1);
            saveStudyResults(currentSetIndex, results);
        }

        appData[currentSetIndex].words.splice(wordIdxToDelete, 1);
        saveAppData();

        pushUndoAction({
            type: 'DELETE_WORD',
            description: `Xóa từ "${deletedWord.eng || 'thuật ngữ'}"`,
            data: {
                setIndex: currentSetIndex,
                wordIndex: wordIdxToDelete,
                word: deletedWord,
                savedAnswer: deletedAns,
                savedResult: deletedRes
            }
        });

        renderSetDetail();
        closeDeleteWordModal();
    }
};

// Edit Set Modal
let setIdxToEdit = -1;
window.openEditSetModal = function(index) {
    setIdxToEdit = index;
    const set = appData[index];
    document.getElementById('editSetTitleInput').value = set.title;

    const folderSelect = document.getElementById('editSetFolderSelect');
    folderSelect.innerHTML = '';
    folderData.forEach(folder => {
        const fName = typeof folder === 'string' ? folder : folder.name;
        const fIcon = typeof folder === 'string' ? '📁' : (folder.icon || '📁');
        folderSelect.innerHTML += `<option value="${escapeHtml(fName)}" ${set.folder === fName ? 'selected' : ''}>${fIcon} ${escapeHtml(fName)}</option>`;
    });

    document.getElementById('editSetModal').style.display = 'flex';
};

window.closeEditSetModal = function() {
    document.getElementById('editSetModal').style.display = 'none';
    setIdxToEdit = -1;
};

document.getElementById('btnSaveSetInfo').onclick = function() {
    if (setIdxToEdit > -1) {
        const newTitle = document.getElementById('editSetTitleInput').value.trim();
        const newFolder = document.getElementById('editSetFolderSelect').value;

        if (newTitle) {
            appData[setIdxToEdit].title = newTitle;
            appData[setIdxToEdit].folder = newFolder;
            saveAppData();
            renderLibrary();
            closeEditSetModal();
        }
    }
};

// Delete Set Modal
let setIdxToDelete = -1;
window.openDeleteSetModal = function(index) {
    setIdxToDelete = index;
    const set = appData[index];
    document.getElementById('deleteSetMessage').innerHTML = `Xóa học phần <strong>"${escapeHtml(set.title)}"</strong> cùng toàn bộ ${set.words.length} thuật ngữ?`;
    document.getElementById('deleteSetModal').style.display = 'flex';
};

window.closeDeleteSetModal = function() {
    document.getElementById('deleteSetModal').style.display = 'none';
    setIdxToDelete = -1;
};

document.getElementById('btnConfirmDeleteSet').onclick = function() {
    if (setIdxToDelete > -1 && appData[setIdxToDelete]) {
        const deletedSet = JSON.parse(JSON.stringify(appData[setIdxToDelete]));
        const savedAns = loadStudyAnswers(setIdxToDelete);
        const savedRes = loadStudyResults(setIdxToDelete);

        clearStudyAnswersForSet(setIdxToDelete);
        appData.splice(setIdxToDelete, 1);
        saveAppData();

        pushUndoAction({
            type: 'DELETE_SET',
            description: `Xóa học phần "${deletedSet.title}"`,
            data: {
                setIndex: setIdxToDelete,
                set: deletedSet,
                savedAnswers: savedAns,
                savedResults: savedRes
            }
        });

        if (currentSetIndex >= appData.length) {
            currentSetIndex = Math.max(0, appData.length - 1);
        }
        saveNavState();
        renderLibrary();
        closeDeleteSetModal();
    }
};

// ==========================================================================
// 7. SAMPLE DATA & EXPORT/IMPORT MODAL
// ==========================================================================

window.openSampleDataModal = function() {
    document.getElementById('sampleDataModal').style.display = 'flex';
};

window.closeSampleDataModal = function() {
    document.getElementById('sampleDataModal').style.display = 'none';
};

window.loadPresetSampleData = function() {
    if (confirm("Nạp thêm 3 bộ từ vựng mẫu TOEIC chuẩn vào danh sách học phần của bạn?")) {
        SAMPLE_PRESETS.forEach(preset => {
            appData.push(JSON.parse(JSON.stringify(preset)));
            if (!folderData.some(f => f.name === preset.folder)) {
                let color = '#3b82f6';
                let icon = '📚';
                if (preset.folder.includes('công sở') || preset.folder.includes('Văn phòng')) {
                    color = '#10b981';
                    icon = '💼';
                }
                folderData.push({ name: preset.folder, color, icon });
            }
        });
        saveAppData();
        saveFolderData();
        renderLibrary();
        closeSampleDataModal();
        alert("Đã nạp thành công 3 bộ từ mẫu TOEIC!");
    }
};

window.exportAllDataJson = function() {
    const backup = {
        appData,
        folderData,
        exportDate: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocabmaster_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

window.importAllDataJson = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.appData && Array.isArray(data.appData)) {
                appData = data.appData;
                folderData = normalizeFolderData(data.folderData || ["Chưa phân loại"]);
                saveAppData();
                saveFolderData();
                renderLibrary();
                closeSampleDataModal();
                alert("Khôi phục dữ liệu từ JSON thành công!");
            } else {
                alert("File JSON không đúng cấu trúc sao lưu của ứng dụng.");
            }
        } catch (err) {
            alert("Lỗi khi đọc file JSON: " + err.message);
        }
    };
    reader.readAsText(file);
};

// ==========================================================================
// 8. UTILITIES (TTS, FUZZY MATCH, ESCAPING, SHUFFLE)
// ==========================================================================

window.speakWord = function(text, lang = 'en-US') {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
};

function isAnswerFuzzyMatch(userInput, target) {
    const cleanUser = userInput.trim().toLowerCase();
    const cleanTarget = target.trim().toLowerCase();
    if (!cleanUser || !cleanTarget) return false;
    if (cleanUser === cleanTarget) return true;

    // Split by comma, semicolon, slash, or newline
    const candidateParts = new Set();
    
    // 1. Add raw parts split by delimiters
    cleanTarget.split(/[,;\/\n]/).forEach(p => {
        const trimmed = p.trim();
        if (trimmed) candidateParts.add(trimmed);
    });

    // 2. Check parenthetical text e.g. "sự cam đoan (bảo đảm)" -> check "sự cam đoan"
    const stripped = cleanTarget.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    if (stripped) {
        candidateParts.add(stripped);
        stripped.split(/[,;\/\n]/).forEach(p => {
            const trimmed = p.trim();
            if (trimmed) candidateParts.add(trimmed);
        });
    }

    // 3. Text extracted from inside parentheses -> check "bảo đảm"
    const parentheticalMatches = cleanTarget.match(/\(([^)]+)\)/g);
    if (parentheticalMatches) {
        parentheticalMatches.forEach(m => {
            const inner = m.replace(/[()]/g, '').trim();
            if (inner) {
                candidateParts.add(inner);
                inner.split(/[,;\/\n]/).forEach(p => {
                    const trimmed = p.trim();
                    if (trimmed) candidateParts.add(trimmed);
                });
            }
        });
    }

    for (const part of candidateParts) {
        if (part === cleanUser) return true;
        // Also allow matching if user typed "to agree" for "agree" or vice versa
        if (cleanUser.startsWith('to ') && part === cleanUser.slice(3).trim()) return true;
        if (part.startsWith('to ') && cleanUser === part.slice(3).trim()) return true;
    }

    return false;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJsString(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ==========================================================================
// 9. APP RESTORATION & INITIAL LAUNCH
// ==========================================================================

function restoreNavState() {
    initTheme();

    let navState = null;
    try {
        const raw = localStorage.getItem('toeicNavState');
        if (raw) navState = JSON.parse(raw);
    } catch (e) {
        navState = null;
    }

    if (!navState) {
        renderLibrary();
        return;
    }

    // 1. Restore auto-speak state
    if (typeof navState.isAutoSpeakEnabled === 'boolean') {
        isAutoSpeakEnabled = navState.isAutoSpeakEnabled;
        const iconEl = document.getElementById('speakIcon');
        const textEl = document.getElementById('speakStatusText');
        if (iconEl && textEl) {
            iconEl.textContent = isAutoSpeakEnabled ? '🔊' : '🔇';
            textEl.textContent = isAutoSpeakEnabled ? 'Tự động đọc: BẬT' : 'Tự động đọc: TẮT';
        }
    }

    // 2. Restore library sub-tab (sets or folders)
    if (navState.currentLibraryTab) {
        currentLibraryTab = navState.currentLibraryTab;
        const btnSets = document.getElementById('libTabSets');
        const btnFolders = document.getElementById('libTabFolders');
        const setsCont = document.getElementById('setsContainer');
        const foldersCont = document.getElementById('foldersContainer');
        if (btnSets && btnFolders && setsCont && foldersCont) {
            btnSets.classList.toggle('active', currentLibraryTab === 'sets');
            btnFolders.classList.toggle('active', currentLibraryTab === 'folders');
            setsCont.style.display = currentLibraryTab === 'sets' ? 'block' : 'none';
            foldersCont.style.display = currentLibraryTab === 'folders' ? 'block' : 'none';
        }
    }

    // 3. Restore opened folder explorer if user was inside one
    if (navState.currentOpenedFolder) {
        currentOpenedFolder = navState.currentOpenedFolder;
    }

    // 4. Restore target view
    if (navState.currentView === 'detail' && typeof navState.currentSetIndex === 'number' && appData[navState.currentSetIndex]) {
        currentSetIndex = navState.currentSetIndex;
        currentSetTab = navState.currentSetTab || 'study';
        navigateTo('detail');
        switchSetTab(currentSetTab);
    } else if (navState.currentView === 'test') {
        navigateTo('test');
    } else if (navState.currentView === 'createSet') {
        navigateTo('createSet');
    } else {
        navigateTo('library');
        if (currentOpenedFolder && currentLibraryTab === 'folders') {
            openFolderContents(currentOpenedFolder);
        }
    }
}

// Initial Launch with State Restoration
restoreNavState();

// ==========================================================================
// FIREBASE AUTHENTICATION & CLOUD SYNC MODULE
// ==========================================================================

const firebaseConfig = {
    apiKey: "AIzaSyCaS3gpkKrU1lwQdYtKE3j6S34OfUbJBK4",
    authDomain: "vocab-master-460c7.firebaseapp.com",
    projectId: "vocab-master-460c7",
    storageBucket: "vocab-master-460c7.firebasestorage.app",
    messagingSenderId: "312779519619",
    appId: "1:312779519619:web:20279f5fcdba662fce0db6",
    measurementId: "G-WSVW4MX80C"
};

let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let currentUser = null;
let isInitialCloudLoad = true;
let cloudSyncTimeout = null;
let cloudUnsubscribeListener = null;

function initFirebaseService() {
    if (typeof firebase === 'undefined') {
        console.warn('[Firebase] Firebase SDK chưa tải hoặc thiết bị đang ngoại tuyến.');
        return;
    }

    try {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
            firebaseApp = firebase.app();
        }

        firebaseAuth = firebase.auth();
        firestoreDb = firebase.firestore();

        // Listen to Auth State Changes
        firebaseAuth.onAuthStateChanged((user) => {
            currentUser = user;
            updateAuthUI(user);

            if (user) {
                console.log('[Firebase] Đã đăng nhập người dùng:', user.email);
                attachCloudRealtimeListener(user);
            } else {
                console.log('[Firebase] Người dùng đang ở chế độ khách (Local only).');
                if (cloudUnsubscribeListener) {
                    cloudUnsubscribeListener();
                    cloudUnsubscribeListener = null;
                }
                isInitialCloudLoad = true;
            }
        });

        // Close user dropdown if clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('userDropdownMenu');
            const trigger = document.querySelector('.user-avatar-trigger');
            if (dropdown && dropdown.style.display !== 'none') {
                if (!dropdown.contains(e.target) && (!trigger || !trigger.contains(e.target))) {
                    dropdown.style.display = 'none';
                }
            }
        });

    } catch (err) {
        console.error('[Firebase Init Error]', err);
    }
}

async function loginWithGoogle() {
    if (!firebaseAuth) {
        alert("Dịch vụ Firebase đang tải hoặc không thể kết nối. Vui lòng kiểm tra lại kết nối mạng!");
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    try {
        setSyncStatus('syncing', 'Đang kết nối...');
        await firebaseAuth.signInWithPopup(provider);
    } catch (error) {
        console.error("[Login Error]", error);
        setSyncStatus('error', 'Lỗi đăng nhập');
        if (error.code === 'auth/unauthorized-domain') {
            alert("⚠️ Lỗi Tên Miền Chưa Được Cấp Phép:\nTên miền này chưa được thêm vào mục 'Authorized domains' trên Firebase Console.\n\nCách xử lý rất đơn giản:\n1. Mở Firebase Console > Authentication > Settings\n2. Chọn 'Authorized domains' > Bấm 'Add domain'\n3. Thêm: tri1210-user.github.io");
        } else if (error.code === 'auth/popup-blocked') {
            firebaseAuth.signInWithRedirect(provider);
        } else if (error.code !== 'auth/popup-closed-by-user') {
            alert("Đăng nhập thất bại: " + error.message);
        }
    }
}

async function logoutFromGoogle() {
    if (!firebaseAuth) return;
    try {
        if (confirm("Bạn có chắc chắn muốn đăng xuất tài khoản Google không? Dữ liệu của bạn đã được lưu an toàn trên Cloud.")) {
            if (cloudUnsubscribeListener) {
                cloudUnsubscribeListener();
                cloudUnsubscribeListener = null;
            }
            await firebaseAuth.signOut();

            // Clear local storage and state on logout
            appData = [];
            folderData = [{ name: 'Chưa phân loại', color: '#64748b', icon: '📁' }];
            localStorage.removeItem('toeicAppData');
            localStorage.removeItem('toeicFolderData');
            localStorage.removeItem('toeicNavState');

            // Clear study & test cached answers from localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('toeic_study_') || key.startsWith('toeic_test_') || key.startsWith('studyAnswers_') || key.startsWith('studyResults_')) {
                    localStorage.removeItem(key);
                }
            });

            currentUser = null;
            isInitialCloudLoad = true;
            updateAuthUI(null);

            const dropdown = document.getElementById('userDropdownMenu');
            if (dropdown) dropdown.style.display = 'none';

            navigateTo('library');
            renderLibrary();
        }
    } catch (error) {
        console.error("[Logout Error]", error);
        alert("Lỗi khi đăng xuất: " + error.message);
    }
}

function updateAuthUI(user) {
    const signInBtn = document.getElementById('googleSignInBtn');
    const userBadge = document.getElementById('userProfileBadge');
    const avatarImg = document.getElementById('userAvatarImg');
    const userNameText = document.getElementById('userNameText');
    const dropdownEmail = document.getElementById('dropdownUserEmail');

    if (user) {
        if (signInBtn) signInBtn.style.display = 'none';
        if (userBadge) userBadge.style.display = 'inline-flex';
        if (avatarImg) {
            avatarImg.src = user.photoURL || 'https://www.gravatar.com/avatar/?d=mp';
            avatarImg.onerror = () => { avatarImg.src = 'https://www.gravatar.com/avatar/?d=mp'; };
        }
        if (userNameText) {
            userNameText.textContent = user.displayName || user.email.split('@')[0];
        }
        if (dropdownEmail) {
            dropdownEmail.textContent = user.email;
        }
        setSyncStatus('synced', 'Đã đồng bộ');
    } else {
        if (signInBtn) signInBtn.style.display = 'inline-flex';
        if (userBadge) userBadge.style.display = 'none';
    }
}

function toggleUserDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

function setSyncStatus(status, text) {
    const dot = document.getElementById('syncStatusDot');
    const textEl = document.getElementById('syncStatusText');
    const lastSyncEl = document.getElementById('dropdownLastSync');

    if (dot) {
        dot.className = 'sync-dot ' + (status || 'synced');
    }
    if (textEl && text) {
        textEl.textContent = text;
    }
    if (lastSyncEl && status === 'synced') {
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        lastSyncEl.textContent = `Đã đồng bộ lúc ${timeStr}`;
    }
}

// Unique client session ID to distinguish writes between multiple tabs/browsers
const CLIENT_SESSION_ID = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

function getSafeSetKey(set, index) {
    if (set && set.title) {
        return 'set_' + (set.title || '').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_').slice(0, 50);
    }
    return `set_${index}`;
}

function getStudyProgressCloudPayload() {
    const progressMap = {};
    (appData || []).forEach((set, index) => {
        if (!set || !set.title) return;
        const answers = loadStudyAnswers(index);
        const results = loadStudyResults(index);

        const hasAnswers = Array.isArray(answers) && answers.some(a => a && a.trim() !== '');
        const hasResults = Array.isArray(results) && results.some(r => r !== null && r !== undefined);

        const timeRaw = localStorage.getItem(`toeic_study_time_${index}`);
        const updatedAt = timeRaw ? parseInt(timeRaw, 10) : Date.now();

        const safeKey = getSafeSetKey(set, index);
        if (hasAnswers || hasResults) {
            progressMap[safeKey] = {
                title: set.title,
                setIndex: index,
                answers: answers,
                results: results,
                updatedAt: updatedAt
            };
        } else if (timeRaw) {
            // Explicitly cleared
            progressMap[safeKey] = {
                title: set.title,
                setIndex: index,
                answers: [],
                results: [],
                updatedAt: updatedAt
            };
        }
    });
    return progressMap;
}

function applyCloudStudyProgress(cloudProgress) {
    if (!cloudProgress || typeof cloudProgress !== 'object') return false;

    let hasUpdatedAnySet = false;

    (appData || []).forEach((set, index) => {
        if (!set || !set.title) return;
        const safeKey = getSafeSetKey(set, index);
        const cloudSetData = cloudProgress[safeKey] || 
                             cloudProgress[set.title.trim()] || 
                             Object.values(cloudProgress).find(item => item && item.title === set.title) ||
                             cloudProgress[`set_${index}`];
        if (!cloudSetData) return;

        const localAnswers = loadStudyAnswers(index);
        const localResults = loadStudyResults(index);

        const localHasData = (Array.isArray(localAnswers) && localAnswers.some(a => a && a.trim() !== '')) ||
                             (Array.isArray(localResults) && localResults.some(r => r !== null && r !== undefined));

        const cloudHasData = (Array.isArray(cloudSetData.answers) && cloudSetData.answers.some(a => a && a.trim() !== '')) ||
                             (Array.isArray(cloudSetData.results) && cloudSetData.results.some(r => r !== null && r !== undefined));

        const localTimeRaw = localStorage.getItem(`toeic_study_time_${index}`);
        const localTime = localTimeRaw ? parseInt(localTimeRaw, 10) : 0;
        const cloudTime = cloudSetData.updatedAt || 0;

        let shouldApplyCloud = false;

        // Case A: Local is empty but Cloud has answers -> Adopt from Cloud
        if (!localHasData && cloudHasData) {
            shouldApplyCloud = true;
        }
        // Case B: Both have answers, but Cloud is newer -> Adopt from Cloud
        else if (localHasData && cloudHasData && cloudTime > localTime) {
            shouldApplyCloud = true;
        }
        // Case C: Cloud was explicitly cleared newer than local -> Adopt from Cloud
        else if (localHasData && !cloudHasData && cloudTime > localTime) {
            shouldApplyCloud = true;
        }

        if (shouldApplyCloud) {
            saveStudyAnswers(index, cloudSetData.answers || [], false);
            saveStudyResults(index, cloudSetData.results || [], false);
            if (cloudTime > 0) {
                localStorage.setItem(`toeic_study_time_${index}`, cloudTime.toString());
            }
            hasUpdatedAnySet = true;
        }
    });

    return hasUpdatedAnySet;
}

function attachCloudRealtimeListener(user) {
    if (!firestoreDb || !user) return;

    if (cloudUnsubscribeListener) {
        cloudUnsubscribeListener();
    }

    setSyncStatus('syncing', 'Đang tải Cloud...');

    const userDocRef = firestoreDb.collection('users').doc(user.uid);

    cloudUnsubscribeListener = userDocRef.onSnapshot(async (docSnapshot) => {
        if (!docSnapshot.exists) {
            // First time this user logs in: Push existing local data to cloud (excluding samples)
            console.log('[Firebase Cloud] Tài khoản mới, đang lưu dữ liệu hiện tại lên Cloud...');
            setSyncStatus('syncing', 'Khởi tạo Cloud...');
            appData = (appData || []).filter(s => !isSamplePresetTitle(s.title));
            folderData = normalizeFolderData(folderData).filter(f => f.name !== 'TOEIC Căn Bản' && f.name !== 'Môi trường công sở');
            await triggerCloudSync(true);
        } else {
            const cloudData = docSnapshot.data();
            if (cloudData) {
                // Only skip re-rendering if THIS EXACT client/tab made the write recently
                const isOurOwnWrite = (cloudData.lastSyncClientId === CLIENT_SESSION_ID) && 
                                      (Date.now() - (cloudData.updatedAt || 0) < 3000);
                if (isOurOwnWrite && !isInitialCloudLoad) {
                    setSyncStatus('synced', 'Đã đồng bộ');
                    return;
                }
                syncFromCloudSourceOfTruth(cloudData);
            }
        }
        isInitialCloudLoad = false;
    }, (error) => {
        console.error('[Firebase Snapshot Error]', error);
        setSyncStatus('error', 'Lỗi Cloud');
    });
}

function syncFromCloudSourceOfTruth(cloudData) {
    // Cloud is the Single Source of Truth
    let cleanCloudSets = Array.isArray(cloudData.appData) ? cloudData.appData : [];
    const originalCount = cleanCloudSets.length;
    // Filter out any default sample sets if they accidentally synced
    cleanCloudSets = cleanCloudSets.filter(s => !isSamplePresetTitle(s.title));

    let cleanCloudFolders = Array.isArray(cloudData.folderData) ? cloudData.folderData : [];
    cleanCloudFolders = cleanCloudFolders.filter(f => f.name !== 'TOEIC Căn Bản' && f.name !== 'Môi trường công sở');
    cleanCloudFolders = normalizeFolderData(cleanCloudFolders);

    appData = cleanCloudSets;
    folderData = cleanCloudFolders;

    localStorage.setItem('toeicAppData', JSON.stringify(appData));
    localStorage.setItem('toeicFolderData', JSON.stringify(folderData));

    // Synchronize study progress across devices & browsers
    if (cloudData.studyProgress && typeof cloudData.studyProgress === 'object') {
        applyCloudStudyProgress(cloudData.studyProgress);
    } else {
        // If Cloud has no studyProgress yet, but local HAS study progress:
        // Automatically seed the cloud with local progress
        const localPayload = getStudyProgressCloudPayload();
        if (Object.keys(localPayload).length > 0) {
            console.log('[Firebase Cloud] Local có tiến độ bài làm, tự động đẩy lên Cloud...');
            triggerCloudSync(true);
        }
    }

    console.log('[Firebase Cloud] Đã đồng bộ dữ liệu sạch từ Cloud Firestore.');
    setSyncStatus('synced', 'Đã đồng bộ');

    // If cloud had polluted sample sets, clean the cloud document permanently
    if (cleanCloudSets.length !== originalCount) {
        console.log('[Firebase Cloud] Tự động xóa các học phần mẫu cũ khỏi Cloud Firestore...');
        triggerCloudSync(true);
    }

    if (currentView === 'library') {
        renderLibrary();
    } else if (currentView === 'detail') {
        renderSetDetail();
    }
}

function triggerCloudSync(immediate = false) {
    if (!currentUser || !firestoreDb) return;

    if (cloudSyncTimeout) {
        clearTimeout(cloudSyncTimeout);
        cloudSyncTimeout = null;
    }

    const doSync = async () => {
        try {
            setSyncStatus('syncing', 'Đang lưu Cloud...');
            const userDocRef = firestoreDb.collection('users').doc(currentUser.uid);
            const studyProgressPayload = getStudyProgressCloudPayload();

            await userDocRef.set({
                appData: appData,
                folderData: folderData,
                studyProgress: studyProgressPayload,
                updatedAt: Date.now(),
                userEmail: currentUser.email,
                lastSyncClientId: CLIENT_SESSION_ID,
                lastSyncBy: navigator.userAgent
            }, { merge: true });
            setSyncStatus('synced', 'Đã đồng bộ');
        } catch (error) {
            console.error('[Cloud Sync Error]', error);
            setSyncStatus('error', 'Lỗi lưu Cloud');
        }
    };

    if (immediate) {
        doSync();
    } else {
        setSyncStatus('syncing', 'Chờ lưu...');
        cloudSyncTimeout = setTimeout(doSync, 1200);
    }
}

async function forceManualCloudSync() {
    if (!currentUser) {
        alert("Vui lòng bấm 'Đăng nhập' bằng tài khoản Google để bật tính năng đồng bộ đám mây!");
        return;
    }
    await triggerCloudSync(true);
    alert("✅ Toàn bộ học phần, thư mục và tiến độ bài làm của bạn đã được tải lên Cloud thành công!");
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) dropdown.style.display = 'none';
}

// Auto re-check and sync on Tab Resume / Visibility Change (for Edge Workspace sleeping tabs)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUser && firestoreDb) {
        const userDocRef = firestoreDb.collection('users').doc(currentUser.uid);
        userDocRef.get().then(docSnapshot => {
            if (docSnapshot.exists) {
                const cloudData = docSnapshot.data();
                if (cloudData) {
                    const isOurOwnWrite = (cloudData.lastSyncClientId === CLIENT_SESSION_ID) && 
                                          (Date.now() - (cloudData.updatedAt || 0) < 3000);
                    if (!isOurOwnWrite) {
                        syncFromCloudSourceOfTruth(cloudData);
                    }
                }
            }
        }).catch(err => {
            console.warn('[Firebase Cloud Resume Error]', err);
        });
    }
});

window.addEventListener('focus', () => {
    if (currentUser && firestoreDb) {
        if (currentView === 'detail' && currentSetTab === 'study') {
            updateStudyStats();
        }
    }
});

// Khởi chạy kết nối Firebase
initFirebaseService();
