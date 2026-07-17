import ast
import html
import json
import re
from pathlib import Path


BASE_URL = "https://br.freetools.best"
SOURCE = Path("frases.html")
TODAY = "2026-07-14"


PAGES = {
    "bom-dia": {
        "file": "frases-bom-dia.html",
        "title": "Frases de Bom Dia para WhatsApp",
        "description": "Copie frases de bom dia para WhatsApp, grupo da família e status. Mensagens leves, engraçadas e prontas para compartilhar.",
        "keywords": "frases de bom dia, bom dia WhatsApp, mensagem de bom dia, bom dia grupo família, frases para compartilhar",
        "h1": "Frases de bom dia para WhatsApp",
        "nav_label": "Bom dia",
        "eyebrow": "Bom dia brasileiro",
        "lead": "Mensagens curtas para abrir o dia no grupo da família, no status ou naquela conversa que merece carinho.",
        "faq": [
            ("Posso usar essas frases no grupo da família?", "Sim. As frases foram escritas em português do Brasil e funcionam bem para WhatsApp, status e grupos."),
            ("As frases de bom dia são gratuitas?", "Sim. Basta copiar ou tocar no botão de WhatsApp para compartilhar."),
        ],
    },
    "status": {
        "file": "frases-status-whatsapp.html",
        "title": "Frases para Status do WhatsApp",
        "description": "Frases para status do WhatsApp em português do Brasil: indiretas leves, autoestima, paz, foco e mensagens curtas para copiar.",
        "keywords": "frases para status, status WhatsApp, legenda para status, frases curtas, frases de autoestima",
        "h1": "Frases para status do WhatsApp",
        "nav_label": "Status",
        "eyebrow": "Status pronto",
        "lead": "Frases curtas para atualizar o status com personalidade, leveza e aquele toque de Brasil.",
        "faq": [
            ("Posso colocar essas frases no status?", "Sim. Copie a frase ou compartilhe direto no WhatsApp."),
            ("As frases são curtas?", "Sim. Elas foram pensadas para status, legenda e compartilhamento rápido."),
        ],
    },
    "cantadas": {
        "file": "cantadas-engracadas.html",
        "title": "Cantadas Engraçadas para WhatsApp",
        "description": "Cantadas engraçadas, leves e brasileiras para mandar no WhatsApp. Copie frases criativas com Pix, café, Wi-Fi e status.",
        "keywords": "cantadas engraçadas, cantadas para WhatsApp, cantadas brasileiras, cantadas leves, frases de paquera",
        "h1": "Cantadas engraçadas para WhatsApp",
        "nav_label": "Cantadas",
        "eyebrow": "Paquera leve",
        "lead": "Cantadas com humor brasileiro para quebrar o gelo sem pesar a mão.",
        "faq": [
            ("Essas cantadas são pesadas?", "Não. A seleção é leve, divertida e pensada para WhatsApp."),
            ("Posso mandar direto pelo WhatsApp?", "Sim. Cada cantada tem botão de copiar e botão para compartilhar."),
        ],
    },
    "aniversario": {
        "file": "mensagens-aniversario.html",
        "title": "Mensagens de Aniversário para WhatsApp",
        "description": "Mensagens de aniversário para copiar e enviar no WhatsApp. Frases de parabéns com carinho, humor e bênçãos.",
        "keywords": "mensagem de aniversário, parabéns WhatsApp, frases de aniversário, feliz aniversário, aniversário para status",
        "h1": "Mensagens de aniversário para WhatsApp",
        "nav_label": "Aniversário",
        "eyebrow": "Parabéns com carinho",
        "lead": "Textos prontos para desejar feliz aniversário com afeto, leveza e um pouco de humor.",
        "faq": [
            ("Posso usar para amigos e família?", "Sim. As mensagens servem para família, amigos, colegas e grupos."),
            ("Tem mensagens religiosas?", "Há frases com bênçãos e fé, mas também opções neutras e engraçadas."),
        ],
    },
    "sextou": {
        "file": "frases-sextou.html",
        "title": "Frases de Sextou para Status e WhatsApp",
        "description": "Frases de sextou para WhatsApp e status. Mensagens engraçadas de sexta-feira, fim de semana, descanso e rolê.",
        "keywords": "frases sextou, sextou WhatsApp, status de sexta-feira, frases fim de semana, legenda sextou",
        "h1": "Frases de sextou para status",
        "nav_label": "Sextou",
        "eyebrow": "Fim de semana chegando",
        "lead": "Frases para comemorar a sexta-feira, o descanso e a sobrevivência à semana.",
        "faq": [
            ("Quando usar frases de sextou?", "Na sexta-feira, no status, em grupos ou para chamar amigos para o rolê."),
            ("As frases são engraçadas?", "Sim. A seleção mistura humor de trabalho, descanso e fim de semana."),
        ],
    },
    "indiretas": {
        "file": "indiretas-whatsapp.html",
        "title": "Indiretas para WhatsApp e Status",
        "description": "Indiretas para WhatsApp e status: frases leves, inteligentes e brasileiras para copiar sem citar nomes.",
        "keywords": "indiretas WhatsApp, indiretas para status, frases de indireta, status de indireta, frases inteligentes",
        "h1": "Indiretas para WhatsApp e status",
        "nav_label": "Indiretas",
        "eyebrow": "Recado sem destinatário",
        "lead": "Frases de indireta com limite, humor e elegância para status ou conversa.",
        "faq": [
            ("As indiretas citam nomes?", "Não. São frases genéricas para status e WhatsApp, sem expor ninguém."),
            ("São frases ofensivas?", "A seleção evita ataques pesados e mantém um tom leve e inteligente."),
        ],
    },
}


def load_categories():
    text = SOURCE.read_text(encoding="utf-8")
    categories = {}
    pattern = r'id: "([^"]+)",\s*label: "([^"]+)",\s*items: \[(.*?)\]\s*}'
    for category_id, label, raw_items in re.findall(pattern, text, re.S):
        items = ast.literal_eval("[" + raw_items + "]")
        categories[category_id] = {"label": label, "items": items}
    return categories


def analytics_script():
    return """    <script>
        (function() {
            // 1. 初始化 va 函数
            window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

            // 2. 动态创建并插入外部 JS 文件
            const script = document.createElement('script');
            script.src = '/_vercel/insights/script.js';
            script.defer = true;
            document.head.appendChild(script);
        })();
    </script>"""


def json_script(data):
    return "    <script type=\"application/ld+json\">\n" + json.dumps(data, ensure_ascii=False, indent=4) + "\n    </script>"


def phrase_card(text, index):
    escaped = html.escape(text)
    return f"""                    <article class="phrase-card" data-phrase="{escaped}">
                        <p class="phrase-text">{escaped}</p>
                        <div class="phrase-actions">
                            <button class="btn secondary" type="button" data-copy>Copiar</button>
                            <button class="btn" type="button" data-share>WhatsApp</button>
                        </div>
                    </article>{ad_slot(index)}"""


def ad_slot(index):
    if index > 0 and index % 8 == 0:
        return "\n                    <div class=\"ad-slot\">Anúncio nativo responsivo</div>"
    return ""


def category_links(active_id):
    links = []
    for category_id, meta in PAGES.items():
        active = " active" if category_id == active_id else ""
        links.append(f'                    <a class="chip{active}" href="{meta["file"]}">{html.escape(meta["nav_label"])}</a>')
    return "\n".join(links)


def build_page(category_id, phrases):
    meta = PAGES[category_id]
    url = f"{BASE_URL}/{meta['file']}"
    faq_entities = [
        {
            "@type": "Question",
            "name": question,
            "acceptedAnswer": {"@type": "Answer", "text": answer},
        }
        for question, answer in meta["faq"]
    ]
    app_schema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": meta["title"],
        "url": url,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "inLanguage": "pt-BR",
        "description": meta["description"],
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "BRL"},
    }
    breadcrumb_schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Brasil Tools", "item": f"{BASE_URL}/"},
            {"@type": "ListItem", "position": 2, "name": "Frases para WhatsApp", "item": f"{BASE_URL}/frases.html"},
            {"@type": "ListItem", "position": 3, "name": meta["h1"], "item": url},
        ],
    }
    faq_schema = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq_entities}
    item_schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": meta["h1"],
        "itemListElement": [
            {"@type": "ListItem", "position": index + 1, "name": phrase}
            for index, phrase in enumerate(phrases)
        ],
    }
    phrase_html = "\n".join(phrase_card(text, index + 1) for index, text in enumerate(phrases))
    faq_html = "\n".join(
        f"""                <h3>{html.escape(question)}</h3>
                <p>{html.escape(answer)}</p>"""
        for question, answer in meta["faq"]
    )
    related_cards = "\n".join(
        f"""                <a class="related-card" href="{related["href"]}">
                    <strong>{html.escape(related["title"])}</strong>
                    <span>{html.escape(related["text"])}</span>
                </a>"""
        for related in [
            {"href": "frases.html", "title": "Todas as frases", "text": "Busque entre todas as categorias em uma página só."},
            {"href": "link-whatsapp.html", "title": "Link WhatsApp", "text": "Use a frase como mensagem pronta em um link wa.me."},
            {"href": "contador-caracteres.html", "title": "Contador de caracteres", "text": "Ajuste o tamanho da frase antes de publicar."},
            {"href": "imagem.html", "title": "Fotos para status", "text": "Comprima e corte imagens para postar junto com a frase."},
            {"href": "pix.html", "title": "Racha Pix", "text": "Divida churrasco, rolê e viagem com acertos via Pix."},
            {"href": "pix-copia-e-cola.html", "title": "Pix Copia e Cola", "text": "Gere um código Pix estático para copiar no app do banco."},
            {"href": "cpf.html", "title": "Validador de CPF", "text": "Confira e formate CPF direto no navegador."},
            {"href": "cnpj.html", "title": "Validador de CNPJ", "text": "Valide e formate CNPJ para loja, serviço e cadastro."},
            {"href": "conversor-texto.html", "title": "Conversor de texto", "text": "Transforme a frase em maiúsculas, minúsculas ou sem acentos."},
            {"href": "sorteador.html", "title": "Sorteador", "text": "Sorteie nomes e números para grupos e brincadeiras."},
        ]
    )
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(meta["title"])}</title>
    <meta name="description" content="{html.escape(meta["description"])}">
    <meta name="keywords" content="{html.escape(meta["keywords"])}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta name="theme-color" content="#1f8f54">
    <link rel="canonical" href="{url}">
    <link rel="alternate" hreflang="pt-BR" href="{url}">
    <link rel="icon" href="favicon.svg" type="image/svg+xml">
    <link rel="manifest" href="site.webmanifest">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="Brasil Tools">
    <meta property="og:title" content="{html.escape(meta["title"])}">
    <meta property="og:description" content="{html.escape(meta["description"])}">
    <meta property="og:url" content="{url}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{html.escape(meta["title"])}">
    <meta name="twitter:description" content="{html.escape(meta["description"])}">
    <link rel="stylesheet" href="styles.css">
{json_script(app_schema)}
{json_script(breadcrumb_schema)}
{json_script(faq_schema)}
{json_script(item_schema)}
{analytics_script()}
</head>
<body>
    <header class="site-header">
        <nav class="nav" aria-label="Navegação principal">
            <a class="brand" href="index.html"><span class="brand-mark">BR</span><span>Brasil Tools</span></a>
            <div class="nav-links">
                <a class="nav-link" href="index.html">Início</a>
            <a class="nav-link active" href="frases.html">Frases</a>
            <a class="nav-link" href="imagem.html">Fotos</a>
            <a class="nav-link" href="pix.html">Pix</a>
            <a class="nav-link" href="cpf.html">CPF</a>
            <a class="nav-link" href="cnpj.html">CNPJ</a>
            <a class="nav-link" href="conversor-texto.html">Texto</a>
            </div>
        </nav>
    </header>

    <main class="wrap section">
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="index.html">Início</a>
            <span>/</span>
            <a href="frases.html">Frases</a>
            <span>/</span>
            <span>{html.escape(meta["h1"])}</span>
        </nav>

        <div class="panel-header">
            <div>
                <p class="eyebrow">{html.escape(meta["eyebrow"])}</p>
                <h1>{html.escape(meta["h1"])}</h1>
                <p class="lead">{html.escape(meta["lead"])}</p>
            </div>
            <a class="btn secondary" href="frases.html">Ver todas</a>
        </div>

        <section class="tool-panel category-nav" aria-label="Categorias de frases">
{category_links(category_id)}
        </section>

        <section class="tool-panel">
            <div class="panel-header">
                <h2>{len(phrases)} frases prontas para copiar</h2>
                <span class="chip">{len(phrases)} frases</span>
            </div>
            <div class="phrase-list static-phrase-list">
{phrase_html}
            </div>
        </section>

        <article class="seo-content">
            <h2>{html.escape(meta["title"])}</h2>
            <p>{html.escape(meta["description"])}</p>
{faq_html}
        </article>

        <section class="seo-content" aria-labelledby="relacionadas">
            <h2 id="relacionadas">Ferramentas relacionadas</h2>
            <div class="related-grid">
{related_cards}
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="footer-links">
            <a href="frases.html">Todas as frases</a>
            <a href="imagem.html">Fotos sociais</a>
            <a href="pix.html">Racha Pix</a>
            <a href="mapa-do-site.html">Mapa do site</a>
            <a href="conversor-texto.html">Texto</a>
            <a href="sorteador.html">Sorteador</a>
        </div>
        Conteúdo local em HTML e JavaScript.
    </footer>

    <script src="phrase-page.js"></script>
</body>
</html>
"""


def main():
    categories = load_categories()
    for category_id, meta in PAGES.items():
        phrases = categories[category_id]["items"]
        Path(meta["file"]).write_text(build_page(category_id, phrases), encoding="utf-8")


if __name__ == "__main__":
    main()
