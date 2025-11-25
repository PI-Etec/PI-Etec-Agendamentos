const container = document.getElementById('materiais-container');
const mensagem = document.getElementById('mensagem');
function formatQuantidade(q) {
  const num = Number(q || 0);
  return `${num} un`; 
}

async function carregarMateriais() {
  try {
    const res = await fetch('http://localhost:3000/selecionar/materials');

   
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Resposta inesperada (não JSON):', text.slice(0, 1000));
      throw new Error('Resposta do servidor não é JSON. Verifique se a URL/rota está correta.');
    }

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erro ao buscar materiais');
    renderMateriais(json.materials || []);
  } catch (err) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro ao carregar materiais: ' + err.message;
  }
}

function renderMateriais(materials) {
  container.innerHTML = '';
  if (!materials.length) {
    container.innerHTML = '<p>Nenhum material cadastrado.</p>';
    return;
  }

  materials.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'material-btn';
    btn.style.margin = '6px';

   
    const label = document.createElement('span');
    label.textContent = m.material;

    const qty = document.createElement('small');
    qty.style.marginLeft = '6px';
    qty.textContent = `(${formatQuantidade(m.quantidade)})`;

    btn.appendChild(label);
    btn.appendChild(qty);

    btn.dataset.id = m._id || m.id || '';
    btn.dataset.quantidade = m.quantidade;

    
    const qtdNum = Number(m.quantidade || 0);
    if (qtdNum <= 0) {
      btn.disabled = true;
      btn.title = 'Sem estoque';
    }

    
    btn.addEventListener('click', () => onClickMaterial(m, btn));
    container.appendChild(btn);
  });
}

async function onClickMaterial(material, btnEl) {
  const max = Number(material.quantidade || btnEl.dataset.quantidade || 0);
  if (max <= 0) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Material sem estoque.';
    return;
  }


const entrada = await showQuantModal(material, max);
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
  window.selectedItems = window.selectedItems || [];
  const existing = window.selectedItems.find(it => it.materialId === (material._id || material.id));
  if (existing) {
    existing.quantidade = Number(existing.quantidade || 0) + q;
  } else {
    window.selectedItems.push({
      materialId: material._id || material.id,
      material: material.material,
      quantidade: q
    });
  }
  const current = Number(btnEl.dataset.quantidade || max);
  const novoLocal = Math.max(0, current - q);
  btnEl.dataset.quantidade = novoLocal;

  const small = btnEl.querySelector('small');
  if (small) small.textContent = `(${formatQuantidade(novoLocal)})`;

  const labelSpan = btnEl.querySelector('span');
  if (labelSpan) labelSpan.textContent = material.material;


  if (novoLocal <= 0) {
    btnEl.disabled = true;
    btnEl.title = 'Sem estoque';
  } else {
    btnEl.disabled = false;
    btnEl.title = '';
  }

  mensagem.style.color = 'green';
  mensagem.textContent = `Adicionado ${q} x ${material.material} à seleção local. Clique em Confirmar para finalizar.`;
}


carregarMateriais();


const confirmarBtn = document.getElementById('confirmar-selecao');
confirmarBtn.addEventListener('click', async () => {
  const selections = window.selectedItems || [];
  const reagentsRaw = localStorage.getItem('transferSelectionsReagents');
  const reagents = reagentsRaw ? JSON.parse(reagentsRaw) : [];

  if (!selections.length && !reagents.length) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Nenhuma seleção de materiais ou reagentes para confirmar.';
    return;
  }

  try {
    
    localStorage.setItem('transferSelectionsMaterials', JSON.stringify(selections));
    mensagem.style.color = 'green';
    mensagem.textContent = 'Seleções salvas. Redirecionando para Reagentes...';
    setTimeout(() => {
      window.location.href = 'tela_reagentes.html';
    }, 300);
  } catch (err) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro ao preparar seleção: ' + err.message;
  }
});

const quantModal = document.getElementById('quant-modal');
const modalTitle = document.getElementById('modal-title');
const modalAvailable = document.getElementById('modal-available');
const modalInput = document.getElementById('modal-quant-input');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

function showModalOverlay() {
  quantModal.classList.remove('hidden');
  modalInput.focus();
  modalInput.select();
}

function hideModalOverlay() {
  quantModal.classList.add('hidden');
}

function showQuantModal(material, max) {
  return new Promise(resolve => {
    modalTitle.textContent = material.material;
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