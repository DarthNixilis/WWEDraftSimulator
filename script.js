document.addEventListener('DOMContentLoaded', () => {
    // --- Existing element selectors ---
    const superstarListContainer = document.getElementById('superstar-list');
    const budgetDisplay = document.getElementById('budget-display');
    const draftedListContainer = document.getElementById('drafted-list');
    const synergyListContainer = document.getElementById('synergy-list');
    const nameFilter = document.getElementById('name-filter');
    const classFilter = document.getElementById('class-filter');
    const genderFilter = document.getElementById('gender-filter');

    // --- New element selectors for the counters ---
    const maleCount = document.getElementById('male-count');
    const femaleCount = document.getElementById('female-count');
    const faceCount = document.getElementById('face-count');
    const heelCount = document.getElementById('heel-count');
    const fighterCount = document.getElementById('fighter-count');
    const bruiserCount = document.getElementById('bruiser-count');
    const cruiserCount = document.getElementById('cruiser-count');
    const giantCount = document.getElementById('giant-count');
    const specialistCount = document.getElementById('specialist-count');

    let budget = 4000000;
    let allSuperstars = [];
    let draftedRoster = [];

    fetch('roster.json')
        .then(response => response.json())
        .then(data => {
            allSuperstars = data.superstars;
            populateClassFilter(allSuperstars);
            displaySuperstars(allSuperstars);
        });

    function populateClassFilter(superstars) {
        const classes = [...new Set(superstars.map(s => s.class))];
        classes.sort().forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classFilter.appendChild(option);
        });
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

    superstarListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('draft-button')) {
            const superstarName = e.target.dataset.name;
            const superstar = allSuperstars.find(s => s.name === superstarName);
            
            if (superstar && budget >= superstar.cost) {
                budget -= superstar.cost;
                draftedRoster.push(superstar);
                
                updateAllDisplays();
            }
        }
    });

    // --- New function to update all displays at once ---
    function updateAllDisplays() {
        updateBudget();
        updateDraftedRoster();
        updateDraftButtons();
        updateBreakdownCounters(); // This is new
        checkSynergy();
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

    function updateDraftedRoster() {
        draftedListContainer.innerHTML = '';
        draftedRoster.forEach(superstar => {
            const listItem = document.createElement('li');
            listItem.textContent = `${superstar.name} - $${superstar.cost.toLocaleString()}`;
            draftedListContainer.appendChild(listItem);
        });
    }

    // --- New function to calculate and display the breakdown ---
    function updateBreakdownCounters() {
        const counts = {
            Male: 0, Female: 0,
            Face: 0, Heel: 0,
            Fighter: 0, Bruiser: 0, Cruiser: 0, Giant: 0, Specialist: 0
        };

        draftedRoster.forEach(s => {
            counts[s.gender]++;
            counts[s.role]++;
            counts[s.class]++;
        });

        maleCount.textContent = counts.Male;
        femaleCount.textContent = counts.Female;
        faceCount.textContent = counts.Face;
        heelCount.textContent = counts.Heel;
        fighterCount.textContent = counts.Fighter;
        bruiserCount.textContent = counts.Bruiser;
        cruiserCount.textContent = counts.Cruiser;
        giantCount.textContent = counts.Giant;
        specialistCount.textContent = counts.Specialist;
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

    function applyFilters() {
        let filteredSuperstars = [...allSuperstars];
        const nameQuery = nameFilter.value.toLowerCase();
        const classQuery = classFilter.value;
        const genderQuery = genderFilter.value;

        if (nameQuery) {
            filteredSuperstars = filteredSuperstars.filter(s => s.name.toLowerCase().includes(nameQuery));
        }
        if (classQuery !== 'all') {
            filteredSuperstars = filteredSuperstars.filter(s => s.class === classQuery);
        }
        if (genderQuery !== 'all') {
            filteredSuperstars = filteredSuperstars.filter(s => s.gender === genderQuery);
        }
        displaySuperstars(filteredSuperstars);
    }

    nameFilter.addEventListener('keyup', applyFilters);
    classFilter.addEventListener('change', applyFilters);
    genderFilter.addEventListener('change', applyFilters);
});

