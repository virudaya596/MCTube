// Check if supabase is defined
if (typeof supabase === 'undefined') {
    console.error('Supabase client not found. Make sure supabase-config.js is loaded first.');
}

// Auth state listener
if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN') {
            console.log('User signed in:', session.user);
            updateAuthUI();
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            updateAuthUI();
        }
    });
}

// Update UI based on auth state
function updateAuthUI() {
    const authElements = document.querySelectorAll('.auth-only');
    const unauthElements = document.querySelectorAll('.unauth-only');
    
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
            authElements.forEach(el => el.style.display = 'block');
            unauthElements.forEach(el => el.style.display = 'none');
        } else {
            authElements.forEach(el => el.style.display = 'none');
            unauthElements.forEach(el => el.style.display = 'block');
        }
    });
}

// Login function
async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        return { data, error };
    } catch (error) {
        return { error };
    }
}

// Logout function
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Initialize auth UI when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof supabase !== 'undefined') {
        updateAuthUI();
    }
});