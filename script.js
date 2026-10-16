// ==========================================================================
// VOCABMASTER - CORE APPLICATION LOGIC
// ==========================================================================

// Sample TOEIC Data Presets
const SAMPLE_PRESETS = [
    {
        title: "TOEIC #1: Hợp đồng & Pháp lý (Contracts)",
        folder: "TOEIC Căn Bản",
        words: [
            { eng: "abide by", type: "v", vie: "tuân theo, chịu theo" },
            { eng: "agreement", type: "n", vie: "hợp đồng, thỏa thuận" },
            { eng: "assurance", type: "n", vie: "sự cam đoan, bảo đảm" },
            { eng: "cancellation", type: "n", vie: "sự hủy bỏ" },
            { eng: "determine", type: "v", vie: "xác định, quyết định" },
            { eng: "engage", type: "v", vie: "tham gia, cam kết" },
            { eng: "establish", type: "v", vie: "thiết lập, thành lập" },
            { eng: "obligate", type: "v", vie: "bắt buộc, ép buộc" },
            { eng: "party", type: "n", vie: "bên tham gia (hợp đồng)" },
            { eng: "provision", type: "n", vie: "điều khoản, dự phòng" },
            { eng: "resolve", type: "v", vie: "giải quyết" },
            { eng: "specific", type: "adj", vie: "cụ thể, rõ ràng" }
        ]
    },
    {
        title: "TOEIC #2: Tiếp thị & Khách hàng (Marketing)",
        folder: "TOEIC Căn Bản",
        words: [
            { eng: "attract", type: "v", vie: "thu hút, hấp dẫn" },
            { eng: "compare", type: "v", vie: "so sánh" },
            { eng: "competition", type: "n", vie: "sự cạnh tranh" },
            { eng: "consume", type: "v", vie: "tiêu thụ, tiêu dùng" },
            { eng: "convince", type: "v", vie: "thuyết phục" },
            { eng: "currently", type: "adv", vie: "hiện tại, hiện nay" },
            { eng: "fad", type: "n", vie: "mốt nhất thời, xu hướng ngắn" },
            { eng: "inspire", type: "v", vie: "truyền cảm hứng" },
            { eng: "market", type: "v", vie: "tiếp thị, bán ra thị trường" },
            { eng: "persuasion", type: "n", vie: "sự thuyết phục" },
            { eng: "productive", type: "adj", vie: "năng suất, hiệu quả" },
            { eng: "satisfaction", type: "n", vie: "sự thỏa mãn, hài lòng" }
        ]
    },
    {
        title: "TOEIC #3: Văn phòng & Hội họp (Office Life)",
        folder: "Môi trường công sở",
        words: [
            { eng: "agenda", type: "n", vie: "chương trình nghị sự, lịch trình" },
            { eng: "colleague", type: "n", vie: "đồng nghiệp" },
            { eng: "deadline", type: "n", vie: "hạn chót" },
            { eng: "equipment", type: "n", vie: "trang thiết bị" },
            { eng: "facilitate", type: "v", vie: "tạo điều kiện thuận lợi" },
            { eng: "implement", type: "v", vie: "thực thi, triển khai" },
            { eng: "schedule", type: "n", vie: "lịch trình" },
            { eng: "supervise", type: "v", vie: "giám sát, quản lý" },
            { eng: "task", type: "n", vie: "nhiệm vụ, công việc" },
            { eng: "verify", type: "v", vie: "xác minh, kiểm chứng" }
        ]
    }
];

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
            } else if (item.includes('TOEIC')) {
                color = '#3b82f6';
                icon = '📚';
            } else if (item.includes('công sở') || item.includes('Văn phòng')) {
                color = '#10b981';
                icon = '💼';
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

let appData = JSON.parse(localStorage.getItem('toeicAppData'));
let rawFolderData = JSON.parse(localStorage.getItem('toeicFolderData'));

// Auto-seed sample presets if no existing data
if (!appData || !Array.isArray(appData) || appData.length === 0) {
    let oldVocab = JSON.parse(localStorage.getItem('myVocab'));
    if (oldVocab && oldVocab.length > 0) {
        appData = [{ title: "VOCABULARY TOEIC READING #1", folder: "Chưa phân loại", words: oldVocab }];
    } else {
        appData = JSON.parse(JSON.stringify(SAMPLE_PRESETS));
    }
    localStorage.setItem('toeicAppData', JSON.stringify(appData));
}

let folderData = normalizeFolderData(rawFolderData);
if (!folderData || folderData.length === 0) {
    const existingFolderNames = new Set(["Chưa phân loại", ...appData.map(s => s.folder).filter(Boolean)]);
    folderData = normalizeFolderData(Array.from(existingFolderNames));
}
localStorage.setItem('toeicFolderData', JSON.stringify(folderData));

function saveAppData() {
    localStorage.setItem('toeicAppData', JSON.stringify(appData));
}

function saveFolderData() {
    localStorage.setItem('toeicFolderData', JSON.stringify(folderData));
}

function getFolderMeta(folderName) {
    const target = folderName || 'Chưa phân loại';
    const found = folderData.find(f => f.name === target);
    if (found) return found;
    return { name: target, color: '#64748b', icon: '📁' };
}

// Current App View State
let currentView = 'library'; // 'library', 'detail', 'test'
let currentLibraryTab = 'sets'; // 'sets', 'folders'
let currentOpenedFolder = null; // null if browsing all folders, or string folderName when inside a folder
let currentSetIndex = 0;
let currentSetTab = 'study'; // 'study', 'manage', 'list'
let isAutoSpeakEnabled = true;

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

    const filtered = appData.map((set, originalIndex) => ({ set, originalIndex })).filter(({ set }) => {
        const matchSearch = set.title.toLowerCase().includes(searchQuery);
        const matchFolder = !folderFilter || set.folder === folderFilter;
        return matchSearch && matchFolder;
    });

    if (filtered.length === 0) {
        setsList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    setsList.style.display = 'grid';
    emptyState.style.display = 'none';

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
};

window.closeFolderContents = function() {
    currentOpenedFolder = null;
    document.getElementById('foldersOverview').style.display = 'block';
    document.getElementById('folderContentsView').style.display = 'none';
    renderFoldersCards();
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
        appData.forEach(set => {
            if (set.folder === folderName) {
                set.folder = "Chưa phân loại";
            }
        });
        saveAppData();

        folderData = folderData.filter(f => f.name !== folderName);
        saveFolderData();

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
    navigateTo('detail');
    switchSetTab('study');
};

window.goBackFromSetDetail = function() {
    navigateTo('library');
    if (currentOpenedFolder) {
        switchLibraryTab('folders');
    }
};

function renderSetDetail() {
    const set = appData[currentSetIndex];
    if (!set) {
        navigateTo('library');
        return;
    }

    const fMeta = getFolderMeta(set.folder);
    document.getElementById('detailSetTitle').textContent = set.title;
    const detailFolderEl = document.getElementById('detailSetFolder');
    detailFolderEl.textContent = `${fMeta.icon} ${set.folder || 'Chưa phân loại'}`;
    detailFolderEl.style.color = fMeta.color;
    document.getElementById('detailWordCount').textContent = `${set.words.length} thuật ngữ`;
    document.getElementById('setListWordCount').textContent = set.words.length;

    if (currentSetTab === 'study') {
        renderStudyTable();
    } else if (currentSetTab === 'manage') {
        updateBulkPreview();
    } else if (currentSetTab === 'list') {
        renderWordListTable();
    }
}

window.switchSetTab = function(tabName) {
    currentSetTab = tabName;
    document.getElementById('setTabStudy').classList.toggle('active', tabName === 'study');
    document.getElementById('setTabManage').classList.toggle('active', tabName === 'manage');
    document.getElementById('setTabList').classList.toggle('active', tabName === 'list');

    document.getElementById('setStudySection').style.display = tabName === 'study' ? 'block' : 'none';
    document.getElementById('setManageSection').style.display = tabName === 'manage' ? 'block' : 'none';
    document.getElementById('setListSection').style.display = tabName === 'list' ? 'block' : 'none';

    renderSetDetail();
};

// --- STUDY TAB (TABLE TYPING PRACTICE) ---
function renderStudyTable() {
    const set = appData[currentSetIndex];
    const tbody = document.getElementById('vocabBody');
    tbody.innerHTML = '';

    if (!set || set.words.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Chưa có từ vựng nào trong học phần này. Hãy chuyển sang tab <strong>"➕ Thêm & Quản lý từ"</strong> để thêm từ!
        </td></tr>`;
        updateStudyStats();
        return;
    }

    const savedAnswers = JSON.parse(sessionStorage.getItem(`studyAnswers_${currentSetIndex}`)) || [];

    set.words.forEach((item, index) => {
        const oldAns = savedAnswers[index] || '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: var(--text-muted); font-weight: 600;">${index + 1}</td>
            <td>
                <span class="word-prompt">
                    ${escapeHtml(item.eng)}
                    <button class="speak-icon-btn" onclick="speakWord('${escapeJsString(item.eng)}')" title="Nghe phát âm">🔊</button>
                </span>
            </td>
            <td><span class="type-badge">${escapeHtml(item.type || '-')}</span></td>
            <td>
                <input type="text" class="answer-input" placeholder="Gõ nghĩa tiếng Việt rồi Enter..." value="${escapeHtml(oldAns)}" data-index="${index}">
            </td>
            <td class="result-cell" data-result-for="${index}"></td>
        `;
        tbody.appendChild(tr);
    });

    setupStudyEvents();
    updateStudyStats();
}

function checkStudyScore(input, index) {
    const set = appData[currentSetIndex];
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = (set.words[index]?.vie || '').trim().toLowerCase();
    const resultCell = document.querySelector(`.result-cell[data-result-for="${index}"]`);

    if (!resultCell) return;

    if (userAnswer === '') {
        resultCell.innerHTML = '';
        input.classList.remove('input-correct', 'input-wrong');
    } else if (isAnswerFuzzyMatch(userAnswer, correctAnswer)) {
        resultCell.innerHTML = `<span class="result-correct">✅ Đúng</span>`;
        input.classList.add('input-correct');
        input.classList.remove('input-wrong');
    } else {
        resultCell.innerHTML = `<span class="result-wrong">❌ Sai</span> <span class="result-expected">(${escapeHtml(set.words[index].vie)})</span>`;
        input.classList.add('input-wrong');
        input.classList.remove('input-correct');
    }
    updateStudyStats();
}

function setupStudyEvents() {
    const inputs = document.querySelectorAll('#vocabTable .answer-input');
    const set = appData[currentSetIndex];

    inputs.forEach((input, index) => {
        if (input.value.trim() !== '') {
            checkStudyScore(input, index);
        }

        input.addEventListener('focus', () => {
            if (isAutoSpeakEnabled && set.words[index]) {
                speakWord(set.words[index].eng);
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                speakWord(set.words[index].eng);
            } else if (e.key === 'Enter') {
                checkStudyScore(input, index);
                let saved = JSON.parse(sessionStorage.getItem(`studyAnswers_${currentSetIndex}`)) || [];
                saved[index] = input.value;
                sessionStorage.setItem(`studyAnswers_${currentSetIndex}`, JSON.stringify(saved));

                if (index + 1 < inputs.length) {
                    inputs[index + 1].focus();
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

function updateStudyStats() {
    const set = appData[currentSetIndex];
    const total = set ? set.words.length : 0;
    let correct = 0;
    let wrong = 0;

    document.querySelectorAll('#vocabTable .result-cell').forEach(cell => {
        if (cell.innerHTML.includes('✅')) correct++;
        else if (cell.innerHTML.includes('❌')) wrong++;
    });

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCorrect').textContent = correct;
    document.getElementById('statWrong').textContent = wrong;
    const answered = correct + wrong;
    document.getElementById('statPercent').textContent = answered > 0 ? Math.round((correct / answered) * 100) + '%' : '0%';
}

window.clearStudyAnswers = function() {
    document.querySelectorAll('#vocabTable .answer-input').forEach(input => {
        input.value = '';
        input.classList.remove('input-correct', 'input-wrong');
    });
    document.querySelectorAll('#vocabTable .result-cell').forEach(cell => cell.innerHTML = '');
    sessionStorage.removeItem(`studyAnswers_${currentSetIndex}`);
    updateStudyStats();
};

window.toggleAutoSpeak = function() {
    isAutoSpeakEnabled = !isAutoSpeakEnabled;
    document.getElementById('speakIcon').textContent = isAutoSpeakEnabled ? '🔊' : '🔇';
    document.getElementById('speakStatusText').textContent = isAutoSpeakEnabled ? 'Tự động đọc: BẬT' : 'Tự động đọc: TẮT';
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
    const set = appData[currentSetIndex];
    const tbody = document.getElementById('wordListBody');
    const query = (document.getElementById('wordSearchInput').value || '').trim().toLowerCase();
    tbody.innerHTML = '';

    if (!set || set.words.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">Học phần này chưa có từ nào.</td></tr>`;
        return;
    }

    const filtered = set.words.map((w, originalIdx) => ({ w, originalIdx })).filter(({ w }) => {
        return w.eng.toLowerCase().includes(query) || w.vie.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Không tìm thấy từ vựng nào khớp với từ khóa tìm kiếm.</td></tr>`;
        return;
    }

    filtered.forEach(({ w, originalIdx }) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: var(--text-muted); font-weight: 600;">${originalIdx + 1}</td>
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

function updateTestSummaryCounts() {
    const selectedSets = activeTestState.selectedSetIndices.map(i => appData[i]).filter(Boolean);
    const totalWords = selectedSets.reduce((sum, s) => sum + s.words.length, 0);

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

    // Pool all words from selected sets
    let pool = [];
    selectedIndices.forEach(idx => {
        const set = appData[idx];
        if (set && set.words.length > 0) {
            set.words.forEach(w => {
                pool.push({
                    eng: w.eng,
                    type: w.type || '',
                    vie: w.vie,
                    sourceSet: set.title
                });
            });
        }
    });

    if (pool.length === 0) {
        alert("Các học phần đã chọn không có từ vựng nào!");
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
        input.addEventListener('focus', () => {
            const q = activeTestState.questions[index];
            if (activeTestState.autoSpeak && activeTestState.direction === 'en-vi' && q) {
                speakWord(q.eng);
            }
        });

        input.addEventListener('keydown', (e) => {
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
    if (wordIdxToDelete > -1) {
        appData[currentSetIndex].words.splice(wordIdxToDelete, 1);
        saveAppData();
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
    if (setIdxToDelete > -1) {
        appData.splice(setIdxToDelete, 1);
        saveAppData();
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

// Initial Launch
initTheme();
renderLibrary();
