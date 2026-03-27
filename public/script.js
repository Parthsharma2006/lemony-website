import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// DOM Elements
const orderForm = document.getElementById('order-form');
const reviewForm = document.getElementById('review-form');
const selectedItemDisplay = document.getElementById('selected-item-display');
const itemNameInput = document.getElementById('item-name');
const itemTypeInput = document.getElementById('item-type');
const itemPriceInput = document.getElementById('item-price');
const quantityInput = document.getElementById('quantity');
const totalPriceSpan = document.getElementById('total-price');
const reviewsGrid = document.getElementById('reviews-grid');
const toast = document.getElementById('toast');

// State
let selectedItem = null;

// Makes selectItem globally available even though it's inside a module
window.selectItem = function(name, type, price) {
    selectedItem = { name, type, price };
    
    // Update display
    selectedItemDisplay.innerHTML = `
        <span style="display:block; font-size: 0.9rem; color: #718096; margin-bottom: 5px;">Selected Item:</span>
        <span style="color: var(--primary-dark); font-size: 1.3rem;">${name}</span> 
        <span style="float: right; background: var(--dark); color: var(--primary); padding: 2px 10px; border-radius: 10px;">₹${price}</span>
    `;
    
    // Smooth scroll to order section
    document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
    
    // Update hidden inputs
    itemNameInput.value = name;
    itemTypeInput.value = type;
    itemPriceInput.value = price;
    
    updateTotalPrice();
};

window.updateTotalPrice = function() {
    if (!selectedItem) return;
    const qty = parseInt(quantityInput.value) || 1;
    const total = qty * selectedItem.price;
    totalPriceSpan.textContent = `(Total: ₹${total})`;
};

quantityInput.addEventListener('input', window.updateTotalPrice);

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
    
    if (!selectedItem) {
        showToast('Please select an item from the menu first!', 'error');
        return;
    }
    
    const formData = new FormData(orderForm);
    const orderData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        item: formData.get('itemName'),
        itemType: formData.get('itemType'),
        price: parseInt(formData.get('itemPrice')),
        quantity: parseInt(formData.get('quantity')),
        totalPrice: parseInt(formData.get('quantity')) * parseInt(formData.get('itemPrice')),
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
        
        const message = `*New Order!*\n\n*Name:* ${orderData.name}\n*Phone:* ${orderData.phone}\n*Item:* ${orderData.item} (${orderData.itemType})\n*Price per item:* ₹${orderData.price}\n*Quantity:* ${orderData.quantity}\n*Total Price:* ₹${orderData.totalPrice}\n\n*Please confirm my order.*`;
        const whatsappUrl = `https://wa.me/916353636794?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        orderForm.reset();
        selectedItem = null;
        selectedItemDisplay.innerHTML = 'No item selected yet. Click on a menu item!';
        totalPriceSpan.textContent = '';
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
