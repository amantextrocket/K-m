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

let vornexProducts = [];
let cart = [];
let selectedSizesMap = {}; 
const MY_WHATSAPP_NUMBER = "918269444061"; // Your Updated WhatsApp Number

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
        
        // Default select first size
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

// Select Size Function
function selectSize(productId, size) {
    selectedSizesMap[productId] = size;
    renderProducts(vornexProducts);
}

// Search Logic
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
    
    let finalPrice = p.price;
    let offerNote = "";
    if (p.price >= 999) {
        finalPrice = Math.round(p.price * 0.8);
        offerNote = `\n*Offer Applied:* 20% OFF (Original: ₹${p.price})`;
    }

    const message = `Hi VORNEX! I want to buy this product:\n\n*Product:* ${p.name}\n*Size:* ${chosenSize}\n*Price:* ₹${finalPrice}${offerNote}\n*Image:* ${p.image}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${MY_WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
}

// Cart Drawer System
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

function updateCartUI() {
    document.getElementById('cartCount').innerText = cart.length;
    const list = document.getElementById('cartItemsList');
    const notice = document.getElementById('discountNotice');
    list.innerHTML = "";
    let subtotal = 0;

    if(cart.length === 0) {
        list.innerHTML = "<p style='color:#777;'>Cart is empty.</p>";
        document.getElementById('cartTotal').innerText = "₹0";
        notice.innerText = "";
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

    let finalTotal = subtotal;
    if (subtotal >= 999) {
        finalTotal = Math.round(subtotal * 0.8);
        notice.innerText = "🎉 20% Discount Applied for purchase over ₹999!";
        document.getElementById('cartTotal').innerHTML = `<span style="text-decoration:line-through; color:#777; font-size:0.8rem;">₹${subtotal}</span> ₹${finalTotal}`;
    } else {
        notice.innerText = `Add ₹${999 - subtotal} more to get 20% OFF!`;
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

    let finalTotal = subtotal;
    let isDiscounted = false;
    if (subtotal >= 999) {
        finalTotal = Math.round(subtotal * 0.8);
        isDiscounted = true;
    }
    
    let msg = "Hi VORNEX! I want to order the following cart items:\n\n";
    cart.forEach((item, i) => {
        msg += `${i+1}. *${item.name}* (Size: ${item.selectedSize}) - ₹${item.price}\n`;
    });

    if (isDiscounted) {
        msg += `\n*Subtotal:* ₹${subtotal}`;
        msg += `\n*Discount:* 20% OFF`;
        msg += `\n*FINAL AMOUNT TO PAY:* ₹${finalTotal}`;
    } else {
        msg += `\n*TOTAL AMOUNT:* ₹${finalTotal}`;
    }
    
    window.open(`https://wa.me/${MY_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}


