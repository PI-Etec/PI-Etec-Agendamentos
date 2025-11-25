document.addEventListener('DOMContentLoaded', async () => {
  try {
    
    const rawKit = localStorage.getItem('transferToProfessor');
    const combined = rawKit ? JSON.parse(rawKit) : null;

    const rawSala = localStorage.getItem('agendamentoSalaHorario');
    const agendamentoSala = rawSala ? JSON.parse(rawSala) : null;

    window.transferedKit = combined;
    window.agendamentoSalaHorario = agendamentoSala;
  } catch (e) {
    console.error('Erro ao processar dados na tela do professor:', e);
  }

  const btnAgendar = document.getElementById('btnAgendarProfessor');
  if (!btnAgendar) return;

  btnAgendar.addEventListener('click', async () => {
    const kit = window.transferedKit;
    const salaData = window.agendamentoSalaHorario;

    if (!salaData) {
      alert('Faltam dados de sala/data/horário. Volte e selecione novamente.');
      return;
    }
    if (!kit) {
      alert('Faltam dados de materiais/reagentes. Volte e selecione novamente.');
      return;
    }

    const payload = {
      data: salaData.data,
      horario: salaData.horario,
      sala: salaData.sala,
      nome_professor: salaData.nome_professor,
      kitName: kit.name,
      materials: kit.materials || [],
      reagents: kit.reagents || [],
    };

    try {
      const apiUrl = `${location.protocol}//${location.hostname}:3000/agendamentos/completo`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => '');
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) {}

      if (!res.ok) {
        console.error('Erro ao salvar agendamento completo:', res.status, data);
        alert(data.message || 'Erro ao salvar agendamento.');
        return;
      }

      alert('Agendamento completo salvo com sucesso!');

      
      localStorage.removeItem('transferToProfessor');
      localStorage.removeItem('agendamentoSalaHorario');
    } catch (e) {
      console.error(e);
      alert('Falha ao conectar com o servidor ao salvar agendamento.');
    }
  });
});
