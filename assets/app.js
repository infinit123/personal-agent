let state = {
    inspections: JSON.parse(localStorage.getItem('revizio_inspections')) || [
        { id: '1', date: '2026-06-01', client: 'SC Restaurant Gourmet SRL', address: 'Pța. Mare Nr. 5, Sibiu', type: 'Verificare 10 Ani', basePrice: 450, status: 'Finalizat', notes: 'Verificare contor și ardere' },
        { id: '2', date: '2026-06-02', client: 'Ionescu Maria', address: 'Str. Lânii Nr. 14', type: 'Revizie 2 Ani', basePrice: 200, status: 'Finalizat', notes: 'Fără scurgeri identificate' },
        { id: '3', date: '2026-06-03', client: 'Popa Gheorghe', address: 'Bd. Victoriei 22', type: 'Instalație Nouă', basePrice: 850, status: 'Programat', notes: 'Racordare aragaz și centrală' }
    ],
    target: parseInt(localStorage.getItem('revizio_target')) || 5,
    operator: JSON.parse(localStorage.getItem('revizio_operator')) || { name: 'Operator ORV', auth: 'ANRE-2026-0142' }
};

const TVA_RATE = 0.19;

const currentDateDisplay = document.getElementById('currentDateDisplay');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const statTotalCount = document.getElementById('statTotalCount');
const statTotalRevenue = document.getElementById('statTotalRevenue');
const statTvaAmount = document.getElementById('statTvaAmount');
const statGrossRevenue = document.getElementById('statGrossRevenue');
const targetPercentage = document.getElementById('targetPercentage');
const targetProgressBar = document.getElementById('targetProgressBar');
const targetProgressText = document.getElementById('targetProgressText');
const dailyTargetInput = document.getElementById('dailyTargetInput');
const saveTargetBtn = document.getElementById('saveTargetBtn');
const recentInspectionsBody = document.getElementById('recentInspectionsBody');
const recentEmptyState = document.getElementById('recentEmptyState');
const fullInspectionsBody = document.getElementById('fullInspectionsBody');
const fullEmptyState = document.getElementById('fullEmptyState');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const filterStatus = document.getElementById('filterStatus');

const inspectionModal = document.getElementById('inspectionModal');
const inspectionForm = document.getElementById('inspectionForm');
const modalTitle = document.getElementById('modalTitle');
const editInspectionId = document.getElementById('editInspectionId');
const formDate = document.getElementById('formDate');
const formClient = document.getElementById('formClient');
const formAddress = document.getElementById('formAddress');
const formType = document.getElementById('formType');
const formBasePrice = document.getElementById('formBasePrice');
const formStatus = document.getElementById('formStatus');
const formNotes = document.getElementById('formNotes');

const calcAmount = document.getElementById('calcAmount');
const calcResultTva = document.getElementById('calcResultTva');
const calcResultTotal = document.getElementById('calcResultTotal');
const summaryNet = document.getElementById('summaryNet');
const summaryTva = document.getElementById('summaryTva');
const summaryGross = document.getElementById('summaryGross');
const summaryCount = document.getElementById('summaryCount');

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTheme();
    updateDateBadge();
    renderAll();
    setupEventListeners();
});

function initNavigation() {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const targetId = item.getAttribute('data-target');
            switchView(targetId);
            
            document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    document.getElementById('goToInspectionsBtn').addEventListener('click', () => {
        switchView('view-inspections');
        document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => {
            if(nav.getAttribute('data-target') === 'view-inspections') nav.classList.add('active');
            else nav.classList.remove('active');
        });
    });
}

function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

function initTheme() {
    const savedTheme = localStorage.getItem('revizio_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('revizio_theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

function updateDateBadge() {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    currentDateDisplay.textContent = new Date().toLocaleDateString('ro-RO', options);
}

function setupEventListeners() {
    document.getElementById('quickAddBtn').addEventListener('click', openAddModal);
    document.getElementById('addNewInspectionBtn').addEventListener('click', openAddModal);
    document.getElementById('quickExportBtn').addEventListener('click', exportDataJson);
    document.getElementById('exportJsonBtn').addEventListener('click', exportDataJson);
    document.getElementById('quickImportBtn').addEventListener('click', () => document.getElementById('importJsonFile').click());
    document.getElementById('importJsonFile').addEventListener('change', importDataJson);
    document.getElementById('quickClearBtn').addEventListener('click', clearAllData);
    document.getElementById('factoryResetBtn').addEventListener('click', clearAllData);

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => inspectionModal.classList.add('hidden'));
    });

    inspectionForm.addEventListener('submit', handleFormSubmit);

    searchInput.addEventListener('input', renderInspectionsTable);
    filterType.addEventListener('change', renderInspectionsTable);
    filterStatus.addEventListener('change', renderInspectionsTable);

    dailyTargetInput.value = state.target;
    saveTargetBtn.addEventListener('click', () => {
        const val = parseInt(dailyTargetInput.value);
        if(val > 0) {
            state.target = val;
            localStorage.setItem('revizio_target', val);
            renderStats();
            showToast('Obiectivul zilnic a fost actualizat!');
        }
    });

    calcAmount.addEventListener('input', updateCalculator);

    document.getElementById('operatorName').value = state.operator.name;
    document.getElementById('operatorAuth').value = state.operator.auth;
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        state.operator = {
            name: document.getElementById('operatorName').value,
            auth: document.getElementById('operatorAuth').value
        };
        localStorage.setItem('revizio_operator', JSON.stringify(state.operator));
        showToast('Setările au fost salvate!');
    });
}

function renderAll() {
    renderStats();
    renderRecentInspections();
    renderInspectionsTable();
    updateCalculator();
}

function renderStats() {
    const totalCount = state.inspections.length;
    const totalNet = state.inspections.reduce((acc, curr) => acc + parseFloat(curr.basePrice || 0), 0);
    const totalTva = totalNet * TVA_RATE;
    const totalGross = totalNet + totalTva;

    statTotalCount.textContent = totalCount;
    statTotalRevenue.textContent = `${totalNet.toFixed(2)} RON`;
    statTvaAmount.textContent = `${totalTva.toFixed(2)} RON`;
    statGrossRevenue.textContent = `${totalGross.toFixed(2)} RON`;

    summaryNet.textContent = `${totalNet.toFixed(2)} RON`;
    summaryTva.textContent = `${totalTva.toFixed(2)} RON`;
    summaryGross.textContent = `${totalGross.toFixed(2)} RON`;
    summaryCount.textContent = totalCount;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCompleted = state.inspections.filter(i => i.date === todayStr && i.status === 'Finalizat').length;
    const percentage = Math.min(Math.round((todayCompleted / state.target) * 100), 100);

    targetPercentage.textContent = `${percentage}%`;
    targetProgressBar.style.width = `${percentage}%`;
    targetProgressText.textContent = `${todayCompleted} din ${state.target} lucrări finalizate astăzi.`;
}

function renderRecentInspections() {
    recentInspectionsBody.innerHTML = '';
    const sorted = [...state.inspections].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if(sorted.length === 0) {
        recentEmptyState.classList.remove('hidden');
        return;
    }
    recentEmptyState.classList.add('hidden');

    sorted.forEach(item => {
        const net = parseFloat(item.basePrice);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.date}</td>
            <td><strong>${item.client}</strong><br><small style="color:var(--text-muted);">${item.address}</small></td>
            <td>${item.type}</td>
            <td>${net.toFixed(2)} RON</td>
            <td><span class="badge status-${getStatusSlug(item.status)}">${item.status}</span></td>
        `;
        recentInspectionsBody.appendChild(tr);
    });
}

function renderInspectionsTable() {
    fullInspectionsBody.innerHTML = '';
    const query = searchInput.value.toLowerCase();
    const typeVal = filterType.value;
    const statusVal = filterStatus.value;

    const filtered = state.inspections.filter(item => {
        const matchesQuery = item.client.toLowerCase().includes(query) || item.address.toLowerCase().includes(query) || item.type.toLowerCase().includes(query);
        const matchesType = typeVal ? item.type === typeVal : true;
        const matchesStatus = statusVal ? item.status === statusVal : true;
        return matchesQuery && matchesType && matchesStatus;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));

    if(filtered.length === 0) {
        fullEmptyState.classList.remove('hidden');
        return;
    }
    fullEmptyState.classList.add('hidden');

    filtered.forEach(item => {
        const net = parseFloat(item.basePrice);
        const tva = net * TVA_RATE;
        const gross = net + tva;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.date}</td>
            <td><strong>${item.client}</strong></td>
            <td>${item.address}</td>
            <td>${item.type}</td>
            <td>${net.toFixed(2)} RON</td>
            <td>${tva.toFixed(2)} RON</td>
            <td><strong>${gross.toFixed(2)} RON</strong></td>
            <td><span class="badge status-${getStatusSlug(item.status)}">${item.status}</span></td>
            <td>
                <button class="icon-btn" onclick="editInspection('${item.id}')" title="Editează"><i class="fa-solid fa-pen"></i></button>
                <button class="icon-btn" onclick="deleteInspection('${item.id}')" title="Șterge"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        fullInspectionsBody.appendChild(tr);
    });
}

function getStatusSlug(status) {
    if(status === 'Finalizat') return 'finalizat';
    if(status === 'În Așteptare') return 'asteptare';
    return 'programat';
}

function updateCalculator() {
    const val = parseFloat(calcAmount.value) || 0;
    const tva = val * TVA_RATE;
    const total = val + tva;
    calcResultTva.textContent = `${tva.toFixed(2)} RON`;
    calcResultTotal.textContent = `${total.toFixed(2)} RON`;
}

function openAddModal() {
    modalTitle.textContent = 'Adaugă Lucrare Nouă';
    editInspectionId.value = '';
    inspectionForm.reset();
    formDate.value = new Date().toISOString().split('T')[0];
    inspectionModal.classList.remove('hidden');
}

window.editInspection = function(id) {
    const item = state.inspections.find(i => i.id === id);
    if(!item) return;

    modalTitle.textContent = 'Editează Lucrarea';
    editInspectionId.value = item.id;
    formDate.value = item.date;
    formClient.value = item.client;
    formAddress.value = item.address;
    formType.value = item.type;
    formBasePrice.value = item.basePrice;
    formStatus.value = item.status;
    formNotes.value = item.notes || '';

    inspectionModal.classList.remove('hidden');
}

function handleFormSubmit(e) {
    e.preventDefault();
    const id = editInspectionId.value;

    const newItem = {
        id: id ? id : Date.now().toString(),
        date: formDate.value,
        client: formClient.value,
        address: formAddress.value,
        type: formType.value,
        basePrice: parseFloat(formBasePrice.value),
        status: formStatus.value,
        notes: formNotes.value
    };

    if(id) {
        const index = state.inspections.findIndex(i => i.id === id);
        if(index !== -1) state.inspections[index] = newItem;
        showToast('Lucrarea a fost actualizată!');
    } else {
        state.inspections.push(newItem);
        showToast('Lucrarea a fost adăugată cu succes!');
    }

    saveAndRefresh();
    inspectionModal.classList.add('hidden');
}

window.deleteInspection = function(id) {
    if(confirm('Sigur doriți să ștergeți această înregistrare?')) {
        state.inspections = state.inspections.filter(i => i.id !== id);
        saveAndRefresh();
        showToast('Lucrarea a fost ștersă.');
    }
}

function saveAndRefresh() {
    localStorage.setItem('revizio_inspections', JSON.stringify(state.inspections));
    renderAll();
}

function exportDataJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `revizio_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Datele au fost exportate cu succes!');
}

function importDataJson(e) {
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const imported = JSON.parse(evt.target.result);
            if(imported.inspections && Array.isArray(imported.inspections)) {
                state.inspections = imported.inspections;
                if(imported.target) state.target = imported.target;
                if(imported.operator) state.operator = imported.operator;
                
                localStorage.setItem('revizio_inspections', JSON.stringify(state.inspections));
                localStorage.setItem('revizio_target', state.target);
                localStorage.setItem('revizio_operator', JSON.stringify(state.operator));

                renderAll();
                showToast('Datele au fost importate cu succes!');
            } else {
                alert('Fișierul JSON nu are structura validă.');
            }
        } catch(err) {
            alert('Eroare la citirea fișierului JSON.');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if(confirm('ATENȚIE: Această acțiune va șterge toate datele salvate local. Sigur doriți să continuați?')) {
        state.inspections = [];
        saveAndRefresh();
        showToast('Toate datele au fost șterse.');
    }
}

function showToast(message) {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
