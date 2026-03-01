/**
 * Twitter Rius - El Cerebro (Fase 2: SPA)
 */

// 1. Carnet de Identidad (ID de dispositivo)
const getDeviceId = () => {
    let id = localStorage.getItem('twitter_rius_device_id');
    if (!id) {
        // Generamos un ID único y lo guardamos para siempre
        id = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now();
        localStorage.setItem('twitter_rius_device_id', id);
    }
    return id;
};

const DEVICE_ID = getDeviceId();

// 2. El Mapa de la App (Router)
const showLoader = () => {
    document.getElementById('content').innerHTML = `
        <div class="loader-container fade-in">
            <div class="spinner"></div>
            <p>Conectando con la base estelar...</p>
        </div>
    `;
};

const renderFeed = async () => {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="view-header fade-in">
            <h2>Inicio</h2>
        </div>
        <div id="posts-container" class="fade-in">
            <div class="loader-container">
                <div class="spinner"></div>
                <p>Buscando mensajes en la nube...</p>
            </div>
        </div>
    `;

    await fetchPosts();
};

const fetchPosts = async () => {
    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .select(`
                *,
                likes (count)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderPosts(data);
    } catch (err) {
        console.error('Error al obtener posts:', err);
        document.getElementById('posts-container').innerHTML = `
            <p style="padding: 2rem; color: var(--danger); text-align: center;">
                Error al conectar con el almacén. Revisa tu config.js
            </p>
        `;
    }
};

const renderPosts = (posts) => {
    const container = document.getElementById('posts-container');

    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <p style="padding: 2rem; color: #71767b; text-align: center;">
                ¡El feed está vacío! Sé el primero en escribir algo.
            </p>
        `;
        return;
    }

    const html = posts.map(post => {
        const date = new Date(post.created_at).toLocaleDateString();
        const initial = post.author_id.charAt(0).toUpperCase();
        const isOwner = post.author_id === DEVICE_ID;
        const likeCount = post.likes?.[0]?.count || 0;

        return `
            <div class="post-card fade-in">
                <div class="avatar">${initial}</div>
                <div class="post-main">
                    <div class="post-header">
                        <span class="post-author">Usuario</span>
                        <span class="post-id-tag">@${post.author_id.slice(5, 10)}</span>
                        <span class="post-time">· ${date}</span>
                    </div>
                    <div class="post-content">${post.content}</div>
                    <div class="post-footer">
                        <button class="action-btn" onclick="handleLike(${post.id})">
                            ❤️ <span>${likeCount}</span>
                        </button>
                        ${isOwner ? `
                        <button class="action-btn delete" onclick="handleDelete(${post.id})">
                            🗑️
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="posts-list">${html}</div>`;
};

const renderNewPost = () => {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="view-header fade-in">
            <h2>Crear nuevo post</h2>
        </div>
        <div class="form-container glass-card fade-in">
            <textarea id="post-content" placeholder="¿Qué está pasando?" maxlength="280"></textarea>
            <div class="form-actions">
                <span id="char-count">280</span>
                <button id="send-btn" class="btn btn-primary">Twittear</button>
            </div>
        </div>
    `;

    const textarea = document.getElementById('post-content');
    const charCount = document.getElementById('char-count');
    const sendBtn = document.getElementById('send-btn');

    textarea.focus();

    textarea.addEventListener('input', () => {
        const remaining = 280 - textarea.value.length;
        charCount.textContent = remaining;
        charCount.style.color = remaining < 20 ? 'var(--danger)' : 'var(--text-secondary)';
        sendBtn.disabled = textarea.value.trim().length === 0;
    });

    sendBtn.addEventListener('click', async () => {
        const text = textarea.value.trim();
        if (!text) return;

        sendBtn.disabled = true;
        sendBtn.textContent = 'Enviando...';

        try {
            const { error } = await supabaseClient
                .from('posts')
                .insert([{
                    content: text,
                    author_id: DEVICE_ID
                }]);

            if (error) throw error;
            window.location.hash = ''; // Volver al feed
        } catch (err) {
            alert('Error al enviar: ' + err.message);
            sendBtn.disabled = false;
            sendBtn.textContent = 'Twittear';
        }
    });
};

const handleLike = async (postId) => {
    try {
        // Intentar insertar el like
        const { error } = await supabaseClient
            .from('likes')
            .insert([{
                post_id: postId,
                device_id: DEVICE_ID
            }]);

        if (error) {
            if (error.code === '23505') { // Código de error para UNIQUE constraint
                alert('¡Ya le has dado amor a este post!');
            } else {
                throw error;
            }
        } else {
            // Refrescar solo los posts (o podrías actualizar solo el contador en el DOM)
            await fetchPosts();
        }
    } catch (err) {
        console.error('Error al dar like:', err);
    }
};

const handleDelete = async (postId) => {
    if (!confirm('¿Seguro que quieres eliminar este post para siempre?')) return;

    try {
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('author_id', DEVICE_ID); // Doble seguridad

        if (error) throw error;
        await fetchPosts();
    } catch (err) {
        alert('No se pudo borrar: ' + err.message);
    }
};

// Exponer las funciones al objeto window para los onclick
window.handleLike = handleLike;
window.handleDelete = handleDelete;

const navigate = () => {
    const hash = window.location.hash || '#';

    // Actualizar estado activo en los menús
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === hash);
    });

    if (hash === '#new') {
        renderNewPost();
    } else {
        renderFeed();
    }
};

// 3. Inicialización
window.addEventListener('hashchange', navigate);
window.addEventListener('load', navigate);

// Pequeña mejora para el diseño de tarjetas
const style = document.createElement('style');
style.textContent = `
    .view-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--glass-border); position: sticky; top: 60px; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); z-index: 10; }
    .view-header h2 { font-size: 1.25rem; font-weight: 700; }
    .glass-card { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 16px; padding: 1.5rem; margin: 1rem; }
    textarea { width: 100%; background: transparent; border: none; color: white; font-size: 1.2rem; resize: none; min-height: 120px; outline: none; }
    .form-actions { display: flex; justify-content: flex-end; align-items: center; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--glass-border); }
    #char-count { color: var(--text-secondary); font-size: 0.9rem; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
`;
document.head.appendChild(style);
