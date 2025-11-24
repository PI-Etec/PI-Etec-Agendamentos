// Uso esperado: na página HTML ter um container <div id="agendamentosList"></div>
// e incluir este script com <script src="/javascript/js_visualizar_agendamentos.js"></script>

(async function loadAgendamentos() {
  const container = document.getElementById("agendamentosList");
  if (!container) {
    console.warn("Container #agendamentosList não encontrado na página.");
    return;
  }

  function formatDate(isoDate) {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    return d.toLocaleDateString();
  }

  try {
    const resp = await fetch("/agendamentos"); // assume rota montada em /agendamentos
    if (!resp.ok) {
      container.innerText = "Falha ao carregar agendamentos.";
      return;
    }
    const agendamentos = await resp.json();
    if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
      container.innerText = "Nenhum agendamento encontrado.";
      return;
    }

    const ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.padding = "0";

    agendamentos.forEach((a) => {
      const li = document.createElement("li");
      li.style.marginBottom = "8px";
      li.textContent = `Sala: ${a.sala || "-"} | Data: ${formatDate(a.data)} | Horário: ${a.horario || "-"} | Professor: ${a.nome_professor || "-"}`;
      ul.appendChild(li);
    });

    container.innerHTML = "";
    container.appendChild(ul);
  } catch (err) {
    console.error("Erro ao buscar agendamentos:", err);
    container.innerText = "Erro ao carregar agendamentos.";
  }
})();
