// ==========================================
// VORNEX STORE - CORE APPLICATION LOGIC
// ==========================================

let cart = JSON.parse(localStorage.getItem('vornex_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('vornex_wishlist')) || [];

// 📱 1. Dynamic Menu Drawer & Accordion Handlers
function toggleMenuDrawer(open) {
    const drawer = document.getElementById('iosMenuDrawer');
    const overlay = document.getElementById('cartOverlay');
    
    if (drawer) {
        if (open) {
            drawer.classList.add('active');
            if (overlay) overlay.classList.add('active');
        } else {
            drawer.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }
    }
}

function toggleAccordion(id) {
    const el = document.getElementById(id);
    if (el) {
        const isShown = el.style.display === 'block';
        el.style.display = isShown ? 'none' : 'block';
    }
}

// 🛍️ 2. Cart Drawer Toggle
function toggleCartDrawer(open) {
    const cartDrawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    
    if (cartDrawer) {
        if (open) {
            cartDrawer.classList.add('active');
            if (overlay) overlay.classList.add('active');
        } else {
            cartDrawer.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }
    }
}

// 🔲 3. Generic Modal Handlers
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function closeModalOnBg(event, id) {
    if (event.target.id === id) {
        closeModal(id);
    }
}

function openWishlistModal() {
    renderWishlist();
    openModal('wishlistModal');
}

// ⚡ 4. Quick Order & BUY NOW Handlers
function openQuickOrderModal() {
    if (cart.length === 0) {
        if (typeof Toastify === "function") {
            Toastify({ text: "⚠️ Bag is empty! Add products first.", duration: 3000, style: { background: "#e74c3c" } }).showToast();
        } else {
            alert("Bag is empty! Add products first.");
        }
        return;
    }
    
    let summaryHtml = "<ul style='list-style:none; padding:0;'>";
    let total = 0;
    
    cart.forEach(item => {
        summaryHtml += `<li style='margin-bottom:8px; border-bottom:1px solid #222; padding-bottom:5px;'>
            <strong>${item.name}</strong><br>
            Size: ${item.size} | Qty: ${item.qty} - ₹${item.price * item.qty}
        </li>`;
        total += item.price * item.qty;
    });
    
    summaryHtml += `</ul><div style='margin-top:10px; font-weight:800; font-size:1rem; color:#40c057;'>Total Amount: ₹${total}</div>`;
    
    const summaryContainer = document.getElementById('quickOrderSummary');
    if (summaryContainer) summaryContainer.innerHTML = summaryHtml;
    
    openModal('quickOrderModal');
}

function processQuickOrder(type) {
    const phoneNo = "918269444061";
    if (cart.length === 0) return;
    
    let orderText = "🛒 *NEW ORDER FROM VORNEX STORE*\n------------------------------\n";
    let total = 0;
    
    cart.forEach((item, idx) => {
        orderText += `${idx + 1}. ${item.name}\n   Size: ${item.size} | Qty: ${item.qty} | Price: ₹${item.price * item.qty}\n`;
        total += item.price * item.qty;
    });
    
    orderText += `------------------------------\n*Grand Total: ₹${total}*\n\nPlease confirm my order!`;

    if (type === 'WA') {
        window.open(`https://wa.me/${phoneNo}?text=${encodeURIComponent(orderText)}`, '_blank');
    } else if (type === 'SMS') {
        window.open(`sms:${phoneNo}?body=${encodeURIComponent(orderText)}`, '_blank');
    }
}

// 🎨 5. Theme Switcher
function setTheme(theme) {
    if (theme === 'neon') {
        document.documentElement.style.setProperty('--bg-black', '#0b132b');
        document.documentElement.style.setProperty('--card-bg', '#1c2541');
        document.documentElement.style.setProperty('--accent-green', '#38bdf8');
    } else if (theme === 'luxury') {
        document.documentElement.style.setProperty('--bg-black', '#121212');
        document.documentElement.style.setProperty('--card-bg', '#1c1917');
        document.documentElement.style.setProperty('--accent-green', '#fbbf24');
    } else {
        document.documentElement.style.setProperty('--bg-black', '#0a0a0c');
        document.documentElement.style.setProperty('--card-bg', '#141418');
        document.documentElement.style.setProperty('--accent-green', '#40c057');
    }
    
    if (typeof Toastify === "function") {
        Toastify({ text: `Theme switched to ${theme.toUpperCase()}`, duration: 2000 }).showToast();
    }
}

// 👤 6. Utility Functions for Menu
function showAccountDetails() {
    alert("User Profile:\nName: Aman Verma\nCity: Bilaspur\nStatus: Verified Premium Member");
}
function loginViaPhone() { alert("Phone OTP Service Redirecting..."); }
function loginViaGoogle() { alert("Connecting Google Authentication..."); }
function openOrderHistory() { alert("No previous completed orders found."); }
function openOrderTracking() { alert("Enter tracking ID to trace shipment."); }

function renderWishlist() {
    const container = document.getElementById('wishlistItemsList');
    if (!container) return;
    
    if (wishlist.length === 0) {
        container.innerHTML = `<p style="color:#888; text-align:center; padding:20px;">No wishlist items saved yet.</p>`;
        return;
    }
    
    let html = "";
    wishlist.forEach((item, index) => {
        html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:#0a0a0c; padding:10px; border-radius:6px;">
            <span>${item.name} - ₹${item.price}</span>
            <button onclick="removeFromWishlist(${index})" style="background:#e74c3c; border:none; color:#fff; padding:4px 8px; border-radius:4px; cursor:pointer;">Remove</button>
        </div>`;
    });
    container.innerHTML = html;
}

function removeFromWishlist(index) {
    wishlist.splice(index, 1);
    localStorage.setItem('vornex_wishlist', JSON.stringify(wishlist));
    renderWishlist();
}
