import html
import json
from pathlib import Path


BASE_URL = "https://br.freetools.best"
TODAY = "2026-07-20"


PAGES = [
    {
        "file": "calcular-10-porcento.html",
        "title": "Calcular 10 Porcento de um Valor",
        "description": "Aprenda a calcular 10% de um valor e use a calculadora de porcentagem grátis para desconto, taxa, Pix e compras.",
        "keywords": "calcular 10 porcento, 10% de um valor, dez por cento, calculadora de porcentagem",
        "h1": "Calcular 10% de um valor",
        "eyebrow": "Porcentagem rápida",
        "lead": "Use para descobrir 10% de preço, taxa, desconto, comissão ou valor para dividir no Pix.",
        "tool_href": "calculadora-porcentagem.html",
        "tool_label": "Abrir calculadora",
        "example_title": "Exemplo: 10% de R$ 250",
        "example_lines": ["10% de R$ 250 = R$ 25", "Com 10% de desconto, o preço final fica R$ 225."],
        "seo_h2": "Como calcular 10 por cento",
        "seo_text": "Para calcular 10% de qualquer valor, divida o valor por 10. Na calculadora, digite 10 no campo de porcentagem e informe o valor base.",
        "faq": [
            ("Quanto é 10% de 100?", "10% de 100 é 10."),
            ("Posso usar para desconto de loja?", "Sim. A calculadora mostra o valor do desconto e o preço final."),
        ],
        "related": ["calcular-20-porcento.html", "calcular-desconto.html", "calculadora-porcentagem.html"],
    },
    {
        "file": "calcular-20-porcento.html",
        "title": "Calcular 20 Porcento de um Valor",
        "description": "Calcule 20% de qualquer valor no navegador. Ferramenta grátis para desconto, aumento, taxa e compras no Brasil.",
        "keywords": "calcular 20 porcento, 20% de um valor, vinte por cento, desconto de 20",
        "h1": "Calcular 20% de um valor",
        "eyebrow": "Desconto comum",
        "lead": "Descubra rapidamente 20% de preço, promoção, comissão ou taxa usando a calculadora grátis.",
        "tool_href": "calculadora-porcentagem.html",
        "tool_label": "Calcular agora",
        "example_title": "Exemplo: 20% de R$ 150",
        "example_lines": ["20% de R$ 150 = R$ 30", "Com 20% de desconto, o preço final fica R$ 120."],
        "seo_h2": "Como calcular 20 por cento",
        "seo_text": "Para calcular 20%, multiplique o valor por 0,20. A calculadora faz essa conta automaticamente e também mostra o preço com desconto ou aumento.",
        "faq": [
            ("Quanto é 20% de 200?", "20% de 200 é 40."),
            ("Como calcular desconto de 20%?", "Informe o preço base, digite 20 no percentual e selecione desconto."),
        ],
        "related": ["calcular-10-porcento.html", "calcular-desconto.html", "aumento-percentual.html"],
    },
    {
        "file": "calcular-desconto.html",
        "title": "Calcular Desconto Online Grátis",
        "description": "Calcule desconto em reais e preço final com porcentagem. Ferramenta grátis para promoção, loja, Pix e compras.",
        "keywords": "calcular desconto, calculadora de desconto, preço com desconto, desconto porcentagem",
        "h1": "Calcular desconto",
        "eyebrow": "Preço final",
        "lead": "Veja quanto sai um desconto em reais e qual fica o preço final da compra.",
        "tool_href": "calculadora-porcentagem.html",
        "tool_label": "Abrir calculadora de desconto",
        "example_title": "Exemplo: R$ 120 com 15% de desconto",
        "example_lines": ["15% de R$ 120 = R$ 18", "Preço final: R$ 102."],
        "seo_h2": "Como calcular preço com desconto",
        "seo_text": "Digite o preço original e a porcentagem do desconto. A calculadora mostra quanto será abatido e o valor final.",
        "faq": [
            ("Como saber quanto vou economizar?", "O valor da economia é o preço original multiplicado pela porcentagem do desconto."),
            ("Funciona para Pix?", "Sim. Use o preço final para combinar ou cobrar via Pix."),
        ],
        "related": ["calcular-10-porcento.html", "calcular-20-porcento.html", "pix-copia-e-cola.html"],
    },
    {
        "file": "aumento-percentual.html",
        "title": "Calcular Aumento Percentual Grátis",
        "description": "Calcule aumento percentual, reajuste e diferença entre valor antigo e novo. Ferramenta grátis no navegador.",
        "keywords": "aumento percentual, calcular reajuste, variação percentual, diferença em porcentagem",
        "h1": "Calcular aumento percentual",
        "eyebrow": "Reajuste e variação",
        "lead": "Compare valor antigo e novo para descobrir quanto subiu em porcentagem.",
        "tool_href": "calculadora-porcentagem.html",
        "tool_label": "Calcular variação",
        "example_title": "Exemplo: de R$ 80 para R$ 100",
        "example_lines": ["Diferença: R$ 20", "Aumento percentual: 25%."],
        "seo_h2": "Como calcular aumento percentual",
        "seo_text": "Subtraia o valor antigo do novo, divida pelo valor antigo e multiplique por 100. A calculadora faz isso automaticamente.",
        "faq": [
            ("Como calcular reajuste de preço?", "Informe valor antigo e valor novo na área de variação percentual."),
            ("Serve para queda de preço?", "Sim. Se o valor novo for menor, a ferramenta mostra a queda percentual."),
        ],
        "related": ["calculadora-porcentagem.html", "calcular-desconto.html", "pix.html"],
    },
    {
        "file": "remover-acentos.html",
        "title": "Remover Acentos de Texto Online",
        "description": "Remova acentos de palavras e textos em português no navegador. Ferramenta grátis para slug, cadastro, SEO e arquivos.",
        "keywords": "remover acentos, tirar acento de texto, texto sem acento, remover acentuação",
        "h1": "Remover acentos",
        "eyebrow": "Texto simples",
        "lead": "Transforme João, São Paulo e promoção em texto sem acentos para cadastro, arquivo ou URL.",
        "tool_href": "conversor-texto.html",
        "tool_label": "Abrir conversor",
        "example_title": "Exemplo de conversão",
        "example_lines": ["São Paulo → Sao Paulo", "Promoção grátis → Promocao gratis"],
        "seo_h2": "Como remover acentos de texto",
        "seo_text": "Cole o texto no conversor e escolha a opção sem acentos. O resultado aparece no navegador e pode ser copiado.",
        "faq": [
            ("O texto é enviado para servidor?", "Não. A conversão acontece localmente no navegador."),
            ("Serve para nomes de arquivos?", "Sim. Texto sem acento ajuda em nomes de arquivo, URLs e sistemas antigos."),
        ],
        "related": ["conversor-texto.html", "gerar-slug.html", "texto-maiusculo-minusculo.html"],
    },
    {
        "file": "texto-maiusculo-minusculo.html",
        "title": "Converter Texto Maiúsculo e Minúsculo",
        "description": "Converta texto para maiúsculas, minúsculas, título ou frase. Ferramenta grátis para WhatsApp, Instagram e documentos.",
        "keywords": "texto maiúsculo minúsculo, converter maiúsculas, converter minúsculas, caixa alta",
        "h1": "Texto maiúsculo e minúsculo",
        "eyebrow": "Caixa alta e baixa",
        "lead": "Cole um texto e converta para MAIÚSCULAS, minúsculas, Título ou frase.",
        "tool_href": "conversor-texto.html",
        "tool_label": "Converter texto",
        "example_title": "Exemplos rápidos",
        "example_lines": ["bom dia brasil → BOM DIA BRASIL", "PROMOÇÃO HOJE → promoção hoje"],
        "seo_h2": "Como converter letras maiúsculas e minúsculas",
        "seo_text": "Use o conversor para alternar entre formatos de texto antes de publicar, copiar ou enviar uma mensagem.",
        "faq": [
            ("Posso usar para legenda do Instagram?", "Sim. Cole a legenda e escolha o formato desejado."),
            ("Tem opção de texto em título?", "Sim. O conversor também cria formato de título."),
        ],
        "related": ["conversor-texto.html", "remover-acentos.html", "contador-caracteres.html"],
    },
    {
        "file": "gerar-slug.html",
        "title": "Gerar Slug Online Grátis",
        "description": "Gere slug para URL, arquivo e SEO: remove acentos, troca espaços por hífen e deixa tudo em minúsculas.",
        "keywords": "gerar slug, slug online, criar slug, remover acentos URL, slug SEO",
        "h1": "Gerar slug",
        "eyebrow": "URL amigável",
        "lead": "Crie slugs simples para título de página, produto, post, arquivo ou campanha.",
        "tool_href": "conversor-texto.html",
        "tool_label": "Gerar slug agora",
        "example_title": "Exemplo de slug",
        "example_lines": ["Promoção de São João → promocao-de-sao-joao", "Brasil Tools Grátis → brasil-tools-gratis"],
        "seo_h2": "Como gerar slug para URL",
        "seo_text": "O slug remove acentos, transforma letras em minúsculas e troca espaços ou símbolos por hífen.",
        "faq": [
            ("Slug pode ter acento?", "O ideal é usar slug sem acento para evitar problemas em URLs."),
            ("Serve para SEO?", "Sim. Slugs curtos e descritivos ajudam usuários e buscadores a entenderem a página."),
        ],
        "related": ["conversor-texto.html", "remover-acentos.html", "texto-maiusculo-minusculo.html"],
    },
    {
        "file": "sorteador-instagram.html",
        "title": "Sorteador para Instagram Grátis",
        "description": "Sorteie nomes e ganhadores para Instagram usando uma lista colada no navegador. Ferramenta grátis e sem cadastro.",
        "keywords": "sorteador Instagram, sorteio Instagram grátis, sortear ganhador Instagram, sorteador de nomes",
        "h1": "Sorteador para Instagram",
        "eyebrow": "Ganhador do sorteio",
        "lead": "Cole participantes, nomes ou números e sorteie ganhadores para uma ação simples no Instagram.",
        "tool_href": "sorteador.html",
        "tool_label": "Abrir sorteador",
        "example_title": "Como usar no Instagram",
        "example_lines": ["Copie a lista de participantes.", "Cole um nome por linha e escolha quantos ganhadores sortear."],
        "seo_h2": "Sorteio simples para Instagram",
        "seo_text": "A ferramenta não acessa o Instagram automaticamente. Ela sorteia uma lista que você cola no navegador.",
        "faq": [
            ("O sorteador conecta no Instagram?", "Não. Ele sorteia nomes de uma lista colada por você."),
            ("Posso sortear mais de um ganhador?", "Sim. Informe a quantidade de ganhadores antes de sortear."),
        ],
        "related": ["sorteador.html", "sorteador-whatsapp.html", "contador-caracteres.html"],
    },
    {
        "file": "sorteador-whatsapp.html",
        "title": "Sorteador para WhatsApp Grátis",
        "description": "Sorteie nomes em grupo de WhatsApp com uma lista simples. Ferramenta grátis, local e pronta para copiar o resultado.",
        "keywords": "sorteador WhatsApp, sortear nomes WhatsApp, sorteio grupo WhatsApp, sorteador grátis",
        "h1": "Sorteador para WhatsApp",
        "eyebrow": "Grupo e brincadeira",
        "lead": "Sorteie nomes de um grupo, rifa, brincadeira, amigo secreto ou lista de presença.",
        "tool_href": "sorteador.html",
        "tool_label": "Sortear nomes",
        "example_title": "Exemplo de uso",
        "example_lines": ["Cole os nomes do grupo.", "Toque em sortear e copie o resultado para mandar no WhatsApp."],
        "seo_h2": "Como sortear nomes no WhatsApp",
        "seo_text": "Copie ou digite os participantes, um por linha, e use o sorteador local. Depois compartilhe o resultado no grupo.",
        "faq": [
            ("A lista fica salva?", "Não. A lista roda no navegador e não precisa ser enviada para servidor."),
            ("Tem botão de WhatsApp?", "Sim. O sorteador permite compartilhar o resultado pelo WhatsApp."),
        ],
        "related": ["sorteador.html", "link-whatsapp.html", "frases.html"],
    },
    {
        "file": "sorteador-numeros.html",
        "title": "Sorteador de Números Grátis",
        "description": "Sorteie números online para rifa, grupo, brincadeira ou decisão rápida. Ferramenta grátis no navegador.",
        "keywords": "sorteador de números, sortear número, número aleatório, sorteio de rifa",
        "h1": "Sorteador de números",
        "eyebrow": "Número aleatório",
        "lead": "Use para rifa, bingo simples, escolha rápida ou sorteio entre números.",
        "tool_href": "sorteador.html",
        "tool_label": "Abrir sorteador",
        "example_title": "Exemplo: números de 1 a 100",
        "example_lines": ["Use o botão 1 a 100 no sorteador.", "Escolha 1 ou mais ganhadores e toque em sortear."],
        "seo_h2": "Como sortear números",
        "seo_text": "Você pode colar uma lista de números ou usar o exemplo de 1 a 100. O sorteio é feito no navegador.",
        "faq": [
            ("Posso sortear vários números?", "Sim. Ajuste a quantidade de ganhadores."),
            ("Serve para rifa?", "Serve para sorteios simples quando você já tem os números participantes."),
        ],
        "related": ["sorteador.html", "sorteador-whatsapp.html", "sorteador-instagram.html"],
    },
    {
        "file": "gerador-senha-forte.html",
        "title": "Gerador de Senha Forte Online",
        "description": "Gere senha forte com letras, números e símbolos no navegador. Ferramenta grátis para contas, lojas e apps.",
        "keywords": "gerador de senha forte, criar senha forte, senha segura, gerar senha online",
        "h1": "Gerador de senha forte",
        "eyebrow": "Segurança local",
        "lead": "Crie uma senha forte para e-mail, loja, app, banco ou rede social sem enviar dados.",
        "tool_href": "gerador-senhas.html",
        "tool_label": "Gerar senha forte",
        "example_title": "O que uma senha forte pode ter",
        "example_lines": ["16 ou mais caracteres.", "Mistura de maiúsculas, minúsculas, números e símbolos."],
        "seo_h2": "Como criar senha forte",
        "seo_text": "Use tamanho maior e combine tipos diferentes de caracteres. Evite reutilizar a mesma senha em vários serviços.",
        "faq": [
            ("A senha gerada é salva?", "Não. A senha é gerada no navegador."),
            ("Preciso usar símbolos?", "Símbolos ajudam a aumentar a variedade, quando o serviço permite."),
        ],
        "related": ["gerador-senhas.html", "senha-aleatoria.html", "cpf.html"],
    },
    {
        "file": "senha-aleatoria.html",
        "title": "Gerar Senha Aleatória Grátis",
        "description": "Gere senha aleatória no navegador com tamanho personalizado. Ferramenta grátis, local e sem cadastro.",
        "keywords": "senha aleatória, gerar senha aleatória, senha grátis, senha segura aleatória",
        "h1": "Gerar senha aleatória",
        "eyebrow": "Random local",
        "lead": "Gere uma senha aleatória para cadastro, teste, loja ou app direto no celular.",
        "tool_href": "gerador-senhas.html",
        "tool_label": "Gerar senha",
        "example_title": "Exemplo de configuração",
        "example_lines": ["Tamanho: 16 caracteres.", "Inclua letras, números e símbolos para mais força."],
        "seo_h2": "Senha aleatória no navegador",
        "seo_text": "O gerador usa recursos do navegador para criar uma senha aleatória e permite copiar o resultado.",
        "faq": [
            ("A senha sai do meu aparelho?", "Não. A geração acontece localmente."),
            ("Posso gerar várias opções?", "Sim. A ferramenta permite gerar uma lista com várias senhas."),
        ],
        "related": ["gerador-senhas.html", "gerador-senha-forte.html", "conversor-texto.html"],
    },
    {
        "file": "link-whatsapp-com-mensagem.html",
        "title": "Link WhatsApp com Mensagem Pronta",
        "description": "Crie link do WhatsApp com mensagem pronta para cliente, orçamento, pedido e atendimento. Grátis e sem cadastro.",
        "keywords": "link WhatsApp com mensagem, WhatsApp mensagem pronta, gerar link wa.me, link atendimento WhatsApp",
        "h1": "Link WhatsApp com mensagem",
        "eyebrow": "Atendimento rápido",
        "lead": "Monte um link wa.me com texto inicial para cliente tocar e abrir a conversa já preenchida.",
        "tool_href": "link-whatsapp.html",
        "tool_label": "Gerar link com mensagem",
        "example_title": "Exemplo de mensagem",
        "example_lines": ["Olá! Vim pelo Instagram e quero saber mais.", "Oi, gostaria de pedir um orçamento."],
        "seo_h2": "Como criar link do WhatsApp com mensagem",
        "seo_text": "Digite o número com DDD, escreva a mensagem e copie o link gerado. A ferramenta codifica o texto para funcionar no WhatsApp.",
        "faq": [
            ("Precisa salvar contato?", "Não. O link abre a conversa pelo número informado."),
            ("Funciona em anúncio e bio?", "Sim. Você pode colar o link em bio, cardápio, anúncio ou página de atendimento."),
        ],
        "related": ["link-whatsapp.html", "contador-caracteres.html", "frases.html"],
    },
    {
        "file": "link-whatsapp-para-instagram.html",
        "title": "Link WhatsApp para Instagram",
        "description": "Gere link WhatsApp para colocar no Instagram, bio, stories, loja e anúncio. Ferramenta grátis para brasileiros.",
        "keywords": "link WhatsApp Instagram, link para bio Instagram WhatsApp, wa.me Instagram, WhatsApp para loja",
        "h1": "Link WhatsApp para Instagram",
        "eyebrow": "Bio e atendimento",
        "lead": "Crie um link curto de atendimento para colocar na bio do Instagram ou enviar em posts e stories.",
        "tool_href": "link-whatsapp.html",
        "tool_label": "Criar link para Instagram",
        "example_title": "Onde usar",
        "example_lines": ["Bio do Instagram.", "Stories, destaques, anúncio e descrição de produto."],
        "seo_h2": "Como colocar WhatsApp na bio do Instagram",
        "seo_text": "Gere o link com número e mensagem pronta, copie o resultado e cole no campo de site da bio ou no material de divulgação.",
        "faq": [
            ("Posso usar número com DDD?", "Sim. Para Brasil, informe DDD e número; a ferramenta usa o código +55."),
            ("Dá para editar a mensagem depois?", "Sim. Volte ao gerador, altere o texto e copie um novo link."),
        ],
        "related": ["link-whatsapp-com-mensagem.html", "contador-caracteres-instagram.html", "imagem.html"],
    },
    {
        "file": "link-whatsapp-para-bio.html",
        "title": "Link WhatsApp para Bio Grátis",
        "description": "Crie link de WhatsApp para bio com mensagem pronta. Ideal para Instagram, TikTok, loja e atendimento simples.",
        "keywords": "link WhatsApp bio, WhatsApp para bio, criar link para bio, link wa.me bio",
        "h1": "Link WhatsApp para bio",
        "eyebrow": "Bio clicável",
        "lead": "Deixe sua bio pronta para receber pedidos, dúvidas e orçamentos pelo WhatsApp.",
        "tool_href": "link-whatsapp.html",
        "tool_label": "Criar link para bio",
        "example_title": "Exemplo de link para bio",
        "example_lines": ["Mensagem: Olá! Quero saber mais.", "Use o link gerado no campo de site da rede social."],
        "seo_h2": "Link de WhatsApp na bio",
        "seo_text": "Um link de WhatsApp para bio reduz o caminho entre visitante e conversa. Use uma mensagem curta e clara.",
        "faq": [
            ("A pessoa precisa copiar o número?", "Não. Ela toca no link e abre a conversa."),
            ("Serve para pequeno negócio?", "Sim. É útil para loja, salão, serviço, delivery e atendimento autônomo."),
        ],
        "related": ["link-whatsapp.html", "link-whatsapp-para-instagram.html", "gerar-slug.html"],
    },
    {
        "file": "contador-caracteres-instagram.html",
        "title": "Contador de Caracteres para Instagram",
        "description": "Conte caracteres para legenda, bio e comentário do Instagram. Ferramenta grátis, local e fácil de usar no celular.",
        "keywords": "contador caracteres Instagram, contador legenda Instagram, limite bio Instagram, contar letras Instagram",
        "h1": "Contador de caracteres para Instagram",
        "eyebrow": "Legenda e bio",
        "lead": "Ajuste legenda, bio, comentário e chamada antes de publicar no Instagram.",
        "tool_href": "contador-caracteres.html",
        "tool_label": "Contar caracteres",
        "example_title": "Limites comuns",
        "example_lines": ["Bio curta e direta.", "Legenda revisada antes de postar."],
        "seo_h2": "Como contar caracteres da legenda",
        "seo_text": "Cole a legenda no contador e acompanhe caracteres, palavras, linhas e limite personalizado.",
        "faq": [
            ("O texto fica salvo?", "Não. A contagem roda no navegador."),
            ("Posso usar com emojis?", "Sim. Cole a legenda completa e confira o tamanho antes de publicar."),
        ],
        "related": ["contador-caracteres.html", "frases-status-whatsapp.html", "link-whatsapp-para-instagram.html"],
    },
    {
        "file": "contador-caracteres-whatsapp.html",
        "title": "Contador de Caracteres para WhatsApp",
        "description": "Conte caracteres de mensagem para WhatsApp, status, grupo e atendimento. Ferramenta grátis no navegador.",
        "keywords": "contador caracteres WhatsApp, contar mensagem WhatsApp, texto para status WhatsApp, limite mensagem",
        "h1": "Contador de caracteres para WhatsApp",
        "eyebrow": "Mensagem enxuta",
        "lead": "Revise mensagem de atendimento, status e grupo antes de copiar para o WhatsApp.",
        "tool_href": "contador-caracteres.html",
        "tool_label": "Contar mensagem",
        "example_title": "Exemplo de uso",
        "example_lines": ["Mensagem de promoção.", "Resposta pronta para cliente ou grupo."],
        "seo_h2": "Como contar texto para WhatsApp",
        "seo_text": "Cole a mensagem no contador para ver caracteres, palavras e linhas. Depois copie o texto ajustado.",
        "faq": [
            ("Serve para status?", "Sim. Use para preparar textos curtos para status."),
            ("Envia a mensagem para servidor?", "Não. Tudo acontece localmente no navegador."),
        ],
        "related": ["contador-caracteres.html", "link-whatsapp-com-mensagem.html", "frases.html"],
    },
    {
        "file": "comprimir-imagem-whatsapp.html",
        "title": "Comprimir Imagem para WhatsApp",
        "description": "Reduza tamanho de foto para enviar no WhatsApp e economizar dados móveis. Compressor grátis direto no navegador.",
        "keywords": "comprimir imagem WhatsApp, reduzir foto WhatsApp, diminuir tamanho imagem, compressor de foto celular",
        "h1": "Comprimir imagem para WhatsApp",
        "eyebrow": "Menos dados móveis",
        "lead": "Comprima fotos grandes no próprio celular antes de enviar no WhatsApp ou postar no status.",
        "tool_href": "imagem.html",
        "tool_label": "Comprimir foto",
        "example_title": "Quando usar",
        "example_lines": ["Foto pesada tirada no celular.", "Imagem para enviar em grupo com internet fraca."],
        "seo_h2": "Como reduzir foto para WhatsApp",
        "seo_text": "Selecione a imagem, ajuste qualidade e baixe uma versão menor. O processamento usa Canvas no navegador.",
        "faq": [
            ("A foto é enviada para servidor?", "Não. A compressão é local no navegador."),
            ("Funciona em Android?", "Sim. A página foi pensada para uso no celular."),
        ],
        "related": ["imagem.html", "reduzir-tamanho-foto.html", "frases-status-whatsapp.html"],
    },
    {
        "file": "reduzir-tamanho-foto.html",
        "title": "Reduzir Tamanho de Foto Online",
        "description": "Reduza tamanho de foto JPG, PNG ou WebP no navegador. Ferramenta grátis para celular, WhatsApp e Instagram.",
        "keywords": "reduzir tamanho foto, diminuir foto online, comprimir foto grátis, foto menor celular",
        "h1": "Reduzir tamanho de foto",
        "eyebrow": "Foto mais leve",
        "lead": "Transforme uma foto pesada em um arquivo menor para enviar, postar ou guardar.",
        "tool_href": "imagem.html",
        "tool_label": "Reduzir foto",
        "example_title": "Exemplo de economia",
        "example_lines": ["Foto original: 4 MB.", "Versão comprimida: pode ficar muito menor dependendo da qualidade."],
        "seo_h2": "Como diminuir o tamanho de uma foto",
        "seo_text": "Use o compressor, escolha qualidade e formato de saída. Em celulares modestos, use o modo automático.",
        "faq": [
            ("Perde qualidade?", "Pode haver redução visual dependendo da qualidade escolhida."),
            ("Precisa instalar app?", "Não. A ferramenta roda no navegador."),
        ],
        "related": ["imagem.html", "comprimir-imagem-whatsapp.html", "cortar-foto-instagram.html"],
    },
    {
        "file": "cortar-foto-instagram.html",
        "title": "Cortar Foto para Instagram",
        "description": "Corte foto para feed, stories, avatar e grade 3x3 do Instagram. Ferramenta grátis com processamento local.",
        "keywords": "cortar foto Instagram, recortar foto feed, avatar Instagram, grade 3x3 Instagram, foto para stories",
        "h1": "Cortar foto para Instagram",
        "eyebrow": "Feed e stories",
        "lead": "Prepare foto quadrada, vertical, avatar ou grade 3x3 sem subir a imagem para servidor.",
        "tool_href": "imagem.html",
        "tool_label": "Cortar foto",
        "example_title": "Formatos úteis",
        "example_lines": ["Feed 1:1 ou 4:5.", "Stories 9:16 e avatar 1:1."],
        "seo_h2": "Como cortar foto para o Instagram",
        "seo_text": "Abra a ferramenta de fotos, selecione imagem e escolha o formato ideal para feed, stories ou avatar.",
        "faq": [
            ("Tem grade 3x3?", "Sim. A ferramenta principal inclui modo de grade 3x3."),
            ("A imagem sai do aparelho?", "Não. O corte roda localmente com Canvas."),
        ],
        "related": ["imagem.html", "reduzir-tamanho-foto.html", "contador-caracteres-instagram.html"],
    },
    {
        "file": "gerar-pix-copia-e-cola.html",
        "title": "Gerar Pix Copia e Cola Online",
        "description": "Gere Pix Copia e Cola estático com chave, valor, nome e cidade. Ferramenta grátis, local e sem API.",
        "keywords": "gerar Pix copia e cola, código Pix online, Pix estático, gerador Pix grátis",
        "h1": "Gerar Pix Copia e Cola",
        "eyebrow": "Código Pix local",
        "lead": "Monte um código Pix estático para copiar e conferir no aplicativo do banco.",
        "tool_href": "pix-copia-e-cola.html",
        "tool_label": "Gerar código Pix",
        "example_title": "Dados necessários",
        "example_lines": ["Chave Pix.", "Nome do recebedor, cidade e valor opcional."],
        "seo_h2": "Como gerar Pix Copia e Cola",
        "seo_text": "Preencha chave Pix, nome e cidade. A ferramenta monta o payload e calcula o CRC no navegador.",
        "faq": [
            ("É Pix dinâmico?", "Não. A página gera um Pix estático simples."),
            ("Preciso conferir no banco?", "Sim. Sempre confira os dados no app do banco antes de pagar ou compartilhar."),
        ],
        "related": ["pix-copia-e-cola.html", "dividir-conta-pix.html", "link-whatsapp.html"],
    },
    {
        "file": "dividir-conta-pix.html",
        "title": "Dividir Conta no Pix",
        "description": "Divida conta entre amigos e veja quem deve pagar quem via Pix. Ferramenta grátis para churrasco, viagem e rolê.",
        "keywords": "dividir conta Pix, racha conta Pix, quem paga quem Pix, calculadora dividir conta, Pix amigos",
        "h1": "Dividir conta no Pix",
        "eyebrow": "Racha simples",
        "lead": "Cadastre pessoas e gastos para calcular os menores acertos via Pix.",
        "tool_href": "pix.html",
        "tool_label": "Abrir Racha Pix",
        "example_title": "Exemplo de racha",
        "example_lines": ["Ana pagou o mercado.", "João pagou o Uber. A ferramenta calcula os acertos."],
        "seo_h2": "Como dividir conta entre amigos",
        "seo_text": "Adicione participantes, lance despesas e veja quanto cada pessoa precisa transferir para equilibrar a conta.",
        "faq": [
            ("Os dados ficam online?", "Não. O racha fica salvo apenas no navegador."),
            ("Serve para viagem?", "Sim. Você pode lançar vários gastos ao longo da viagem."),
        ],
        "related": ["pix.html", "gerar-pix-copia-e-cola.html", "calculadora-porcentagem.html"],
    },
    {
        "file": "validar-cpf-online.html",
        "title": "Validar CPF Online Grátis",
        "description": "Valide CPF online pelo cálculo dos dígitos verificadores. Ferramenta grátis, local e sem consulta oficial.",
        "keywords": "validar CPF online, validador CPF grátis, conferir CPF, CPF dígitos verificadores",
        "h1": "Validar CPF online",
        "eyebrow": "Dígitos verificadores",
        "lead": "Confira se um CPF tem 11 dígitos e passa no cálculo matemático dos verificadores.",
        "tool_href": "cpf.html",
        "tool_label": "Validar CPF",
        "example_title": "O que a ferramenta verifica",
        "example_lines": ["Quantidade de dígitos.", "Cálculo do primeiro e segundo dígito verificador."],
        "seo_h2": "Como validar CPF online",
        "seo_text": "Digite o CPF com ou sem pontuação. O validador remove símbolos e confere os dígitos verificadores no navegador.",
        "faq": [
            ("Consulta a Receita Federal?", "Não. A ferramenta não consulta bases oficiais."),
            ("CPF válido confirma identidade?", "Não. Apenas indica que os dígitos batem matematicamente."),
        ],
        "related": ["cpf.html", "formatar-cpf.html", "validar-cnpj-online.html"],
    },
    {
        "file": "formatar-cpf.html",
        "title": "Formatar CPF Online",
        "description": "Formate CPF com pontos e traço ou copie apenas os números. Ferramenta grátis no navegador e sem cadastro.",
        "keywords": "formatar CPF, CPF com pontuação, remover pontuação CPF, copiar CPF formatado",
        "h1": "Formatar CPF",
        "eyebrow": "Com ou sem pontuação",
        "lead": "Cole um CPF e copie no formato 000.000.000-00 ou apenas com números.",
        "tool_href": "cpf.html",
        "tool_label": "Formatar CPF",
        "example_title": "Exemplo de formatação",
        "example_lines": ["12345678909 → 123.456.789-09", "123.456.789-09 → 12345678909"],
        "seo_h2": "Como formatar CPF",
        "seo_text": "O formatador remove caracteres extras, limita a 11 dígitos e mostra o CPF no padrão brasileiro.",
        "faq": [
            ("Também valida o CPF?", "Sim. A ferramenta principal mostra se os dígitos são válidos."),
            ("O CPF digitado é enviado?", "Não. A formatação acontece localmente."),
        ],
        "related": ["cpf.html", "validar-cpf-online.html", "formatar-cnpj.html"],
    },
    {
        "file": "validar-cnpj-online.html",
        "title": "Validar CNPJ Online Grátis",
        "description": "Valide CNPJ online pelo cálculo dos dígitos verificadores. Ferramenta grátis, local e sem consulta à Receita.",
        "keywords": "validar CNPJ online, validador CNPJ grátis, conferir CNPJ, CNPJ dígitos verificadores",
        "h1": "Validar CNPJ online",
        "eyebrow": "Empresa e loja",
        "lead": "Confira se um CNPJ tem 14 dígitos e passa no cálculo dos verificadores.",
        "tool_href": "cnpj.html",
        "tool_label": "Validar CNPJ",
        "example_title": "O que é conferido",
        "example_lines": ["Quantidade de dígitos.", "Primeiro e segundo dígito verificador."],
        "seo_h2": "Como validar CNPJ online",
        "seo_text": "Digite o CNPJ com ou sem pontuação. A ferramenta confere o formato e os dígitos verificadores localmente.",
        "faq": [
            ("Consulta empresa ativa?", "Não. Não há consulta à Receita Federal."),
            ("CNPJ válido garante empresa real?", "Não. A validação é apenas matemática."),
        ],
        "related": ["cnpj.html", "formatar-cnpj.html", "validar-cpf-online.html"],
    },
    {
        "file": "formatar-cnpj.html",
        "title": "Formatar CNPJ Online",
        "description": "Formate CNPJ com pontos, barra e traço ou copie apenas os números. Ferramenta grátis direto no navegador.",
        "keywords": "formatar CNPJ, CNPJ com pontuação, remover pontuação CNPJ, copiar CNPJ formatado",
        "h1": "Formatar CNPJ",
        "eyebrow": "Cadastro de empresa",
        "lead": "Cole um CNPJ e copie no formato 00.000.000/0000-00 ou apenas com números.",
        "tool_href": "cnpj.html",
        "tool_label": "Formatar CNPJ",
        "example_title": "Exemplo de formatação",
        "example_lines": ["11222333000181 → 11.222.333/0001-81", "11.222.333/0001-81 → 11222333000181"],
        "seo_h2": "Como formatar CNPJ",
        "seo_text": "O formatador remove caracteres extras, limita a 14 dígitos e mostra o CNPJ no padrão brasileiro.",
        "faq": [
            ("Também valida o CNPJ?", "Sim. A ferramenta principal mostra se os dígitos são válidos."),
            ("Precisa de API?", "Não. Tudo roda no navegador."),
        ],
        "related": ["cnpj.html", "validar-cnpj-online.html", "formatar-cpf.html"],
    },
]


def analytics_script():
    return """    <script>
        (function() {
            window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
            const script = document.createElement('script');
            script.src = '/_vercel/insights/script.js';
            script.defer = true;
            document.head.appendChild(script);
        })();
    </script>"""


def json_script(data):
    return "    <script type=\"application/ld+json\">\n" + json.dumps(data, ensure_ascii=False, indent=4) + "\n    </script>"


def page_title(file_name):
    for page in PAGES:
        if page["file"] == file_name:
            return page["h1"]
    labels = {
        "calculadora-porcentagem.html": "Calculadora de porcentagem",
        "conversor-texto.html": "Conversor de texto",
        "sorteador.html": "Sorteador",
        "gerador-senhas.html": "Gerador de senhas",
        "contador-caracteres.html": "Contador de caracteres",
        "link-whatsapp.html": "Link WhatsApp",
        "frases.html": "Frases para WhatsApp",
        "pix.html": "Racha Pix",
        "pix-copia-e-cola.html": "Pix Copia e Cola",
        "cpf.html": "Validador de CPF",
        "cnpj.html": "Validador de CNPJ",
        "imagem.html": "Fotos sociais",
        "link-whatsapp.html": "Link WhatsApp",
    }
    return labels.get(file_name, file_name.replace(".html", "").replace("-", " "))


def related_cards(page):
    cards = []
    for href in page["related"]:
        cards.append(f"""                <a class="related-card" href="{href}">
                    <strong>{html.escape(page_title(href))}</strong>
                    <span>{html.escape('Abra uma página relacionada para continuar a tarefa.')}</span>
                </a>""")
    if page["tool_href"] not in page["related"]:
        cards.append(f"""                <a class="related-card" href="{page["tool_href"]}">
                    <strong>{html.escape(page["tool_label"])}</strong>
                    <span>Use a ferramenta principal com todos os controles.</span>
                </a>""")
    cards.append("""                <a class="related-card" href="mapa-do-site.html">
                    <strong>Mapa do site</strong>
                    <span>Veja todas as ferramentas gratuitas do Brasil Tools.</span>
                </a>""")
    return "\n".join(cards[:4])


def build_page(page):
    url = f"{BASE_URL}/{page['file']}"
    app_schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": page["title"],
        "url": url,
        "inLanguage": "pt-BR",
        "description": page["description"],
    }
    breadcrumb_schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Brasil Tools", "item": f"{BASE_URL}/"},
            {"@type": "ListItem", "position": 2, "name": page_title(page["tool_href"]), "item": f"{BASE_URL}/{page['tool_href']}"},
            {"@type": "ListItem", "position": 3, "name": page["h1"], "item": url},
        ],
    }
    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": question, "acceptedAnswer": {"@type": "Answer", "text": answer}}
            for question, answer in page["faq"]
        ],
    }
    example_lines = "\n".join(
        f"""                    <article class="phrase-card">
                        <p class="phrase-text">{html.escape(line)}</p>
                    </article>"""
        for line in page["example_lines"][:3]
    )
    faq_html = "\n".join(f"""            <h3>{html.escape(question)}</h3>
            <p>{html.escape(answer)}</p>""" for question, answer in page["faq"])
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(page["title"])}</title>
    <meta name="description" content="{html.escape(page["description"])}">
    <meta name="keywords" content="{html.escape(page["keywords"])}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta name="theme-color" content="#1f8f54">
    <link rel="canonical" href="{url}">
    <link rel="alternate" hreflang="pt-BR" href="{url}">
    <link rel="icon" href="favicon.svg" type="image/svg+xml">
    <link rel="manifest" href="site.webmanifest">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="Brasil Tools">
    <meta property="og:title" content="{html.escape(page["title"])}">
    <meta property="og:description" content="{html.escape(page["description"])}">
    <meta property="og:url" content="{url}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{html.escape(page["title"])}">
    <meta name="twitter:description" content="{html.escape(page["description"])}">
    <link rel="stylesheet" href="styles.css">
{json_script(app_schema)}
{json_script(breadcrumb_schema)}
{json_script(faq_schema)}
{analytics_script()}
</head>
<body>
    <header class="site-header">
        <nav class="nav" aria-label="Navegação principal">
            <a class="brand" href="index.html"><span class="brand-mark">BR</span><span>Brasil Tools</span></a>
            <div class="nav-links">
                <a class="nav-link" href="index.html">Início</a>
                <a class="nav-link" href="link-whatsapp.html">WhatsApp</a>
                <a class="nav-link" href="contador-caracteres.html">Contador</a>
                <a class="nav-link" href="imagem.html">Fotos</a>
                <a class="nav-link" href="pix.html">Pix</a>
                <a class="nav-link" href="cpf.html">CPF</a>
                <a class="nav-link" href="cnpj.html">CNPJ</a>
                <a class="nav-link" href="calculadora-porcentagem.html">Porcentagem</a>
                <a class="nav-link" href="conversor-texto.html">Texto</a>
                <a class="nav-link" href="sorteador.html">Sorteador</a>
                <a class="nav-link" href="gerador-senhas.html">Senhas</a>
            </div>
        </nav>
    </header>

    <main class="wrap section">
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="index.html">Início</a>
            <span>/</span>
            <a href="{page["tool_href"]}">{html.escape(page_title(page["tool_href"]))}</a>
            <span>/</span>
            <span>{html.escape(page["h1"])}</span>
        </nav>

        <div class="panel-header">
            <div>
                <p class="eyebrow">{html.escape(page["eyebrow"])}</p>
                <h1>{html.escape(page["h1"])}</h1>
                <p class="lead">{html.escape(page["lead"])}</p>
            </div>
            <a class="btn" href="{page["tool_href"]}">{html.escape(page["tool_label"])}</a>
        </div>

        <div class="tool-layout">
            <aside class="tool-panel">
                <h3>Use a ferramenta grátis</h3>
                <p>Abra a ferramenta principal para preencher valores, copiar resultado e usar todos os controles no celular.</p>
                <div class="toolbar">
                    <a class="btn" href="{page["tool_href"]}">{html.escape(page["tool_label"])}</a>
                    <a class="btn secondary" href="mapa-do-site.html">Ver outras</a>
                </div>
                <div class="ad-slot">Anúncio lateral</div>
            </aside>

            <section class="tool-panel">
                <div class="panel-header">
                    <h2>{html.escape(page["example_title"])}</h2>
                    <span class="chip active">Exemplo</span>
                </div>
                <div class="phrase-list">
{example_lines}
                </div>
                <article class="seo-content">
                    <h2>{html.escape(page["seo_h2"])}</h2>
                    <p>{html.escape(page["seo_text"])}</p>
                </article>
            </section>
        </div>

        <article class="seo-content">
            <h2>{html.escape(page["title"])}</h2>
            <p>{html.escape(page["description"])}</p>
{faq_html}
        </article>

        <section class="seo-content" aria-labelledby="relacionadas">
            <h2 id="relacionadas">Ferramentas relacionadas</h2>
            <div class="related-grid">
{related_cards(page)}
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="footer-links">
            <a href="{page["tool_href"]}">{html.escape(page_title(page["tool_href"]))}</a>
            <a href="link-whatsapp.html">WhatsApp</a>
            <a href="contador-caracteres.html">Contador</a>
            <a href="imagem.html">Fotos</a>
            <a href="pix.html">Pix</a>
            <a href="cpf.html">CPF</a>
            <a href="cnpj.html">CNPJ</a>
            <a href="calculadora-porcentagem.html">Porcentagem</a>
            <a href="conversor-texto.html">Texto</a>
            <a href="sorteador.html">Sorteador</a>
            <a href="gerador-senhas.html">Senhas</a>
            <a href="mapa-do-site.html">Mapa do site</a>
        </div>
        Página leve em português do Brasil, pronta para celular.
    </footer>
</body>
</html>
"""


def main():
    for page in PAGES:
        Path(page["file"]).write_text(build_page(page), encoding="utf-8")


if __name__ == "__main__":
    main()
