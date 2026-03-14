const fs = require('fs');
const path = require('path');

// URL do seu feed do Behold
const BEHOLD_URL = "https://feeds.behold.so/dDpAFVwfxIST9MZ9QQJm";
const DB_PATH = path.join(__dirname, 'src', 'data', 'instagram_db.json');

async function sync() {
    console.log("🔄 Iniciando sincronização com Instagram (Behold)...");

    try {
        // 1. Carregar banco atual
        let db = [];
        if (fs.existsSync(DB_PATH)) {
            db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        }

        // 2. Buscar novas fotos do Behold
        const response = await fetch(BEHOLD_URL);
        const data = await response.json();
        const posts = Array.isArray(data) ? data : data.posts;

        if (!posts) {
            console.error("❌ Erro: Não foi possível obter posts do Behold.");
            return;
        }

        // 3. Mesclar novos posts (evitando duplicatas)
        let addedCount = 0;
        posts.forEach(post => {
            const exists = db.find(item => item.id === post.id);
            if (!exists) {
                db.unshift({
                    id: post.id,
                    url: post.sizes?.large?.mediaUrl || post.mediaUrl,
                    permalink: post.permalink,
                    caption: post.caption || '',
                    timestamp: post.timestamp
                });
                addedCount++;
            }
        });

        // 4. Salvar de volta no banco
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 4));

        console.log(`✅ Sincronização concluída!`);
        console.log(`📸 Total no banco: ${db.length} fotos.`);
        console.log(`✨ Novas fotos adicionadas: ${addedCount}`);

    } catch (error) {
        console.error("❌ Erro durante a sincronização:", error.message);
    }
}

sync();
