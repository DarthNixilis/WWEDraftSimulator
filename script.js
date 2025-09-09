document.addEventListener('DOMContentLoaded', () => {
    const superstarListContainer = document.getElementById('superstar-list');
    const budgetDisplay = document.getElementById('budget-display');
    const draftedListContainer = document.getElementById('drafted-list');
    const synergyListContainer = document.getElementById('synergy-list');
    const nameFilter = document.getElementById('name-filter');
    const classFilter = document.getElementById('class-filter');
    const genderFilter = document.getElementById('gender-filter');

    let budget = 4000000;
    let allSuperstars = [];
    let draftedRoster = [];

    // Fetch data from the JSON file
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
        superstarListContainer.innerHTML = ''; // Clear existing list
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

    // Event listener for drafting a superstar
    superstarListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('draft-button')) {
            const superstarName = e.target.dataset.name;
            const superstar = allSuperstars.find(s => s.name === superstarName);
            
            if (superstar && budget >= superstar.cost) {
                budget -= superstar.cost;
                draftedRoster.push(superstar);
                
                updateBudget();
                updateDraftedRoster();
                updateDraftButtons();
                checkSynergy();
            }
        }
    });

    function updateBudget() {
        budgetDisplay.textContent = `$${budget.toLocaleString()}`;
        if (budget < 0) {
            budgetDisplay.style.color = '#D32F2F'; // Red if over budget
        } else {
            budgetDisplay.style.color = '#4CAF50'; // Green if within budget
        }
    }

    function updateDraftButtons() {
        const buttons = document.querySelectorAll('.draft-button');
        buttons.forEach(button => {
            const superstarName = button.dataset.name;
            const superstar = allSuperstars.find(s => s.name === superstarName);
            const isDrafted = draftedRoster.some(s => s.name === superstarName);

            if (isDrafted || superstar.cost > budget) {
                button.disabled = true;
            } else {
                button.disabled = false;
            }
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

    // Filter functionality
    function applyFilters() {
        let filteredSuperstars = [...allSuperstars];

        // Name filter
        const nameQuery = nameFilter.value.toLowerCase();
        if (nameQuery) {
            filteredSuperstars = filteredSuperstars.filter(s => s.name.toLowerCase().includes(nameQuery));
        }

        // Class filter
        const classQuery = classFilter.value;
        if (classQuery !== 'all') {
            filteredSuperstars = filteredSuperstars.filter(s => s.class === classQuery);
        }

        // Gender filter
        const genderQuery = genderFilter.value;
        if (genderQuery !== 'all') {
            filteredSuperstars = filteredSuperstars.filter(s => s.gender === genderQuery);
        }

        displaySuperstars(filteredSuperstars);
    }

    nameFilter.addEventListener('keyup', applyFilters);
    classFilter.addEventListener('change', applyFilters);
    genderFilter.addEventListener('change', applyFilters);
});
