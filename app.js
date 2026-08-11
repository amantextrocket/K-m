// ==========================================================================
// VORNEX STORE - FRONTEND APPLICATION SCRIPT (2026)
// ==========================================================================

// 🔔 Custom Toast Helper Function
function showToast(message, type = "success") {
    let bgColor = "#10b981"; // Green
    if (type === "error") bgColor = "#ef4444"; // Red
    if (type === "info") bgColor = "#3b82f6"; // Blue

    Toastify({
        text: message,
        duration: 2500,
        gravity: "bottom",
        position: "right",
        stopOnFocus: true,
        style: {
            background: "#141414",
            color: "#ffffff",
            border: `1px solid ${bgColor}`,
            borderRadius: "8px",
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: "600",
            fontSize: "0.82rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.6)"
        }
    }).showToast();
}

// 🔌 Firebase Initialization
const firebaseConfig = {
    apiKey: "AIzaSyDItBcWY7ww6jj73h1HEtaTm7YllIBLQ1c",
    authDomain: "vornex-b7a62.firebaseapp.com",
    databaseURL: "https://vornex-b7a62-default-rtdb.firebaseio.com",
    projectId: "vornex-b7a62",
    storageBucket: "vornex-b7a62.firebasestorage.app",
    messagingSenderId: "60746200967",
    appId: "1:60746200967:web:29bf4cb533b14db3080522",
    measurementId: "G-RBG15BDSG0"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const productsRef = db.ref('products');
const analyticsRef = db.ref('analytics/daily_views');

// 📊 Global App State
let allProducts = {};
let selectedCategory = 'ALL';
let cart = JSON.parse(localStorage.getItem('vornex_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('vornex_wishlist')) || [];
let selectedSizes = {}; 
let appliedDiscount = 0;

// 📈 Record Daily Traffic Views
function recordTrafficView() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    
    analyticsRef.child(todayStr).transaction((currentViews) => {
        return (currentViews || 0) + 1;
    });
}
recordTrafficView();

// 📥 Realtime Firebase Products Fetch
productsRef.on('value', (snapshot) => {
    allProducts = snapshot.val() || {};
    renderProducts();
    updateBadges();
});

// 🖼️ Render Product Grid
function renderProducts() {
    const gridEl = document.getElementById('productGrid');
    const keys = Object.keys(allProducts);

    if (keys.length === 0) {
        gridEl.innerHTML = `<div class="loading-spinner">No products currently available in store.</div>`;
        return;
    }

    let html = "";
    let matchesCount = 0;

    keys.forEach(key => {
        const p = allProducts[key];
        
        // Category Filter Check
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return;

        matchesCount++;
        const isWishlisted = wishlist.includes(key);
        const stocks = p.sizeStocks || { S:5, M:10, L:10, XL:5, XXL:0 };
        const totalStock = Object.values(stocks).reduce((a, b) => a + b, 0);
        const isOutOfStock = totalStock === 0;

        const defaultSelectedSize = selectedSizes[key] || getFirstAvailableSize(stocks) || 'M';

        html += `
            <div class="product-card">
                <div class="card-img-wrapper">
                    ${p.tag ? `<span class="tag-badge">${p.tag.toUpperCase()}</span>` : ''}
                    <button class="wishlist-btn-icon ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${key}')">
                        <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                    <img src="${p.image}" class="img-primary ${p.imageBack ? '' : 'single-img'}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x375?text=VORNEX'">
                    ${p.imageBack ? `<img src="${p.imageBack}" class="img-back" alt="${p.name} Back View">` : ''}
                </div>

                <div class="card-info">
                    <span class="card-category">${p.category.toUpperCase()}</span>
                    <h3 class="card-title">${escapeHtml(p.name)}</h3>
                    
                    <div class="card-price-row">
                        <span class="price-current">₹${p.price}</span>
                    </div>

                    <div class="size-selector">
                        ${['S', 'M', 'L', 'XL', 'XXL'].map(sz => {
                            const qty = stocks[sz] || 0;
                            const isSelected = defaultSelectedSize === sz;
                            const isSzOut = qty === 0;
                            return `
                                <div class="size-chip ${isSelected ? 'selected' : ''} ${isSzOut ? 'out-of-stock' : ''}" 
                                     onclick="${isSzOut ? '' : `selectSize('${key}', '${sz}')`}">
                                    ${sz}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="card-action-btns">
                        <button class="add-cart-btn" onclick="addToCart('${key}')" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                            ${isOutOfStock ? 'SOLD OUT' : 'ADD TO BAG'}
                        </button>
                        <button class="size-guide-link" onclick="openModal('sizeChartModal')" title="Size Chart">
                            <i class="fa-solid fa-ruler"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    if (matchesCount === 0) {
        gridEl.innerHTML = `<div class="loading-spinner">No products found in this category.</div>`;
    } else {
        gridEl.innerHTML = html;
    }
}

function getFirstAvailableSize(stocks) {
    for (let sz of ['S', 'M', 'L', 'XL', 'XXL']) {
        if ((stocks[sz] || 0) > 0) return sz;
    }
    return null;
}

function selectSize(prodKey, size) {
    selectedSizes[prodKey] = size;
    renderProducts();
}

function filterCategory(catName, btnEl) {
    selectedCategory = catName;
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    btnEl.classList.add('active');
    renderProducts();
}

function searchProducts() {
    const query = document.getElementById('storeSearch').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const title = card.querySelector('.card-title').innerText.toLowerCase();
        const cat = card.querySelector('.card-category').innerText.toLowerCase();
        if (title.includes(query) || cat.includes(query)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// 🛍️ Cart Management
function addToCart(prodKey) {
    const p = allProducts[prodKey];
    if (!p) return;

    const size = selectedSizes[prodKey] || getFirstAvailableSize(p.sizeStocks) || 'M';
    const cartItemId = `${prodKey}_${size}`;
    const existingIndex = cart.findIndex(item => item.id === cartItemId);

    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({
            id: cartItemId,
            prodKey: prodKey,
            name: p.name,
            price: p.price,
            image: p.image,
            size: size,
            qty: 1
        });
    }

    saveCart();
    showToast(`🛍️ Added ${p.name} (${size}) to Bag!`, "success");
    toggleCartDrawer(true);
}

function updateCartQty(cartItemId, delta) {
    const index = cart.findIndex(item => item.id === cartItemId);
    if (index > -1) {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
            showToast("Item removed from cart", "info");
        }
        saveCart();
    }
}

function saveCart() {
    localStorage.setItem('vornex_cart', JSON.stringify(cart));
    renderCart();
    updateBadges();
}

function renderCart() {
    const listEl = document.getElementById('cartItemsList');
    if (cart.length === 0) {
        listEl.innerHTML = `<p class="empty-cart-text">Your cart is currently empty.</p>`;
        document.getElementById('cartSubtotal').innerText = '₹0';
        document.getElementById('cartDiscount').innerText = '-₹0';
        document.getElementById('cartGrandTotal').innerText = '₹0';
        document.getElementById('cartTotalItems').innerText = '0';
        return;
    }

    let subtotal = 0;
    let totalItems = 0;
    let html = "";

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        totalItems += item.qty;

        html += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <div class="cart-item-title">${escapeHtml(item.name)}</div>
                    <div class="cart-item-meta">Size: <strong>${item.size}</strong> | ₹${item.price}</div>
                    <div class="cart-qty-ctrl">
                        <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)">-</button>
                        <span style="font-size:0.8rem; font-weight:bold;">${item.qty}</span>
                        <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
                    </div>
                </div>
                <div style="font-weight:900; font-size:0.85rem;">₹${itemTotal}</div>
            </div>
        `;
    });

    listEl.innerHTML = html;
    const discountAmount = Math.round(subtotal * appliedDiscount);
    const grandTotal = subtotal - discountAmount;

    document.getElementById('cartSubtotal').innerText = `₹${subtotal}`;
    document.getElementById('cartDiscount').innerText = `-₹${discountAmount}`;
    document.getElementById('cartGrandTotal').innerText = `₹${grandTotal}`;
    document.getElementById('cartTotalItems').innerText = totalItems;
}

function applyCoupon() {
    const input = document.getElementById('couponCodeInput').value.trim().toUpperCase();
    const msgEl = document.getElementById('couponDiscountText');

    if (input === 'VORNEX10') {
        appliedDiscount = 0.10; // 10% Off
        msgEl.innerText = "✅ Promo Code 'VORNEX10' Applied (10% OFF)";
        showToast("🎉 10% Discount Applied!", "success");
    } else {
        appliedDiscount = 0;
        msgEl.innerText = "⚠️ Invalid Promo Code";
        showToast("Invalid Promo Code", "error");
    }
    renderCart();
}

function toggleCartDrawer(forceOpen = false) {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    
    if (forceOpen || !drawer.classList.contains('open')) {
        drawer.classList.add('open');
        overlay.classList.add('open');
        renderCart();
    } else {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    }
}

// ❤️ Wishlist Management
function toggleWishlist(prodKey) {
    const index = wishlist.indexOf(prodKey);
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast("Removed from Wishlist", "info");
    } else {
        wishlist.push(prodKey);
        showToast("❤️ Saved to Wishlist!", "success");
    }
    localStorage.setItem('vornex_wishlist', JSON.stringify(wishlist));
    renderProducts();
    updateBadges();
}

function openWishlistModal() {
    const listEl = document.getElementById('wishlistItemsList');
    if (wishlist.length === 0) {
        listEl.innerHTML = `<p style="color:#888; text-align:center; padding: 20px;">Your wishlist is empty.</p>`;
    } else {
        let html = "";
        wishlist.forEach(key => {
            const p = allProducts[key];
            if (p) {
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1a1a1a; padding:12px 0;">
                        <div style="display:flex; gap:12px; align-items:center;">
                            <img src="${p.image}" style="width:45px; height:55px; object-fit:cover; border-radius:4px;">
                            <div>
                                <strong style="font-size:0.85rem; color:#fff;">${escapeHtml(p.name)}</strong><br>
                                <span style="font-size:0.75rem; color:#888;">₹${p.price}</span>
                            </div>
                        </div>
                        <button onclick="addToCart('${key}')" style="background:#fff; color:#000; border:none; padding:6px 12px; font-weight:bold; font-size:0.7rem; border-radius:4px; cursor:pointer;">
                            ADD TO BAG
                        </button>
                    </div>
                `;
            }
        });
        listEl.innerHTML = html;
    }
    openModal('wishlistModal');
}

function updateBadges() {
    const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').innerText = totalCartCount;
    document.getElementById('wishlistCount').innerText = wishlist.length;
}

// 📦 Checkout & WhatsApp Order Generation
function openCheckoutModal() {
    if (cart.length === 0) {
        showToast("⚠️ Your cart is empty!", "error");
        return;
    }
    toggleCartDrawer(false);
    openModal('checkoutModal');
}

function submitOrder(e) {
    e.preventDefault();
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();

    let subtotal = 0;
    let orderDetails = "";

    cart.forEach((item, i) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        orderDetails += `${i+1}. *${item.name}*\n   • Size: ${item.size}\n   • Qty: ${item.qty}\n   • Price: ₹${itemTotal}\n`;
    });

    const discountAmount = Math.round(subtotal * appliedDiscount);
    const finalTotal = subtotal - discountAmount;

    let msg = `*🔥 NEW ORDER - VORNEX STORE 🔥*\n\n`;
    msg += `*Customer Details:*\n`;
    msg += `👤 Name: ${name}\n`;
    msg += `📞 Phone: ${phone}\n`;
    msg += `📍 Address: ${address}\n\n`;
    msg += `*Order Items:*\n${orderDetails}\n`;
    if (discountAmount > 0) msg += `💰 Discount: -₹${discountAmount}\n`;
    msg += `*TOTAL AMOUNT: ₹${finalTotal}*\n\n`;
    msg += `Please confirm my order and share payment details!`;

    const whatsappNumber = "919024220557"; // Store Owner WhatsApp
    const encodedUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

    // Clear Cart
    cart = [];
    localStorage.removeItem('vornex_cart');
    saveCart();
    closeModal('checkoutModal');

    showToast("🚀 Redirecting to WhatsApp...", "success");
    setTimeout(() => {
        window.open(encodedUrl, '_blank');
    }, 1000);
}

// 🔳 Modal Helpers
function openModal(modalId) { document.getElementById(modalId).style.display = 'flex'; }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }
function closeModalOnBg(e, modalId) { if (e.target.id === modalId) closeModal(modalId); }

function escapeHtml(text) {
    return text ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : '';
}
