class ScheduleApp {
    constructor() {
        this.currentUser = null;
        this.currentWeekStart = this.getStartOfWeek(new Date());
        this.scheduleData = JSON.parse(localStorage.getItem('georgeSchedule')) || {};
        this.userNames = {
            'parent1': 'Parent 1',
            'parent2': 'Parent 2',
            'helper1': 'Helper 1',
            'helper2': 'Helper 2'
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateWeekDisplay();
        this.loadScheduleData();
    }

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('prev-week').addEventListener('click', () => {
            this.changeWeek(-1);
        });

        document.getElementById('next-week').addEventListener('click', () => {
            this.changeWeek(1);
        });

        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        document.getElementById('delete-signup').addEventListener('click', () => {
            this.handleDeleteSignup();
        });
    }

    handleLogin() {
        const userSelect = document.getElementById('user-select');
        if (userSelect.value) {
            this.currentUser = userSelect.value;
            document.getElementById('current-user').textContent = this.userNames[this.currentUser];
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('calendar-section').classList.remove('hidden');
            document.getElementById('user-info').classList.remove('hidden');
        }
    }

    handleLogout() {
        this.currentUser = null;
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('calendar-section').classList.add('hidden');
        document.getElementById('user-info').classList.add('hidden');
        document.getElementById('user-select').value = '';
    }

    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    changeWeek(direction) {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + (direction * 7));
        this.updateWeekDisplay();
        this.loadScheduleData();
    }

    updateWeekDisplay() {
        const endOfWeek = new Date(this.currentWeekStart);
        endOfWeek.setDate(endOfWeek.getDate() + 4);

        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const startStr = this.currentWeekStart.toLocaleDateString('en-US', options);
        const endStr = endOfWeek.toLocaleDateString('en-US', options);

        document.getElementById('current-week').textContent = `${startStr} - ${endStr}`;
    }

    getWeekKey() {
        return this.currentWeekStart.toISOString().split('T')[0];
    }

    loadScheduleData() {
        const weekKey = this.getWeekKey();
        const weekData = this.scheduleData[weekKey] || {};

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const times = ['pickup', 'dropoff'];

        days.forEach(day => {
            times.forEach(time => {
                const slotId = `${day}-${time}`;
                const slotElement = document.getElementById(slotId);
                const signupData = weekData[`${day}_${time}`];

                if (signupData) {
                    this.displaySignup(slotElement, signupData, day, time);
                } else {
                    this.clearSignup(slotElement, day, time);
                }
            });
        });
    }

    displaySignup(element, signupData, day, time) {
        const userName = this.userNames[signupData.user];
        const timeStr = signupData.time;
        const notes = signupData.notes ? `<div class="notes">${signupData.notes}</div>` : '';

        element.innerHTML = `
            <div class="user-name">${userName}</div>
            <div class="time">${timeStr}</div>
            ${notes}
        `;
        element.className = 'signup-info has-signup';

        const button = element.parentElement.querySelector('.signup-btn');
        button.textContent = 'Edit';
        button.className = 'signup-btn edit-btn';
    }

    clearSignup(element, day, time) {
        element.innerHTML = '';
        element.className = 'signup-info';

        const button = element.parentElement.querySelector('.signup-btn');
        button.textContent = 'Sign Up';
        button.className = 'signup-btn';
    }

    saveScheduleData() {
        localStorage.setItem('georgeSchedule', JSON.stringify(this.scheduleData));
    }

    showSignupModal(day, time) {
        if (!this.currentUser) return;

        const modal = document.getElementById('signup-modal');
        const modalTitle = document.getElementById('modal-title');
        const timeInput = document.getElementById('signup-time');
        const notesInput = document.getElementById('signup-notes');
        const deleteBtn = document.getElementById('delete-signup');

        const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
        const timeCapitalized = time.charAt(0).toUpperCase() + time.slice(1);
        modalTitle.textContent = `${dayCapitalized} ${timeCapitalized}`;

        const weekKey = this.getWeekKey();
        const existingSignup = this.scheduleData[weekKey]?.[`${day}_${time}`];

        if (existingSignup) {
            timeInput.value = existingSignup.time;
            notesInput.value = existingSignup.notes || '';
            deleteBtn.classList.remove('hidden');
        } else {
            timeInput.value = '';
            notesInput.value = '';
            deleteBtn.classList.add('hidden');
        }

        modal.classList.remove('hidden');
        modal.dataset.day = day;
        modal.dataset.time = time;
    }

    closeSignupModal() {
        document.getElementById('signup-modal').classList.add('hidden');
    }

    handleSignup() {
        const modal = document.getElementById('signup-modal');
        const day = modal.dataset.day;
        const time = modal.dataset.time;
        const timeValue = document.getElementById('signup-time').value;
        const notes = document.getElementById('signup-notes').value;

        if (!timeValue) return;

        const weekKey = this.getWeekKey();
        if (!this.scheduleData[weekKey]) {
            this.scheduleData[weekKey] = {};
        }

        this.scheduleData[weekKey][`${day}_${time}`] = {
            user: this.currentUser,
            time: timeValue,
            notes: notes,
            timestamp: new Date().toISOString()
        };

        this.saveScheduleData();
        this.loadScheduleData();
        this.closeSignupModal();
    }

    handleDeleteSignup() {
        const modal = document.getElementById('signup-modal');
        const day = modal.dataset.day;
        const time = modal.dataset.time;

        const weekKey = this.getWeekKey();
        if (this.scheduleData[weekKey] && this.scheduleData[weekKey][`${day}_${time}`]) {
            delete this.scheduleData[weekKey][`${day}_${time}`];
            this.saveScheduleData();
            this.loadScheduleData();
        }

        this.closeSignupModal();
    }
}

function showSignupModal(day, time) {
    window.app.showSignupModal(day, time);
}

function closeSignupModal() {
    window.app.closeSignupModal();
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScheduleApp();
});