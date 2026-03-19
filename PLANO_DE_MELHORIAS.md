# Plano de Melhorias Técnicas e Estruturais (Portfólio Jordão Nunes)

Este documento guarda as próximas etapas recomendadas de refatoração e otimização do projeto, divididas por áreas.

## 1. Arquitetura e Deploy (Docker & Scripts)
- **Separação de Preocupações (Single Responsibility Principle):**
  - **Recomendação:** Utilizar o `docker-compose.yml` para separar os serviços. Um container deverá ser exclusivo para o Nginx (Front-end) e outro container exclusivo para o Scraper (Python), compartilhando apenas um `volume` onde o arquivo `instagram_final_filtrado.json` transita. Isso evita que consumo de memória e falhas do Chromium encerrem o servidor web inteiro.
- **Gerenciamento de Processos no Scraper:** 
  - **Recomendação:** No lugar do laço infinito `while True`, usar uma abordagem mais resiliente de Job Scheduling (como `cron` do Linux empacotado no container ou uma biblioteca tipo `schedule` com tratamento robusto de erros) que não morra silenciosamente.

## 2. Back-end (Scraping com Playwright)
- **Otimização de Lógica de Extração:** O código atual faz parsing do HTML visual do Instagram (`role=dialog`, `h1`). O Instagram muda isso com alta frequência.
  - **Melhoria Sugerida:** Mapear a extração interceptando as rotas da API GraphQL de rede (`page.on("response", handler)` no Playwright). Isso é instantâneo e não quebra se o layout visual mudar.
- **Segurança:** Ocultação rigorosa do manuseio da variável `INSTA_PASS`.

## 3. Front-end (UI/UX, HTML, CSS, JS)
- **Limpeza do DOM e Modularização CSS:**
  - O arquivo `index.html` hoje contém muitos estilos dinâmicos (`style="..."`).
  - **Melhoria Sugerida:** Migrar as marcações inline para classes estritas dentro de `src/css/main.css`. Facilita manutenção e possibilita políticas rigorosas de Content Security Policy (CSP).
- **Adequação Global de Imagens (WebP/AVIF):**
  - Remover formatos pesados como JPG/PNG do assets de base.
  - **Melhoria Sugerida:** Compilar estáticos estruturais (como a imagem isométrica e as fotos na sessão "Sobre") para `.webp` ou `.avif`, aprimorando drasticamente a métrica de LCP (Largest Contentful Paint).
- **SEO Rico Estruturado:**
  - Inserir tags de Schema Markup via JSON-LD (`<script type="application/ld+json">`) na página definindo `LocalBusiness` ou `ProfessionalService`, para destacar localidade e perfil fotográfico perante a leitura orgânica do Google.
- **Acessibilidade Móvel Total:**
  - Garantir o uso do `aria-hidden="true"` enquanto menus (`mobile-overlay`) e modais (`lightbox`) não estão visíveis na tela.
