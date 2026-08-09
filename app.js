// Vornex Products Catalog (Prices ranging ₹399 - ₹1499)
const vornexProducts = [
    {
        id: "v1",
        name: "VORNEX HEAVYWEIGHT OVERSIZED TEE",
        category: "Oversized Tees",
        price: 799,
        tag: "BESTSELLER",
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80"
    },
    {
        id: "v2",
        name: "VORNEX ACID WASH HOODIE",
        category: "Hoodies",
        price: 1499,
        tag: "NEW DROP",
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80"
    },
    {
        id: "v3",
        name: "VORNEX MINIMALIST BASIC T-SHIRT",
        category: "T-shirts",
        price: 399,
        tag: "ESSENTIAL",
        image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80"
    },
    {
        id: "v4",
        name: "VORNEX CASUAL OVERSIZED SHIRT",
        category: "Shirts",
        price: 999,
        tag: "HOT",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80"
    },
    {
        id: "v5",
        name: "VORNEX RELAXED SWEATSHIRT",
        category: "Sweatshirts",
        price: 1199,
        tag: "TRENDING",
        image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80"
    },
    {
        id: "v6",
        name: "VORNEX BAGGY DENIM JEANS",
        category: "Jeans",
        price: 1399,
        tag: "NEW",
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80"
    }
];

let cart = [];
let selectedSizes = {};

function renderProducts(items) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let html = "";
    items.forEach(item => {
        const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        let sizeBtns = sizes.map(size => `
            <button class="size-btn ${selectedSizes[item.id] === size ? 'selected' : ''}" 
                    onclick="selectSize('${item.id}', '${size}')">${size}</button>
        `).join('');

        html += `
            <div class="product-card">
                <div class="product-img-box">
                    <span class="badge-tag">${item.tag}</span>
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="product-info">
                    <div class="product-name">${item.name}</div>
                    <div class="product-price">₹${item.price}</div>
                    <div class="size-selector">
                        ${sizeBtns}
                    </div>
                    <button class="btn-add" onclick="addToCart('${item.id}')">ADD TO CART</button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function selectSize(productId, size) {
    selectedSizes[productId] = size;
    renderProducts(vornexProducts);
}

function filterCategory(cat) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.trim().toUpperCase() === cat.toUpperCase());
    });

    if (cat === 'All') {
        renderProducts(vornexProducts);
    } else {
        const filtered = vornexProducts.filter(p => p.category === cat);
        renderProducts(filtered);
    }
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

    let html = "";
    let rawTotal = 0;

    cart.forEach((item, index) => {
        rawTotal += item.price;
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <div>
                    <strong style="font-size:0.85rem">${item.name}</strong><br>
                    <small>Size: ${item.selectedSize} | ₹${item.price}</small>
                </div>
                <button onclick="removeFromCart(${index})" style="border:none; background:none; cursor:pointer; font-weight:bold; font-size:1.1rem;">✕</button>
            </div>
        `;
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

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function toggleCart(forceOpen = false) {
    const sidebar = document.getElementById('cartSidebar');
    const backdrop = document.getElementById('cartBackdrop');

    if (forceOpen) {
        sidebar.classList.add('open');
        backdrop.classList.add('active');
    } else {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('active');
    }
}

function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();

    if (!name || !phone || !address) {
        alert("Please fill Name, Phone, and Address!");
        return;
    }

    let rawTotal = 0;
    let itemsText = "";

    cart.forEach((item, i) => {
        rawTotal += item.price;
        itemsText += `${i+1}. ${item.name} (Size: ${item.selectedSize}) - ₹${item.price}%0A`;
    });

    let finalTotal = rawTotal;
    let offerApplied = "No Offer";

    if (rawTotal > 999) {
        const discount = Math.round(rawTotal * 0.20);
        finalTotal = rawTotal - discount;
        offerApplied = `Flat 20% OFF (-₹${discount})`;
    }

    let msg = `*🛍️ NEW ORDER FOR VORNEX*%0A%0A`;
    msg += `*Name:* ${name}%0A`;
    msg += `*Phone:* ${phone}%0A`;
    msg += `*Address:* ${address}%0A%0A`;
    msg += `*Items Ordered:*%0A${itemsText}%0A`;
    msg += `*Subtotal:* ₹${rawTotal}%0A`;
    msg += `*Offer:* ${offerApplied}%0A`;
    msg += `*Final Amount:* ₹${finalTotal}`;

    const targetPhone = "918269444061";
    window.open(`https://wa.me/${targetPhone}?text=${msg}`, '_blank');
}

window.addEventListener('DOMContentLoaded', () => {
    renderProducts(vornexProducts);
});
