const hoursBody = document.getElementById('hoursBody');
const weeklyTotalElement = document.getElementById('weeklyTotal');
const monthlyTotalElement = document.getElementById('monthlyTotal');
const addHoursButton = document.getElementById('addHoursButton');
const clearButton = document.getElementById('clearButton');

let hoursData = JSON.parse(localStorage.getItem('hoursData')) || [];
let weeklyTotal = 0;
let monthlyTotal = 0;

function updateTotals() {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    weeklyTotal = hoursData
        .filter(entry => new Date(entry.date) >= weekStart)
        .reduce((sum, entry) => sum + parseFloat(entry.hours), 0);

    monthlyTotal = hoursData
        .filter(entry => new Date(entry.date) >= monthStart)
        .reduce((sum, entry) => sum + parseFloat(entry.hours), 0);

    weeklyTotalElement.textContent = weeklyTotal.toFixed(1);
    monthlyTotalElement.textContent = monthlyTotal.toFixed(1);
}

function renderHoursTable() {
    hoursBody.innerHTML = '';
    hoursData.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.trainer}</td>
            <td>${entry.class}</td>
            <td>${entry.date}</td>
            <td>${entry.hours}</td>
            <td>${entry.notes || '—'}</td>
            <td><button class="delete-btn" data-index="${index}">Delete</button></td>
        `;
        hoursBody.appendChild(row);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            hoursData.splice(index, 1);
            localStorage.setItem('hoursData', JSON.stringify(hoursData));
            renderHoursTable();
            updateTotals();
        });
    });
}

function clearForm() {
    document.getElementById('trainerSelect').value = '';
    document.getElementById('classSelect').value = '';
    document.getElementById('dateInput').value = '';
    document.getElementById('hoursInput').value = '';
    document.getElementById('notesInput').value = '';
}

addHoursButton.addEventListener('click', () => {
    const trainer = document.getElementById('trainerSelect').value;
    const classType = document.getElementById('classSelect').value;
    const date = document.getElementById('dateInput').value;
    const hours = document.getElementById('hoursInput').value;
    const notes = document.getElementById('notesInput').value.trim();

    if (!trainer || !classType || !date || !hours) {
        alert('Please fill in all required fields.');
        return;
    }

    const entry = { trainer, class: classType, date, hours: parseFloat(hours), notes };
    hoursData.push(entry);
    localStorage.setItem('hoursData', JSON.stringify(hoursData));

    renderHoursTable();
    updateTotals();
    clearForm();
});

clearButton.addEventListener('click', clearForm);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderHoursTable();
    updateTotals();
});