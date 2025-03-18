function initTimeWheel() {
    const columns = document.querySelectorAll('.wheel-column');

    columns.forEach(column => {
        const container = document.createElement('div');
        container.className = 'wheel-items-container';
        while (column.firstChild) {
            container.appendChild(column.firstChild);
        }
        column.appendChild(container);

        let isDragging = false;
        let startY = 0;
        let startScroll = 0;
        let hasMoved = false;

        function handleStart(e) {
            isDragging = true;
            hasMoved = false;
            startY = e.type.includes('mouse') ? e.pageY : e.touches[0].pageY;
            startScroll = column.scrollTop;
            e.preventDefault();
        }

        function handleMove(e) {
            if (!isDragging) return;
            const currentY = e.type.includes('mouse') ? e.pageY : e.touches[0].pageY;
            const diff = (startY - currentY);
            if (Math.abs(diff) > 5) {
                hasMoved = true;
            }
            column.scrollTop = startScroll + diff;
            updateAdjacentItems(column);
            e.preventDefault();
        }

        function handleEnd(e) {
            if (!isDragging) return;
            isDragging = false;

            if (!hasMoved) {
                const item = e.target.closest('.wheel-item');
                if (item) {
                    const items = column.querySelectorAll('.wheel-item');
                    const itemHeight = 40;
                    const index = Array.from(items).indexOf(item);

                    column.scrollTo({
                        top: index * itemHeight,
                        behavior: 'smooth'
                    });

                    updateActiveItem(column, index);
                }
            } else {
                const itemHeight = 40;
                const targetScroll = Math.round(column.scrollTop / itemHeight) * itemHeight;

                column.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });

                setTimeout(() => {
                    const activeIndex = Math.round(targetScroll / itemHeight);
                    updateActiveItem(column, activeIndex);
                }, 100);
            }
        }

        function updateActiveItem(column, activeIndex) {
            const items = column.querySelectorAll('.wheel-item');
            items.forEach((item, index) => {
                item.classList.remove('active', 'adjacent');
                if (index === activeIndex) {
                    item.classList.add('active');
                } else if (Math.abs(index - activeIndex) === 1) {
                    item.classList.add('adjacent');
                }
            });
        }

        function updateAdjacentItems(column) {
            const itemHeight = 40;
            const currentIndex = Math.round(column.scrollTop / itemHeight);
            updateActiveItem(column, currentIndex);
        }

        column.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);

        column.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        column.addEventListener('touchend', handleEnd);

        column.addEventListener('scroll', () => {
            requestAnimationFrame(() => updateAdjacentItems(column));
        });
    });

    const hoursColumn = document.querySelector('.wheel-column.hours .wheel-items-container');
    const minutesColumn = document.querySelector('.wheel-column.minutes .wheel-items-container');

    for (let i = 0; i < 24; i++) {
        const div = document.createElement('div');
        div.className = 'wheel-item';
        div.textContent = i.toString().padStart(2, '0');
        div.dataset.value = i;
        if (i === 0) div.classList.add('active');
        hoursColumn.appendChild(div);
    }

    for (let i = 0; i < 60; i++) {
        const div = document.createElement('div');
        div.className = 'wheel-item';
        div.textContent = i.toString().padStart(2, '0');
        div.dataset.value = i;
        if (i === 0) div.classList.add('active');
        minutesColumn.appendChild(div);
    }
}

function getSelectedTime() {
    const hourElement = document.querySelector('.hours .wheel-item.active');
    const minuteElement = document.querySelector('.minutes .wheel-item.active');

    const hour = hourElement ? hourElement.dataset.value : '00';
    const minute = minuteElement ? minuteElement.dataset.value : '00';

    return { hour, minute };
}

function getCycleText(cycles) {
    if (cycles === 1) return "cykl snu";
    if (cycles >= 2 && cycles <= 4) return "cykle snu";
    return "cykli snu";
}

function showResults(resultsId) {
    const calculatorContainer = document.getElementById('calculatorContainer');
    const resultsContainer = document.getElementById(resultsId);

    // Pokazujemy nowy widok przed ukryciem starego
    resultsContainer.style.display = 'block';
    setTimeout(() => {
        calculatorContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function showCalculator() {
    const calculatorContainer = document.getElementById('calculatorContainer');
    const sleepResults = document.getElementById('sleepResults');
    const wakeResults = document.getElementById('wakeResults');

    // Pokazujemy kalkulator przed ukryciem wyników
    calculatorContainer.style.display = 'flex';
    setTimeout(() => {
        sleepResults.classList.add('hidden');
        wakeResults.classList.add('hidden');
        calculatorContainer.classList.remove('hidden');

        // Ukrywamy wyniki po zakończeniu animacji
        setTimeout(() => {
            sleepResults.style.display = 'none';
            wakeResults.style.display = 'none';
        }, 600);
    }, 100);
}

function calculateSleepTimes() {
    const { hour, minute } = getSelectedTime();
    const wakeTime = new Date();
    wakeTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

    document.querySelector('.target-hour').textContent =
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const sleepTimes = [];
    for (let i = 1; i <= 6; i++) {
        const sleepTime = new Date(wakeTime);
        sleepTime.setMinutes(sleepTime.getMinutes() - (i * 90) - 15);
        sleepTimes.unshift({
            time: sleepTime.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            cycles: i
        });
    }

    const sleepTimesDiv = document.getElementById('sleepTimes');
    sleepTimesDiv.innerHTML = sleepTimes
        .map(({ time, cycles }) => `
            <div class="time-card">
                <span class="time-hour">${time}</span>
                <span class="time-cycles">${cycles} ${getCycleText(cycles)}</span>
            </div>
        `)
        .join('');

    showResults('sleepResults');
}

function calculateWakeTimes() {
    const now = new Date();
    const wakeTimes = [];

    for (let i = 6; i >= 1; i--) {
        const wakeTime = new Date(now);
        wakeTime.setMinutes(wakeTime.getMinutes() + 15 + (i * 90));
        wakeTimes.push({
            time: wakeTime.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            cycles: i
        });
    }

    const wakeTimesDiv = document.getElementById('wakeTimes');
    wakeTimesDiv.innerHTML = wakeTimes
        .map(({ time, cycles }) => `
            <div class="time-card">
                <span class="time-hour">${time}</span>
                <span class="time-cycles">${cycles} ${getCycleText(cycles)}</span>
            </div>
        `)
        .join('');

    showResults('wakeResults');
}

document.addEventListener('DOMContentLoaded', initTimeWheel); 