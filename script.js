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

    // --- State Variables ---
    let budget = 4000000;
    let allSuperstars = [];
    let draftedRoster = [];
    const MAX_FILTERS = 3;

    const filterableProperties = {
        'class': 'Class',
        'role': 'Role',
        'gender': 'Gender',
        'team': 'Team'
    };

    // --- Fetch initial data ---
    fetch('roster.json')
        .then(response => response.json())
        .then(data => {
            allSuperstars = data.superstars;
            resetFilters(); // Start with a clean slate and one filter row
        });

    // --- Event Listeners ---
    superstarListContainer.addEventListener('click', handleDraftClick);
    addFilterBtn.addEventListener('click', addFilterRow);
    resetFiltersBtn.addEventListener('click', resetFilters);
    dynamicFilterContainer.addEventListener('change', (event) => {
        const target = event.target;
        if (target.classList.contains('filter-type')) {
            populateValueSelect(target);
        }
        applyFilters();
    });

    // --- Core Functions ---

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

    function resetFilters() {
        dynamicFilterContainer.innerHTML = '';
        addFilterRow();
        updateAddFilterButtonState();
        applyFilters();
    }

    function updateAddFilterButtonState() {
        addFilterBtn.disabled = dynamicFilterContainer.children.length >= MAX_FILTERS;
    }

    function applyFilters() {
        let filteredSuperstars = [...allSuperstars];
        const filterRows = dynamicFilterContainer.querySelectorAll('.filter-row');

        filterRows.forEach(row => {
            const type = row.querySelector('.filter-type').value;
            const value = row.querySelector('.filter-value').value;
            if (type && value) {
                filteredSuperstars = filteredSuperstars.filter(s => String(s[type]) === value);
            }
        });

        displaySuperstars(filteredSuperstars);
    }

    function displaySuperstars(superstars) {
        superstarListContainer.innerHTML = '';
        superstars.forEach(superstar => {
            const card = document.createElement('div');
            card.className = `superstar-card ${superstar.role}`;
            card.innerHTML = `
                <h3>${superstar.name}</h3>
                <div class="stats">
                    <p><strong>Cost:</strong> $${superstar.cost.toLocaleString()}</p>
                    <p><strong>Class:</strong> ${superstar.class}</p>
                    <p><strong>Gender:</strong> ${superstar.gender}</p>
                    <p><strong>STA:</strong> ${superstar.sta} | <strong>POP:</strong> ${superstar.pop}</p>
                    ${superstar.team ? `<p><strong>Team:</strong> ${superstar.team}</p>` : ''}
                </div>
                <button class="draft-button" data-name="${superstar.name}">Draft</button>
            `;
            superstarListContainer.appendChild(card);
        });
        updateDraftButtons();
    }

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

    function updateAllDisplays() {
        updateBudget();
        updateDraftedRoster();
        updateDraftButtons();
        updateBreakdownCounters();
        checkSynergy();
    }

    function updateDraftedRoster() {
        draftedListContainer.innerHTML = '';
        draftedRoster.forEach(superstar => {
            const listItem = document.createElement('li');
            listItem.textContent = `${superstar.name} - $${superstar.cost.toLocaleString()}`;
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
        const counts = {
            male: { total: 0, Face: 0, Heel: 0, Fighter: 0, Bruiser: 0, Cruiser: 0, Giant: 0, Specialist: 0 },
            female: { total: 0, Face: 0, Heel: 0, Fighter: 0, Bruiser: 0, Cruiser: 0, Giant: 0, Specialist: 0 }
        };
        draftedRoster.forEach(s => {
            const division = s.gender.toLowerCase();
            counts[division].total++;
            counts[division][s.role]++;
            counts[division][s.class]++;
        });
        document.getElementById('male-count').textContent = counts.male.total;
        document.getElementById('male-face-count').textContent = counts.male.Face;
        document.getElementById('male-heel-count').textContent = counts.male.Heel;
        document.getElementById('male-fighter-count').textContent = counts.male.Fighter;
        document.getElementById('male-bruiser-count').textContent = counts.male.Bruiser;
        document.getElementById('male-cruiser-count').textContent = counts.male.Cruiser;
        document.getElementById('male-giant-count').textContent = counts.male.Giant;
        document.getElementById('male-specialist-count').textContent = counts.male.Specialist;
        document.getElementById('female-count').textContent = counts.female.total;
        document.getElementById('female-face-count').textContent = counts.female.Face;
        document.getElementById('female-heel-count').textContent = counts.female.Heel;
        document.getElementById('female-fighter-count').textContent = counts.female.Fighter;
        document.getElementById('female-bruiser-count').textContent = counts.female.Bruiser;
        document.getElementById('female-cruiser-count').textContent = counts.female.Cruiser;
        document.getElementById('female-giant-count').textContent = counts.female.Giant;
        document.getElementById('female-specialist-count').textContent = counts.female.Specialist;
    }

    function checkSynergy() {
        synergyListContainer.innerHTML = '';
        const teamCounts = {};
        draftedRoster.forEach(superstar => {
            if (superstar.team) {
                teamCounts[superstar.team] = (teamCounts[superstar.team] || 0) + 1;
            }
        });
        for (const team in teamCounts) {
            if (teamCounts[team] > 1) {
                const listItem = document.createElement('li');
                listItem.textContent = `Synergy Bonus: ${team} (${teamCounts[team]} members)`;
                synergyListContainer.appendChild(listItem);
            }
        }
    }
});

