// Load worlds on page load
document.addEventListener('DOMContentLoaded', function() {
    if (typeof supabase !== 'undefined') {
        loadWorlds();
    } else {
        console.error('Supabase client not available');
    }
});

async function loadWorlds() {
    try {
        console.log('Loading worlds...');
        
        const { data: worlds, error } = await supabase
            .from('worlds')
            .select(`
                *,
                world_images(image_url),
                world_likes(count)
            `)
            .order('uploaded_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            throw error;
        }

        console.log('Worlds loaded:', worlds);
        displayWorlds(worlds);
    } catch (error) {
        console.error('Error loading worlds:', error);
        document.getElementById('worldsGrid').innerHTML = 
            '<p style="color: white; text-align: center;">Error loading worlds. Please refresh the page.</p>';
    }
}

function displayWorlds(worlds) {
    const grid = document.getElementById('worldsGrid');
    
    if (!worlds || worlds.length === 0) {
        grid.innerHTML = '<p style="color: white; text-align: center;">No worlds uploaded yet. Be the first to upload!</p>';
        return;
    }

    grid.innerHTML = worlds.map(world => {
        const images = world.world_images || [];
        const likeCount = world.world_likes ? world.world_likes.length : 0;
        const uploadDate = new Date(world.uploaded_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });

        return `
        <div class="world-card" data-world-id="${world.id}">
            <div class="world-images">
                <div class="image-slider">
                    ${images.length > 0 ? 
                        images.map((img, index) => 
                            `<img src="${img.image_url}" alt="World image ${index + 1}">`
                        ).join('') : 
                        '<img src="https://via.placeholder.com/400x200/667eea/ffffff?text=No+Image" alt="No image">'
                    }
                </div>
                ${images.length > 1 ? `
                <div class="slider-nav">
                    ${images.map((_, index) => 
                        `<div class="slider-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`
                    ).join('')}
                </div>
                ` : ''}
            </div>
            <div class="world-content">
                <h3 class="world-title">${escapeHtml(world.title)}</h3>
                <p class="world-seed">Seed: ${world.seed || 'Random'}</p>
                <p class="world-description">${escapeHtml(world.description || 'No description provided.')}</p>
                
                <div class="world-stats">
                    <span>Days: ${world.days_played || 0}</span>
                    <span>Likes: ${likeCount}</span>
                </div>
                
                <p><strong>Progress:</strong> ${escapeHtml(world.progress_description || 'No progress details.')}</p>
                <p><strong>Structures:</strong> ${escapeHtml(world.structures || 'None specified')}</p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                    <button class="like-btn" onclick="toggleLike('${world.id}')">
                        👍 Like
                    </button>
                    <a href="${world.world_file_url}" download class="download-btn">
                        📥 Download World
                    </a>
                </div>
                
                <div class="uploader-info">
                    Uploaded by ${escapeHtml(world.uploaded_by_name)} • ${uploadDate}
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Initialize image sliders
    initImageSliders();
}

function initImageSliders() {
    document.querySelectorAll('.world-images').forEach(slider => {
        const images = slider.querySelector('.image-slider');
        const dots = slider.querySelectorAll('.slider-dot');
        
        if (images.children.length > 1) {
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    images.style.transform = `translateX(-${index * 100}%)`;
                    dots.forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                });
            });
        }
    });
}

async function toggleLike(worldId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Please login to like worlds');
            window.location.href = 'login.html';
            return;
        }

        // Check if already liked
        const { data: existingLike } = await supabase
            .from('world_likes')
            .select()
            .eq('world_id', worldId)
            .eq('user_id', user.id)
            .single();

        if (existingLike) {
            // Unlike
            await supabase
                .from('world_likes')
                .delete()
                .eq('world_id', worldId)
                .eq('user_id', user.id);
        } else {
            // Like
            await supabase
                .from('world_likes')
                .insert([{ world_id: worldId, user_id: user.id }]);
        }

        // Reload worlds to update like counts
        loadWorlds();
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

// Helper function to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}