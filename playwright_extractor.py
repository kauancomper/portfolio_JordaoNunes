import os
import asyncio
import json
import re
import random
from datetime import datetime, timezone
from playwright.async_api import async_playwright
try:
    import playwright_stealth
except ImportError:
    playwright_stealth = None

# Configurações de Filtro e Automação
ANOS_LIMITE = 3
LIMITE_MAX_POSTS = 30
INTERVALO_MINUTOS = 60 # Tempo de espera entre verificações
HEADLESS = True 
# Credenciais via Variáveis de Ambiente (Configure no Easypanel)
INSTA_USER = os.getenv("INSTA_USER", "jordaonunes")
INSTA_PASS = os.getenv("INSTA_PASS", "")
PROXY_SERVER = os.getenv("PROXY_SERVER", "") # Ex: http://user:pass@host:port

# Configuração de Filtros Profissionais (Natureza, Urbano, Animais e Cultura)
NATURE_KEYWORDS = [
    "natureza", "pássaro", "animal", "flor", "fauna", "flora", "wildlife", "inseto", "réptil", 
    "rio", "amazônia", "paisagem", "parque", "árvore", "floresta", "mata", "céu", "nuvem", 
    "pôr do sol", "nascer do sol", "amazônico", "amazônica", "macaco", "onça", "jacaré", "cobra",
    "peixe", "bicho", "flutuante", "água", "selva", "bioma"
]

SOCIAL_KEYWORDS = [
    # Cultura e Eventos
    "círio", "nazare", "festejo", "junino", "junina", "quadrilha", "expoama", "exposição", "cultura", "tradição",
    "evento", "festa", "povo", "gente", "comunidade", "público", "manifestação", "religioso", "fé", "paraense",
    # Urbano e Arquitetura
    "urbano", "cidade", "ponte", "praça", "rua", "prédio", "arquitetura", "marabá", "avenida", "histórico",
    "skyline", "construção", "centro", "estrada", "beira-rio"
]

# Blacklist: Termos que indicam fotos de perfil/pessoais (O que o usuário quer REMOVER)
BLACKLIST = [
    "selfie", "rosto", "look", "moda", "estilo", "promoção", "sorteio", "maquiagem",
    "lookdodia", "ensaio pessoal", "minha foto", "eu no", "close de rosto", "retrato"
]

def detecta_pessoas_alt(alt_texts):
    """Detecta se o Alt-Text do Instagram indica presença indesejada de pessoas/selfies."""
    padroes_pessoa = [
        r"imagem pode conter: (\d+) pesso", 
        r"imagem pode conter: rosto",
        r"pode ser uma imagem de (\d+) pesso",
        r"pode ser uma imagem de rosto",
        r"pessoa sorrindo",
        r"selfie",
        r"em pé",
        r"sentado"
    ]
    texto_total = " ".join(alt_texts).lower()
    for p in padroes_pessoa:
        if re.search(p, texto_total):
            return True
    return False

def categorizar_e_filtrar(caption, alt_texts):
    texto_imagens = " ".join(alt_texts).lower()
    texto_legenda = caption.lower()
    texto_total = f"{texto_imagens} {texto_legenda}"
    
    # 1. Verifica Detecção Automática de Pessoas no Alt-Text
    if detecta_pessoas_alt(alt_texts):
        tem_natureza = any(k in texto_total for k in NATURE_KEYWORDS)
        if not tem_natureza:
            return None

    # 2. Verifica Blacklist Manual na Legenda
    for word in BLACKLIST:
        if word in texto_legenda:
            return None
            
    # 3. Verifica Social (Cultura/Urbano)
    for k in SOCIAL_KEYWORDS:
        if k in texto_total:
            return "social"
            
    # 4. Default: Natureza
    return "nature"

def passa_no_filtro(caption, alt_texts):
    return categorizar_e_filtrar(caption, alt_texts) is not None

def categorizar_post(caption, alt_texts):
    res = categorizar_e_filtrar(caption, alt_texts)
    return res if res else "nature"

async def extrair_instagram_dom(username):
    print(f"\n[INFO] Iniciando raspagem: @{username} (Alvo: {LIMITE_MAX_POSTS} posts)")
    
    async with async_playwright() as p:
        session_file = "instagram_session.json"
        browser_args = ["--disable-blink-features=AutomationControlled"]
        proxy_config = {"server": PROXY_SERVER} if PROXY_SERVER else None
        
        browser = await p.chromium.launch(headless=HEADLESS, args=browser_args, proxy=proxy_config)
        
        if os.path.exists(session_file):
            context = await browser.new_context(storage_state=session_file, proxy=proxy_config)
        else:
            context = await browser.new_context(proxy=proxy_config)

        page = await context.new_page()
        if playwright_stealth:
            try:
                from playwright_stealth import stealth
                await stealth(page)
                print("[INFO] Modo Stealth ativado.")
            except: pass
        
        print("[INFO] Acessando Instagram...")
        await page.goto("https://www.instagram.com/accounts/login/", wait_until="networkidle", timeout=60000)
        
        try:
            await page.wait_for_selector('svg[aria-label="Página inicial"]', timeout=8000)
            print("[LOGIN] Sessão ativa ok.")
        except:
            print("[LOGIN] Tentando login automático...")
            if not INSTA_PASS:
                print("⚠️ ERRO: Senha não configurada.")
                await browser.close()
                return

            try:
                # Se estiver na home mas não logado, clica em Entrar
                if "login" not in page.url:
                    await page.goto("https://www.instagram.com/accounts/login/")
                
                await page.wait_for_selector('input[name="username"]', timeout=30000)
                await page.fill('input[name="username"]', INSTA_USER)
                await page.fill('input[name="password"]', INSTA_PASS)
                await page.click('button[type="submit"]')
                
                # Espera carregar ou pular anúncios de "Salvar Login"
                await page.wait_for_selector('svg[aria-label="Página inicial"], button:has-text("Agora não"), button:has-text("Not Now")', timeout=30000)
                
                # Clica em "Agora não" se aparecer
                for btn_text in ["Agora não", "Not Now"]:
                    try:
                        btn = await page.get_by_role("button", name=btn_text).first
                        if await btn.is_visible(): await btn.click()
                    except: pass
                
                await context.storage_state(path=session_file)
                print("[LOGIN] Sucesso!")
            except Exception as e:
                print(f"❌ Erro no login: {e}")
                await browser.close()
                return

        await page.goto(f"https://www.instagram.com/{username}/", wait_until="networkidle")
        
        postagens = []
        processados = set()
        parou = False
        limite_timestamp = datetime.now().timestamp() - (ANOS_LIMITE * 365 * 24 * 60 * 60)

        while not parou:
            posts_na_tela = await page.query_selector_all('a[href*="/p/"], a[href*="/reel/"]')
            novos = False

            for post in posts_na_tela:
                if len(processados) >= LIMITE_MAX_POSTS or parou:
                    parou = True
                    break
                    
                href = await post.get_attribute("href")
                shortcode = re.search(r'/(?:p|reel)/([^/]+)', href).group(1)
                
                if shortcode in processados: continue
                processados.add(shortcode)
                novos = True

                if '/reel/' in href: continue

                try:
                    await post.click(force=True)
                    await page.wait_for_selector('role=dialog', timeout=10000)
                    await page.wait_for_timeout(2000)
                    
                    # Extrair Data
                    time_elem = await page.query_selector('role=dialog time')
                    dt_str = await time_elem.get_attribute('datetime')
                    dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
                    taken_at = dt.timestamp()
                    
                    if taken_at < limite_timestamp:
                        parou = True
                        break

                    # Extrair Legenda
                    caption = ""
                    try:
                        caption_elem = await page.query_selector('role=dialog article ul li span._a9zs')
                        if not caption_elem:
                            caption_elem = await page.query_selector('role=dialog article ul li span')
                        if caption_elem:
                            caption = await caption_elem.inner_text()
                    except: pass
                    caption = re.sub(f"^{username}\\s*", "", caption, flags=re.IGNORECASE).strip()

                    # Extrair Imagens (Carrossel)
                    urls = []
                    alt_texts = []
                    for _ in range(12):
                        imgs = await page.query_selector_all('role=dialog img')
                        for img in imgs:
                            src = await img.get_attribute('src')
                            alt = await img.get_attribute('alt') or ""
                            if src and "cdninstagram" in src and src not in urls:
                                urls.append(src)
                                if alt: alt_texts.append(alt)
                        
                        next_btn = await page.query_selector('button[aria-label="Avançar"], button[aria-label="Next"]')
                        if next_btn:
                            await next_btn.click(force=True)
                            await page.wait_for_timeout(1000)
                        else: break

                    await page.keyboard.press("Escape")
                    await page.wait_for_timeout(500)

                    # Filtro e Categorização
                    if passa_no_filtro(caption, alt_texts):
                        categoria = categorizar_post(caption, alt_texts)
                        postagens.append({
                            "id": shortcode,
                            "url": urls[0] if len(urls) == 1 else urls,
                            "permalink": f"https://www.instagram.com/p/{shortcode}/",
                            "caption": caption,
                            "cat": categoria,
                            "timestamp": dt.strftime("%Y-%m-%dT%H:%M:%S+0000")
                        })
                        print(f"[POST] {len(postagens)}/{LIMITE_MAX_POSTS} | {categoria.upper()} - {shortcode}")

                except Exception as e:
                    print(f"[AVISO] Erro no post {shortcode}: {e}")
                    await page.keyboard.press("Escape")

            if not novos and not parou:
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(3000)
            
        await browser.close()
        
        filename = "src/data/instagram_final_filtrado.json"
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(postagens, f, indent=4, ensure_ascii=False)
        print(f"[ARQUIVO] Salvo: {filename}")

async def main():
    username = "jordaonunes"
    while True:
        try:
            print(f"\n🚀 VERIFICAÇÃO: {datetime.now().strftime('%H:%M:%S')}")
            await extrair_instagram_dom(username)
            await asyncio.sleep(INTERVALO_MINUTOS * 60)
        except Exception as e:
            print(f"❌ ERRO: {e}")
            await asyncio.sleep(300)

if __name__ == "__main__":
    asyncio.run(main())
