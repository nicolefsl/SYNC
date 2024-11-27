document.addEventListener("DOMContentLoaded", function() {
    const habitForm = document.getElementById('habit-form');
    const habitInput = document.getElementById('habit-input');
    const categoryInput = document.getElementById('category-input');
    const habitList = document.getElementById('habit-list');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const editModal = document.getElementById('edit-modal');
    const closeButton = document.querySelector('.close-button');
    const editForm = document.getElementById('edit-form');
    const editInput = document.getElementById('edit-input');
    const editCategoryInput = document.getElementById('edit-category-input');
    const filterCategory = document.getElementById('filter-category');
    const monthInput = document.getElementById('month-input');
    const calendar = document.getElementById('calendar');
    const toDoItems = document.getElementById('to-do-items');
    const inProgressItems = document.getElementById('in-progress-items');
    const doneItems = document.getElementById('done-items');

    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let habitToEdit = null; // Armazena o hábito que está sendo editado
    let selectedMonth = new Date().toISOString().slice(0,7); // Formato YYYY-MM

    // Solicitar permissão para notificações
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }

    // Event Listeners
    habitForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const habitText = habitInput.value.trim();
        const habitCategory = categoryInput.value;
        if (habitText !== "" && habitCategory !== "") {
            addHabit(habitText, habitCategory);
            habitInput.value = "";
            categoryInput.value = "";
        }
    });

    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newText = editInput.value.trim();
        const newCategory = editCategoryInput.value;
        if (newText !== "" && newCategory !== "" && habitToEdit !== null) {
            updateHabit(habitToEdit.id, newText, newCategory);
            closeModal();
        }
    });

    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', function(event) {
        if (event.target == editModal) {
            closeModal();
        }
    });

    filterCategory.addEventListener('change', renderHabits);

    monthInput.addEventListener('change', function() {
        selectedMonth = this.value;
        renderCalendar();
        renderHabits();
        updateProgress();
    });

    // Funções Principais
    function addHabit(text, category) {
        const habit = {
            id: Date.now(),
            text: text,
            category: category,
            status: 'A Fazer', // Status inicial
            history: {} // Para armazenar status por dia
        };
        
        habits.push(habit);
        saveHabits();
        renderHabits();
        renderCalendar();
        updateProgress();
        scheduleNotification(habit);
    }

    function removeHabit(id) {
        habits = habits.filter(habit => habit.id !== id);
        saveHabits();
        renderHabits();
        renderCalendar();
        updateProgress();
    }

    function toggleHabitStatus(habitId, day) {
        habits = habits.map(habit => {
            if (habit.id === habitId) {
                const currentStatus = habit.history[day] || false;
                habit.history[day] = !currentStatus;
            }
            return habit;
        });
        saveHabits();
        renderHabits();
        renderCalendar();
        updateProgress();
    }

    function updateHabit(id, newText, newCategory) {
        habits = habits.map(habit => {
            if (habit.id === id) {
                return { ...habit, text: newText, category: newCategory };
            }
            return habit;
        });
        saveHabits();
        renderHabits();
    }

    function openModal(habit) {
        habitToEdit = habit;
        editInput.value = habit.text;
        editCategoryInput.value = habit.category;
        editModal.style.display = 'block';
    }

    function closeModal() {
        habitToEdit = null;
        editInput.value = "";
        editCategoryInput.value = "";
        editModal.style.display = 'none';
    }

    function renderHabits() {
        habitList.innerHTML = "";
        toDoItems.innerHTML = "";
        inProgressItems.innerHTML = "";
        doneItems.innerHTML = "";

        const selectedCategory = filterCategory.value;
        const filteredHabits = selectedCategory === "Todas" ? habits : habits.filter(habit => habit.category === selectedCategory);
        
        filteredHabits.forEach(habit => {
            const habitItem = document.createElement('div');
            habitItem.classList.add('habit-item');

            const leftSection = document.createElement('div');
            leftSection.classList.add('left-section');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isAllDaysCompleted(habit);
            checkbox.addEventListener('change', () => toggleHabitStatusForAllDays(habit.id, checkbox.checked));

            const habitText = document.createElement('span');
            habitText.classList.add('habit-text');
            habitText.textContent = habit.text;

            const habitCategory = document.createElement('span');
            habitCategory.classList.add('habit-category');
            habitCategory.textContent = `${habit.category}`;

            leftSection.appendChild(checkbox);
            leftSection.appendChild(habitText);
            leftSection.appendChild(habitCategory);

            const rightSection = document.createElement('div');

            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-button');
            editBtn.innerHTML = '&#9998;'; // Ícone de lápis
            editBtn.title = 'Editar hábito';
            editBtn.addEventListener('click', () => openModal(habit));

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Remover hábito';
            deleteBtn.addEventListener('click', () => removeHabit(habit.id));

            rightSection.appendChild(editBtn);
            rightSection.appendChild(deleteBtn);

            habitItem.appendChild(leftSection);
            habitItem.appendChild(rightSection);

            // Adicionar ao Quadro Kanban com base no status
            if (habit.status === 'A Fazer') {
                toDoItems.appendChild(habitItem);
            } else if (habit.status === 'Em Progresso') {
                inProgressItems.appendChild(habitItem);
            } else if (habit.status === 'Concluído') {
                doneItems.appendChild(habitItem);
            }
        });
    }

    function isAllDaysCompleted(habit) {
        // Verifica se todas as 30 dias estão marcados como concluídos
        const days = getDaysInMonth(selectedMonth);
        for (let i = 1; i <= days; i++) {
            if (!habit.history[i]) {
                return false;
            }
        }
        return true;
    }

    function toggleHabitStatusForAllDays(habitId, status) {
        habits = habits.map(habit => {
            if (habit.id === habitId) {
                const days = getDaysInMonth(selectedMonth);
                for (let i = 1; i <= days; i++) {
                    habit.history[i] = status;
                }
            }
            return habit;
        });
        saveHabits();
        renderHabits();
        renderCalendar();
        updateProgress();
    }

    function renderCalendar() {
        calendar.innerHTML = "";
        const [year, month] = selectedMonth.split('-').map(Number);
        const days = getDaysInMonth(selectedMonth);
        
        for (let day = 1; day <= days; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day');

            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = day;

            const habitStatusDiv = document.createElement('div');
            habitStatusDiv.classList.add('habit-status');

            habits.forEach(habit => {
                const habitLabel = document.createElement('label');
                habitLabel.textContent = habit.text;

                const habitCheckbox = document.createElement('input');
                habitCheckbox.type = 'checkbox';
                habitCheckbox.checked = habit.history[day] || false;
                habitCheckbox.addEventListener('change', () => toggleHabitStatus(habit.id, day));

                habitLabel.prepend(habitCheckbox);
                habitStatusDiv.appendChild(habitLabel);
            });

            dayDiv.appendChild(dayNumber);
            dayDiv.appendChild(habitStatusDiv);
            calendar.appendChild(dayDiv);
        }
    }

    function getDaysInMonth(monthString) {
        const [year, month] = monthString.split('-').map(Number);
        return new Date(year, month, 0).getDate();
    }

    function updateProgress() {
        const totalHabits = habits.length;
        if (totalHabits === 0) {
            progressBar.style.width = '0%';
            progressText.textContent = 'Progresso: 0%';
            return;
        }

        let totalCompleted = 0;
        habits.forEach(habit => {
            const days = getDaysInMonth(selectedMonth);
            let completedDays = 0;
            for (let i = 1; i <= days; i++) {
                if (habit.history[i]) completedDays++;
            }
            totalCompleted += completedDays;
        });

        const totalPossible = totalHabits * getDaysInMonth(selectedMonth);
        const progress = Math.round((totalCompleted / totalPossible) * 100);

        progressBar.style.width = progress + '%';

        // Adicionar classe para mudar a cor conforme o progresso
        if (progress >= 80) {
            progressBar.classList.add('animated');
        } else {
            progressBar.classList.remove('animated');
        }

        progressText.textContent = `Progresso: ${progress}%`;
    }

    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
    }

    function scheduleNotification(habit) {
        if ("Notification" in window && Notification.permission === "granted") {
            const now = new Date();
            const notificationTime = new Date();
            notificationTime.setHours(8, 0, 0, 0); // 8 AM

            // Se já passou das 8 AM, agendar para o próximo dia
            if (now > notificationTime) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }

            const timeUntilNotification = notificationTime - now;

            setTimeout(() => {
                new Notification("Lembrete de Hábito", {
                    body: `Não esqueça de completar o hábito: ${habit.text}`,
                    icon: "https://cdn-icons-png.flaticon.com/512/2922/2922506.png" // Ícone opcional
                });
            
                // Agendar a próxima notificação para 24 horas depois
                setInterval(() => {
                    new Notification("Lembrete de Hábito", {
                        body: `Não esqueça de completar o hábito: ${habit.text}`,
                        icon: "https://cdn-icons-png.flaticon.com/512/2922/2922506.png" // Ícone opcional
                    });
                }, 24 * 60 * 60 * 1000); // 24 horas
            }, timeUntilNotification);
            
        }
    }

    // Inicializar a seleção do mês para o mês atual
    monthInput.value = selectedMonth;
    renderCalendar();
    renderHabits();
    updateProgress();

    // Agendar notificações para hábitos existentes
    habits.forEach(habit => {
        scheduleNotification(habit);
    });

    // Drag and Drop para Quadro Kanban
    const kanbanItems = column.querySelector('.kanban-items');
if (kanbanItems) {
    column.addEventListener('dragover', function(e) {
        e.preventDefault();
        kanbanItems.classList.add('drag-over');
    });

    column.addEventListener('dragleave', function(e) {
        kanbanItems.classList.remove('drag-over');
    });

    column.addEventListener('drop', function(e) {
        e.preventDefault();
        kanbanItems.classList.remove('drag-over');
        const habitId = e.dataTransfer.getData('text/plain');
        const habit = habits.find(h => h.id == habitId);
        if (habit) {
            const newStatus = column.id === 'to-do' ? 'A Fazer' :
                              column.id === 'in-progress' ? 'Em Progresso' : 'Concluído';
            habit.status = newStatus;
            saveHabits();
            renderHabits();
            updateProgress();
        }
    });
}


    // Permitir arrastar cartões
    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('habit-item')) {
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            e.target.classList.add('dragging');
        }
    });

    document.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('habit-item')) {
            e.target.classList.remove('dragging');
        }
    });

    // Atualizar atributos para permitir arrastar
    function makeDraggable() {
        const items = document.querySelectorAll('.kanban-item');
        items.forEach(item => {
            item.setAttribute('draggable', 'true');
            item.dataset.id = item.querySelector('.habit-text').textContent; // Assumindo que os nomes são únicos
        });
    }

    // Re-renderizar para tornar os itens arrastáveis
    function renderHabits() {
        habitList.innerHTML = "";
        toDoItems.innerHTML = "";
        inProgressItems.innerHTML = "";
        doneItems.innerHTML = "";

        const selectedCategory = filterCategory.value;
        const filteredHabits = selectedCategory === "Todas" ? habits : habits.filter(habit => habit.category === selectedCategory);
        
        filteredHabits.forEach(habit => {
            const habitItem = document.createElement('div');
            habitItem.classList.add('habit-item');
            habitItem.setAttribute('draggable', 'true');
            habitItem.dataset.id = habit.id;

            const leftSection = document.createElement('div');
            leftSection.classList.add('left-section');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isAllDaysCompleted(habit);
            checkbox.addEventListener('change', () => toggleHabitStatusForAllDays(habit.id, checkbox.checked));

            const habitText = document.createElement('span');
            habitText.classList.add('habit-text');
            habitText.textContent = habit.text;

            const habitCategory = document.createElement('span');
            habitCategory.classList.add('habit-category');
            habitCategory.textContent = `${habit.category}`;

            leftSection.appendChild(checkbox);
            leftSection.appendChild(habitText);
            leftSection.appendChild(habitCategory);

            const rightSection = document.createElement('div');

            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-button');
            editBtn.innerHTML = '&#9998;'; // Ícone de lápis
            editBtn.title = 'Editar hábito';
            editBtn.addEventListener('click', () => openModal(habit));

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Remover hábito';
            deleteBtn.addEventListener('click', () => removeHabit(habit.id));

            rightSection.appendChild(editBtn);
            rightSection.appendChild(deleteBtn);

            habitItem.appendChild(leftSection);
            habitItem.appendChild(rightSection);

            // Adicionar ao Quadro Kanban com base no status
            if (habit.status === 'A Fazer') {
                toDoItems.appendChild(habitItem);
            } else if (habit.status === 'Em Progresso') {
                inProgressItems.appendChild(habitItem);
            } else if (habit.status === 'Concluído') {
                doneItems.appendChild(habitItem);
            }
        });

        // Tornar os itens arrastáveis
        const kanbanItems = document.querySelectorAll('.habit-item');
        kanbanItems.forEach(item => {
            item.setAttribute('draggable', 'true');
            item.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.target.classList.add('dragging');
            });
            item.addEventListener('dragend', function(e) {
                e.target.classList.remove('dragging');
            });
        });
    }

    // Re-renderizar a lista de hábitos após mudanças
    function renderHabits() {
        habitList.innerHTML = "";
        toDoItems.innerHTML = "";
        inProgressItems.innerHTML = "";
        doneItems.innerHTML = "";

        const selectedCategory = filterCategory.value;
        const filteredHabits = selectedCategory === "Todas" ? habits : habits.filter(habit => habit.category === selectedCategory);
        
        filteredHabits.forEach(habit => {
            const habitItem = document.createElement('div');
            habitItem.classList.add('habit-item');
            habitItem.setAttribute('draggable', 'true');
            habitItem.dataset.id = habit.id;

            const leftSection = document.createElement('div');
            leftSection.classList.add('left-section');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isAllDaysCompleted(habit);
            checkbox.addEventListener('change', () => toggleHabitStatusForAllDays(habit.id, checkbox.checked));

            const habitText = document.createElement('span');
            habitText.classList.add('habit-text');
            habitText.textContent = habit.text;

            const habitCategory = document.createElement('span');
            habitCategory.classList.add('habit-category');
            habitCategory.textContent = `${habit.category}`;


            leftSection.appendChild(checkbox);
            leftSection.appendChild(habitText);
            leftSection.appendChild(habitCategory);

            const rightSection = document.createElement('div');

            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-button');
            editBtn.innerHTML = '&#9998;'; // Ícone de lápis
            editBtn.title = 'Editar hábito';
            editBtn.addEventListener('click', () => openModal(habit));

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Remover hábito';
            deleteBtn.addEventListener('click', () => removeHabit(habit.id));

            rightSection.appendChild(editBtn);
            rightSection.appendChild(deleteBtn);

            habitItem.appendChild(leftSection);
            habitItem.appendChild(rightSection);

            // Adicionar ao Quadro Kanban com base no status
            if (habit.status === 'A Fazer') {
                toDoItems.appendChild(habitItem);
            } else if (habit.status === 'Em Progresso') {
                inProgressItems.appendChild(habitItem);
            } else if (habit.status === 'Concluído') {
                doneItems.appendChild(habitItem);
            }
        });

        // Tornar os itens arrastáveis
        const kanbanItems = document.querySelectorAll('.habit-item');
        kanbanItems.forEach(item => {
            item.setAttribute('draggable', 'true');
            item.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.target.classList.add('dragging');
            });
            item.addEventListener('dragend', function(e) {
                e.target.classList.remove('dragging');
            });
        });
    }

    function isAllDaysCompleted(habit) {
        // Verifica se todas as 30 dias estão marcados como concluídos
        const days = getDaysInMonth(selectedMonth);
        for (let i = 1; i <= days; i++) {
            if (!habit.history[i]) {
                return false;
            }
        }
        return true;
    }

    function toggleHabitStatusForAllDays(habitId, status) {
        habits = habits.map(habit => {
            if (habit.id === habitId) {
                const days = getDaysInMonth(selectedMonth);
                for (let i = 1; i <= days; i++) {
                    habit.history[i] = status;
                }
            }
            return habit;
        });
        saveHabits();
        renderHabits();
        renderCalendar();
        updateProgress();
    }

    function renderCalendar() {
        calendar.innerHTML = "";
        const [year, month] = selectedMonth.split('-').map(Number);
        const days = getDaysInMonth(selectedMonth);
        
        for (let day = 1; day <= days; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day');

            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = day;

            const habitStatusDiv = document.createElement('div');
            habitStatusDiv.classList.add('habit-status');

            habits.forEach(habit => {
                const habitLabel = document.createElement('label');
                habitLabel.textContent = habit.text;

                const habitCheckbox = document.createElement('input');
                habitCheckbox.type = 'checkbox';
                habitCheckbox.checked = habit.history[day] || false;
                habitCheckbox.addEventListener('change', () => toggleHabitStatus(habit.id, day));

                habitLabel.prepend(habitCheckbox);
                habitStatusDiv.appendChild(habitLabel);
            });

            dayDiv.appendChild(dayNumber);
            dayDiv.appendChild(habitStatusDiv);
            calendar.appendChild(dayDiv);
        }
    }

    function getDaysInMonth(monthString) {
        const [year, month] = monthString.split('-').map(Number);
        return new Date(year, month, 0).getDate();
    }

    function updateProgress() {
        const totalHabits = habits.length;
        if (totalHabits === 0) {
            progressBar.style.width = '0%';
            progressText.textContent = 'Progresso: 0%';
            return;
        }

        let totalCompleted = 0;
        habits.forEach(habit => {
            const days = getDaysInMonth(selectedMonth);
            let completedDays = 0;
            for (let i = 1; i <= days; i++) {
                if (habit.history[i]) completedDays++;
            }
            totalCompleted += completedDays;
        });

        const totalPossible = totalHabits * getDaysInMonth(selectedMonth);
        const progress = Math.round((totalCompleted / totalPossible) * 100);

        progressBar.style.width = progress + '%';

        // Adicionar classe para mudar a cor conforme o progresso
        if (progress >= 80) {
            progressBar.classList.add('animated');
        } else {
            progressBar.classList.remove('animated');
        }

        progressText.textContent = `Progresso: ${progress}%`;
    }

    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
    }

    function scheduleNotification(habit) {
        if ("Notification" in window && Notification.permission === "granted") {
            const now = new Date();
            const notificationTime = new Date();
            notificationTime.setHours(8, 0, 0, 0); // 8 AM

            // Se já passou das 8 AM, agendar para o próximo dia
            if (now > notificationTime) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }

            const timeUntilNotification = notificationTime - now;

            setTimeout(() => {
                new Notification("Lembrete de Hábito", {
                    body: `Não esqueça de completar o hábito: ${habit.text}`,
                    icon: "https://cdn-icons-png.flaticon.com/512/2922/2922506.png" // Ícone opcional
                });
            
                // Agendar a próxima notificação para 24 horas depois
                setInterval(() => {
                    new Notification("Lembrete de Hábito", {
                        body: `Não esqueça de completar o hábito: ${habit.text}`,
                        icon: "https://cdn-icons-png.flaticon.com/512/2922/2922506.png" // Ícone opcional
                    });
                }, 24 * 60 * 60 * 1000); // 24 horas
            }, timeUntilNotification);
            
        }
    }

    // Inicializar a seleção do mês para o mês atual
    monthInput.value = selectedMonth;
    renderCalendar();
    renderHabits();
    updateProgress();

    // Agendar notificações para hábitos existentes
    habits.forEach(habit => {
        scheduleNotification(habit);
    });

    // Drag and Drop para Quadro Kanban
    const kanbanColumns = document.querySelectorAll('.kanban-column');

    kanbanColumns.forEach(column => {
        const kanbanItems = column.querySelector('.kanban-items');

        // Drag Over
        column.addEventListener('dragover', function(e) {
            e.preventDefault();
            kanbanItems.classList.add('drag-over');
        });

        column.addEventListener('dragleave', function(e) {
            kanbanItems.classList.remove('drag-over');
        });

        column.addEventListener('drop', function(e) {
            e.preventDefault();
            kanbanItems.classList.remove('drag-over');
            const habitId = e.dataTransfer.getData('text/plain');
            const habit = habits.find(h => h.id == habitId);
            const newStatus = column.id === 'to-do' ? 'A Fazer' : column.id === 'in-progress' ? 'Em Progresso' : 'Concluído';
            habit.status = newStatus;
            saveHabits();
            renderHabits();
            updateProgress();
        });
    });

    // Permitir arrastar cartões
    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('habit-item')) {
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            e.target.classList.add('dragging');
        }
    });

    document.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('habit-item')) {
            e.target.classList.remove('dragging');
        }
    });

});