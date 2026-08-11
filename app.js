// ==========================================
// VORNEX STORE - CORE JAVASCRIPT LOGIC
// ==========================================

// Firebase Initialization (Make sure config matches admin.html)
const firebaseConfig = {
    databaseURL: "https://your-firebase-database-url.firebaseio.com" // Ensure same DB URL as admin.html
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('vornex_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('vornex_wishlist')) || [];
let currentCategory = 'ALL';

// On Page Load
document.addEventListener('DOMContentLoaded', () => {
    fetchProductsFromFirebase();
    updateBadges();
});

// 1. FETCH PRODUCTS FROM FIREBASE (ADMIN SYNC)
function fetchProductsFromFirebase() {
    const grid = document.getElementById('productGrid');
    
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        allProducts = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                allProducts.push({ id: key, ...data[key] });
            });
            renderProducts(allProducts);
        } else {
            grid.innerHTML = `<div class="loading-spinner">No products found in store. Add from Admin Panel.</div>`;
        }
    }, (error) => {
        console.error(error);
        grid.innerHTML = `<div class="loading-spinner">Error loading products.</div>`;
    });
}

// 2. RENDER PRODUCTS TO GRID
function renderProducts(productsList) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    if (productsList.length === 0) {
        grid.innerHTML = `<div class="loading-spinner">No products match your search.</div>`;
        return;
    }
    
    let html = "";
    productsList.forEach(p => {
        html += `
        <div class="product-card">
            <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.title}">
            <div class="p-info">
                <div class="p-title">${p.title || p.name}</div>
                <div class="p-price">₹${p.price}</div>
                <button class="add-btn" onclick="addToCart('${p.id}')">ADD TO BAG</button>
            </div>
        </div>`;
    });
    grid.innerHTML = html;
}

// 3. CATEGORY & SEARCH FILTER FIX
function filterCategory(cat, btn) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    applyFilters();
}

function searchProducts() {
    applyFilters();
}

function applyFilters() {
    const query = document.getElementById('storeSearch').value.toLowerCase();
    
    let filtered = allProducts.filter(p => {
        const matchCategory = (currentCategory === 'ALL') || (p.category && p.category.toLowerCase() === currentCategory.toLowerCase());
        const matchSearch = (p.title && p.title.toLowerCase().includes(query)) || (p.name && p.name.toLowerCase().includes(query));
        return matchCategory && matchSearch;
    });
    
    renderProducts(filtered);
}

// 4. MENU & NAVIGATION HANDLERS (STEP BACK FIX)
function toggleMenuDrawer(open) {
    const drawer = document.getElementById('iosMenuDrawer');
    const overlay = document.getElementById('drawerOverlay');
    
    if (open) {
        drawer.classList.add('active');
        overlay.classList.add('active');
    } else {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
    }
}

function closeAllDrawers() {
    document.getElementById('iosMenuDrawer').classList.remove('active');
    document.getElementById('cartDrawer').classList.remove('active');
    document.getElementById('drawerOverlay').classList.remove('active');
    
    document.querySelectorAll('.custom-modal').forEach(m => m.classList.remove('active'));
}

function toggleAccordion(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isVisible = el.style.display === 'block';
    
    // Close other accordions
    document.querySelectorAll('.acc-body').forEach(b => b.style.display = 'none');
    el.style.display = isVisible ? 'none' : 'block';
}

// MENU SUB-ROUTINES (Open modals while keeping Menu drawer intact)
function openCartFromMenu() {
    document.getElementById('cartDrawer').classList.add('active');
}

function closeCartDrawer() {
    document.getElementById('cartDrawer').classList.remove('active');
    // Keeps side menu drawer open if opened from menu
}

function openWishlistFromMenu() {
    openModal('wishlistModal');
}

function openCouponsFromMenu() {
    openModal('couponsModal');
}

function closeModalStepBack(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Returns gracefully to the underlying menu/page
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModalOnBg(event, id) {
    if (event.target.id === id) {
        closeModalStepBack(id);
    }
}

// 5. THEMES SWITCHER (6 Themes)
function setTheme(themeName) {
    document.body.className = '';
    if (themeName !== 'dark') {
        document.body.classList.add(`theme-${themeName}`);
    }
    if (typeof Toastify === "function") {
        Toastify({ text: `Theme updated: ${themeName.toUpperCase()}`, duration: 2000 }).showToast();
    }
}

// 6. CART & WISHLIST LOGIC
function addToCart(id) {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;
    
    cart.push(prod);
    localStorage.setItem('vornex_cart', JSON.stringify(cart));
    updateBadges();
    
    if (typeof Toastify === "function") {
        Toastify({ text: "🛍️ Added to Bag!", duration: 2000, style: { background: "#40c057" } }).showToast();
    }
}

function updateBadges() {
    const cartCount = cart.length;
    const wishCount = wishlist.length;
    
    document.getElementById('menuCartCount').innerText = cartCount;
    document.getElementById('cartTotalItems').innerText = cartCount;
    document.getElementById('menuWishCount').innerText = wishCount;
}

// Dummy Handlers
function loginViaPhone() { alert("Phone OTP login active."); }
function loginViaGoogle() { alert("Google Authentication active."); }
function openOrderHistory() { alert("Order History details."); }
function openOrderTracking() { alert("Order Tracking active."); }
function openQuickOrderModal() { openCartFromMenu(); }
