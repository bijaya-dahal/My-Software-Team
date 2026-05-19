const assignmentBody = document.getElementById('assignmentBody');
const totalHoursElement = document.getElementById('totalHours');
const assignButton = document.getElementById('assignButton');
const resetButton = document.getElementById('resetButton');

let totalHours = 0;

function clearForm() {
    document.getElementById('trainerName').value = '';
    document.getElementById('classType').value = '';
    document.getElementById('sessionDate').value = '';
    document.getElementById('sessionHours').value = '';
    document.getElementById('notes').value = '';
}

function createAssignmentRow(data) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${data.trainerName}</td>
        <td>${data.classType}</td>
        <td>${data.sessionDate}</td>
        <td>${data.sessionHours}</td>
        <td>${data.notes}</td>
        <td><button class="delete-btn" type="button">Delete</button></td>
    `;

    row.querySelector('.delete-btn').addEventListener('click', () => {
        row.remove();
        totalHours -= Number(data.sessionHours);
        totalHoursElement.textContent = totalHours;
    });

    assignmentBody.appendChild(row);
}

assignButton.addEventListener('click', () => {
    const trainerName = document.getElementById('trainerName').value.trim();
    const classType = document.getElementById('classType').value;
    const sessionDate = document.getElementById('sessionDate').value;
    const sessionHours = document.getElementById('sessionHours').value;
    const notes = document.getElementById('notes').value.trim() || '—';

    if (!trainerName || !classType || !sessionDate || !sessionHours) {
        alert('Please complete all required fields.');
        return;
    }

    const data = { trainerName, classType, sessionDate, sessionHours, notes };
    createAssignmentRow(data);

    totalHours += Number(sessionHours);
    totalHoursElement.textContent = totalHours;

    clearForm();
});

resetButton.addEventListener('click', clearForm);