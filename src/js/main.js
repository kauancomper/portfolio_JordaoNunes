document.addEventListener('DOMContentLoaded', () => {

    // ══ SPLASH SCREEN ══
    const splash = document.getElementById('splash');
    const progress = document.getElementById('splash-progress');
    const pctLabel = document.getElementById('splash-pct');
    let pct = 0;
    const timer = setInterval(() => {
        pct += Math.random() * 18 + 4;
        if (pct >= 100) { pct = 100; clearInterval(timer); }
        progress.style.width = pct + '%';
        if (pctLabel) pctLabel.textContent = Math.round(pct) + '%';
        if (pct >= 100) setTimeout(() => splash?.classList.add('hidden'), 300);
    }, 80);

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

    // ══ NAV SCROLL ══
    const nav = document.querySelector('.nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
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

    // ══ INSTAGRAM INTEGRATION (via Behold.so) ══
    const BEHOLD_URL = "https://feeds.behold.so/2nVNxB2RdKJ6i9mJ2nKM";
    let allInstagramPosts = [];

    async function loadInstagramFeed() {
        if (!BEHOLD_URL) {
            allInstagramPosts = [
                // NATUREZA (5 fotos)
                { id: 1, url: 'https://picsum.photos/seed/fern-green/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Micro mundo — samambaia amazônica • Natureza', cat: 'nature' },
                { id: 2, url: 'https://picsum.photos/seed/raindrop-leaf/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Gota de orvalho na folhagem • Natureza', cat: 'nature' },
                { id: 3, url: 'https://picsum.photos/seed/mushroom-para/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Cogumelo parasol no Piquiazal • Natureza', cat: 'nature' },
                { id: 4, url: 'https://picsum.photos/seed/forest-mist/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Cerrado mistico ao entardecer • Natureza', cat: 'nature' },
                { id: 5, url: 'https://picsum.photos/seed/bromeliad-jn/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Bromélia selvagem na mata ciliar • Natureza', cat: 'nature' },
                // VIDA SELVAGEM (5 fotos)
                { id: 6, url: 'https://picsum.photos/seed/arara-blue/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Arara Canindé em vôo livre • Wildlife', cat: 'wildlife' },
                { id: 7, url: 'https://picsum.photos/seed/heron-river/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Garça branca no Rio Itacaiúnas • Wildlife', cat: 'wildlife' },
                { id: 8, url: 'https://picsum.photos/seed/hawk-flight/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Gavião caratã cacando • Wildlife', cat: 'wildlife' },
                { id: 9, url: 'https://picsum.photos/seed/frog-amazon/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Perereca verde amazônica • Wildlife', cat: 'wildlife' },
                { id: 10, url: 'https://picsum.photos/seed/lizard-stones/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Tejupã sobre pedras do Rio • Wildlife', cat: 'wildlife' },
                // URBANO (5 fotos)
                { id: 11, url: 'https://picsum.photos/seed/bridge-maraba/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Ponte Ana Miranda • Marabá PA', cat: 'urban' },
                { id: 12, url: 'https://picsum.photos/seed/city-night/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Marabá ao entardecer • Urbano', cat: 'urban' },
                { id: 13, url: 'https://picsum.photos/seed/arch-facade/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Geometria da fachada histórica • Urbano', cat: 'urban' },
                { id: 14, url: 'https://picsum.photos/seed/street-rain/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Rua sob chuva tropical • Urbano', cat: 'urban' },
                { id: 15, url: 'https://picsum.photos/seed/skyline-pa/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Skyline do Tocantins • Urbano', cat: 'urban' },
                // SOCIAL (5 fotos)
                { id: 16, url: 'https://picsum.photos/seed/event-photo/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Evento técnico de fotografia • Social', cat: 'social' },
                { id: 17, url: 'https://picsum.photos/seed/portrait-doc/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Retrato documental • Social', cat: 'social' },
                { id: 18, url: 'https://picsum.photos/seed/collab-work/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Parceria projeto cultural • Social', cat: 'social' },
                { id: 19, url: 'https://picsum.photos/seed/community-jn/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Workshop fotógrafos do Pará • Social', cat: 'social' },
                { id: 20, url: 'https://picsum.photos/seed/festival-art/800/1000', permalink: 'https://www.instagram.com/jordaonunes/', caption: 'Festival cultural de Marabá • Social', cat: 'social' },
            ];
            filterGallery('nature');
            return;
        }

        try {
            const response = await fetch(BEHOLD_URL);
            const data = await response.json();

            // Behold returns an object with 'posts' or just an array directly depending on config
            const posts = Array.isArray(data) ? data : data.posts;

            allInstagramPosts = posts.map(item => ({
                id: item.id,
                url: item.sizes?.large?.mediaUrl || item.mediaUrl,
                permalink: item.permalink,
                caption: item.caption || '',
                cat: categorizePost(item.caption || '')
            }));

            filterGallery('nature');
        } catch (error) {
            console.error('Erro ao carregar feed do Behold:', error);
            filterGallery('nature');
        }
    }

    function categorizePost(caption) {
        const text = caption.toLowerCase();
        if (text.includes('fungo') || text.includes('cogumelo') || text.includes('natureza') || text.includes('flora')) return 'nature';
        if (text.includes('ave') || text.includes('passaro') || text.includes('wildlife') || text.includes('animal')) return 'wildlife';
        if (text.includes('cidade') || text.includes('maraba') || text.includes('ponte') || text.includes('urbano')) return 'urban';
        if (text.includes('social') || text.includes('evento') || text.includes('projeto') || text.includes('parceria') || text.includes('branding') || text.includes('design')) return 'social';
        return 'nature';
    }

    function filterGallery(category) {
        const galleryGrid = document.getElementById('home-gallery-grid');
        if (!galleryGrid) return;
        galleryGrid.innerHTML = '';

        const filtered = (category === 'logo' || !category || category === 'nav-home')
            ? allInstagramPosts
            : allInstagramPosts.filter(p => p.cat === category);

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

        const ordered = [...allInstagramPosts].sort((a, b) => b.id - a.id);

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
        lbImg.src = post.url;
        lbImg.alt = post.caption;
        lbCat.textContent = post.cat.toUpperCase();
        lbCaption.textContent = post.caption;
        lbLink.href = post.permalink;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        lbImg.src = '';
    }

    function lbNavigate(dir) {
        lbIndex = (lbIndex + dir + lbPosts.length) % lbPosts.length;
        const p = lbPosts[lbIndex];
        lbImg.src = p.url;
        lbImg.alt = p.caption;
        lbCat.textContent = p.cat.toUpperCase();
        lbCaption.textContent = p.caption;
        lbLink.href = p.permalink;
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
            filterGallery('logo');
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
