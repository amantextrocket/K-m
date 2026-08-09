// Kabir Mobile — JS Logic

let localProducts = [
    {
        id: "1",
        name: "iPhone 13 Pro",
        brand: "iPhone",
        price: 52000,
        specs: "128GB / Graphite",
        battery: "88% Health",
        condition: "Mint Condition",
        image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&auto=format&fit=crop&q=60"
    },
    {
        id: "2",
        name: "Samsung Galaxy S22 Ultra",
        brand: "Samsung",
        price: 48500,
        specs: "256GB / 12GB RAM",
        battery: "5000 mAh",
        condition: "Like New (9/10)",
        image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60"
    },
    {
        id: "3",
        name: "OnePlus 11 5G",
        brand: "OnePlus",
        price: 38000,
        specs: "256GB / 16GB RAM",
        battery: "5000 mAh",
        condition: "Very Good",
        image: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500&auto=format&fit=crop&q=60"
    }
];

let cart = [];
let currentFilter = 'All';
let currentSlide = 0;
let slideInterval;

// Carousel Banner Logic
function showSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;

    if (index >= slides.length) currentSlide = 0;
    else if (index < 0) currentSlide = slides.length - 1;
    else currentSlide = index;

    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentSlide);
    });

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

function moveSlide(direction) {
    showSlide(currentSlide + direction);
    resetSliderTimer();
}

function setSlide(index) {
    showSlide(index);
    resetSliderTimer();
}

function startSliderTimer() {
    slideInterval = setInterval(() => {
        showSlide(currentSlide + 1);
    }, 4000); // 4 seconds auto slide
}

function resetSliderTimer() {
    clearInterval(slideInterval);
    startSliderTimer();
}

// Product Display & Filters Logic
function renderProducts(productsToRender) {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    if (productsToRender.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #777;">Is category me koi mobile nahi mila.</p>';
        return;
    }

    let html = "";
    productsToRender.forEach(p => {
        html += `
            <div class="card">
                <div class="card-img-wrap">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'">
                </div>
                <div>
                    <div class="card-badges">
                        <span class="badge-cond">⭐ ${p.condition}</span>
                        <span class="badge-spec">🔋 ${p.battery}</span>
                    </div>
                    <div class="card-title">${p.name}</div>
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 6px;">💾 ${p.specs}</div>
                    <div class="card-price">₹${p.price.toLocaleString('en-IN')}</div>
                </div>
                <button class="btn-add-cart" onclick="addToCart('${p.name}', ${p.price})">🛒 Add to Cart</button>
            </div>
        `;
    });
    container.innerHTML = html;
}

function searchMobiles() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = localProducts.filter(p => 
        (currentFilter === 'All' || p.brand === currentFilter) &&
        (p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
    );
    renderProducts(filtered);
}

function filterBrand(brand) {
    currentFilter = brand;
    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.classList.toggle('active', chip.innerText.includes(brand));
    });

    const filtered = brand === 'All' ? localProducts : localProducts.filter(p => p.brand === brand);
    renderProducts(filtered);
}

function addToCart(name, price) {
    cart.push({ name, price });
    updateCartUI();
    alert(`✅ "${name}" Cart me add ho gaya hai!`);
}

function updateCartUI() {
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.innerText = cart.length;

    const cartItemsEl = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');

    if (!cartItemsEl) return;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
        cartTotalEl.innerText = '₹0';
        return;
    }

    let html = "";
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        html += `
            <div class="cart-item-row">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>₹${item.price.toLocaleString('en-IN')}</small>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red; cursor:pointer;">❌</button>
            </div>
        `;
    });

    cartItemsEl.innerHTML = html;
    cartTotalEl.innerText = `₹${total.toLocaleString('en-IN')}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function toggleCart() {
    const modal = document.getElementById('cartModal');
    if (modal) modal.classList.toggle('active');
}

function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert("Aapka cart khali hai!");
        return;
    }

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();

    if (!name || !phone || !address) {
        alert("Kripya apna Naam, Phone Number aur Delivery Address bharen!");
        return;
    }

    let message = `*🔴 NEW ORDER - KABIR MOBILE*%0A%0A`;
    message += `*Customer Details:*%0A👤 Name: ${name}%0A📞 Phone: ${phone}%0A🏠 Address: ${address}%0A%0A`;
    message += `*Ordered Mobiles (Cash on Delivery):*%0A`;

    let total = 0;
    cart.forEach((item, idx) => {
        total += item.price;
        message += `${idx + 1}. ${item.name} — ₹${item.price.toLocaleString('en-IN')}%0A`;
    });

    message += `%0A*Total Amount:* ₹${total.toLocaleString('en-IN')}`;

    const targetPhone = "919876543210"; // Replace with your original number
    window.open(`https://wa.me/${targetPhone}?text=${message}`, '_blank');
}

window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsContainer')) {
        renderProducts(localProducts);
    }
    startSliderTimer();
});
