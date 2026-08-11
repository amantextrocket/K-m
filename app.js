// ==========================================
// VORNEX STORE - AMAN.HTML ADMIN SYNCED JS
// ==========================================

// 1. Firebase Initialization (Aapke aman.html waale Firebase Config se match karein)
const firebaseConfig = {
    databaseURL: "https://your-firebase-database-url.firebaseio.com" // 👈 Isko apne aman.html waale Database URL se badal dein
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

// 2. FETCH PRODUCTS FROM FIREBASE (Directly Synced with aman.html)
function fetchProductsFromFirebase() {
    const grid = document.getElementById('productGrid');
    
    // 'products' node se data fetch ho raha hai jo aman.html se save hota hai
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        allProducts = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                allProducts.push({ id: key, ...data[key] });
            });
            renderProducts(allProducts);
        } else {
            grid.innerHTML = `<div class="loading-spinner">No products found. Add items from aman.html panel.</div>`;
        }
    }, (error) => {
        console.error(error);
        grid.innerHTML = `<div class="loading-spinner">Error loading products from database.</div>`;
    });
}

// 3. RENDER PRODUCTS TO GRID
function renderProducts(productsList) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    if (productsList.length === 0) {
        grid.innerHTML = `<div class="loading-spinner">No products found matching category/search.</div>`;
        return;
    }
    
    let html = "";
    productsList.forEach(p => {
        html += `
        <div class="product-card">
            <img src="${p.image || p.imgUrl || 'https://via.placeholder.com/300'}" alt="${p.title || p.name}">
            <div class="p-info">
                <div class="p-title">${p.title || p.name}</div>
                <div class="p-price">₹${p.price}</div>
                <button class="add-btn" onclick="addToCart('${p.id}')">ADD TO BAG</button>
            </div>
        </div>`;
    });
    grid.innerHTML = html;
}

// 4. CATEGORY FILTER FIX
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
        const title = (p.title || p.name || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        
        const matchCategory = (currentCategory === 'ALL') || (category === currentCategory.toLowerCase());
        const matchSearch = title.includes(query);
        
        return matchCategory && matchSearch;
    });
    
    renderProducts(filtered);
}

// 5. DRAWER NAVIGATION & STEP BACK FIX
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
    
    document.querySelectorAll('.acc-body').forEach(b => b.style.display = 'none');
    el.style.display = isVisible ? 'none' : 'block';
}

function openCartFromMenu() { document.getElementById('cartDrawer').classList.add('active'); }
function closeCartDrawer() { document.getElementById('cartDrawer').classList.remove('active'); }
function openWishlistFromMenu() { openModal('wishlistModal'); }
function openCouponsFromMenu() { openModal('couponsModal'); }

function closeModalStepBack(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModalOnBg(event, id) {
    if (event.target.id === id) closeModalStepBack(id);
}

// 6. COLOR THEMES
function setTheme(themeName) {
    document.body.className = '';
    if (themeName !== 'dark') document.body.classList.add(`theme-${themeName}`);
    if (typeof Toastify === "function") Toastify({ text: `Theme: ${themeName.toUpperCase()}`, duration: 2000 }).showToast();
}

// 7. CART & BADGES
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
    const count = cart.length;
    if (document.getElementById('menuCartCount')) document.getElementById('menuCartCount').innerText = count;
    if (document.getElementById('cartTotalItems')) document.getElementById('cartTotalItems').innerText = count;
    if (document.getElementById('menuWishCount')) document.getElementById('menuWishCount').innerText = wishlist.length;
}

// Login & Utilities
function loginViaPhone() { alert("Phone Login Triggered"); }
function loginViaGoogle() { alert("Google Login Triggered"); }
function openOrderHistory() { alert("Order History"); }
function openOrderTracking() { alert("Order Tracking"); }
function openQuickOrderModal() { openCartFromMenu(); }
