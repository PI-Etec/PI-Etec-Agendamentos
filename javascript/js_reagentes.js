// Busca os reagentes do servidor e preenche os botões existentes (preserva layout)
// Script adaptado para popular os botões estáticos no container `#grupo-botoes`.
// IMPORTANT: use API_BASE para apontar ao backend (porta 3000). Se abrir a página
// com Live Server (porta 5500), chamadas relativas falharão com 404.
const API_BASE = 'http://127.0.0.1:3000';
const container = document.getElementById('grupo-botoes');
const mensagem = document.getElementById('mensagem');

function formatQuantidade(q) {
  const num = Number(q || 0);
  return `${num}`;
}

async function carregarReagentes() {
  try {
    const res = await fetch(`${API_BASE}/reagentes`);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Resposta inesperada (não JSON):', text.slice(0, 1000));
      throw new Error('Resposta do servidor não é JSON. Verifique se a URL/rota está correta.');
    }

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erro ao buscar reagentes');
    renderReagentes(json.reagentes || []);
  } catch (err) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro ao carregar reagentes: ' + err.message;
  }
}

function renderReagentes(reagentes) {
  if (!reagentes.length) {
    // manter os botões visíveis, mas mostrar mensagem
    mensagem.style.color = 'green';
    mensagem.textContent = 'Nenhum reagente cadastrado.';
    // ocultar todos os botões
    const allBtns = Array.from(container.querySelectorAll('button'));
    allBtns.forEach(b => { b.style.display = 'none'; });
    return;
  }

  const buttons = Array.from(container.querySelectorAll('button'));

  reagentes.forEach((m, idx) => {
    let btn;
    if (idx < buttons.length) {
      btn = buttons[idx];
      btn.style.display = '';
    } else {
      btn = document.createElement('button');
      container.appendChild(btn);
      buttons.push(btn);
    }

    // limpar conteúdo e construir estrutura: checkbox + label + qty
    btn.innerHTML = '';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.disabled = true; // checkbox visual (selection via modal)
    chk.style.marginRight = '6px';

    const label = document.createElement('span');
    label.textContent = m.reagente;

    const qty = document.createElement('small');
    qty.style.marginLeft = '6px';
    qty.textContent = `(${m.quantidade})`;

    btn.appendChild(chk);
    btn.appendChild(label);
    btn.appendChild(qty);

    btn.dataset.id = m._id || m.id || '';
    btn.dataset.quantidade = m.quantidade;

    const qtdNum = Number(m.quantidade || 0);
    if (qtdNum <= 0) {
      btn.disabled = true;
      btn.title = 'Sem estoque';
    } else {
      btn.disabled = false;
      btn.title = '';
    }

    // remover listeners antigos (prático: replace with a clone)
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    // attach click to the newly inserted node
    newBtn.addEventListener('click', () => onClickReagente(m, newBtn));
    // update reference in buttons array
    buttons[idx] = newBtn;
  });

  // hide any leftover static buttons beyond reagentes.length
  for (let i = reagentes.length; i < buttons.length; i++) {
    const b = buttons[i];
    if (b) b.style.display = 'none';
  }
}

async function onClickReagente(reagente, btnEl) {
  const max = Number(reagente.quantidade || btnEl.dataset.quantidade || 0);
  if (max <= 0) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Reagente sem estoque.';
    return;
  }

  const entrada = await showQuantModal(reagente, max);
  if (entrada === null) return;

  const q = parseInt(entrada, 10);
  if (Number.isNaN(q) || q <= 0) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Quantidade inválida.';
    return;
  }

  if (q > max) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Quantidade solicitada maior que o disponível.';
    return;
  }
  // Acumular seleção localmente (enviar ao backend apenas ao confirmar)
  window.selectedItems = window.selectedItems || [];
  const id = reagente._id || reagente.id;
  const existing = window.selectedItems.find(it => it.materialId === id);
  if (existing) {
    existing.quantidade = Number(existing.quantidade || 0) + q;
  } else {
    window.selectedItems.push({
      materialId: id,
      material: reagente.reagente,
      quantidade: q
    });
  }

  // Atualiza visualmente o botão (marca checkbox e adiciona destaque)
  const chk = btnEl.querySelector('input[type=checkbox]');
  if (chk) {
    chk.checked = true;
    chk.disabled = true;
  }
  btnEl.classList.add('selected');
  btnEl.style.border = '2px solid #28a745';
  btnEl.style.backgroundColor = '#e6ffed';

  // reduzir localmente a quantidade mostrada (sem alterar ainda no servidor)
  const current = Number(btnEl.dataset.quantidade || 0);
  const novoLocal = Math.max(0, current - q);
  btnEl.dataset.quantidade = novoLocal;
  const small = btnEl.querySelector('small');
  if (small) small.textContent = `(${novoLocal})`;

  if (novoLocal <= 0) {
    btnEl.disabled = true;
    btnEl.title = 'Sem estoque';
  }

  mensagem.style.color = 'green';
  mensagem.style.display = '';
  mensagem.textContent = `Adicionado ${q} x ${reagente.reagente} à seleção local. Clique em Confirmar para finalizar.`;
}

carregarReagentes();

const confirmarBtn = document.getElementById('confirmar-selecao');
confirmarBtn.addEventListener('click', async () => {
  const selections = window.selectedItems || [];
  if (!selections.length) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Nenhuma seleção para confirmar.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reagentes/kits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selections })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao salvar seleção');

    mensagem.style.color = 'green';
    mensagem.style.display = '';
    mensagem.textContent = 'Seleção salva com sucesso (kit id: ' + data.kitId + ')';
    window.selectedItems = [];
    // recarregar reagentes do servidor para atualizar quantidades exibidas
    await carregarReagentes();
  } catch (err) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro ao salvar seleção: ' + err.message;
  }
});

// --- Modal logic (copied from tela_materiais) ---
const quantModal = document.getElementById('quant-modal');
const modalTitle = document.getElementById('modal-title');
const modalAvailable = document.getElementById('modal-available');
const modalInput = document.getElementById('modal-quant-input');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

function showModalOverlay() {
  quantModal.classList.remove('hidden');
  // ensure the modal is visible (remove any inline display:none)
  quantModal.style.display = '';
  modalInput.focus();
  modalInput.select();
}

function hideModalOverlay() {
  quantModal.classList.add('hidden');
  // hide via inline style as well so it stays hidden regardless of CSS specificity
  quantModal.style.display = 'none';
}

function showQuantModal(material, max) {
  return new Promise(resolve => {
    modalTitle.textContent = material.reagente;
    modalAvailable.textContent = 'Quantidade disponível: ' + formatQuantidade(max);
    modalInput.value = '1';
    showModalOverlay();

    function cleanup() {
      modalCancel.removeEventListener('click', onCancel);
      modalConfirm.removeEventListener('click', onConfirm);
      quantModal.removeEventListener('keydown', onKey);
    }

    function onCancel() {
      cleanup();
      hideModalOverlay();
      resolve(null);
    }

    function onConfirm() {
      const val = modalInput.value;
      cleanup();
      hideModalOverlay();
      resolve(val);
    }

    function onKey(e) {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    }

    modalCancel.addEventListener('click', onCancel);
    modalConfirm.addEventListener('click', onConfirm);
    quantModal.addEventListener('keydown', onKey);
  });
}
