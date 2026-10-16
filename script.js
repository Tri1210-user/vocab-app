// ==========================================
// 1. CẤU TRÚC DỮ LIỆU CƠ BẢN
// ==========================================
let appData = JSON.parse(localStorage.getItem('toeicAppData'));

if (!appData || appData.length === 0) {
    let oldVocab = JSON.parse(localStorage.getItem('myVocab')) || [];
    appData = [{ title: "VOCABULARY TOEIC READING #1", folder: "", words: oldVocab }];
    localStorage.setItem('toeicAppData', JSON.stringify(appData));
}

let currentSetIndex = 0; 
let vocabData = appData[currentSetIndex].words; 

function saveData() {
    appData[currentSetIndex].words = vocabData; 
    localStorage.setItem('toeicAppData', JSON.stringify(appData));
}

// ==========================================
// 2. QUẢN LÝ THƯ MỤC & ĐIỀU HƯỚNG TRANG CHỦ
// ==========================================
let folderData = JSON.parse(localStorage.getItem('toeicFolderData')) || ["Chưa phân loại"];

function saveFolderData() {
    localStorage.setItem('toeicFolderData', JSON.stringify(folderData));
}

let currentHomeTab = 'sets'; 

window.switchHomeTab = function(tabName) {
    currentHomeTab = tabName;
    document.getElementById('tabSets').classList.toggle('active', tabName === 'sets');
    document.getElementById('tabFolders').classList.toggle('active', tabName === 'folders');
    
    document.getElementById('setsViewContainer').style.display = tabName === 'sets' ? 'block' : 'none';
    document.getElementById('foldersViewContainer').style.display = tabName === 'folders' ? 'block' : 'none';
    document.getElementById('btnCreateSet').style.display = tabName === 'sets' ? 'block' : 'none';
    document.getElementById('btnCreateFolder').style.display = tabName === 'folders' ? 'block' : 'none';

    renderHome();
};

function renderHome() {
    if (currentHomeTab === 'sets') {
        renderSetsTab();
    } else {
        renderFoldersTab();
    }
}

function renderSetsTab() {
    const setsList = document.getElementById('setsList');
    setsList.innerHTML = '';
    
    appData.forEach((set, index) => {
        setsList.innerHTML += `
            <div onclick="openSet(${index})" style="background-color: #2e344e; color: white; padding: 20px; border-radius: 8px; cursor: pointer; border-left: 5px solid #7a88cf; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-size: 13px; color: #a9b1d6; margin-bottom: 8px; font-weight: bold;">
                        Học phần &nbsp;•&nbsp; ${set.words.length} thuật ngữ &nbsp;•&nbsp; Tác giả: Bạn
                    </div>
                    <div style="font-size: 20px; font-weight: bold; text-transform: uppercase;">
                        ${set.title}
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="event.stopPropagation(); editSet(${index})" style="background-color: transparent; border: 1px solid #a9b1d6; color: white; padding: 5px 10px; border-radius: 4px;">Sửa</button>
                    <button onclick="event.stopPropagation(); deleteSet(${index})" style="background-color: transparent; border: 1px solid #f44336; color: #f44336; padding: 5px 10px; border-radius: 4px;">Xóa</button>
                </div>
            </div>
        `;
    });
}

function renderFoldersTab() {
    const foldersList = document.getElementById('foldersList');
    foldersList.innerHTML = '';

    let allFolders = new Set([...folderData, ...appData.map(set => set.folder).filter(Boolean)]);
    folderData = Array.from(allFolders);
    saveFolderData();

    folderData.forEach(folderName => {
        const itemsCount = appData.filter(set => set.folder === folderName).length;
        
        // Logic: Không cho phép xóa thư mục mặc định "Chưa phân loại"
        const deleteBtnHtml = folderName !== "Chưa phân loại"
            ? `<button class="btn-delete-folder" onclick="event.stopPropagation(); deleteFolder('${folderName}')">🗑️ Xóa</button>`
            : `<div></div>`; // Giữ chỗ trống nếu là thư mục mặc định

        foldersList.innerHTML += `
            <div class="folder-item">
                <div class="folder-header-row">
                    <!-- Bên trái: Thông tin thư mục -->
                    <div>
                        <div class="folder-count">${itemsCount} mục</div>
                        <div class="folder-name">📁 ${folderName}</div>
                    </div>
                    
                    <!-- Bên phải: Nhóm nút hành động -->
                    <div class="folder-actions">
                        ${deleteBtnHtml}
                        <button class="btn-add-material" onclick="event.stopPropagation(); addMaterialToFolder('${folderName}')">Thêm tài liệu học</button>
                    </div>
                </div>
            </div>
        `;
    });
}
// ==========================================
// LOGIC: THÊM TÀI LIỆU VÀO THƯ MỤC CỤ THỂ
// ==========================================
let currentTargetFolder = ''; // Biến toàn cục lưu tên thư mục đang mở

// Hàm 1: Mở Modal khi bấm nút "Thêm tài liệu học"
window.addMaterialToFolder = function(folderName) {
    currentTargetFolder = folderName;
    document.getElementById('addMaterialModal').style.display = 'flex';
    renderMaterialList(); // Vẽ danh sách các học phần
};

// Hàm 2: Đóng Modal và cập nhật lại màn hình chính
window.closeMaterialModal = function() {
    document.getElementById('addMaterialModal').style.display = 'none';
    currentTargetFolder = '';
    renderHome(); // Cập nhật lại số lượng mục trên giao diện ngoài
};

// Hàm 3: Vẽ danh sách học phần lên Modal
function renderMaterialList() {
    const list = document.getElementById('materialList');
    list.innerHTML = '';
    
    appData.forEach((set, index) => {
        // Kiểm tra xem set này đã nằm trong thư mục hiện tại chưa
        const isAdded = set.folder === currentTargetFolder;
        
        // Giao diện nút bấm sẽ đổi thành "✓" nếu đã thêm
        const btnHtml = isAdded 
            ? `<button class="btn-add-set added" onclick="toggleSetFolder(${index})">✓</button>` 
            : `<button class="btn-add-set" onclick="toggleSetFolder(${index})">+</button>`;

        list.innerHTML += `
            <div class="material-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="background: #2e344e; padding: 12px; border-radius: 6px;">📄</div>
                    <div>
                        <div class="material-item-title">${set.title}</div>
                        <div class="material-item-desc">Học phần • ${set.words.length} thuật ngữ</div>
                    </div>
                </div>
                ${btnHtml}
            </div>
        `;
    });
}

// Hàm 4: Chuyển đổi trạng thái Thêm/Xóa học phần vào thư mục
window.toggleSetFolder = function(index) {
    // Nếu học phần đang ở trong thư mục này -> Xóa ra (chuyển về Chưa phân loại)
    if (appData[index].folder === currentTargetFolder) {
        appData[index].folder = 'Chưa phân loại';
    } 
    // Nếu chưa ở trong thư mục -> Cập nhật folder của nó thành thư mục này
    else {
        appData[index].folder = currentTargetFolder;
    }
    
    // Lưu và vẽ lại tức thì (Real-time reactivity)
    localStorage.setItem('toeicAppData', JSON.stringify(appData));
    renderMaterialList(); 
};

// Hàm 5: Tạo nhanh học phần mới và ném thẳng vào thư mục này
window.createNewSetForFolder = function() {
    const title = prompt(`Tạo học phần mới trong [${currentTargetFolder}]:\nNhập tên:`, "VOCABULARY #" + (appData.length + 1));
    if (title && title.trim() !== '') {
        appData.push({ title: title.trim(), folder: currentTargetFolder, words: [] });
        localStorage.setItem('toeicAppData', JSON.stringify(appData));
        renderMaterialList(); // Cập nhật Modal
    }
};

// ==========================================
// LOGIC: XÓA THƯ MỤC (BẢO VỆ DỮ LIỆU CON)
// ==========================================
window.deleteFolder = function(folderName) {
    if (confirm(`⚠️ Bạn có chắc chắn muốn xóa thư mục "${folderName}" không?\n\nLưu ý: Các học phần bên trong sẽ KHÔNG bị mất, chúng sẽ được tự động chuyển về mục "Chưa phân loại".`)) {
        
        // 1. Chuyển các học phần đang thuộc thư mục này về "Chưa phân loại"
        appData.forEach(set => {
            if (set.folder === folderName) {
                set.folder = "Chưa phân loại";
            }
        });
        localStorage.setItem('toeicAppData', JSON.stringify(appData)); // Lưu data học phần

        // 2. Xóa tên thư mục khỏi mảng quản lý thư mục
        folderData = folderData.filter(name => name !== folderName);
        saveFolderData(); // Lưu data thư mục

        // 3. Vẽ lại giao diện
        renderHome();
    }
};

// ==========================================
// 3. LOGIC HỌC PHẦN & TẠO MỚI
// ==========================================
window.createNewFolder = function() {
    const folderName = prompt("Nhập tên thư mục mới:");
    if (folderName && folderName.trim() !== '') {
        const cleanName = folderName.trim();
        if (folderData.includes(cleanName)) {
            alert("Thư mục này đã tồn tại!"); return;
        }
        folderData.push(cleanName);
        saveFolderData();
        renderHome();
    }
};

window.createNewSet = function() {
    const title = prompt("Nhập tên học phần mới:", "VOCABULARY TOEIC READING #" + (appData.length + 1));
    if (title && title.trim() !== '') {
        const folder = prompt("Nhập tên thư mục để lưu (Để trống nếu không phân loại):", "Chưa phân loại");
        appData.push({ title: title.trim(), folder: folder ? folder.trim() : "", words: [] });
        saveData();
        renderHome();
    }
};

window.openSet = function(index) {
    currentSetIndex = index;
    vocabData = appData[currentSetIndex].words; 
    document.getElementById('studyTitle').textContent = appData[currentSetIndex].title;
    
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('studyScreen').style.display = 'block';
    document.getElementById('btnTabStudy').click();
    
    renderTable();
    renderWordList();
};

window.goHome = function() {
    document.getElementById('studyScreen').style.display = 'none';
    document.getElementById('homeScreen').style.display = 'block';
    renderHome(); 
};

// ==========================================
// 4. QUẢN LÝ TABS TRONG KHÔNG GIAN HỌC
// ==========================================
const btnTabStudy = document.getElementById('btnTabStudy');
const btnTabManage = document.getElementById('btnTabManage');
const btnTabList = document.getElementById('btnTabList');

const studySection = document.getElementById('studySection');
const manageSection = document.getElementById('manageSection');
const listSection = document.getElementById('listSection');

function hideAllTabs() {
    studySection.style.display = 'none';
    manageSection.style.display = 'none';
    listSection.style.display = 'none';
    btnTabStudy.style.backgroundColor = '#888';
    btnTabManage.style.backgroundColor = '#888';
    btnTabList.style.backgroundColor = '#888';
}

btnTabStudy.addEventListener('click', function() {
    hideAllTabs();
    studySection.style.display = 'block';
    btnTabStudy.style.backgroundColor = '#4CAF50';
    renderTable();
});

btnTabManage.addEventListener('click', function() {
    hideAllTabs();
    manageSection.style.display = 'block';
    btnTabManage.style.backgroundColor = '#4CAF50';
});

btnTabList.addEventListener('click', function() {
    hideAllTabs();
    listSection.style.display = 'block';
    btnTabList.style.backgroundColor = '#4CAF50';
    renderWordList();
});

// ==========================================
// 5. HIỂN THỊ DỮ LIỆU & CHẤM ĐIỂM
// ==========================================
function renderTable() {
    const tbody = document.getElementById('vocabBody');
    tbody.innerHTML = ''; 
    let savedAnswers = JSON.parse(sessionStorage.getItem('myAnswers')) || [];

    vocabData.forEach((item, index) => {
        let oldAns = savedAnswers[index] || ''; 
        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.eng} <span onclick="speakWord('${item.eng}')" style="cursor: pointer; font-size: 16px; margin-left: 8px;">🔊</span></td>
                <td style="color: #666; font-style: italic;">${item.type || ''}</td>
                <td><input type="text" class="answer-input" placeholder="Nhập đáp án..." value="${oldAns}"></td>
                <td class="result-cell"></td>
            </tr>
        `;
    });
    setupEvents();
    updateStats(); 
}

function checkScore(input, index) {
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = vocabData[index].vie.toLowerCase();
    const resultCell = input.parentElement.nextElementSibling;

    if (userAnswer === correctAnswer) {
        resultCell.textContent = '✅ Đúng'; resultCell.style.color = 'green';
    } else if (userAnswer === '') {
        resultCell.textContent = ''; 
    } else {
        resultCell.textContent = '❌ Sai (' + vocabData[index].vie + ')'; resultCell.style.color = 'red';
    }
    updateStats();
}

function setupEvents() {
    const answerInputs = document.querySelectorAll('.answer-input');
    const resultCells = document.querySelectorAll('.result-cell');
    
    answerInputs.forEach((input, index) => {
        if (input.value.trim() !== '') checkScore(input, index);

        input.addEventListener('focus', function() {
            if (isAutoSpeakEnabled) speakWord(vocabData[index].eng);
        });

        input.addEventListener('keydown', function(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                speakWord(vocabData[index].eng);
            } else if (event.key === 'Enter') {
                checkScore(input, index);
                let savedAnswers = JSON.parse(sessionStorage.getItem('myAnswers')) || [];
                savedAnswers[index] = input.value;
                sessionStorage.setItem('myAnswers', JSON.stringify(savedAnswers));
                if (index + 1 < answerInputs.length) answerInputs[index + 1].focus();
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (index + 1 < answerInputs.length) answerInputs[index + 1].focus();
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (index - 1 >= 0) answerInputs[index - 1].focus();
            }
        });
    });

    document.getElementById('btnClear').onclick = function() {
        answerInputs.forEach(input => input.value = '');
        resultCells.forEach(cell => cell.textContent = '');
        sessionStorage.removeItem('myAnswers');
        updateStats();
    };
}

// ==========================================
// 6. NHẬP DỮ LIỆU HÀNG LOẠT & XEM TRƯỚC
// ==========================================
document.getElementById('btnImportBulk').addEventListener('click', function() {
    const rawText = document.getElementById('bulkText').value;
    const termSep = document.getElementById('termSeparator').value;
    let cardSep = document.getElementById('cardSeparator').value.replace(/\\n/g, '\n');

    if (rawText.trim() === '') { alert('Vui lòng dán dữ liệu vào ô trống!'); return; }

    let addedCount = 0;
    rawText.split(cardSep).forEach(card => {
        if (card.trim() === '') return;
        const parts = card.split(termSep);
        if (parts.length >= 3) {
            vocabData.push({ eng: parts[0].trim(), type: parts[1].trim(), vie: parts.slice(2).join(termSep).trim() });
            addedCount++;
        } else if (parts.length === 2) {
            vocabData.push({ eng: parts[0].trim(), type: '', vie: parts[1].trim() });
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveData(); renderTable(); 
        document.getElementById('bulkText').value = '';
        alert(`Thành công! Đã thêm ${addedCount} từ vựng mới.`);
    } else { alert('Không tìm thấy từ vựng nào. Kiểm tra lại Ký tự ngăn cách!'); }
});

function updatePreview() {
    const rawText = document.getElementById('bulkText').value;
    const termSep = document.getElementById('termSeparator').value;
    let cardSep = document.getElementById('cardSeparator').value.replace(/\\n/g, '\n');
    const previewContainer = document.getElementById('previewContainer');

    if (rawText.trim() === '') {
        previewContainer.innerHTML = '<p style="color: #888; font-style: italic; font-size: 14px;">Không có nội dung...</p>';
        document.getElementById('previewCount').textContent = '0'; return;
    }

    let previewHTML = ''; let validCount = 0;
    rawText.split(cardSep).forEach((card) => {
        if (card.trim() === '') return;
        const parts = card.split(termSep);
        let eng = parts[0]?.trim() || '';
        let type = parts.length >= 3 ? parts[1].trim() : '';
        let vie = parts.length >= 3 ? parts.slice(2).join(termSep).trim() : (parts[1]?.trim() || '');

        validCount++;
        previewHTML += `
            <div style="display: flex; background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 12px;">
                <div style="width: 30px; font-weight: bold; color: #555;">${validCount}</div>
                <div style="flex: 1; border-right: 1px solid #eee;"><b>${eng || '...'}</b> <br><small>THUẬT NGỮ</small></div>
                <div style="flex: 1; border-right: 1px solid #eee; padding-left: 15px;"><i>${type || '-'}</i> <br><small>LOẠI TỪ</small></div>
                <div style="flex: 1; padding-left: 15px;"><b>${vie || '...'}</b> <br><small>ĐỊNH NGHĨA</small></div>
            </div>`;
    });

    previewContainer.innerHTML = previewHTML;
    document.getElementById('previewCount').textContent = validCount;
}

document.getElementById('bulkText').addEventListener('input', updatePreview);
document.getElementById('termSeparator').addEventListener('input', updatePreview);
document.getElementById('cardSeparator').addEventListener('change', updatePreview);

// ==========================================
// 7. CÁC TÍNH NĂNG CHỈNH SỬA / XÓA (CRUD)
// ==========================================
function renderWordList() {
    const wordListBody = document.getElementById('wordListBody');
    wordListBody.innerHTML = ''; 
    vocabData.forEach((item, index) => {
        wordListBody.innerHTML += `
            <tr>
                <td>${index + 1}</td> <td>${item.eng}</td> <td style="color:#666; font-style:italic;">${item.type || ''}</td> <td>${item.vie}</td>
                <td style="text-align: center;">
                    <button onclick="editWord(${index})" style="background-color: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 4px;">Sửa</button>
                    <button onclick="deleteWord(${index})" style="background-color: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px;">Xóa</button>
                </td>
            </tr>`;
    });
}

let wordIndexToEdit = -1;
window.editWord = function(index) {
    wordIndexToEdit = index;
    document.getElementById('editEng').value = vocabData[index].eng;
    document.getElementById('editType').value = vocabData[index].type || '';
    document.getElementById('editVie').value = vocabData[index].vie;
    document.getElementById('editModal').style.display = 'flex';
};

document.getElementById('btnSaveEdit').onclick = function() {
    if (wordIndexToEdit > -1) {
        vocabData[wordIndexToEdit].eng = document.getElementById('editEng').value.trim();
        vocabData[wordIndexToEdit].type = document.getElementById('editType').value.trim();
        vocabData[wordIndexToEdit].vie = document.getElementById('editVie').value.trim();
        saveData(); renderWordList(); renderTable();
        document.getElementById('editModal').style.display = 'none';
    }
};
document.getElementById('btnCancelEdit').onclick = () => document.getElementById('editModal').style.display = 'none';

let wordIndexToDelete = -1; 
window.deleteWord = function(index) {
    wordIndexToDelete = index;
    document.getElementById('deleteMessage').innerHTML = `Xóa từ <strong>"${vocabData[index].eng}"</strong>?`;
    document.getElementById('deleteModal').style.display = 'flex';
};

document.getElementById('btnConfirmDelete').onclick = function() {
    if (wordIndexToDelete > -1) {
        vocabData.splice(wordIndexToDelete, 1);
        saveData(); renderWordList(); renderTable();
        document.getElementById('deleteModal').style.display = 'none';
    }
};
document.getElementById('btnCancelDelete').onclick = () => document.getElementById('deleteModal').style.display = 'none';

let setIndexToEdit = -1;
window.editSet = function(index) {
    setIndexToEdit = index;
    document.getElementById('editSetTitle').value = appData[index].title;
    document.getElementById('editSetModal').style.display = 'flex';
};
document.getElementById('btnSaveSetEdit').onclick = function() {
    if (setIndexToEdit > -1) {
        appData[setIndexToEdit].title = document.getElementById('editSetTitle').value.trim();
        localStorage.setItem('toeicAppData', JSON.stringify(appData));
        renderHome(); document.getElementById('editSetModal').style.display = 'none';
    }
};

let setIndexToDelete = -1;
window.deleteSet = function(index) {
    setIndexToDelete = index;
    document.getElementById('deleteSetMessage').innerHTML = `Xóa học phần <strong>"${appData[index].title}"</strong>?`;
    document.getElementById('deleteSetModal').style.display = 'flex';
};
document.getElementById('btnConfirmDeleteSet').onclick = function() {
    if (setIndexToDelete > -1) {
        appData.splice(setIndexToDelete, 1);
        localStorage.setItem('toeicAppData', JSON.stringify(appData));
        renderHome(); document.getElementById('deleteSetModal').style.display = 'none';
    }
};

// ==========================================
// 8. TIỆN ÍCH (TTS & THỐNG KÊ)
// ==========================================
window.speakWord = function(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
};

window.updateStats = function() {
    let total = vocabData.length;
    let correct = 0, wrong = 0;
    document.querySelectorAll('.result-cell').forEach(cell => {
        if (cell.textContent.includes('✅')) correct++;
        else if (cell.textContent.includes('❌')) wrong++;
    });
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCorrect').textContent = correct;
    document.getElementById('statWrong').textContent = wrong;
    document.getElementById('statPercent').textContent = (correct + wrong > 0) ? Math.round((correct / (correct + wrong)) * 100) + '%' : '0%';
};

let isAutoSpeakEnabled = true; 
document.getElementById('btnToggleSpeak').onclick = function() {
    isAutoSpeakEnabled = !isAutoSpeakEnabled;
    this.textContent = isAutoSpeakEnabled ? '🔊 Tự động đọc: BẬT' : '🔇 Tự động đọc: TẮT';
    this.style.backgroundColor = isAutoSpeakEnabled ? '#008CBA' : '#757575';
};

// Khởi chạy ứng dụng
renderHome();