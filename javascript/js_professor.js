document.addEventListener('DOMContentLoaded', async () => {
  // Ao carregar a tela do professor, ler objeto transferido (materials + reagents)
  try {
    const raw = localStorage.getItem('transferToProfessor');
    if (!raw) return; // nada a processar
    const combined = JSON.parse(raw);

    // mostrar resumo no topo da página para verificação
    const container = document.querySelector('.container') || document.body;
    const info = document.createElement('div');
    info.style.border = '1px solid #ccc';
    info.style.padding = '10px';
    info.style.marginBottom = '12px';
    info.style.background = '#f6f9ff';

    const titleText = combined.name && String(combined.name).trim() ? combined.name.trim() : 'Sem nome';
    const titleEl = document.createElement('strong');
    titleEl.textContent = titleText;
    info.appendChild(titleEl);

    // juntar materiais + reagentes em uma descrição entre parênteses
    const items = [];
    (combined.materials || []).forEach(m => items.push(`${m.material} — ${m.quantidade}`));
    (combined.reagents || []).forEach(r => items.push(`${r.material} — ${r.quantidade}`));
    if (items.length) {
      const desc = document.createElement('span');
      desc.style.marginLeft = '8px';
      desc.className = 'text-muted';
      // construir lista inline com badges
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode('('));
      items.forEach((it, idx) => {
        // it já vem no formato 'Nome — qtd', tentamos extrair type se disponível no combined
        // Porém aqui o array 'items' foi montado já como strings; vamos reconstruir usando combined arrays
      });

      // reconstruir a partir de combined.materials/reagents com badges
      const parts = [];
      (combined.materials || []).forEach(m => parts.push({ label: 'Material', text: `${m.material} — ${m.quantidade}` }));
      (combined.reagents || []).forEach(r => parts.push({ label: 'Reagente', text: `${r.material} — ${r.quantidade}` }));
      parts.forEach((p, idx) => {
        const typeLabel = (p.label && p.label.toLowerCase()) || 'item';
        // montar como: material: nome-quantidade; reagente: nome-quantidade
        let textValue = p.text;
        if (typeLabel === 'material' || typeLabel === 'reagente') {
          textValue = typeLabel + ': ' + p.text;
        }
        frag.appendChild(document.createTextNode(textValue));
        if (idx < parts.length - 1) frag.appendChild(document.createTextNode('; '));
      });
      frag.appendChild(document.createTextNode(')'));
      desc.appendChild(frag);
      info.appendChild(desc);
    }

    container.insertBefore(info, container.firstChild);

    // manter objeto disponível para uso posterior na página
    window.transferedKit = combined;
    // opcional: remover a chave para evitar reaplicar
    localStorage.removeItem('transferToProfessor');
  } catch (e) {
    console.error('Erro ao processar transferToProfessor na tela do professor:', e);
  }
});
