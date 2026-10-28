"""Gera js/indice-busca.js, o índice da busca interna do site.

Rode sempre que mudar o texto de alguma página:
    python3 ferramentas/gerar-indice.py
Também dá um id aos títulos (h2/h3) que ainda não têm, para a busca levar direto ao trecho.
"""
import json, re, unicodedata
from pathlib import Path
from bs4 import BeautifulSoup

RAIZ = Path(__file__).resolve().parent.parent
PAGINAS = ['historia.html', 'servicos.html', 'pesquisa.html', 'normalizacao.html',
           'acervo.html', 'faq.html', 'localizacao.html']


def slug(t):
    t = unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')[:48]


def da_ids(caminho):
    html = caminho.read_text(encoding='utf-8')
    usados = set(re.findall(r'\sid="([^"]+)"', html))

    def troca(m):
        tag, attrs, corpo = m.group(1), m.group(2) or '', m.group(3)
        if 'id=' in attrs:
            return m.group(0)
        base = slug(re.sub(r'<[^>]+>', '', corpo)) or tag
        novo, n = base, 2
        while novo in usados:
            novo, n = f'{base}-{n}', n + 1
        usados.add(novo)
        return f'<{tag} id="{novo}"{attrs}>{corpo}</{tag}>'

    novo = re.sub(r'<(h[23])(\s[^>]*)?>(.*?)</\1>', troca, html, flags=re.S)
    if novo != html:
        caminho.write_text(novo, encoding='utf-8')


def limpa(t):
    t = re.sub(r'\s+', ' ', t).strip()
    return re.sub(r'\s+([.,;:!?)])', r'\1', t)


def texto_ate_proximo(h):
    partes = []
    for irmao in h.find_next_siblings():
        if irmao.name in ('h1', 'h2', 'h3') or irmao.find(['h2', 'h3']):
            break
        partes.append(irmao.get_text(' ', strip=True))
    return limpa(' '.join(partes))


itens = []
for nome in PAGINAS:
    caminho = RAIZ / nome
    da_ids(caminho)
    s = BeautifulSoup(caminho.read_text(encoding='utf-8'), 'html.parser')
    pagina = limpa(s.title.get_text()).split(' | ')[0]
    main = s.find('main')
    h1 = main.find('h1')
    intro = texto_ate_proximo(h1) if h1 else ''
    if nome == 'localizacao.html':
        intro = limpa(main.get_text(' ', strip=True))
    itens.append({'p': pagina, 't': pagina, 'u': nome, 'x': intro[:1500]})
    for h in main.find_all(['h2', 'h3']):
        if h.find_parent(class_='livro'):
            continue
        titulo = limpa(h.get_text(' ', strip=True))
        if nome == 'faq.html' and h.name == 'h2':
            continue
        corpo = texto_ate_proximo(h)
        if nome == 'acervo.html':
            serie = h.find_parent(class_='serie')
            bio = serie.find(class_='bio') if serie else None
            corpo = limpa(bio.get_text(' ', strip=True)) if bio else corpo
        itens.append({'p': pagina, 't': titulo, 'u': f"{nome}#{h['id']}", 'x': corpo[:1500]})
    for livro in main.select('.livro'):
        serie = livro.find_parent(class_='serie')
        autor = limpa(serie.find('h2').get_text()) if serie else ''
        b, i = livro.find('b'), livro.find('i')
        desc = livro.find('span', class_=False)
        itens.append({'p': f'Nossos autores · {autor}', 't': limpa(b.get_text()),
                      'u': f"acervo.html#{serie['id']}" if serie else 'acervo.html',
                      'x': limpa(f"{i.get_text() if i else ''}. {desc.get_text() if desc else ''}")})

saida = RAIZ / 'js' / 'indice-busca.js'
saida.write_text('window.INDICE_BUSCA=' + json.dumps(itens, ensure_ascii=False, separators=(',', ':')) + ';\n',
                 encoding='utf-8')
print(len(itens), 'trechos no índice')
