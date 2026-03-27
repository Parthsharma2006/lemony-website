import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// DOM Elements
const orderForm = document.getElementById('order-form');
const reviewForm = document.getElementById('review-form');
const selectedItemDisplay = document.getElementById('selected-item-display');
const totalPriceSpan = document.getElementById('total-price');
const reviewsGrid = document.getElementById('reviews-grid');
const toast = document.getElementById('toast');

// State
let cart = [];

// Makes selectItem globally available even though it's inside a module
window.selectItem = function(name, type, price) {
    const existing = cart.find(i => i.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, type, price, quantity: 1 });
    }
    
    updateCartDisplay();
    
    showToast(`${name} added to order!`);
    
    // Smooth scroll to order section
    document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
};

window.removeItem = function(index) {
    cart.splice(index, 1);
    updateCartDisplay();
};

window.changeQuantity = function(index, delta) {
    if (cart[index].quantity + delta > 0) {
        cart[index].quantity += delta;
        updateCartDisplay();
    }
};

window.updateCartDisplay = function() {
    if (cart.length === 0) {
        selectedItemDisplay.innerHTML = '<div style="text-align:center; padding: 20px;">No items selected yet.<br>Click on a menu item to add it to your order!</div>';
        totalPriceSpan.textContent = '';
        return;
    }
    
    let html = '<div style="margin-bottom: 10px; font-weight: bold; border-bottom: 2px solid var(--primary-dark); padding-bottom: 5px;">Your Selected Items</div>';
    html += '<ul style="list-style: none; padding: 0; text-align: left;">';
    let total = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `<li style="display: flex; flex-direction: column; margin-bottom: 12px; background: rgba(0,0,0,0.03); padding: 10px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 1.1rem;">${item.name}</strong>
                <button type="button" onclick="removeItem(${index})" style="background: none; border: none; color: #e53e3e; cursor: pointer; font-size: 1.1rem; padding: 2px 5px;">&times; Remove</button>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                <div>
                    <span style="font-size: 0.9rem; color: #4a5568;">Price:</span><br><strong>₹${item.price}</strong>
                </div>
                
                <div style="display: flex; align-items: center; gap: 5px; background: #fff; padding: 4px; border-radius: 5px; border: 1px solid #cbd5e0;">
                    <span style="font-size: 0.8rem; color: #4a5568; margin-right: 5px;">Qty:</span>
                    <button type="button" onclick="changeQuantity(${index}, -1)" style="border: 1px solid #cbd5e0; background: #f7fafc; width: 25px; height: 25px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;">-</button>
                    <strong style="min-width: 20px; text-align: center;">${item.quantity}</strong>
                    <button type="button" onclick="changeQuantity(${index}, 1)" style="border: 1px solid #cbd5e0; background: #f7fafc; width: 25px; height: 25px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
                </div>
                
                <div style="text-align: right;">
                    <span style="font-size: 0.9rem; color: #4a5568;">Item Total:</span><br><strong style="color: var(--primary-dark);">₹${itemTotal}</strong>
                </div>
            </div>
        </li>`;
    });
    html += '</ul>';
    
    html += `<div style="text-align: right; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; font-weight: bold; margin-top: 15px; font-size: 1.2rem; color: var(--primary-dark);">Grand Total: ₹${total}</div>`;
    selectedItemDisplay.innerHTML = html;
    
    totalPriceSpan.textContent = `(₹${total})`;
};

function showToast(message, type = 'success') {
    toast.textContent = message;
    if (type === 'error') {
        toast.classList.add('error');
    } else {
        toast.classList.remove('error');
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Firebase Operations ---

async function fetchReviews() {
    try {
        const q = query(collection(db, "reviews"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (reviews.length === 0) {
            reviewsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: #718096; font-style: italic;">
                    No reviews yet. Be the first to tell us about your mouth-watering experience!
                </div>
            `;
            return;
        }
        
        reviewsGrid.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer">${review.name}</div>
                    <div class="stars">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                </div>
                <div class="review-text">"${review.text}"</div>
                <div style="font-size: 0.8rem; color: #a0aec0; margin-top: 15px; text-align: right;">
                    ${new Date(review.date).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching reviews:', error);
        reviewsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: red;">Failed to load reviews. Did you set up Firebase rules correctly?</div>`;
    }
}

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
        showToast('Please add at least one item to your order first!', 'error');
        return;
    }
    
    const formData = new FormData(orderForm);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        items: cart,
        totalPrice: total,
        date: new Date().toISOString()
    };
    
    try {
        const submitBtn = document.getElementById('order-submit-btn');
        const ogText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Sending...';
        
        // Save to Firebase Firestore
        await addDoc(collection(db, "orders"), orderData);
        
        submitBtn.innerHTML = ogText;
        showToast('Order placed successfully! Redirecting to WhatsApp...');
        
        // Format message for WhatsApp
        let message = `*New Order!*\n\n*Name:* ${orderData.name}\n*Phone:* ${orderData.phone}\n\n*Items:*\n`;
        cart.forEach(item => {
            message += `- ${item.name} (${item.quantity} x ₹${item.price}) = ₹${item.price * item.quantity}\n`;
        });
        message += `\n*Total Price:* ₹${orderData.totalPrice}\n\n*Please confirm my order.*`;
        
        const whatsappUrl = `https://wa.me/916353636794?text=${encodeURIComponent(message)}`;
        
        orderForm.reset();
        cart = [];
        updateCartDisplay();
        
        // Redirect directly to avoid popup blockers from squashing the window.open call after await
        window.location.href = whatsappUrl;
    } catch (error) {
        console.error('Error:', error);
        showToast('Database error. Did you update firebase-config.js?', 'error');
    }
});

reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(reviewForm);
    const rating = formData.get('rating');
    
    if (!rating) {
        showToast('Please select a star rating!', 'error');
        return;
    }
    
    const reviewData = {
        name: formData.get('reviewerName'),
        rating: parseInt(rating),
        text: formData.get('reviewText'),
        date: new Date().toISOString()
    };
    
    try {
        const submitBtn = reviewForm.querySelector('.submit-btn');
        const ogText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        
        // Save to Firebase Firestore
        await addDoc(collection(db, "reviews"), reviewData);
        
        submitBtn.textContent = ogText;
        showToast('Thank you for your mouth-watering review!');
        reviewForm.reset();
        fetchReviews(); // Refresh review list
    } catch (error) {
        console.error('Error:', error);
        showToast('Database error. Did you update firebase-config.js?', 'error');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchReviews();
});
