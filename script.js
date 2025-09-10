document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const superstarListContainer = document.getElementById('superstar-list');
    const budgetDisplay = document.getElementById('budget-display');
    const draftedListContainer = document.getElementById('drafted-list');
    const synergyListContainer = document.getElementById('synergy-bonus');
    const totalDraftedCount = document.getElementById('total-drafted-count');
    const dynamicFilterContainer = document.getElementById('dynamic-filter-container');
    const addFilterBtn = document.getElementById('add-filter-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const toggleExportBtn = document.getElementById('toggle-export-btn');
    const exportOptionsContainer = document.getElementById('export-options');
    const exportClipboardBtn = document.getElementById('export-clipboard-btn');
    const exportTxtBtn = document.getElementById('export-txt-btn');
    const exportMdBtn = document.getElementById('export-md-btn');
    const resetRosterBtn = document.getElementById('reset-roster-btn');
    const sortFilter = document.getElementById('sort-filter');
    const columnSwitcher = document.getElementById('column-switcher');

    // --- State Variables ---
    let budget = 4000000;
    let allSuperstars = [];
    let draftedRoster = [];
    const MAX_FILTERS = 3;
    const filterableProperties = { 'class': 'Class', 'role': 'Role', 'gender': 'Gender', 'team': 'Team' };
    const classes = ['Fighter', 'Bruiser', 'Cruiser', 'Giant', 'Specialist'];

    // --- Initial Setup ---
    fetch('roster.json')
        .then(response => response.json())
        .then(data => {
            allSuperstars = data.superstars;
            loadState();
            setupColumnSwitcher();
            resetFilters();
        });

    // --- Event Listeners ---
    superstarListContainer.addEventListener('click', handleDraftClick);
    draftedListContainer.addEventListener('click', handleRemoveClick);
    addFilterBtn.addEventListener('click', addFilterRow);
    resetFiltersBtn.addEventListener('click', resetFilters);
    resetRosterBtn.addEventListener('click', resetRoster);
    toggleExportBtn.addEventListener('click', () => exportOptionsContainer.classList.toggle('hidden'));
    exportClipboardBtn.addEventListener('click', () => generateExport('clipboard'));
    exportTxtBtn.addEventListener('click', () => generateExport('txt'));
    exportMdBtn.addEventListener('click', () => generateExport('md'));
    sortFilter.addEventListener('change', applyFiltersAndSort);
    dynamicFilterContainer.addEventListener('change', (event) => {
        if (event.target.classList.contains('filter-type')) populateValueSelect(event.target);
        applyFiltersAndSort();
    });
    columnSwitcher.addEventListener('click', handleColumnSwitch);

    // --- Column Switcher Logic ---
    function setupColumnSwitcher() {
        const savedCols = localStorage.getItem('wweDraftGridCols') || '2';
        setGridColumns(savedCols);
    }

    function handleColumnSwitch(e) {
        if (e.target.tagName === 'BUTTON') {
            const numCols = e.target.dataset.columns;
            setGridColumns(numCols);
            localStorage.setItem('wweDraftGridCols', numCols);
        }
    }

    function setGridColumns(numCols) {
        superstarListContainer.classList.remove('grid-cols-1', 'grid-cols-2', 'grid-cols-3');
        superstarListContainer.classList.add(`grid-cols-${numCols}`);
        const buttons = columnSwitcher.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.columns === numCols);
        });
    }

    // --- State Management (Save/Load) ---
    function saveState() {
        const state = { budget: budget, draftedRosterNames: draftedRoster.map(s => s.name) };
        localStorage.setItem('wweDraftState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('wweDraftState');
        if (savedState) {
            const state = JSON.parse(savedState);
            budget = state.budget;
            draftedRoster = state.draftedRosterNames.map(name => allSuperstars.find(s => s.name === name)).filter(Boolean);
        }
        updateAllDisplays();
    }

    // --- Core Interaction Functions ---
    function handleDraftClick(e) { if (e.target.classList.contains('draft-button')) { const sName = e.target.dataset.name; const s = allSuperstars.find(i => i.name === sName); if (s && budget >= s.cost) { budget -= s.cost; draftedRoster.push(s); updateAllDisplays(); } } }
    function handleRemoveClick(e) { if (e.target.classList.contains('remove-superstar-btn')) { const sName = e.target.dataset.name; const sIndex = draftedRoster.findIndex(s => s.name === sName); if (sIndex > -1) { const s = draftedRoster[sIndex]; budget += s.cost; draftedRoster.splice(sIndex, 1); updateAllDisplays(); applyFiltersAndSort(); } } }
    function resetRoster() { if (!confirm('Are you sure you want to reset your entire roster? This will clear your saved progress.')) return; budget = 4000000; draftedRoster = []; updateAllDisplays(); applyFiltersAndSort(); }

    // --- Display & Filtering ---
    function applyFiltersAndSort() { let p = [...allSuperstars]; const f = dynamicFilterContainer.querySelectorAll('.filter-row'); f.forEach(r => { const t = r.querySelector('.filter-type').value; const v = r.querySelector('.filter-value').value; if (t && v) p = p.filter(s => String(s[t]) === v); }); const sV = sortFilter.value; switch (sV) { case 'cost-desc': p.sort((a, b) => b.cost - a.cost); break; case 'cost-asc': p.sort((a, b) => a.cost - b.cost); break; case 'name-asc': p.sort((a, b) => a.name.localeCompare(b.name)); break; case 'name-desc': p.sort((a, b) => b.name.localeCompare(a.name)); break; case 'pop-desc': p.sort((a, b) => b.pop - a.pop); break; case 'sta-desc': p.sort((a, b) => b.sta - a.sta); break; } displaySuperstars(p); }
    function displaySuperstars(superstars) { superstarListContainer.innerHTML = ''; superstars.forEach(s => { const c = document.createElement('div'); c.className = `superstar-card ${s.role}`; c.innerHTML = `<img src="${s.image || ''}" alt="${s.name}" class="superstar-card-image" loading="lazy" onerror="this.style.display='none'"><div class="superstar-card-content"><h3>${s.name}</h3><div class="stats"><p><strong>Cost:</strong> $${s.cost.toLocaleString()}</p><p><strong>Class:</strong> ${s.class}</p><p><strong>POP:</strong> ${s.pop} | <strong>STA:</strong> ${s.sta}</p></div><button class="draft-button" data-name="${s.name}">Draft</button></div>`; superstarListContainer.appendChild(c); }); updateDraftButtons(); }
    function resetFilters() { dynamicFilterContainer.innerHTML = ''; addFilterRow(); updateAddFilterButtonState(); applyFiltersAndSort(); }
    function addFilterRow() { if (dynamicFilterContainer.children.length >= MAX_FILTERS) return; const f = document.createElement('div'); f.className = 'filter-row'; const t = document.createElement('select'); t.className = 'filter-type'; t.innerHTML = `<option value="">-- Filter by Property --</option>`; for (const p in filterableProperties) { t.innerHTML += `<option value="${p}">${filterableProperties[p]}</option>`; } const v = document.createElement('select'); v.className = 'filter-value'; v.disabled = true; f.appendChild(t); f.appendChild(v); dynamicFilterContainer.appendChild(f); updateAddFilterButtonState(); }
    function populateValueSelect(t) { const r = t.parentElement; const v = r.querySelector('.filter-value'); const s = t.value; v.innerHTML = ''; if (s) { const V = [...new Set(allSuperstars.map(i => i[s]).filter(Boolean))]; V.sort(); v.innerHTML = `<option value="">-- Select Value --</option>`; V.forEach(i => { v.innerHTML += `<option value="${i}">${i}</option>`; }); v.disabled = false; } else { v.disabled = true; } }
    function updateAddFilterButtonState() { addFilterBtn.disabled = dynamicFilterContainer.children.length >= MAX_FILTERS; }

    // --- UI Update Functions ---
    function updateAllDisplays() { updateBudget(); updateDraftedRoster(); updateDraftButtons(); updateBreakdownCounters(); checkSynergy(); saveState(); }
    function updateDraftedRoster() { draftedListContainer.innerHTML = ''; draftedRoster.forEach(s => { const l = document.createElement('li'); l.innerHTML = `<span>${s.name}</span><button class="remove-superstar-btn" data-name="${s.name}" title="Remove Superstar">×</button>`; draftedListContainer.appendChild(l); }); totalDraftedCount.textContent = draftedRoster.length; }
    function updateBudget() { budgetDisplay.textContent = `$${budget.toLocaleString()}`; budgetDisplay.style.color = budget < 0 ? '#D32F2F' : '#4CAF50'; }
    function updateDraftButtons() { const b = document.querySelectorAll('.draft-button'); b.forEach(B => { const n = B.dataset.name; const s = allSuperstars.find(i => i.name === n); const d = draftedRoster.some(i => i.name === n); B.disabled = d || s.cost > budget; }); }
    function updateBreakdownCounters() { const c = { male: { total: 0 }, female: { total: 0 } }; ['male', 'female'].forEach(g => { classes.forEach(cl => { c[g][cl] = { Face: 0, Heel: 0 }; }); }); draftedRoster.forEach(s => { const g = s.gender.toLowerCase(); const sC = s.class; const sR = s.role; c[g].total++; if (classes.includes(sC) && (sR === 'Face' || sR === 'Heel')) { c[g][sC][sR]++; } }); document.getElementById('male-total-count').textContent = c.male.total; document.getElementById('female-total-count').textContent = c.female.total; ['male', 'female'].forEach(g => { classes.forEach(cl => { const sC = cl.toLowerCase(); document.getElementById(`${g}-${sC}-face`).textContent = c[g][cl].Face; document.getElementById(`${g}-${sC}-heel`).textContent = c[g][cl].Heel; }); }); }
    function checkSynergy() { const s = document.getElementById('synergy-bonus'); s.innerHTML = ''; const t = {}; draftedRoster.forEach(i => { if (i.team) t[i.team] = (t[i.team] || 0) + 1; }); let h = false; for (const T in t) { if (t[T] > 1) { if (!h) { s.innerHTML = '<h3>Synergy Bonuses</h3><ul id="synergy-list"></ul>'; h = true; } const l = s.querySelector('#synergy-list'); const i = document.createElement('li'); i.textContent = `${T} (${t[T]} members)`; l.appendChild(i); } } }

    // --- Export Logic ---
    function generateExport(format) { const t = draftedRoster.reduce((s, c) => s + c.cost, 0); const c = findCompletedTeams(); const r = findPotentialRivalries(); let sm = '', md = ''; sm += `ROSTER SUMMARY\n====================\n`; sm += `Total Superstars: ${draftedRoster.length}\nTotal Cost: $${t.toLocaleString()}\nBudget Remaining: $${budget.toLocaleString()}\n\n`; sm += `DRAFTED SUPERSTARS:\n`; draftedRoster.forEach(s => { sm += `- ${s.name} (${s.role} ${s.class})\n`; }); if (c.length > 0) { sm += `\nCOMPLETED TEAMS:\n`; c.forEach(t => { sm += `- ${t}\n`; }); } sm += `\nPOTENTIAL RIVALRIES:\n`; if (r.ideal.length > 0) { sm += `Ideal Matchups (High Ceiling):\n`; r.ideal.forEach(i => { sm += `- ${i.s1.name} vs. ${i.s2.name} [${i.type}]\n`; }); } if (r.specialist.length > 0) { sm += `Specialist Matchups (High Floor):\n`; r.specialist.forEach(i => { sm += `- ${i.s1.name} vs. ${i.s2.name} [${i.type}]\n`; }); } if (r.ideal.length === 0 && r.specialist.length === 0) { sm += `- No ideal rivalries found.\n`; } md += `# Roster Summary\n\n| Stat | Value |\n|:---|:---|\n`; md += `| Total Superstars | ${draftedRoster.length} |\n| Total Cost | $${t.toLocaleString()} |\n| Budget Remaining | $${budget.toLocaleString()} |\n\n## Drafted Superstars\n`; draftedRoster.forEach(s => { md += `* **${s.name}** (${s.role} ${s.class})\n`; }); if (c.length > 0) { md += `\n## Completed Teams\n`; c.forEach(t => { md += `* ${t}\n`; }); } md += `\n## Potential Rivalries\n`; if (r.ideal.length > 0) { md += `### Ideal Matchups (High Ceiling)\n`; r.ideal.forEach(i => { md += `* **${i.s1.name}** vs. **${i.s2.name}** _(${i.type})_\n`; }); } if (r.specialist.length > 0) { md += `### Specialist Matchups (High Floor)\n`; r.specialist.forEach(i => { md += `* **${i.s1.name}** vs. **${i.s2.name}** _(${i.type})_\n`; }); } if (r.ideal.length === 0 && r.specialist.length === 0) { md += `*No ideal rivalries found.*\n`; } if (format === 'clipboard') { navigator.clipboard.writeText(sm).then(() => alert('Roster summary copied!')); } else if (format === 'txt') { downloadFile('roster.txt', sm); } else if (format === 'md') { downloadFile('roster.md', md); } }
    function findCompletedTeams() { const d = {}; draftedRoster.forEach(s => { if (s.team) { if (!d[s.team]) d[s.team] = []; d[s.team].push(s.name); } }); const c = []; for (const t in d) { const T = allSuperstars.filter(s => s.team === t).length; if (d[t].length === T && T > 1) c.push(t); } return c; }
    function findPotentialRivalries() { const r = { 'Fighter': 'Bruiser', 'Bruiser': 'Fighter', 'Cruiser': 'Giant', 'Giant': 'Cruiser' }; const p = { ideal: [], specialist: [] }; const f = draftedRoster.filter(s => s.role === 'Face'); const h = draftedRoster.filter(s => s.role === 'Heel'); for (const a of f) { for (const b of h) { if (a.gender !== b.gender) continue; if (r[a.class] === b.class) { p.ideal.push({ s1: a, s2: b, type: `${a.class} vs. ${b.class}` }); } else if (a.class === 'Specialist' && b.class !== 'Specialist') { p.specialist.push({ s1: a, s2: b, type: `Specialist vs. ${b.class}` }); } else if (b.class === 'Specialist' && a.class !== 'Specialist') { p.specialist.push({ s1: a, s2: b, type: `${a.class} vs. Specialist` }); } } } return p; }
    
    // This function was missing from the truncated file
    function downloadFile(filename, content) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
});

