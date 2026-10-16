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

// ==========================================================================
// 1. STATE & STORAGE MANAGEMENT
// ==========================================================================

let appData = JSON.parse(localStorage.getItem('toeicAppData'));
let folderData = JSON.parse(localStorage.getItem('toeicFolderData'));

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

if (!folderData || !Array.isArray(folderData) || folderData.length === 0) {
    const existingFolders = new Set(["Chưa phân loại", ...appData.map(s => s.folder).filter(Boolean)]);
    folderData = Array.from(existingFolders);
    localStorage.setItem('toeicFolderData', JSON.stringify(folderData));
}

function saveAppData() {
    localStorage.setItem('toeicAppData', JSON.stringify(appData));
}

function saveFolderData() {
    localStorage.setItem('toeicFolderData', JSON.stringify(folderData));
}

// Current App View State
let currentView = 'library'; // 'library', 'detail', 'test'
let currentLibraryTab = 'sets'; // 'sets', 'folders'
let currentSetIndex = 0;
let currentSetTab = 'study'; // 'study', 'manage', 'list'
let isAutoSpeakEnabled = true;

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
    document.getElementById('setDetailView').style.display = 'none';
    document.getElementById('testView').style.display = 'none';

    // Update main nav buttons
    document.getElementById('navBtnLibrary').classList.toggle('active', viewName === 'library');
    document.getElementById('navBtnTest').classList.toggle('active', viewName === 'test');

    if (viewName === 'library') {
        document.getElementById('libraryView').style.display = 'flex';
        renderLibrary();
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
        folderFilterSelect.innerHTML += `<option value="${escapeHtml(folder)}" ${currentSelectedFilter === folder ? 'selected' : ''}>${escapeHtml(folder)}</option>`;
    });

    if (currentLibraryTab === 'sets') {
        renderSetsCards();
    } else {
        renderFoldersCards();
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
        const card = document.createElement('div');
        card.className = 'set-card';
        card.onclick = () => openSet(originalIndex);
        card.innerHTML = `
            <div>
                <div class="set-card-meta">
                    <span class="set-card-folder">📁 ${escapeHtml(folderName)}</span>
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

function renderFoldersCards() {
    const foldersList = document.getElementById('foldersList');
    foldersList.innerHTML = '';

    folderData.forEach(folderName => {
        const setsInFolder = appData.filter(s => s.folder === folderName);
        const totalWords = setsInFolder.reduce((sum, s) => sum + s.words.length, 0);

        const folderCard = document.createElement('div');
        folderCard.className = 'folder-card';
        folderCard.innerHTML = `
            <div>
                <div class="folder-card-header">
                    <div class="folder-icon">📁</div>
                    <div>
                        <div class="folder-name">${escapeHtml(folderName)}</div>
                        <div class="folder-count-badge">${setsInFolder.length} học phần • ${totalWords} từ</div>
                    </div>
                </div>
            </div>
            <div class="folder-card-footer">
                ${folderName !== 'Chưa phân loại' ? `
                    <button class="btn btn-ghost btn-sm" onclick="deleteFolder('${escapeHtml(folderName)}')" style="color: var(--danger);">
                        🗑️ Xóa thư mục
                    </button>
                ` : '<div></div>'}
                <button class="btn btn-secondary btn-sm" onclick="openFolderManageModal('${escapeHtml(folderName)}')">
                    ⚙️ Thêm học phần
                </button>
            </div>
        `;
        foldersList.appendChild(folderCard);
    });
}

// Set & Folder Creation Modals / Prompts
window.createNewSet = function() {
    const title = prompt("Nhập tên học phần mới:", "VOCABULARY TOEIC #" + (appData.length + 1));
    if (title && title.trim() !== '') {
        const folder = prompt("Nhập thư mục để lưu (để trống nếu 'Chưa phân loại'):", "Chưa phân loại");
        const cleanFolder = folder && folder.trim() ? folder.trim() : "Chưa phân loại";

        if (!folderData.includes(cleanFolder)) {
            folderData.push(cleanFolder);
            saveFolderData();
        }

        const newSet = {
            title: title.trim(),
            folder: cleanFolder,
            words: []
        };
        appData.push(newSet);
        saveAppData();

        openSet(appData.length - 1);
    }
};

window.createNewFolder = function() {
    const folderName = prompt("Nhập tên thư mục mới:");
    if (folderName && folderName.trim() !== '') {
        const cleanName = folderName.trim();
        if (folderData.includes(cleanName)) {
            alert("Thư mục này đã tồn tại!");
            return;
        }
        folderData.push(cleanName);
        saveFolderData();
        renderLibrary();
    }
};

window.deleteFolder = function(folderName) {
    if (confirm(`Bạn có chắc muốn xóa thư mục "${folderName}" không?\n\nLưu ý: Các học phần bên trong sẽ được chuyển về "Chưa phân loại" chứ KHÔNG bị xóa.`)) {
        appData.forEach(set => {
            if (set.folder === folderName) {
                set.folder = "Chưa phân loại";
            }
        });
        saveAppData();

        folderData = folderData.filter(name => name !== folderName);
        saveFolderData();
        renderLibrary();
    }
};

// ==========================================
// FOLDER MANAGE MODAL (ADD SETS TO FOLDER)
// ==========================================
let targetFolderForModal = '';

window.openFolderManageModal = function(folderName) {
    targetFolderForModal = folderName;
    document.getElementById('folderManageTitle').textContent = `📁 Thư mục: ${folderName}`;
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

function renderSetDetail() {
    const set = appData[currentSetIndex];
    if (!set) {
        navigateTo('library');
        return;
    }

    document.getElementById('detailSetTitle').textContent = set.title;
    document.getElementById('detailSetFolder').textContent = `📁 ${set.folder || 'Chưa phân loại'}`;
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
        folderSelect.innerHTML += `<option value="${escapeHtml(folder)}" ${set.folder === folder ? 'selected' : ''}>${escapeHtml(folder)}</option>`;
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
            if (!folderData.includes(preset.folder)) {
                folderData.push(preset.folder);
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
                folderData = data.folderData || ["Chưa phân loại"];
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
