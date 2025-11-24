(async function () {
  // Fallback para backend local se necessário
  const DEFAULT_BACKEND = "http://127.0.0.1:3000";
  const ORIGIN =
    window.location &&
    window.location.protocol &&
    window.location.protocol !== "file:"
      ? window.location.origin
      : null;
  const container = document.getElementById("kits-container");
  const confirmBtn = document.querySelector(".confirm-btn");
  if (!container) return;

  let selectedKit = null;

  function formatItems(items) {
    if (!Array.isArray(items) || !items.length) return "Nenhum item";
    return items.map((it) => `${it.material} — ${it.quantidade}`).join("; ");
  }

  function renderEmpty() {
    container.innerHTML =
      '<p class="text-muted">Nenhum kit salvo encontrado.</p>';
  }

  // If the page is opened via file:// the fetch will fail — show hint
  if (window.location.protocol === "file:") {
    container.innerHTML =
      '<p class="text-warning">Abra esta página via HTTP (por exemplo <code>http://127.0.0.1:3000/tela_selecao_de_kits.html</code>) para carregar os kits do servidor.</p>';
    return;
  }

  // mostrar estado de carregamento
  container.innerHTML = '<p class="text-muted">Carregando kits...</p>';

  async function fetchKitsWithFallback() {
    const candidates = [];
    if (ORIGIN) candidates.push(ORIGIN + "/selecionar/kits");
    candidates.push(DEFAULT_BACKEND + "/selecionar/kits");

    let lastErr = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          lastErr = new Error("Status " + res.status + " from " + url);
          // try next candidate
          continue;
        }
        const json = await res.json();
        return { json, url };
      } catch (err) {
        lastErr = err;
        // try next
      }
    }
    throw lastErr || new Error("Nenhum backend disponível");
  }

  try {
    const { json, url: usedUrl } = await fetchKitsWithFallback();
    const kits =
      (json &&
        (Array.isArray(json.kits)
          ? json.kits
          : Array.isArray(json)
            ? json
            : [])) ||
      [];
    // Fonte usada para carregar kits
    if (!kits.length) return renderEmpty();

    // build selectable list (radio buttons)
    const list = document.createElement("div");
    list.className = "list-group";

    kits.forEach((k) => {
      const title = k.name && k.name.trim() ? k.name.trim() : "Sem nome";
      // Representação inline dos itens entre parênteses
      const itemsInline = (() => {
        const its = Array.isArray(k.items) ? k.items : [];
        if (!its.length) return "";
        return (
          "(" +
          its.map((it) => `${it.material} — ${it.quantidade}`).join(", ") +
          ")"
        );
      })();

      const wrapper = document.createElement("div");
      wrapper.className = "form-check list-group-item d-flex align-items-start";

      const input = document.createElement("input");
      input.className = "form-check-input me-2 mt-1";
      input.type = "radio";
      input.name = "selectedKit";
      input.id = "kit-" + k._id;
      input.value = k._id;

      input.addEventListener("change", () => {
        selectedKit = k;
      });

      const label = document.createElement("label");
      label.className = "form-check-label";
      label.htmlFor = input.id;

      const titleEl = document.createElement("strong");
      titleEl.textContent = title;

      label.appendChild(titleEl);
      if (itemsInline) {
        const desc = document.createElement("span");
        desc.className = "kit-desc ms-2";
        try {
          const its = Array.isArray(k.items) ? k.items : [];
          // construir conteúdo com badges para tipo
          const frag = document.createDocumentFragment();
          const open = document.createTextNode("(");
          frag.appendChild(open);
          its.forEach((it, idx) => {
            const typeLabel =
              it.type === "reagente"
                ? "reagente"
                : it.type === "material"
                  ? "vidraria"
                  : "item";
            // montar como: material: nome-quantidade  (ex.: maca-5g) — se quantidade estiver presente
            const qtyPart =
              it.quantidade !== undefined && it.quantidade !== null
                ? `-${it.quantidade}`
                : "";
            let textValue;
            if (typeLabel === "item") {
              textValue = String(it.material) + qtyPart;
            } else {
              textValue = typeLabel + ": " + String(it.material) + qtyPart;
            }
            const text = document.createTextNode(textValue);
            frag.appendChild(text);
            if (idx < its.length - 1)
              frag.appendChild(document.createTextNode("; "));
          });
          const close = document.createTextNode(")");
          frag.appendChild(close);
          desc.appendChild(frag);
        } catch (e) {
          desc.textContent = itemsInline;
        }
        label.appendChild(desc);
      }

      wrapper.appendChild(input);
      wrapper.appendChild(label);
      list.appendChild(wrapper);
    });

    // renderizar lista
    container.innerHTML = "";
    container.appendChild(list);

    // wire confirm button to send selected kit to professor page
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        if (!selectedKit) {
          alert("Por favor selecione um kit salvo antes de confirmar.");
          return;
        }
        const transfer = {
          name: selectedKit.name || "Sem nome",
          items: selectedKit.items || [],
        };
        localStorage.setItem("transferToProfessor", JSON.stringify(transfer));
        window.location.href = "tela_professor.html";
      });
    }
  } catch (err) {
    console.error("Erro ao buscar kits:", err);
    container.innerHTML =
      '<p class="text-danger">Erro ao carregar kits: ' +
      (err.message || err) +
      "</p>";
  }
})();
