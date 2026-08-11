// ==========================================================================
// VORNEX STORE - FRONTEND APPLICATION SCRIPT (2026)
// Complete Merged & Production-Ready Code
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

// 🎟️ Coupon System Configuration
const validCoupons = {
    'VORNEX10': { type: 'percent', value: 10, label: '10% OFF' },
    'SAVE20': { type: 'percent', value: 20, label: '20% OFF' },
    'FLAT200': { type: 'flat', value: 200, label: '₹200 OFF' },
    'WELCOME50': { type: 'percent', value: 50, label: '50% OFF' }
};
let appliedCouponCode = '';

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
    if (!gridEl) return;

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
                    <span class="card-category">${p.category ? p.category.toUpperCase() : ''}</span>
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
    if (!stocks) return null;
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
    if (btnEl) btnEl.classList.add('active');
    renderProducts();
}

function searchProducts() {
    const input = document.getElementById('storeSearch');
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const title = card.querySelector('.card-title')?.innerText.toLowerCase() || '';
        const cat = card.querySelector('.card-category')?.innerText.toLowerCase() || '';
        if (title.includes(query) || cat.includes(query)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// 🛍️ Cart Management (With Multi-Item Stock Checks)
function addToCart(prodKey) {
    const p = allProducts[prodKey];
    if (!p) return;

    const stocks = p.sizeStocks || { S:5, M:10, L:10, XL:5, XXL:0 };
    const size = selectedSizes[prodKey] || getFirstAvailableSize(stocks);

    if (!size) {
        showToast("⚠️ Selected item is out of stock!", "error");
        return;
    }

    const availableStock = stocks[size] || 0;
    const cartItemId = `${prodKey}_${size}`;
    const existingIndex = cart.findIndex(item => item.id === cartItemId);
    const currentQtyInCart = existingIndex > -1 ? cart[existingIndex].qty : 0;

    if (currentQtyInCart + 1 > availableStock) {
        showToast(`⚠️ Only ${availableStock} items available in size ${size}`, "error");
        return;
    }

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
        const item = cart[index];
        const p = allProducts[item.prodKey];
        
        if (delta > 0 && p && p.sizeStocks) {
            const availableStock = p.sizeStocks[item.size] || 0;
            if (item.qty + delta > availableStock) {
                showToast(`⚠️ Max stock reached for size ${item.size} (${availableStock})`, "error");
                return;
            }
        }

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

// 🧮 Calculate Discount Amount Helper
function getDiscountAmount(subtotal) {
    if (!appliedCouponCode || !validCoupons[appliedCouponCode]) return 0;
    const coupon = validCoupons[appliedCouponCode];

    if (coupon.type === 'percent') {
        return Math.round((subtotal * coupon.value) / 100);
    } else if (coupon.type === 'flat') {
        return Math.min(subtotal, coupon.value);
    }
    return 0;
}

function renderCart() {
    const listEl = document.getElementById('cartItemsList');
    if (!listEl) return;

    if (cart.length === 0) {
        listEl.innerHTML = `<p class="empty-cart-text">Your cart is currently empty.</p>`;
        if (document.getElementById('cartSubtotal')) document.getElementById('cartSubtotal').innerText = '₹0';
        if (document.getElementById('cartDiscount')) document.getElementById('cartDiscount').innerText = '-₹0';
        if (document.getElementById('cartGrandTotal')) document.getElementById('cartGrandTotal').innerText = '₹0';
        if (document.getElementById('cartTotalItems')) document.getElementById('cartTotalItems').innerText = '0';
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
    const discountAmount = getDiscountAmount(subtotal);
    const grandTotal = Math.max(0, subtotal - discountAmount);

    if (document.getElementById('cartSubtotal')) document.getElementById('cartSubtotal').innerText = `₹${subtotal}`;
    if (document.getElementById('cartDiscount')) document.getElementById('cartDiscount').innerText = `-₹${discountAmount}`;
    if (document.getElementById('cartGrandTotal')) document.getElementById('cartGrandTotal').innerText = `₹${grandTotal}`;
    if (document.getElementById('cartTotalItems')) document.getElementById('cartTotalItems').innerText = totalItems;
}

// 🏷️ Coupon Code Apply & Remove Functions
function applyCoupon() {
    const inputEl = document.getElementById('couponCodeInput');
    const msgEl = document.getElementById('couponDiscountText');
    
    if (!inputEl) return;
    const input = inputEl.value.trim().toUpperCase();

    if (!input) {
        if (msgEl) msgEl.innerText = "⚠️ Please enter a coupon code";
        showToast("Please enter a coupon code!", "error");
        return;
    }

    if (appliedCouponCode === input) {
        showToast("Coupon is already applied!", "info");
        return;
    }

    if (validCoupons[input]) {
        appliedCouponCode = input;
        const coupon = validCoupons[input];
        if (msgEl) msgEl.innerText = `✅ Promo Code '${input}' Applied (${coupon.label})`;
        showToast(`🎉 Code '${input}' applied (${coupon.label})!`, "success");
    } else {
        appliedCouponCode = '';
        if (msgEl) msgEl.innerText = "⚠️ Invalid Promo Code";
        showToast("Invalid Promo Code", "error");
    }
    renderCart();
}

function removeCoupon() {
    appliedCouponCode = '';
    const inputEl = document.getElementById('couponCodeInput');
    const msgEl = document.getElementById('couponDiscountText');
    if (inputEl) inputEl.value = '';
    if (msgEl) msgEl.innerText = '';
    showToast("Coupon removed", "info");
    renderCart();
}

function toggleCartDrawer(forceOpen = false) {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    
    if (!drawer || !overlay) return;

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
    if (!listEl) return;

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
    const cartCountEl = document.getElementById('cartCount');
    const wishlistCountEl = document.getElementById('wishlistCount');

    if (cartCountEl) cartCountEl.innerText = totalCartCount;
    if (wishlistCountEl) wishlistCountEl.innerText = wishlist.length;
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
    const nameEl = document.getElementById('custName');
    const phoneEl = document.getElementById('custPhone');
    const addressEl = document.getElementById('custAddress');

    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const address = addressEl ? addressEl.value.trim() : '';

    let subtotal = 0;
    let orderDetails = "";

    cart.forEach((item, i) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        orderDetails += `${i+1}. *${item.name}*\n   • Size: ${item.size}\n   • Qty: ${item.qty}\n   • Price: ₹${itemTotal}\n`;
    });

    const discountAmount = getDiscountAmount(subtotal);
    const finalTotal = Math.max(0, subtotal - discountAmount);

    let msg = `*🔥 NEW ORDER - VORNEX STORE 🔥*\n\n`;
    msg += `*Customer Details:*\n`;
    msg += `👤 Name: ${name}\n`;
    msg += `📞 Phone: ${phone}\n`;
    msg += `📍 Address: ${address}\n\n`;
    msg += `*Order Items:*\n${orderDetails}\n`;
    if (appliedCouponCode && discountAmount > 0) {
        msg += `🎟️ Coupon Applied: ${appliedCouponCode}\n`;
        msg += `💰 Discount: -₹${discountAmount}\n`;
    }
    msg += `*TOTAL AMOUNT: ₹${finalTotal}*\n\n`;
    msg += `Please confirm my order and share payment details!`;

    const whatsappNumber = "919024220557"; // Store Owner WhatsApp
    const encodedUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

    // Clear Cart & Applied Coupon
    cart = [];
    appliedCouponCode = '';
    localStorage.removeItem('vornex_cart');
    saveCart();
    closeModal('checkoutModal');

    showToast("🚀 Redirecting to WhatsApp...", "success");
    setTimeout(() => {
        window.open(encodedUrl, '_blank');
    }, 1000);
}

// 🔳 Modal Helpers
function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = 'flex';
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = 'none';
}

function closeModalOnBg(e, modalId) {
    if (e.target.id === modalId) closeModal(modalId);
}

function escapeHtml(text) {
    return text ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : '';
}
// 📱 Menu Drawer Toggle Function
function toggleMenuDrawer(open) {
    const drawer = document.getElementById('iosMenuDrawer');
    if (drawer) {
        drawer.classList.toggle('open', open);
    }
}

// 📂 Accordion Toggle Function
function toggleAccordion(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = el.style.display === 'block' ? 'none' : 'block';
    }
}

// ⚡ Quick Order Popup Handlers
function openQuickOrderModal() {
    if (cart.length === 0) {
        showToast("⚠️ Cart is empty! Add products first.", "error");
        return;
    }
    
    let summaryHtml = "";
    let total = 0;
    cart.forEach(item => {
        summaryHtml += `<p>• ${item.name} (${item.size}) x ${item.qty} - ₹${item.price * item.qty}</p>`;
        total += item.price * item.qty;
    });
    
    summaryHtml += `<strong>Total Amount: ₹${total}</strong>`;
    document.getElementById('quickOrderSummary').innerHTML = summaryHtml;
    openModal('quickOrderModal');
}

// 📲 Process Quick Order via WhatsApp / SMS
function processQuickOrder(type) {
    const phoneNo = "918269444061";
    let orderText = "Order Details from VORNEX:\n";
    let total = 0;
    
    cart.forEach(item => {
        orderText += `- ${item.name} | Size: ${item.size} | Qty: ${item.qty} | Price: ₹${item.price * item.qty}\n`;
        total += item.price * item.qty;
    });
    orderText += `Total: ₹${total}`;

    if (type === 'WA') {
        window.open(`https://wa.me/${phoneNo}?text=${encodeURIComponent(orderText)}`, '_blank');
    } else if (type === 'SMS') {
        window.open(`sms:${phoneNo}?body=${encodeURIComponent(orderText)}`, '_blank');
    }
}

// 🎨 Dynamic Theme Switcher
function setTheme(theme) {
    if (theme === 'neon') {
        document.body.style.backgroundColor = '#0b132b';
        document.body.style.color = '#6fffe9';
    } else if (theme === 'luxury') {
        document.body.style.backgroundColor = '#121212';
        document.body.style.color = '#d4af37';
    } else {
        document.body.style.backgroundColor = '#000000';
        document.body.style.color = '#ffffff';
    }
    showToast(`Theme changed to ${theme.toUpperCase()}`, "info");
}

// 👤 Account Details Dummy Modal Trigger
function showAccountDetails() {
    showToast("User: Aman Verma | City: Bilaspur", "info");
}

// 📱 Login Handlers
function loginViaPhone() { showToast("Redirecting to OTP Verification...", "info"); }
function loginViaGoogle() { showToast("Connecting Google Auth...", "info"); }

