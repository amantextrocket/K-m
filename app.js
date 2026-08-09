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

let vornexProducts = [];
let cart = [];
let selectedSizes = {};

db.on('value', (snapshot) => {
    const data = snapshot.val();
    vornexProducts = [];
    if (data) {
        Object.keys(data).forEach(key => {
            vornexProducts.push({ id: key, ...data[key] });
        });
    }
    renderProducts(vornexProducts);
});

function renderProducts(items) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    if (items.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; font-weight: bold;">Loading VORNEX Collection...</p>`;
        return;
    }
    let html = "";
    items.forEach(item => {
        const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        let sizeBtns = sizes.map(size => `<button class="size-btn ${selectedSizes[item.id] === size ? 'selected' : ''}" onclick="selectSize('${item.id}', '${size}')">${size}</button>`).join('');
        html += `<div class="product-card">
            <div class="product-img-box"><span class="badge-tag">${item.tag}</span><img src="${item.image}" alt="${item.name}"></div>
            <div class="product-info">
                <div class="product-name">${item.name}</div>
                <div class="product-price">₹${item.price}</div>
                <div class="size-selector">${sizeBtns}</div>
                <button class="btn-add" onclick="addToCart('${item.id}')">ADD TO CART</button>
            </div>
        </div>`;
    });
    grid.innerHTML = html;
}

function selectSize(productId, size) { selectedSizes[productId] = size; renderProducts(vornexProducts); }

function filterCategory(cat) {
    document.querySelectorAll('.filter-btn').forEach(btn => { 
        btn.classList.toggle('active', btn.innerText.trim().toUpperCase() === cat.toUpperCase()); 
    });
    if (cat === 'All') { renderProducts(vornexProducts); } 
    else { renderProducts(vornexProducts.filter(p => p.category === cat)); }
}

function addToCart(productId) {
    const product = vornexProducts.find(p => p.id === productId);
    const size = selectedSizes[productId] || 'M';
    cart.push({ ...product, selectedSize: size });
    updateCartUI(); 
    toggleCart(true);
}

function updateCartUI() {
    document.getElementById('cartCount').innerText = cart.length;
    const list = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountNote = document.getElementById('discountNote');
    
    if (cart.length === 0) {
        list.innerHTML = '<p class="empty-cart-text">Your cart is empty.</p>';
        subtotalEl.innerText = '₹0';
        discountNote.innerText = 'Add items above ₹999 for Flat 20% OFF!';
        return;
    }
    let html = "", rawTotal = 0;
    cart.forEach((item, index) => {
        rawTotal += item.price;
        html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <div><strong>${item.name}</strong><br><small>Size: ${item.selectedSize} | ₹${item.price}</small></div>
            <button onclick="removeFromCart(${index})" style="border:none; background:none; cursor:pointer; font-weight:bold; font-size:1.1rem;">✕</button>
        </div>`;
    });
    let finalTotal = rawTotal;
    if (rawTotal > 999) {
        const discount = Math.round(rawTotal * 0.20);
        finalTotal = rawTotal - discount;
        discountNote.innerText = `🎉 FLAT 20% OFF APPLIED! (Saved ₹${discount})`;
    } else {
        discountNote.innerText = `Add ₹${1000 - rawTotal} more to get FLAT 20% OFF!`;
    }
    list.innerHTML = html;
    subtotalEl.innerText = `₹${finalTotal}`;
}

function removeFromCart(index) { cart.splice(index, 1); updateCartUI(); }

function toggleCart(forceOpen = false) {
    const sidebar = document.getElementById('cartSidebar');
    const backdrop = document.getElementById('cartBackdrop');
    if (forceOpen) { sidebar.classList.add('open'); backdrop.classList.add('active'); } 
    else { sidebar.classList.toggle('open'); backdrop.classList.toggle('active'); }
}

function checkoutWhatsApp() {
    if (cart.length === 0) { alert("Cart is empty!"); return; }
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    if (!name || !phone || !address) { alert("Please fill Name, Phone, and Address!"); return; }
    
    let rawTotal = 0, itemsText = "";
    cart.forEach((item, i) => {
        rawTotal += item.price;
        itemsText += `${i+1}. ${item.name} (Size: ${item.selectedSize}) - ₹${item.price}%0A`;
    });
    let finalTotal = rawTotal > 999 ? rawTotal - Math.round(rawTotal * 0.20) : rawTotal;
    let offerApplied = rawTotal > 999 ? `Flat 20% OFF` : "No Offer";
    
    let msg = `*🛍️ NEW ORDER FOR VORNEX*%0A%0A`;
    msg += `*Name:* ${name}%0A`;
    msg += `*Phone:* ${phone}%0A`;
    msg += `*Address:* ${address}%0A%0A`;
    msg += `*Items Ordered:*%0A${itemsText}%0A`;
    msg += `*Subtotal:* ₹${rawTotal}%0A`;
    msg += `*Offer:* ${offerApplied}%0A`;
    msg += `*Final Amount:* ₹${finalTotal}`;
    
    window.open(`https://wa.me/918269444061?text=${msg}`, '_blank');
}
