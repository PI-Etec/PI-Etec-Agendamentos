#!/usr/bin/env python3
"""
Gera dois gráficos em PNG com a distribuição percentual de quantidade
por reagente e por material a partir das coleções `reagentes` e `materials`.

Uso:
  - Configure a variável de ambiente MONGO_URI (ou crie um arquivo .env com MONGO_URI)
  - Instale dependências: pip install pymongo python-dotenv matplotlib
  - Rode: python python/generate_charts.py

As imagens são geradas em `img/charts/` (criado se não existir).
"""
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
    from pymongo import MongoClient
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
except Exception as e:
    print("Erro: dependências Python não encontradas. Instale: pymongo, python-dotenv, matplotlib")
    print(e)
    sys.exit(1)


HERE = Path(__file__).resolve().parent.parent
CHART_DIR = HERE / "img" / "charts"
CHART_DIR.mkdir(parents=True, exist_ok=True)


def get_mongo_uri():
    # Carrega .env se presente
    load_dotenv(dotenv_path=HERE / ".env")
    uri = os.environ.get("MONGO_URI")
    if not uri:
        print("MONGO_URI não configurado. Defina a variável de ambiente ou crie um arquivo .env com MONGO_URI.")
        sys.exit(2)
    return uri


def aggregate_percentages(db, collection_name, label_field="reagente"):
    coll = db[collection_name]
    pipeline = [
        {"$group": {"_id": f"${label_field}", "total": {"$sum": "$quantidade"}}},
        {"$sort": {"total": -1}},
    ]
    results = list(coll.aggregate(pipeline))
    labels = [r["_id"] for r in results]
    values = [r["total"] for r in results]
    total = sum(values)
    if total == 0:
        # evitar divisão por zero: mostrar porcentagens zero
        percentages = [0 for _ in values]
    else:
        percentages = [v / total * 100 for v in values]
    return labels, values, percentages


def save_pie(labels, values, percentages, out_path, title):
    plt.figure(figsize=(6, 6))
    if not labels:
        labels = ["(nenhum)"]
        values = [1]
        percentages = [100]
    # Exibir apenas as maiores fatias por rótulo direto; pequenas fatias agrupadas
    plt.pie(values, labels=labels, autopct="%.1f%%", startangle=90)
    plt.title(title)
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()


def main():
    uri = get_mongo_uri()
    client = MongoClient(uri)
    # conexão padrão usa banco definido na URI
    db = client.get_default_database()

    # Coleção de reagentes: 'reagentes'
    labels_r, values_r, perc_r = aggregate_percentages(db, "reagentes", label_field="reagente")
    out_r = CHART_DIR / "reagentes_pie.png"
    save_pie(labels_r, values_r, perc_r, out_r, "Reagentes (porcentagem por quantidade)")
    print(f"Gerado: {out_r}")

    # Coleção de materiais: 'materials' ou 'materiais' ? Mongoose cria 'materials' a partir do model 'Material'
    # Tentar 'materials' primeiro, senão 'materiais'
    coll_name = "materials" if "materials" in db.list_collection_names() else "materiais"
    labels_m, values_m, perc_m = aggregate_percentages(db, coll_name, label_field="material")
    out_m = CHART_DIR / "materials_pie.png"
    save_pie(labels_m, values_m, perc_m, out_m, "Materiais (porcentagem por quantidade)")
    print(f"Gerado: {out_m}")


if __name__ == "__main__":
    main()
