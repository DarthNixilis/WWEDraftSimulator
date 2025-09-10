document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const superstarListContainer = document.getElementById('superstar-list');
    const budgetDisplay = document.getElementById('budget-display');
    const draftedListContainer = document.getElementById('drafted-list');
    const synergyListContainer = document.getElementById('synergy-list');
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

    // --- State Variables ---
    let budget = 4000000;
    let allSuperstars = [];
    let draftedRoster = [];
    const MAX_FILTERS = 3;
    const filterableProperties = { 'class': 'Class', 'role': 'Role', 'gender': 'Gender', 'team': 'Team' };

    // --- Initial Setup ---
    fetch('roster.json')
        .then(response => response.json())
        .then(data => {
            allSuperstars = data.superstars;
            loadState(); // Load saved data first
            resetFilters(); // Then setup filters and display
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

    // --- State Management (Save/Load) ---
    function saveState() {
        const state = {
            budget: budget,
            draftedRosterNames: draftedRoster.map(s => s.name)
        };
        localStorage.setItem('wweDraftState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('wweDraftState');
        if (savedState) {
            const state = JSON.parse(savedState);
            budget = state.budget;
            draftedRoster = state.draftedRosterNames
                .map(name => allSuperstars.find(s => s.name === name))
                .filter(Boolean); // Filter out any nulls if a superstar was removed from JSON
        }
        updateAllDisplays();
    }

    // --- Core Interaction Functions ---
    function handleDraftClick(e) {
        if (e.target.classList.contains('draft-button')) {
            const superstarName = e.target.dataset.name;
            const superstar = allSuperstars.find(s => s.name === superstarName);
            if (superstar && budget >= superstar.cost) {
                budget -= superstar.cost;
                draftedRoster.push(superstar);
                updateAllDisplays();
            }
        }
    }

    function handleRemoveClick(e) {
        if (e.target.classList.contains('remove-superstar-btn')) {
            const superstarName = e.target.dataset.name;
            const superstarIndex = draftedRoster.findIndex(s => s.name === superstarName);
            if (superstarIndex > -1) {
                const superstar = draftedRoster[superstarIndex];
                budget += superstar.cost;
                draftedRoster.splice(superstarIndex, 1);
                updateAllDisplays();
                applyFiltersAndSort(); // Re-check draft button disabled states
            }
        }
    }

    function resetRoster() {
        if (!confirm('Are you sure you want to reset your entire roster? This will clear your saved progress.')) return;
        budget = 4000000;
        draftedRoster = [];
        updateAllDisplays();
        applyFiltersAndSort();
    }

    // --- Display & Filtering ---
    function applyFiltersAndSort() {
        let processedSuperstars = [...allSuperstars];
        const filterRows = dynamicFilterContainer.querySelectorAll('.filter-row');
        filterRows.forEach(row => {
            const type = row.querySelector('.filter-type').value;
            const value = row.querySelector('.filter-value').value;
            if (type && value) {
                processedSuperstars = processedSuperstars.filter(s => String(s[type]) === value);
            }
        });
        const sortValue = sortFilter.value;
        switch (sortValue) {
            case 'cost-desc': processedSuperstars.sort((a, b) => b.cost - a.cost); break;
            case 'cost-asc':  processedSuperstars.sort((a, b) => a.cost - b.cost); break;
            case 'name-asc':  processedSuperstars.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'name-desc': processedSuperstars.sort((a, b) => b.name.localeCompare(a.name)); break;
            case 'pop-desc':  processedSuperstars.sort((a, b) => b.pop - a.pop); break;
            case 'sta-desc':  processedSuperstars.sort((a, b) => b.sta - a.sta); break;
        }
        displaySuperstars(processedSuperstars);
    }

    function displaySuperstars(superstars) {
        superstarListContainer.innerHTML = '';
        superstars.forEach(superstar => {
            const card = document.createElement('div');
            card.className = `superstar-card ${superstar.role}`;
            card.innerHTML = `
                <img src="${superstar.image || ''}" alt="${superstar.name}" class="superstar-card-image" loading="lazy" onerror="this.style.display='none'">
                <div class="superstar-card-content">
                    <h3>${superstar.name}</h3>
                    <div class="stats">
                        <p><strong>Cost:</strong> $${superstar.cost.toLocaleString()}</p>
                        <p><strong>Class:</strong> ${superstar.class}</p>
                        <p><strong>POP:</strong> ${superstar.pop} | <strong>STA:</strong> ${superstar.sta}</p>
                    </div>
                    <button class="draft-button" data-name="${superstar.name}">Draft</button>
                </div>
            `;
            superstarListContainer.appendChild(card);
        });
        updateDraftButtons();
    }

    function resetFilters() {
        dynamicFilterContainer.innerHTML = '';
        addFilterRow();
        updateAddFilterButtonState();
        applyFiltersAndSort();
    }

    function addFilterRow() {
        if (dynamicFilterContainer.children.length >= MAX_FILTERS) return;
        const filterRow = document.createElement('div');
        filterRow.className = 'filter-row';
        const typeSelect = document.createElement('select');
        typeSelect.className = 'filter-type';
        typeSelect.innerHTML = `<option value="">-- Filter by Property --</option>`;
        for (const prop in filterableProperties) {
            typeSelect.innerHTML += `<option value="${prop}">${filterableProperties[prop]}</option>`;
        }
        const valueSelect = document.createElement('select');
        valueSelect.className = 'filter-value';
        valueSelect.disabled = true;
        filterRow.appendChild(typeSelect);
        filterRow.appendChild(valueSelect);
        dynamicFilterContainer.appendChild(filterRow);
        updateAddFilterButtonState();
    }

    function populateValueSelect(typeSelectElement) {
        const filterRow = typeSelectElement.parentElement;
        const valueSelect = filterRow.querySelector('.filter-value');
        const selectedType = typeSelectElement.value;
        valueSelect.innerHTML = '';
        if (selectedType) {
            const values = [...new Set(allSuperstars.map(s => s[selectedType]).filter(Boolean))];
            values.sort();
            valueSelect.innerHTML = `<option value="">-- Select Value --</option>`;
            values.forEach(val => {
                valueSelect.innerHTML += `<option value="${val}">${val}</option>`;
            });
            valueSelect.disabled = false;
        } else {
            valueSelect.disabled = true;
        }
    }

    function updateAddFilterButtonState() {
        addFilterBtn.disabled = dynamicFilterContainer.children.length >= MAX_FILTERS;
    }

    // --- UI Update Functions ---
    function updateAllDisplays() {
        updateBudget();
        updateDraftedRoster();
        updateDraftButtons();
        updateBreakdownCounters();
        checkSynergy();
        saveState();
    }

    function updateDraftedRoster() {
        draftedListContainer.innerHTML = '';
        draftedRoster.forEach(superstar => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${superstar.name}</span>
                <button class="remove-superstar-btn" data-name="${superstar.name}" title="Remove Superstar">×</button>
            `;
            draftedListContainer.appendChild(listItem);
        });
        totalDraftedCount.textContent = draftedRoster.length;
    }

    function updateBudget() {
        budgetDisplay.textContent = `$${budget.toLocaleString()}`;
        budgetDisplay.style.color = budget < 0 ? '#D32F2F' : '#4CAF50';
    }

    function updateDraftButtons() {
        const buttons = document.querySelectorAll('.draft-button');
        buttons.forEach(button => {
            const superstarName = button.dataset.name;
            const superstar = allSuperstars.find(s => s.name === superstarName);
            const isDrafted = draftedRoster.some(s => s.name === superstarName);
            button.disabled = isDrafted || superstar.cost > budget;
        });
    }

    function updateBreakdownCounters() {
        const breakdownContainer = document.getElementById('roster-breakdown');
        const counts = { male: { total: 0, Face: 0, Heel: 0, Fighter: 0, Bruiser: 0, Cruiser: 0, Giant: 0, Specialist: 0 }, female: { total: 0, Face: 0, Heel: 0, Fighter: 0, Bruiser: 0, Cruiser: 0, Giant: 0, Specialist: 0 } };
        draftedRoster.forEach(s => { const d = s.gender.toLowerCase(); counts[d].total++; counts[d][s.role]++; counts[d][s.class]++; });
        breakdownContainer.innerHTML = `
            <h3>Roster Breakdown</h3>
            <div class="division-tracker">
                <h4>Male Division (<span>${counts.male.total}</span>)</h4>
                <div class="breakdown-item"><span>Face</span><span>${counts.male.Face}</span></div>
                <div class="breakdown-item"><span>Heel</span><span>${counts.male.Heel}</span></div>
                <div class="breakdown-item sub-item"><span>Fighter</span><span>${counts.male.Fighter}</span></div>
                <div class="breakdown-item sub-item"><span>Bruiser</span><span>${counts.male.Bruiser}</span></div>
                <div class="breakdown-item sub-item"><span>Cruiser</span><span>${counts.male.Cruiser}</span></div>
                <div class="breakdown-item sub-item"><span>Giant</span><span>${counts.male.Giant}</span></div>
                <div class="breakdown-item sub-item"><span>Specialist</span><span>${counts.male.Specialist}</span></div>
            </div>
            <div class="division-tracker">
                <h4>Female Division (<span>${counts.female.total}</span>)</h4>
                <div class="breakdown-item"><span>Face</span><span>${counts.female.Face}</span></div>
                <div class="breakdown-item"><span>Heel</span><span>${counts.female.Heel}</span></div>
                <div class="breakdown-item sub-item"><span>Fighter</span><span>${counts.female.Fighter}</span></div>
                <div class="breakdown-item sub-item"><span>Bruiser</span><span>${counts.female.Bruiser}</span></div>
                <div class="breakdown-item sub-item"><span>Cruiser</span><span>${counts.female.Cruiser}</span></div>
                <div class="breakdown-item sub-item"><span>Giant</span><span>${counts.female.Giant}</span></div>
                <div class="breakdown-item sub-item"><span>Specialist</span><span>${counts.female.Specialist}</span></div>
            </div>
        `;
    }

    function checkSynergy() {
        const synergyBonusContainer = document.getElementById('synergy-bonus');
        synergyBonusContainer.innerHTML = '';
        const teamCounts = {};
        draftedRoster.forEach(superstar => { if (superstar.team) teamCounts[superstar.team] = (teamCounts[superstar.team] || 0) + 1; });
        let hasSynergy = false;
        for (const team in teamCounts) {
            if (teamCounts[team] > 1) {
                if (!hasSynergy) {
                    synergyBonusContainer.innerHTML = '<h3>Synergy Bonuses</h3><ul id="synergy-list"></ul>';
                    hasSynergy = true;
                }
                const list = synergyBonusContainer.querySelector('#synergy-list');
                const listItem = document.createElement('li');
                listItem.textContent = `${team} (${teamCounts[team]} members)`;
                list.appendChild(listItem);
            }
        }
    }

    // --- Export Logic ---
    function generateExport(format) {
        const totalCost = draftedRoster.reduce((sum, s) => sum + s.cost, 0);
        const completedTeams = findCompletedTeams();
        const rivalries = findPotentialRivalries();
        let summary = '', mdSummary = '';
        summary += `ROSTER SUMMARY\n====================\n`;
        summary += `Total Superstars: ${draftedRoster.length}\nTotal Cost: $${totalCost.toLocaleString()}\nBudget Remaining: $${budget.toLocaleString()}\n\n`;
        summary += `DRAFTED SUPERSTARS:\n`;
        draftedRoster.forEach(s => { summary += `- ${s.name} (${s.role} ${s.class})\n`; });
        if (completedTeams.length > 0) { summary += `\nCOMPLETED TEAMS:\n`; completedTeams.forEach(team => { summary += `- ${team}\n`; }); }
        summary += `\nPOTENTIAL RIVALRIES:\n`;
        if (rivalries.ideal.length > 0) { summary += `Ideal Matchups (High Ceiling):\n`; rivalries.ideal.forEach(r => { summary += `- ${r.superstar1.name} vs. ${r.superstar2.name} [${r.type}]\n`; }); }
        if (rivalries.specialist.length > 0) { summary += `Specialist Matchups (High Floor):\n`; rivalries.specialist.forEach(r => { summary += `- ${r.superstar1.name} vs. ${r.superstar2.name} [${r.type}]\n`; }); }
        if (rivalries.ideal.length === 0 && rivalries.specialist.length === 0) { summary += `- No ideal rivalries found.\n`; }
        mdSummary += `# Roster Summary\n\n| Stat | Value |\n|:---|:---|\n`;
        mdSummary += `| Total Superstars | ${draftedRoster.length} |\n| Total Cost | $${totalCost.toLocaleString()} |\n| Budget Remaining | $${budget.toLocaleString()} |\n\n## Drafted Superstars\n`;
        draftedRoster.forEach(s => { mdSummary += `* **${s.name}** (${s.role} ${s.class})\n`; });
        if (completedTeams.length > 0) { mdSummary += `\n## Completed Teams\n`; completedTeams.forEach(team => { mdSummary += `* ${team}\n`; }); }
        mdSummary += `\n## Potential Rivalries\n`;
        if (rivalries.ideal.length > 0) { mdSummary += `### Ideal Matchups (High Ceiling)\n`; rivalries.ideal.forEach(r => { mdSummary += `* **${r.superstar1.name}** vs. **${r.superstar2.name}** _(${r.type})_\n`; }); }
        if (rivalries.specialist.length > 0) { mdSummary += `### Specialist Matchups (High Floor)\n`; rivalries.specialist.forEach(r => { mdSummary += `* **${r.superstar1.name}** vs. **${r.superstar2.name}** _(${r.type})_\n`; }); }
        if (rivalries.ideal.length === 0 && rivalries.specialist.length === 0) { mdSummary += `*No ideal rivalries found.*\n`; }
        if (format === 'clipboard') { navigator.clipboard.writeText(summary).then(() => alert('Roster summary copied to clipboard!')); }
        else if (format === 'txt') { downloadFile('roster.txt', summary); }
        else if (format === 'md') { downloadFile('roster.md', mdSummary); }
    }

    function findCompletedTeams() {
        const draftedTeams = {};
        draftedRoster.forEach(s => { if (s.team) { if (!draftedTeams[s.team]) draftedTeams[s.team] = []; draftedTeams[s.team].push(s.name); } });
        const completed = [];
        for (const teamName in draftedTeams) {
            const totalInTeam = allSuperstars.filter(s => s.team === teamName).length;
            if (draftedTeams[teamName].length === totalInTeam && totalInTeam > 1) completed.push(teamName);
        }
        return completed;
    }

    function findPotentialRivalries() {
        const rules = { 'Fighter': 'Bruiser', 'Bruiser': 'Fighter', 'Cruiser': 'Giant', 'Giant': 'Cruiser' };
        const rivalries = { ideal: [], specialist: [] };
        const faces = draftedRoster.filter(s => s.role === 'Face');
        const heels = draftedRoster.filter(s => s.role === 'Heel');
        for (const face of faces) {
            for (const heel of heels) {
                if (face.gender !== heel.gender) continue;
                if (rules[face.class] === heel.class) {
                    rivalries.ideal.push({ superstar1: face, superstar2: heel, type: `${face.class} vs. ${heel.class}` });
                } else if (face.class === 'Specialist' && heel.class !== 'Specialist') {
                    rivalries.specialist.push({ superstar1: face, superstar2: heel, type: `Specialist vs. ${heel.class}` });
                } else if (heel.class === 'Specialist' && face.class !== 'Specialist') {
                    rivalries.specialist.push({ superstar1: face, superstar2: heel, type: `${face.class} vs. Specialist` });
                }
            }
        }
        return rivalries;
    }

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

