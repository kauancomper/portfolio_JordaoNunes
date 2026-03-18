import os
import asyncio
import json
import re
import random
from datetime import datetime, timezone
from playwright.async_api import async_playwright
try:
    from playwright_stealth import stealth_async as stealth_func
except ImportError:
    try:
        from playwright_stealth import stealth as stealth_func
    except ImportError:
        stealth_func = None

# Configurações de Filtro e Automação
ANOS_LIMITE = 3
LIMITE_MAX_POSTS = 25
INTERVALO_MINUTOS = 60 # Tempo de espera entre verificações
HEADLESS = True 
# Credenciais via Variáveis de Ambiente (Configure no Easypanel)
INSTA_USER = os.getenv("INSTA_USER", "jordaonunes")
INSTA_PASS = os.getenv("INSTA_PASS", "")
PROXY_SERVER = os.getenv("PROXY_SERVER", "") # Ex: http://user:pass@host:port

# Palavras-chave por Categoria (Refinado para Eventos Sociais)
CAT_KEYWORDS = {
    "nature": [
        "natureza", "pássaro", "animal", "flor", "fauna", "flora", "wildlife", "inseto", "réptil", # Específicos
        "rio", "amazônia", "paisagem", "parque", "árvore", "floresta", "mata", "céu", "nuvem", "pôr do sol", "nascer do sol" # Gerais
    ],
    "social": [
        "círio", "nazare", "festejo", "junino", "junina", "quadrilha", "expoama", "exposição", "festa", "evento", "casamento", "aniversário", "workshop", # Eventos FORTES
        "povo", "pessoa", "sociedade", "tradição", "cultura", "gente", "comunidade", "público", # Sociedade
        "urbano", "cidade", "ponte", "praça", "rua", "prédio", "arquitetura", "skyline", "marabá", "avenida", "centro", "histórico" # Urbano/Cidade
    ]
}

# Subconjunto de palavras que definem SOCIAL independente de ter natureza no fundo
SOCIAL_STRONG = ["círio", "nazare", "festejo", "junino", "junina", "quadrilha", "expoama", "exposição", "festa", "evento"]

def categorizar_post(caption, alt_texts):
    texto_imagens = " ".join(alt_texts).lower()
    texto_legenda = caption.lower()
    texto_total = f"{texto_imagens} {texto_legenda}"
    
    # 1. PRIORIDADE MÁXIMA: Se for um evento social conhecido (Mesmo que tenha rio/natureza)
    for k in SOCIAL_STRONG:
        if k in texto_total: return "social"

    # 2. SEGUNDA PRIORIDADE: Natureza Específica (Animais, Pássaros, etc no Alt-Text)
    especificos_nature = ["pássaro", "animal", "flor", "fauna", "flora", "wildlife", "inseto", "réptil"]
    for k in especificos_nature:
        if k in texto_imagens: return "nature"

    # 3. Terceira Prioridade: Outros termos de Natureza (Geral)
    for k in CAT_KEYWORDS["nature"]:
        if k in texto_imagens: return "nature"

    # 4. Fallback para Social geral
    for k in CAT_KEYWORDS["social"]:
        if k in texto_imagens: return "social"

    # 5. Fallback para legenda (mesma ordem)
    for k in CAT_KEYWORDS["nature"]:
        if k in texto_legenda: return "nature"
    for k in CAT_KEYWORDS["social"]:
        if k in texto_legenda: return "social"
        
    return "social" # Default para os que sobrarem como urbano/social

def passa_no_filtro(caption, alt_texts):
    # Aceita quase tudo que tenha as palavras chave, mas agora o foco é a classificação correta
    texto = (caption + " " + " ".join(alt_texts)).lower()
    all_keywords = [item for sublist in CAT_KEYWORDS.values() for item in sublist]
    return any(k in texto for k in all_keywords)

async def extrair_instagram_dom(username):
    print(f"Iniciando raspagem focada nas {LIMITE_MAX_POSTS} publicações...")
    print("Modo de Extração: Simulação Humana (Aberto o Modal) para evitar bloqueio de API.")
    
    async with async_playwright() as p:
        session_file = "instagram_session.json"
        
        # Configura Proxy se disponível
        browser_args = ["--disable-blink-features=AutomationControlled"]
        proxy_config = None
        if PROXY_SERVER:
            proxy_config = {"server": PROXY_SERVER}
            print(f"Usando Proxy: {PROXY_SERVER}")

        # Inicia o navegador com argumentos anti-detecção
        browser = await p.chromium.launch(
            headless=HEADLESS,
            args=browser_args,
            proxy=proxy_config
        )
        
        if os.path.exists(session_file):
            context = await browser.new_context(
                storage_state=session_file,
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                proxy=proxy_config
            )
        else:
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                proxy=proxy_config
            )

        page = await context.new_page()
        if stealth_func:
            try:
                if hasattr(stealth_func, 'stealth'):
                    await stealth_func.stealth(page)
                else:
                    await stealth_func(page)
                print("Modo Stealth ativado.")
            except Exception as e:
                print(f"Aviso: Falha ao ativar modo Stealth: {e}")
        
        print("Acessando Instagram...")
        await page.goto("https://www.instagram.com/", wait_until="networkidle")
        
        # 1. TENTA LOGIN POR SESSÃO OU POR CREDENCIAIS
        try:
            await page.wait_for_selector('svg[aria-label="Página inicial"]', timeout=7000)
            print("Sessão ativa confirmada!")
        except:
            print("Sessão expirada ou inexistente. Tentando login automático...")
            if not INSTA_PASS:
                print("⚠️ ERRO: Senha não configurada (INSTA_PASS). O login manual será necessário.")
                await page.wait_for_selector('svg[aria-label="Página inicial"]', timeout=300000)
            else:
                # Lógica de Login Humano
                try:
                    await page.wait_for_selector('input[name="username"]', timeout=10000)
                    
                    # Simula digitação humana
                    async def type_human(selector, text):
                        await page.click(selector)
                        for char in text:
                            await page.keyboard.type(char, delay=random.randint(50, 200))
                            await asyncio.sleep(random.uniform(0.05, 0.15))

                    await type_human('input[name="username"]', INSTA_USER)
                    await asyncio.sleep(random.uniform(1, 2))
                    await type_human('input[name="password"]', INSTA_PASS)
                    await asyncio.sleep(random.uniform(1, 2))
                    
                    # Clica no botão de login
                    await page.click('button[type="submit"]')
                    
                    # Espera o login concluir ou pedir 2FA
                    await page.wait_for_selector('svg[aria-label="Página inicial"]', timeout=20000)
                    print("Login realizado com sucesso!")
                    await context.storage_state(path=session_file)
                except Exception as e:
                    print(f"❌ Falha no login automático: {e}")
                    print("Verifique se há Desafio de Segurança (Capcha/2FA).")
                    await page.wait_for_timeout(30000) # Espera um pouco antes de desistir

        print(f"\nAcessando perfil: @{username}")
        await page.goto(f"https://www.instagram.com/{username}/", timeout=60000)
        
        # Espera carregar a grid
        try:
            print("Aguardando carregamento inicial das publicações...")
            await page.wait_for_selector('a[href*="/p/"], a[href*="/reel/"]', timeout=30000)
        except Exception:
            print("Aviso: Demora para carregar a grid ou o perfil pode estar vazio. O script tentará rolar a página para forçar.")
            await page.evaluate("window.scrollBy(0, 500)")
            await page.wait_for_timeout(3000)
        
        postagens = []
        processados = set()
        parou = False
        
        limite_timestamp = datetime.now().timestamp() - (ANOS_LIMITE * 365 * 24 * 60 * 60)

        while not parou:
            posts_na_tela = await page.query_selector_all('a[href*="/p/"], a[href*="/reel/"]')
            novos = False

            for post in posts_na_tela:
                if parou: break
                
                # Se já inspecionou 20 publicações no total (passando ou não no filtro), encerra.
                if len(processados) >= LIMITE_MAX_POSTS:
                    print(f"\n[OK] Foco Atingido: As {LIMITE_MAX_POSTS} postagens mais recentes foram inspecionadas.")
                    parou = True
                    break
                    
                href = await post.get_attribute("href")
                match = re.search(r'/(?:p|reel)/([^/]+)', href)
                if not match: continue

                
                shortcode = match.group(1)
                if shortcode in processados: continue
                
                processados.add(shortcode)
                novos = True
                
                print(f"\nInspecionando {shortcode}...")

                # 1. Filtro Visual na Grid (Descartar Reels visualmente se possível)
                svgs = await post.query_selector_all('svg')
                is_video_grid = False
                for svg in svgs:
                    label = await svg.get_attribute('aria-label')
                    if label == 'Reels' or label == 'Vídeo':
                        is_video_grid = True
                
                if is_video_grid or '/reel/' in href:
                    print("[Ignorado] É um Vídeo/Reel.")
                    continue

                # 2. Clicar e abrir o Modal
                try:
                    await post.scroll_into_view_if_needed()
                    await page.wait_for_timeout(500)
                    await post.click(force=True)
                    # Espera a legenda aparecer dentro do modal (role='dialog')
                    await page.wait_for_selector('role=dialog >> h1', timeout=10000)
                    await page.wait_for_timeout(3000) # Tempo ampliado para carregar imagens e legenda
                except Exception as e:
                    print(f"❌ (Erro ao abrir post {shortcode}): {type(e).__name__} - {str(e)}")
                    # Escapa de possíveis sobreposições
                    await page.keyboard.press("Escape")
                    continue

                # Pega a data
                try:
                    time_elem = await page.query_selector('role=dialog >> time')
                    datetime_str = await time_elem.get_attribute('datetime') if time_elem else None
                    if not datetime_str:
                        raise ValueError()

                    # Instagram datetime example: 2025-11-23T15:31:34.000Z
                    dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
                    taken_at = dt.timestamp()
                    
                    if taken_at < limite_timestamp:
                        print(f"[Aviso] Limite de 3 anos atingido ({dt.strftime('%Y')}). Finalizando.")
                        parou = True
                        await page.keyboard.press("Escape")
                        break
                        
                except Exception:
                    print("[Erro] Falha ao extrair data")
                    await page.keyboard.press("Escape")
                    continue

                # Pega a legenda baseada na tag h1 específica do modal
                caption = ""
                try:
                    h1_elems = await page.query_selector_all('role=dialog >> h1')
                    for h1 in h1_elems:
                        # Pega o texto de dentro do h1, que geralmente é a legenda principal
                        caption += await h1.inner_text() + " "
                except:
                    pass

                # Filtro de Palavras Baseado na Legenda ou no ALT da imagem inicial
                
                # Coleta as imagens e ALT-TEXTS iterando o carrossel se existir
                urls = []
                alt_texts = []
                try:
                    # Encontra o botão de próximo
                    next_button_selector = 'role=dialog >> button[aria-label="Avançar"]'
                    
                    while True:
                        # Extrai as URLs das imagens visíveis na tela no momento
                        imgs = await page.query_selector_all('role=dialog >> img')
                        for img in imgs:
                            src = await img.get_attribute('src')
                            alt = await img.get_attribute('alt') or ""
                            style = await img.get_attribute('style') or ""
                            
                            if not src: continue
                            
                            # Filtro: A foto principal do post no Insta obrigatoriamente tem "srcset" ou "object-fit: cover"
                            eh_imagem_principal =  ("object-fit" in style) or ("1080x1080" in src)
                            
                            if eh_imagem_principal:
                                if src not in urls:
                                    urls.append(src)
                                if alt and alt not in alt_texts:
                                    alt_texts.append(alt)
                        
                        # Tenta clicar no próximo do carrossel
                        try:
                            next_btn = await page.query_selector(next_button_selector)
                            if next_btn:
                                await next_btn.click(timeout=3000)
                                await page.wait_for_timeout(1000) 
                            else:
                                break
                        except:
                            break
                            
                except Exception as e:
                    print(f"Aviso ao extrair carrossel.")

                # Fecha o Modal
                try:
                    # Tenta clicar no botão de fechar (X)
                    close_btn = await page.query_selector('svg[aria-label="Fechar"]')
                    if close_btn:
                        await close_btn.click(force=True)
                    else:
                        await page.keyboard.press("Escape")
                    
                    # Espera o modal desaparecer
                    await page.wait_for_selector('role=dialog', state='hidden', timeout=5000)
                    await page.wait_for_timeout(500)
                except Exception as e:
                    print(f"[Aviso] Falha ao fechar modal suavemente: {e}. Recarregando página...")
                    await page.reload()
                    await page.wait_for_timeout(5000)
                    # Reseta a busca de posts na tela
                    parou = False # Continua o loop, mas o "novos" não será setado se recarregou

                # Avalia o Filtro
                if not passa_no_filtro(caption, alt_texts):
                    print("[Ignorado] Não atende aos filtros de tema.")
                    continue
                
                if not urls:
                    print("[Erro] Nenhuma imagem encontrada")
                    continue

                # Categoria Final (Análise de Imagem + Legenda)
                categoria = categorizar_post(caption, alt_texts)
                
                # Formatação Final
                url_final = urls[0] if len(urls) == 1 else urls
                data_iso = datetime.fromtimestamp(taken_at, timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+0000")
                
                postagens.append({
                    "id": shortcode,
                    "url": url_final,
                    "permalink": f"https://www.instagram.com/p/{shortcode}/",
                    "caption": caption.strip(),
                    "alt_texts": alt_texts, # Salva para re-categorização futura sem precisar raspar de novo
                    "cat": categoria,
                    "timestamp": data_iso
                })
                print(f"[SALVO] {categoria.upper()} - {shortcode}. [{len(postagens)}/{LIMITE_MAX_POSTS}]")

                if len(postagens) >= LIMITE_MAX_POSTS:
                    print(f"\n[SUCESSO] ALVOS ATINGIDOS: {LIMITE_MAX_POSTS} publicações coletadas!")
                    parou = True
                    break

            if not novos and not parou:
                print("Lendo mais posts...")
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(3000)

        await browser.close()
        
        filename = "src/data/instagram_final_filtrado.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(postagens, f, indent=4, ensure_ascii=False)
            
        print(f"\n[SUCESSO] Arquivo salvo em: {filename}")

async def main():
    username = "jordaonunes"
    while True:
        try:
            inicio = datetime.now().strftime("%H:%M:%S")
            print(f"\n{'='*50}")
            print(f"🚀 INICIANDO VERIFICAÇÃO: {inicio}")
            print(f"{'='*50}\n")
            
            await extrair_instagram_dom(username)
            
            proxima_execucao = datetime.now().timestamp() + (INTERVALO_MINUTOS * 60)
            proxima_formatada = datetime.fromtimestamp(proxima_execucao).strftime("%H:%M:%S")
            
            print(f"\n{'='*50}")
            print(f"✅ SUCESSO: Posts atualizados.")
            print(f"⏳ Próxima verificação às: {proxima_formatada}")
            print(f"{'='*50}\n")
            
            await asyncio.sleep(INTERVALO_MINUTOS * 60)
            
        except Exception as e:
            print(f"\n❌ [ERRO NO LOOP]: {e}")
            print("Tentando novamente em 5 minutos...")
            await asyncio.sleep(300)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Script interrompido pelo usuário.")
