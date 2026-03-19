document.addEventListener('DOMContentLoaded', () => {

    // ══ SPLASH SCREEN ══
    const splash = document.getElementById('splash');
    const progress = document.getElementById('splash-progress');
    const pctLabel = document.getElementById('splash-pct');
    let pct = 0;
    
    console.log("Splash check: ", splash ? "Found" : "Not Found");
    
    if (splash) {
        const timer = setInterval(() => {
            pct += Math.random() * 12 + 2; // Slightly slower
            if (pct >= 100) { 
                pct = 100; 
                clearInterval(timer); 
                console.log("Splash finished, hiding in 500ms...");
                setTimeout(() => {
                    splash.classList.add('splash-hidden');
                }, 500); // 500ms fixed after finish
            }
            if (progress) progress.style.width = pct + '%';
            if (pctLabel) pctLabel.textContent = Math.round(pct) + '%';
        }, 100); // Slower interval
    }

    // ══ CONTACT FORM → GMAIL ══
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('fc-nome')?.value || '';
        const email = document.getElementById('fc-email')?.value || '';
        const projeto = document.getElementById('fc-projeto')?.value || '';
        const msg = document.getElementById('fc-msg')?.value || '';
        const subject = encodeURIComponent(`[Portfólio] ${projeto || 'Novo Contato'} — ${nome}`);
        const body = encodeURIComponent(
            `Olá Jordão,\n\nMeu nome é ${nome} (${email}).\n\nTipo de Projeto: ${projeto}\n\n${msg}\n\nAguardo retorno! 🙏`
        );
        const gmailUrl = `https://mail.google.com/mail/?view=cm&to=jordao@hnnbl.com.br&su=${subject}&body=${body}`;
        window.open(gmailUrl, '_blank');
        const success = document.getElementById('form-success');
        if (success) { success.style.display = 'block'; }
    });

    // ══ NAV AND PARALLAX SCROLL ══
    const nav = document.querySelector('.nav');
    const heroContent = document.querySelector('.hero-content');
    const heroBg = document.querySelector('.hero-bg');
    const heroGrand = document.querySelector('.hero-grand');
    const isoContainer = document.querySelector('.iso-container');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        // Header Blur Nav
        if (scrolled > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');

        // Hero Parallax (apenas enquanto a hero section estiver visível)
        if (scrolled <= window.innerHeight) {
            // Background Image move em uma velocidade
            if (heroBg) heroBg.style.transform = `translateY(${scrolled * 0.4}px)`;
            
            // Container 3D Isometric / Container geral
            if (isoContainer) isoContainer.style.transform = `translateY(${scrolled * -0.15}px)`;
            if (heroContent) heroContent.style.transform = `translateY(${scrolled * 0.25}px)`;
            
            // Diminuição fluida da opacidade do título
            if (heroGrand) {
                const opacity = Math.max(0, 1 - (scrolled / 400));
                heroGrand.style.opacity = opacity;
                heroGrand.style.transform = `translateY(${scrolled * 0.1}px)`;
            }
        }
    });


    // ══ SCROLL REVEAL ══
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0.05, // threshold menor para disparar mais fácil
        rootMargin: '0px 0px -50px 0px'
    });

    function initReveal() {
        document.querySelectorAll('[data-reveal]').forEach(el => {
            el.setAttribute('data-js-reveal', ''); // Mark elements that should be observed
            revealObserver.observe(el);
        });
        // Forçar reveal dos elementos acima da dobra (viewport)
        setTimeout(() => {
            document.querySelectorAll('[data-reveal]').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight) el.classList.add('revealed');
            });
        }, 100);
    }
    initReveal();

    // ══ PAGE SWITCHING LOGIC ══
    function switchPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(`${pageId}-page`);
        if (target) {
            target.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Re-trigger scroll reveal for the new page
            document.querySelectorAll(`[id="${pageId}-page"] [data-js-reveal]`).forEach(el => {
                el.classList.remove('revealed');
                revealObserver.observe(el);
            });
        }
    }

    // ══ INSTAGRAM INTEGRATION (Local JSON) ══
    let allInstagramPosts = [];

    async function loadInstagramFeed() {
        const DB_URL = "src/data/instagram_final_filtrado.json";

        try {
            const dbResponse = await fetch(DB_URL);
            if (dbResponse.ok) {
                const dbData = await dbResponse.json();
                if (dbData && dbData.length > 0) {
                    let flattenedPosts = [];
                    let numericCounter = 1;
                    
                    // Iterate and flatten carousels
                    dbData.forEach((post) => {
                        const urls = Array.isArray(post.url) ? post.url : [post.url];
                        urls.forEach((urlStr) => {
                            flattenedPosts.push({
                                ...post,
                                url: urlStr,
                                numericId: numericCounter++,
                                // Normaliza para as duas categorias de forma robusta
                                cat: (post.cat && post.cat.toLowerCase().includes('nature')) ? 'nature' : 'social'
                            });
                        });
                    });

                    // Global processing of posts
                    allInstagramPosts = flattenedPosts.sort((a, b) => {
                        return new Date(b.timestamp) - new Date(a.timestamp);
                    });
                    
                    console.log(`✅ Carregadas ${allInstagramPosts.length} fotos do arquivo local (carrosséis individualizados). Ordenado por data.`);
                    filterGallery('destaques'); // Carregar assim que o JSON abrir
                    return;
                }
            }
        } catch (e) {
            console.error("Erro ao carregar banco de dados local:", e);
        }

        // Fallback: Se o banco estiver vazio ou falhar
        allInstagramPosts = [
                // NATUREZA & VIDA SELVAGEM (10 fotos)
                { id: 1, url: 'https://picsum.photos/seed/fern-green/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Mundo Micro: Fungo na Floresta Amazônica • Natureza', cat: 'nature' },
                { id: 2, url: 'https://picsum.photos/seed/raindrop-leaf/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Detalhe da chuva sobre a flora local • Natureza', cat: 'nature' },
                { id: 3, url: 'https://picsum.photos/seed/mushroom-para/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Biodiversidade paraense • Natureza', cat: 'nature' },
                { id: 4, url: 'https://picsum.photos/seed/forest-mist/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Caminhos da floresta secundária • Natureza', cat: 'nature' },
                { id: 5, url: 'https://picsum.photos/seed/bromeliad-jn/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Bromélia nativa em detalhe • Natureza', cat: 'nature' },
                { id: 6, url: 'https://picsum.photos/seed/arara-blue/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Arara Canindé em vôo livre • Natureza', cat: 'nature' },
                { id: 7, url: 'https://picsum.photos/seed/heron-river/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Garça branca no Rio Itacaiúnas • Natureza', cat: 'nature' },
                { id: 8, url: 'https://picsum.photos/seed/hawk-flight/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Gavião caratã cacando • Natureza', cat: 'nature' },
                { id: 9, url: 'https://picsum.photos/seed/frog-amazon/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Perereca verde amazônica • Natureza', cat: 'nature' },
                { id: 10, url: 'https://picsum.photos/seed/lizard-stones/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Tejupã sobre pedras do Rio • Natureza', cat: 'nature' },
                // URBANO (5 fotos)
                { id: 11, url: 'https://picsum.photos/seed/bridge-maraba/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Ponte Ana Miranda • Marabá PA', cat: 'social' },
                { id: 12, url: 'https://picsum.photos/seed/city-night/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Marabá ao entardecer • Urbano', cat: 'social' },
                { id: 13, url: 'https://picsum.photos/seed/arch-facade/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Geometria da fachada histórica • Urbano', cat: 'social' },
                { id: 14, url: 'https://picsum.photos/seed/street-rain/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Rua sob chuva tropical • Urbano', cat: 'social' },
                { id: 15, url: 'https://picsum.photos/seed/skyline-pa/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Skyline do Tocantins • Urbano', cat: 'social' },
                // SOCIAL (5 fotos)
                { id: 16, url: 'https://picsum.photos/seed/event-photo/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Evento técnico de fotografia • Social', cat: 'social' },
                { id: 17, url: 'https://picsum.photos/seed/portrait-doc/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Retrato documental • Social', cat: 'social' },
                { id: 18, url: 'https://picsum.photos/seed/collab-work/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Parceria projeto cultural • Social', cat: 'social' },
                { id: 19, url: 'https://picsum.photos/seed/community-jn/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Workshop fotógrafos do Pará • Social', cat: 'social' },
                { id: 20, url: 'https://picsum.photos/seed/festival-art/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Festival cultural de Marabá • Social', cat: 'social' },
        ];
        filterGallery('destaques'); // Carregar também para o fallback
    }

    // Categoria agora vem direto do JSON (Processado via Scraper/Alt-Text)

    function filterGallery(category) {
        const galleryGrid = document.getElementById('home-gallery-grid');
        const galleryHeader = document.getElementById('gallery-header');
        if (!galleryGrid) return;
        galleryGrid.innerHTML = '';

        if (galleryHeader) {
            galleryHeader.style.display = (category === 'destaques' || category === 'logo' || category === 'nav-home') ? 'block' : 'none';
        }

        let filtered;
        if (category === 'destaques' || category === 'logo' || category === 'nav-home' || !category) {
            // Mostra 12 posts aleatórios para garantir variedade de estilos
            filtered = [...allInstagramPosts]
                .sort(() => 0.5 - Math.random())
                .slice(0, 12);
        } else {
            filtered = allInstagramPosts.filter(p => p.cat === category);
        }

        filtered.forEach((post, i) => {
            const item = document.createElement('div');
            item.className = 'gal-item';
            item.setAttribute('data-reveal', '');
            item.style.cursor = 'pointer';

            item.innerHTML = `
                <img src="${post.url}" alt="${post.caption}" loading="lazy">
                <div class="gal-overlay">
                    <span class="gal-info-tag">${post.cat.toUpperCase()}</span>
                    <h3 class="gal-info-name">${post.caption.substring(0, 35)}...</h3>
                </div>
            `;
            item.addEventListener('click', () => openLightbox(post, filtered, i));
            galleryGrid.appendChild(item);
            revealObserver.observe(item);
        });
    }

    // ══ PORTFOLIO: todas as fotos em ordem ══
    function renderPortfolio() {
        const grid = document.getElementById('portfolio-grid');
        if (!grid) return;
        if (grid.children.length > 0) return;

        // Já estão ordenados globalmente no loadInstagramFeed, mas garantimos aqui também.
        const ordered = [...allInstagramPosts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        ordered.forEach((post, i) => {
            const item = document.createElement('div');
            item.className = 'gal-item';
            item.setAttribute('data-reveal', '');
            item.style.cursor = 'pointer';

            item.innerHTML = `
                <img src="${post.url}" alt="${post.caption}" loading="lazy">
                <div class="gal-overlay">
                    <span class="gal-info-tag">${post.cat.toUpperCase()}</span>
                    <h3 class="gal-info-name">${post.caption.substring(0, 35)}...</h3>
                </div>
            `;
            item.addEventListener('click', () => openLightbox(post, ordered, i));
            grid.appendChild(item);
            revealObserver.observe(item);
        });

        setTimeout(() => {
            grid.querySelectorAll('[data-reveal]').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight) el.classList.add('revealed');
            });
        }, 100);
    }

    // ══ LIGHTBOX ══
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lb-img');
    const lbCat = document.getElementById('lb-cat');
    const lbCaption = document.getElementById('lb-caption');
    const lbLink = document.getElementById('lb-link');

    let lbPosts = [];
    let lbIndex = 0;

    function openLightbox(post, posts, index) {
        lbPosts = posts;
        lbIndex = index;
        updateLightboxContent();
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function updateLightboxContent() {
        const post = lbPosts[lbIndex];
        
        lbImg.src = post.url;
        lbImg.alt = post.caption;
        lbCat.textContent = post.cat.toUpperCase();
        lbCaption.textContent = post.caption;
        lbLink.href = post.permalink;
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        lbImg.src = '';
    }

    function lbNavigate(dir) {
        lbIndex = (lbIndex + dir + lbPosts.length) % lbPosts.length;
        updateLightboxContent();
    }

    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    document.getElementById('lb-prev').addEventListener('click', () => lbNavigate(-1));
    document.getElementById('lb-next').addEventListener('click', () => lbNavigate(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lbNavigate(-1);
        if (e.key === 'ArrowRight') lbNavigate(1);
    });

    // ══ HAMBURGER MENU ══
    const hamburger = document.getElementById('hamburger');
    const mobileOverlay = document.getElementById('mobile-overlay');

    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileOverlay.classList.toggle('open');
    });

    // Fechar menu ao clicar num link mobile
    mobileOverlay?.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            mobileOverlay.classList.remove('open');
        });
    });
    document.getElementById('mob-home')?.addEventListener('click', () => { switchPage('home'); filterGallery('logo'); });
    document.getElementById('mob-portfolio')?.addEventListener('click', () => { switchPage('portfolio'); renderPortfolio(); });
    document.getElementById('mob-about')?.addEventListener('click', () => switchPage('about'));
    document.getElementById('mob-contact')?.addEventListener('click', () => switchPage('contact'));

    // ══ CENTRALIZED NAVIGATION ══
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('.nav-link, .nav-logo, .nav-inquire');
        if (!target) return;

        const id = target.id;

        if (id === 'logo' || id === 'nav-home') {
            switchPage('home');
            document.querySelectorAll('.gal-filter').forEach(f => f.classList.remove('active'));
            filterGallery('destaques');
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.getElementById('nav-home')?.classList.add('active');
        } else if (id === 'nav-portfolio') {
            switchPage('portfolio');
            renderPortfolio();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            target.classList.add('active');
        } else if (id === 'nav-about') {
            switchPage('about');
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            target.classList.add('active');
        } else if (id === 'nav-contact' || (target.classList.contains('nav-inquire') && !target.closest('.mobile-overlay'))) {
            switchPage('contact');
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.getElementById('nav-contact')?.classList.add('active');
        } else if (target.classList.contains('gal-filter')) {
            if (!document.getElementById('home-page').classList.contains('active')) {
                switchPage('home');
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.getElementById('nav-home').classList.add('active');
            }
            filterGallery(id);
            document.querySelectorAll('.gal-filter').forEach(f => f.classList.remove('active'));
            target.classList.add('active');
        }
    });

    loadInstagramFeed();
});
