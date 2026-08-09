// Firebase Config
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref('products');

// 📈 Visitor Track Code
(function trackVisitor() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    firebase.database().ref('analytics/daily_views/' + dateKey).transaction((currentViews) => {
        return (currentViews || 0) + 1;
    });
})();


let vornexProducts = [];
let cart = [];
let selectedSizesMap = {}; 
let appliedCouponCode = "";
let couponExtraDiscountPercent = 0; // 5% Extra Coupon Discount

const MY_WHATSAPP_NUMBER = "918269444061"; // Your WhatsApp Number

// Realtime Products Load
db.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    vornexProducts = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    renderProducts(vornexProducts);
});

// Render Store Products
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = "";

    if (products.length === 0) {
        grid.innerHTML = "<p style='grid-column:1/-1; text-align:center; color:#777;'>No products available.</p>";
        return;
    }

    products.forEach(p => {
        const isStock = p.inStock !== false;
        const availableSizes = p.sizes || ['M', 'L', 'XL'];
        
        if (!selectedSizesMap[p.id]) {
            selectedSizesMap[p.id] = availableSizes[0];
        }

        let sizesHTML = `<div class="size-picker">`;
        availableSizes.forEach(size => {
            const activeClass = selectedSizesMap[p.id] === size ? 'active' : '';
            sizesHTML += `<span class="size-chip ${activeClass}" onclick="selectSize('${p.id}', '${size}')">${size}</span>`;
        });
        sizesHTML += `</div>`;

        grid.innerHTML += `
            <div class="product-card">
                ${p.tag ? `<span class="badge-tag">${p.tag}</span>` : ''}
                ${!isStock ? `<span class="sold-out-badge">SOLD OUT</span>` : ''}
                <img src="${p.image}" alt="${p.name}">
                <div class="product-info">
                    <div>
                        <div class="product-title">${p.name}</div>
                        <div class="product-price">₹${p.price}</div>
                        ${sizesHTML}
                    </div>
                    <div class="btn-group">
                        <button class="btn-add ${!isStock ? 'btn-disabled' : ''}" 
                                onclick="addToCart('${p.id}')" ${!isStock ? 'disabled' : ''}>
                                ${isStock ? 'ADD TO CART' : 'OUT OF STOCK'}
                        </button>
                        <button class="btn-wa ${!isStock ? 'btn-disabled' : ''}" 
                                onclick="directWhatsAppOrder('${p.id}')" ${!isStock ? 'disabled' : ''}>
                                BUY VIA WHATSAPP
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

function selectSize(productId, size) {
    selectedSizesMap[productId] = size;
    renderProducts(vornexProducts);
}

function showQuickCategories(show) {
    document.getElementById('quickCategories').style.display = show ? 'flex' : 'none';
}

function handleUserSearch() {
    const query = document.getElementById('userSearchBar').value.toLowerCase().trim();
    const filtered = vornexProducts.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
    );
    renderProducts(filtered);
}

function selectQuickCategory(cat) {
    document.getElementById('userSearchBar').value = cat === 'All' ? '' : cat;
    if(cat === 'All') {
        renderProducts(vornexProducts);
    } else {
        const filtered = vornexProducts.filter(p => p.category === cat);
        renderProducts(filtered);
    }
    showQuickCategories(false);
}

// Single Click Direct WhatsApp Order
function directWhatsAppOrder(productId) {
    const p = vornexProducts.find(item => item.id === productId);
    const chosenSize = selectedSizesMap[productId] || "M";
    
    let currentPrice = p.price;
    let offerDetails = [];

    // Auto 20% OFF above 999
    if (p.price >= 999) {
        currentPrice = Math.round(currentPrice * 0.8);
        offerDetails.push("Flat 20% OFF (Above ₹999)");
    }

    // Extra 5% Coupon OFF
    if (couponExtraDiscountPercent > 0) {
        currentPrice = Math.round(currentPrice * ((100 - couponExtraDiscountPercent) / 100));
        offerDetails.push(`Extra ${couponExtraDiscountPercent}% OFF Coupon (${appliedCouponCode})`);
    }

    let offerNote = offerDetails.length > 0 ? `\n*Offers Applied:* ${offerDetails.join(" + ")}` : "";

    const message = `Hi VORNEX! I want to buy this product:\n\n*Product:* ${p.name}\n*Size:* ${chosenSize}\n*Original Price:* ₹${p.price}\n*Final Price:* ₹${currentPrice}${offerNote}\n*Image:* ${p.image}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${MY_WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
}

// Cart System
function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
}

function addToCart(productId) {
    const p = vornexProducts.find(item => item.id === productId);
    const chosenSize = selectedSizesMap[productId] || "M";
    
    cart.push({ ...p, selectedSize: chosenSize });
    updateCartUI();
    toggleCart();
}

// 5% Extra Coupon Logic
function applyCoupon() {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    const msg = document.getElementById('couponMsg');

    // Available 5% Extra Coupons: VORNEX5, EXTRA5, EDGE5
    if (code === "VORNEX5" || code === "EXTRA5" || code === "EDGE5") {
        appliedCouponCode = code;
        couponExtraDiscountPercent = 5;
        msg.style.color = "#25D366";
        msg.innerText = `🎉 Coupon '${code}' Applied! (Extra 5% OFF)`;
    } else if (code === "") {
        appliedCouponCode = "";
        couponExtraDiscountPercent = 0;
        msg.innerText = "";
    } else {
        msg.style.color = "#ff3333";
        msg.innerText = "❌ Invalid Coupon Code";
        return;
    }
    updateCartUI();
}

function updateCartUI() {
    document.getElementById('cartCount').innerText = cart.length;
    const list = document.getElementById('cartItemsList');
    list.innerHTML = "";
    let subtotal = 0;

    if(cart.length === 0) {
        list.innerHTML = "<p style='color:#777;'>Cart is empty.</p>";
        document.getElementById('cartTotal').innerText = "₹0";
        return;
    }

    cart.forEach((item, index) => {
        subtotal += item.price;
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #222; padding-bottom:8px;">
                <div>
                    <strong style="font-size:0.85rem;">${item.name}</strong><br>
                    <small style="color:#aaa;">Size: ${item.selectedSize} | ₹${item.price}</small>
                </div>
                <span onclick="removeFromCart(${index})" style="color:#ff3333; cursor:pointer; font-weight:bold;">&times;</span>
            </div>
        `;
    });

    let currentTotal = subtotal;

    // 1. Check Auto 20% Flat Discount above 999
    if (subtotal >= 999) {
        currentTotal = Math.round(currentTotal * 0.8);
    }

    // 2. Apply Extra 5% Coupon Discount
    if (couponExtraDiscountPercent > 0) {
        currentTotal = Math.round(currentTotal * ((100 - couponExtraDiscountPercent) / 100));
    }

    if (currentTotal < subtotal) {
        document.getElementById('cartTotal').innerHTML = `<span style="text-decoration:line-through; color:#777; font-size:0.8rem;">₹${subtotal}</span> ₹${currentTotal}`;
    } else {
        document.getElementById('cartTotal').innerText = "₹" + subtotal;
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function checkoutCartWhatsApp() {
    if(cart.length === 0) return alert("Your cart is empty!");
    
    let subtotal = 0;
    cart.forEach(item => subtotal += item.price);

    let currentTotal = subtotal;
    let appliedOffers = [];

    // Auto 20% OFF
    if (subtotal >= 999) {
        currentTotal = Math.round(currentTotal * 0.8);
        appliedOffers.push("Flat 20% OFF (Orders >= ₹999)");
    }

    // Extra 5% OFF Coupon
    if (couponExtraDiscountPercent > 0) {
        currentTotal = Math.round(currentTotal * ((100 - couponExtraDiscountPercent) / 100));
        appliedOffers.push(`Extra 5% Coupon OFF (${appliedCouponCode})`);
    }
    
    let msg = "Hi VORNEX! I want to order the following cart items:\n\n";
    cart.forEach((item, i) => {
        msg += `${i+1}. *${item.name}* (Size: ${item.selectedSize}) - ₹${item.price}\n`;
    });

    msg += `\n*Subtotal:* ₹${subtotal}`;
    if (appliedOffers.length > 0) {
        msg += `\n*Offers Applied:* ${appliedOffers.join(" + ")}`;
    }
    msg += `\n*FINAL AMOUNT TO PAY:* ₹${currentTotal}`;
    
    window.open(`https://wa.me/${MY_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

