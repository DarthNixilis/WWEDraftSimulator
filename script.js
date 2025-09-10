document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const superstarListContainer = document.getElementById('superstar-list');
    const budgetDisplay = document.getElementById('budget-display');
    const draftedListContainer = document.getElementById('drafted-list');
    const synergyListContainer = document.getElementById('synergy-list');
    const nameFilter = document.getElementById('name-filter');
    const genderFilter = document.getElementById('gender-filter');
    const sortFilter = document.getElementById('sort-filter'); // New sort dropdown
    const totalDraftedCount = document.getElementById('total-drafted-count');

    // --- State Variables ---
    let budget = 4000000;
    let allSuperstars = [];
    let draftedRoster = [];

    // --- Fetch initial data ---
    fetch('roster.json')
        .then(response => response.json())
        .then(data => {
            allSuperstars = data.superstars;
            applyFiltersAndSort(); // Initial display
        });

    // --- Event Listeners ---
    superstarListContainer.addEventListener('click', handleDraftClick);
    nameFilter.addEventListener('keyup', applyFiltersAndSort);
    genderFilter.addEventListener('change', applyFiltersAndSort);
    sortFilter.addEventListener('change', applyFiltersAndSort);

    // --- Core Functions ---

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

    function applyFiltersAndSort() {
        let processedSuperstars = [...allSuperstars];

        // 1. Filtering
        const nameQuery = nameFilter.value.toLowerCase();
        const genderQuery = genderFilter.value;

        if (nameQuery) {
            processedSuperstars = processedSuperstars.filter(s => s.name.toLowerCase().includes(nameQuery));
        }
        if (genderQuery !== 'all') {
            processedSuperstars = processedSuperstars.filter(s => s.gender === genderQuery);
        }

        // 2. Sorting
        const sortValue = sortFilter.value;
        switch (sortValue) {
            case 'cost-desc': processedSuperstars.sort((a, b) => b.cost - a.cost); break;
            case 'cost-asc':  processedSuperstars.sort((a, b) => a.cost - b.cost); break;
            case 'name-asc':  processedSuperstars.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'name-desc': processedSuperstars.sort((a, b) => b.name.localeCompare(a.name)); break;
            case 'pop-desc':  processedSuperstars.sort((a, b) => b.pop - a.pop); break;
            case 'sta-desc':  processedSuperstars.sort((a, b) => b.sta - a.sta); break;
        }
        
        // 3. Display
        displaySuperstars(processedSuperstars);
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
            const division = s.gender.toLowerCase(); // 'male' or 'female'
            counts[division].total++;
            counts[division][s.role]++;
            counts[division][s.class]++;
        });

        // Update Male Division trackers
        document.getElementById('male-count').textContent = counts.male.total;
        document.getElementById('male-face-count').textContent = counts.male.Face;
        document.getElementById('male-heel-count').textContent = counts.male.Heel;
        document.getElementById('male-fighter-count').textContent = counts.male.Fighter;
        document.getElementById('male-bruiser-count').textContent = counts.male.Bruiser;
        document.getElementById('male-cruiser-count').textContent = counts.male.Cruiser;
        document.getElementById('male-giant-count').textContent = counts.male.Giant;
        document.getElementById('male-specialist-count').textContent = counts.male.Specialist;

        // Update Female Division trackers
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

