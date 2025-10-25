document.addEventListener('DOMContentLoaded', () => {
  // Dropdown salas
  const dropdownButton = document.getElementById('dropdownMenuButton');
  const dropdownItems = document.querySelectorAll('.dropdown-item');

  // Resumo
  const resumoEl = document.getElementById('agendamentoResumo');

  // Título Horários (mantém sem data)
  const tituloHorarios = document.querySelector('.titulo-horarios');
  if (tituloHorarios) tituloHorarios.textContent = 'Horários';

  // Estado
  const calendarRoot = document.querySelector('.calendar');
  if (!calendarRoot) return;

  const state = {
    view: new Date(),     // mês/ano exibido
    selected: null,       // data selecionada (Date)
    today: new Date(),    // hoje
    room: null,           // sala selecionada
    time: null            // horário selecionado
  };

  // Janela permitida: mínimo = hoje + 2 dias, máximo = fim do próximo mês
  const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const minDate = stripTime(addDays(state.today, 2));
  const nextMonthStart = new Date(state.today.getFullYear(), state.today.getMonth() + 1, 1);
  const maxDate = new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 1, 0); // fim do próximo mês
  const inRange = (d) => {
    const x = stripTime(d);
    return x >= minDate && x <= maxDate;
  };

  const updateResumo = () => {
    if (!resumoEl) return;
    const parts = [];
    if (state.room) parts.push(`Sala: ${state.room}`);
    if (state.selected) {
      const d = state.selected;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      parts.push(`Data: ${dd}/${mm}/${yyyy}`);
    }
    if (state.time) parts.push(`Horário: ${state.time}`);
    resumoEl.textContent = parts.length ? parts.join(' | ') : 'Selecione sala, data e horário';
  };

  if (dropdownButton && dropdownItems.length) {
    dropdownItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const name = item.textContent.trim();
        state.room = name;
        dropdownButton.innerHTML = `${name} <i class="bi bi-chevron-down"></i>`;
        updateResumo();
      });
    });
  }

  // Normaliza para ignorar hora
  const toYMD = (d) => [d.getFullYear(), d.getMonth(), d.getDate()];
  const isSameDay = (a, b) => {
    if (!a || !b) return false;
    const [ya, ma, da] = toYMD(a);
    const [yb, mb, db] = toYMD(b);
    return ya === yb && ma === mb && da === db;
  };

  const pad2 = (n) => String(n).padStart(2, '0');
  const isoDate = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
  const formatDateBR = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

  function render() {
    const year = state.view.getFullYear();
    const month = state.view.getMonth();

    // Limites de navegação por mês
    const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    const canGoPrev = (year > minMonth.getFullYear()) || (year === minMonth.getFullYear() && month > minMonth.getMonth());
    const canGoNext = (year < maxMonth.getFullYear()) || (year === maxMonth.getFullYear() && month < maxMonth.getMonth());

    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekDay = firstOfMonth.getDay(); // 0=Dom, ..., 6=Sáb
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const leading = firstWeekDay;
    const totalCells = 42;
    const trailing = totalCells - leading - daysInMonth;

    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, month, 1));
    const todayText = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(state.today);

    const controls = `
      <div class="calendar-controls">
        <div class="calendar-prev">
          <a href="#" data-nav="prev" class="${canGoPrev ? '' : 'is-disabled'}" aria-disabled="${!canGoPrev}">
            <i class="bi bi-chevron-left"></i>
          </a>
        </div>
        <div class="calendar-year-month">
          <div class="calendar-month-label">${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</div>
          <div class="calendar-year-label">${year}</div>
        </div>
        <div class="calendar-next">
          <a href="#" data-nav="next" class="${canGoNext ? '' : 'is-disabled'}" aria-disabled="${!canGoNext}">
            <i class="bi bi-chevron-right"></i>
          </a>
        </div>
      </div>
    `;

    const weekHeader = weekdays.map(w => `<div><a href="#" tabindex="-1">${w}</a></div>`).join('');

    const prevDays = Array.from({ length: leading }, (_, i) => {
      const dayNum = daysInPrevMonth - leading + i + 1;
      return `
        <div class="prev-dates">
          <a href="#" data-type="prev" tabindex="-1">${dayNum}</a>
        </div>
      `;
    }).join('');

    const currentDays = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const cellDate = new Date(year, month, day);
      const enabled = inRange(cellDate);
      const isToday = isSameDay(cellDate, state.today);
      const isSelected = isSameDay(cellDate, state.selected);
      const classes = [
        isToday ? 'calendar-today' : '',
        isSelected ? 'selected' : ''
      ].filter(Boolean).join(' ');
      const disabledClass = enabled ? '' : 'is-disabled';

      return `
        <div class="${classes}">
          <a href="#" class="${disabledClass}" data-type="current" data-date="${isoDate(year, month, day)}" aria-label="${formatDateBR(cellDate)}">${day}</a>
        </div>
      `;
    }).join('');

    const nextDays = Array.from({ length: trailing }, (_, i) => {
      const dayNum = i + 1;
      return `
        <div class="next-dates">
          <a href="#" data-type="next" tabindex="-1">${dayNum}</a>
        </div>
      `;
    }).join('');

    const body = `
      <div class="calendar-body">
        ${weekHeader}
        ${prevDays}
        ${currentDays}
        ${nextDays}
      </div>
    `;

    const todayPill = `
      <div class="calendar-today-date" data-action="go-today" title="Ir para hoje">
        Hoje: ${todayText}
      </div>
    `;

    calendarRoot.innerHTML = `
      <div class="calendar-inner">
        ${controls}
        ${body}
        ${todayPill}
      </div>
    `;

    // Navegação (respeita desabilitados)
    calendarRoot.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.classList.contains('is-disabled')) return;
        const dir = btn.getAttribute('data-nav');
        const v = state.view;
        state.view = new Date(v.getFullYear(), v.getMonth() + (dir === 'next' ? 1 : -1), 1);
        render();
      });
    });

    // Ir para hoje
    const goToday = calendarRoot.querySelector('[data-action="go-today"]');
    if (goToday) {
      goToday.addEventListener('click', () => {
        state.view = new Date(state.today.getFullYear(), state.today.getMonth(), 1);
        render();
      });
    }

    // Seleção de dia (somente mês atual e dentro da janela)
    calendarRoot.querySelectorAll('.calendar-body a[data-type="current"]:not(.is-disabled)').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const [y, m, d] = a.getAttribute('data-date').split('-').map(Number);
        const picked = new Date(y, m - 1, d);
        if (!inRange(picked)) return;
        state.selected = picked;
        if (tituloHorarios) tituloHorarios.textContent = 'Horários';
        updateResumo();
        render();
      });
    });
  }

  // Seleção de horário
  const timeButtons = document.querySelectorAll('.lista-horarios .list-group-item');
  if (timeButtons.length) {
    timeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        timeButtons.forEach(b => b.classList.remove('selecionado'));
        btn.classList.add('selecionado');
        state.time = btn.textContent.trim();
        updateResumo();
      });
    });
  }

  // Render inicial + resumo
  render();
  updateResumo();

  // Clique do botão Confirmar
  const btnConfirmar = document.getElementById('btnConfirmarAgendamento');
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', () => {
      if (!state.room || !state.selected || !state.time) {
        alert('Selecione sala, data e horário antes de confirmar.');
        return;
      }
      const d = state.selected;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      alert(`Agendamento confirmado:\nSala: ${state.room}\nData: ${dd}/${mm}/${yyyy}\nHorário: ${state.time}`);
    });
  }
});



