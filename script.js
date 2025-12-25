// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        // Close mobile menu after clicking
        navUl.classList.remove('show');
    });
});

fetch("https://your-app-name.onrender.com/create-recipient", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "cympet and co nigeria enterprises",
    account_number: "8170779071",
    bank_code: "FIDELITY BANK" // GTBank example
  })
})
.then(res => res.json())
.then(data => {
  console.log("Recipient created:", data);
  alert(`Bank: ${data.data.details.bank_name}, Account: ${data.data.details.account_number}`);
});











// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navUl = document.querySelector('nav ul');

if (hamburger && navUl) {
    hamburger.addEventListener('click', () => {
        navUl.classList.toggle('show');
    });
}

// Paystack initialization
const paystackPublicKey = 'pk_live_b6107994278a9ccd508d5e7a08c12586e64b1ee1'; // Replace with your Paystack test public key




// Enhanced contact form validation and submission
const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const formStatus = document.getElementById('form-status');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const message = document.getElementById('message').value.trim();
        
        // Validation
        if (!name || !email || !subject || !message) {
            showFormStatus('Please fill in all required fields.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showFormStatus('Please enter a valid email address.', 'error');
            return;
        }
        
        if (phone && !isValidPhone(phone)) {
            showFormStatus('Please enter a valid phone number.', 'error');
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        // Simulate form submission (in a real website, this would send to a server)
        setTimeout(() => {
            // Store in localStorage for demo purposes
            const contactData = {
                name,
                email,
                phone,
                subject,
                message,
                timestamp: new Date().toISOString()
            };
            
            let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
            contacts.push(contactData);
            localStorage.setItem('contacts', JSON.stringify(contacts));
            
            // Reset form
            contactForm.reset();
            
            // Show success message
            showFormStatus('Thank you for your message! We will get back to you within 24 hours.', 'success');
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
            
            console.log('Contact form submitted:', contactData);
        }, 2000); // Simulate 2 second delay
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function showFormStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = type;
    formStatus.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        formStatus.style.display = 'none';
    }, 5000);
}

// Add to cart functionality for main product cards
document.querySelectorAll('.product-card .btn').forEach(button => {
    button.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering the card click
        const card = this.closest('.product-card');
        const title = card.querySelector('h3').textContent;
        const variants = productVariants[title];
        if (variants && variants.length > 0) {
            addToCart(variants[0].name); // Add the first variant
        } else {
            alert('No variants available for this product.');
        }
    });
});

// Search functionality
document.getElementById('search-btn').addEventListener('click', performSearch);
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const productCards = document.querySelectorAll('.product-card');
    
    if (query === '') {
        // Show all products
        productCards.forEach(card => {
            card.style.display = 'block';
        });
        return;
    }
    
    productCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(query) || description.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Product variants data
const productVariants = {
    'Refrigerator': [
        { name: 'LG Double Door', description: 'Energy-efficient double door fridge', price: '₦250,000', emoji: '🧊' },
        { name: 'Samsung Side-by-Side', description: 'Large capacity side-by-side refrigerator', price: '₦450,000', emoji: '🧊' },
        { name: 'Whirlpool Single Door', description: 'Compact single door refrigerator', price: '₦150,000', emoji: '🧊' }
    ],
    'Freezer': [
        { name: 'Haier Chest Freezer', description: 'Large capacity chest freezer', price: '₦180,000', emoji: '❄️' },
        { name: 'LG Upright Freezer', description: 'Upright freezer with multiple compartments', price: '₦220,000', emoji: '❄️' },
        { name: 'Samsung Deep Freezer', description: 'Deep freezer for long-term storage', price: '₦200,000', emoji: '❄️' }
    ],
    'Smart Television': [
        { name: 'LG 55" QLED Smart TV', description: '4K QLED with smart features', price: '₦350,000', emoji: '📺' },
        { name: 'LG 65" OLED Smart TV', description: 'Stunning OLED smart display', price: '₦550,000', emoji: '📺' },
        { name: 'LG 43" LED Smart TV', description: 'Compact smart LED TV', price: '₦280,000', emoji: '📺' },
        { name: 'LG 32" LED Smart TV', description: 'Compact smart LED TV', price: '₦180,000', emoji: '📺' }
    ],
    'Television (Not Smart)': [
        { name: 'LG 32" LED TV', description: 'Basic LED television', price: '₦120,000', emoji: '📺' },
        { name: 'LG 40" LED TV', description: 'Standard LED display', price: '₦150,000', emoji: '📺' },
        { name: 'HISENSE 32" LED TV', description: 'Affordable LED television', price: '₦190,000', emoji: '📺' },
        {name: 'HISENSE 45" LED TV', description: 'Affordable LED television', price: '₦360,000', emoji: '📺' }
    ],
    'Stabilizers': [
        { name: 'Blue Gate Stabilizer', description: 'Automatic voltage stabilizer 2000VA', price: '₦25,000', emoji: '🔌' },
        { name: 'Mercury Stabilizer', description: 'Digital display stabilizer 3000VA', price: '₦35,000', emoji: '🔌' },
        { name: 'Luminous Stabilizer', description: 'Wide voltage range stabilizer', price: '₦30,000', emoji: '🔌' }
    ],
    'Sumec Firman Generators': [
        { name: 'Sumec Firman SPG 3000', description: '2.5KVA petrol generator', price: '₦350,000', emoji: '⚡' },
        { name: 'Sumec Firman SPG 5000', description: '4.5KVA petrol generator', price: '₦450,000', emoji: '⚡' },
        { name: 'Sumec Firman ECO 7990ES', description: '7.9KVA electric start generator', price: '₦650,000', emoji: '⚡' }
    ],
    'Elepaq Constant Generators': [
        { name: 'Elepaq SV7500', description: '6.5KVA petrol generator', price: '₦380,000', emoji: '⚡' },
        { name: 'Elepaq SV12000', description: '10KVA petrol generator', price: '₦550,000', emoji: '⚡' },
        { name: 'Elepaq SV28000E2', description: '25KVA electric start generator', price: '₦1,200,000', emoji: '⚡' }
    ],
    'Blenders': [
        { name: 'Ninja Professional Blender', description: 'High-speed blender with multiple functions', price: '₦80,000', emoji: '🥤' },
        { name: 'Oster Blender', description: 'Versatile blender for smoothies and more', price: '₦60,000', emoji: '🥤' },
        { name: 'Hamilton Beach Blender', description: 'Powerful blender with glass jar', price: '₦50,000', emoji: '🥤' }
    ],
    'Ceiling Fans': [
        { name: 'Hunter Ceiling Fan', description: 'Energy-efficient ceiling fan', price: '₦45,000', emoji: '💨' },
        { name: 'Harbor Breeze Ceiling Fan', description: 'Quiet and stylish ceiling fan', price: '₦35,000', emoji: '💨' },
        { name: 'Minka Ceiling Fan', description: 'Modern design ceiling fan', price: '₦55,000', emoji: '💨' }
    ],
    'Standing Fans': [
        { name: 'Honeywell Standing Fan', description: 'Oscillating standing fan', price: '₦25,000', emoji: '💨' },
        { name: 'Lasko Standing Fan', description: 'Tower fan with remote control', price: '₦30,000', emoji: '💨' },
        { name: 'Vornado Standing Fan', description: 'Whole room air circulator', price: '₦40,000', emoji: '💨' }
    ],
    'Air Conditioners': [
        { name: 'LG Inverter AC 1.5HP', description: 'Energy-saving inverter air conditioner', price: '₦250,000', emoji: '❄️' },
        { name: 'Samsung Inverter AC 1HP', description: 'Smart inverter AC with WiFi', price: '₦200,000', emoji: '❄️' },
        { name: 'Daikin Non-Inverter AC 1.5HP', description: 'Reliable non-inverter air conditioner', price: '₦220,000', emoji: '❄️' },
        { name: 'Panasonic Inverter AC 2HP', description: 'High-capacity inverter AC', price: '₦350,000', emoji: '❄️' }
    ],
    'Microphones': [
        { name: 'Shure SM58', description: 'Dynamic vocal microphone', price: '₦45,000', emoji: '🎤' },
        { name: 'Audio-Technica AT2020', description: 'Condenser microphone for recording', price: '₦50,000', emoji: '🎤' },
        { name: 'Blue Yeti USB Microphone', description: 'Multi-pattern USB microphone', price: '₦60,000', emoji: '🎤' }
    ],
    'Rechargeable Standing Fans': [
        { name: 'Rechargeable Tower Fan', description: 'Battery-powered tower fan', price: '₦35,000', emoji: '🔋' },
        { name: 'Portable Standing Fan', description: 'Rechargeable with long battery life', price: '₦40,000', emoji: '🔋' },
        { name: 'Solar Powered Fan', description: 'Eco-friendly rechargeable fan', price: '₦50,000', emoji: '🔋' }
    ],
    'Wall Fans': [
        { name: 'Industrial Wall Fan', description: 'High-power wall-mounted fan', price: '₦30,000', emoji: '💨' },
        { name: 'Quiet Wall Fan', description: 'Silent operation wall fan', price: '₦25,000', emoji: '💨' },
        { name: 'Exhaust Wall Fan', description: 'Ventilation wall fan', price: '₦35,000', emoji: '💨' }
    ],
    'Home Theatre': [
        { name: 'Sony 5.1 Home Theatre', description: 'Complete 5.1 surround sound system', price: '₦150,000', emoji: '🎬' },
        { name: 'LG 7.1 Home Theatre', description: 'High-end 7.1 channel system', price: '₦200,000', emoji: '🎬' },
        { name: 'Samsung Soundbar + Subwoofer', description: 'Modern soundbar system', price: '₦100', emoji: '🎬' }
    ]
};

// Modal functionality
const modal = document.getElementById('product-modal');
const closeBtn = document.querySelector('.close');

document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', function(e) {
        // Prevent triggering if clicking on the button
        if (e.target.classList.contains('btn')) return;
        
        const title = this.querySelector('h3').textContent;
        const description = this.querySelector('p').textContent;
        const imageSrc = this.querySelector('img').src;
        
        // Show product details modal
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-image').src = imageSrc;
        document.getElementById('modal-description').textContent = description;
        
        // Hide variants and show product details
        document.getElementById('modal-variants').style.display = 'none';
        document.getElementById('product-details').style.display = 'block';
        
        modal.style.display = 'block';
    });
});

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || {};
updateCartCount();

function addToCart(productName) {
    if (cart[productName]) {
        cart[productName]++;
    } else {
        cart[productName] = 1;
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Trigger cart animation
    const cartCount = document.getElementById('cart-count');
    cartCount.classList.add('animate');
    setTimeout(() => {
        cartCount.classList.remove('animate');
    }, 600); // Match animation duration
    
    alert(`${productName} added to cart!`);
}

function updateCartCount() {
    let totalItems = 0;
    for (const product in cart) {
        totalItems += cart[product];
    }
    document.getElementById('cart-count').textContent = totalItems;
}

function showCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    let total = 0;
    
    if (Object.keys(cart).length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        for (const productName in cart) {
            // Find product details
            let productDetails = null;
            for (const category in productVariants) {
                productVariants[category].forEach(variant => {
                    if (variant.name === productName) {
                        productDetails = variant;
                    }
                });
            }
            
            if (productDetails) {
                const quantity = cart[productName];
                const itemTotal = parseInt(productDetails.price.replace('₦', '').replace(',', '')) * quantity;
                total += itemTotal;
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.innerHTML = `
                    <div class="cart-item-details">
                        <h4>${productDetails.name}</h4>
                        <p>${productDetails.description}</p>
                        <span class="cart-item-price">${productDetails.price} x ${quantity} = ₦${itemTotal.toLocaleString()}</span>
                    </div>
                    <div class="quantity-controls">
                        <button class="btn qty-btn" onclick="changeQuantity('${productName}', -1)">-</button>
                        <span>${quantity}</span>
                        <button class="btn qty-btn" onclick="changeQuantity('${productName}', 1)">+</button>
                        <button class="btn remove-btn" onclick="removeFromCart('${productName}')">Remove</button>
                    </div>
                `;
                cartItems.appendChild(itemDiv);
            }
        }
    }
    
    document.getElementById('cart-total').textContent = `Total: ₦${total.toLocaleString()}`;
    document.getElementById('cart-modal').style.display = 'block';
}

function changeQuantity(productName, delta) {
    const oldCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    cart[productName] += delta;
    if (cart[productName] <= 0) {
        delete cart[productName];
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Animate if count increased
    const newCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    if (newCount > oldCount) {
        const cartCount = document.getElementById('cart-count');
        cartCount.classList.add('animate');
        setTimeout(() => {
            cartCount.classList.remove('animate');
        }, 600);
    }
    
    showCart();
}

function removeFromCart(productName) {
    delete cart[productName];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCart();
}

function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

function initiateCardPayment() {
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty! Add items before paying.');
    } else {
        showCart();
        // Trigger checkout after a short delay to ensure modal is open
        setTimeout(() => {
            checkout();
        }, 100);
    }
}

function checkout() { let total = 0; for (const productName in cart) { let productDetails = null; for (const category in productVariants) { productVariants[category].forEach(variant => { if (variant.name === productName) { productDetails = variant; } }); } if (productDetails) { const quantity = cart[productName]; const itemTotal = parseInt(productDetails.price.replace('₦', '').replace(',', '')) * quantity; total += itemTotal; } }

    // Convert to kobo (multiply by 100)
    const amountInKobo = total * 100;

    // Paystack payment setup
    const handler = PaystackPop.setup({
        key: 'pk_live_b6107994278a9ccd508d5e7a08c12586e64b1ee1', // Replace with your public key
        email: 'customer@example.com', // You might want to collect customer email
        amount: amountInKobo,
        currency: 'NGN',
        ref: 'PS_' + Math.floor((Math.random() * 1000000000) + 1), // generates a pseudo-unique reference
        callback: function(response) {
            // Payment successful
            alert('Payment successful! Reference: ' + response.reference);
            // Clear cart
            cart = {};
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            closeCart();
        },
        onClose: function() {
            alert('Payment cancelled.');
        }
    });
    handler.openIframe();
}

function initiateCashOnDelivery() {
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty! Add items before placing an order.');
        return;
    }
    showDeliveryModal();
}

function showDeliveryModal() {
    const deliveryCartItems = document.getElementById('delivery-cart-items');
    deliveryCartItems.innerHTML = '';
    let total = 0;

    if (Object.keys(cart).length === 0) {
        deliveryCartItems.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        for (const productName in cart) {
            // Find product details
            let productDetails = null;
            for (const category in productVariants) {
                productVariants[category].forEach(variant => {
                    if (variant.name === productName) {
                        productDetails = variant;
                    }
                });
            }

            if (productDetails) {
                const quantity = cart[productName];
                const itemTotal = parseInt(productDetails.price.replace('₦', '').replace(',', '')) * quantity;
                total += itemTotal;

                const itemDiv = document.createElement('div');
                itemDiv.className = 'delivery-cart-item';
                itemDiv.innerHTML = `
                    <div class="delivery-item-details">
                        <h4>${productDetails.name}</h4>
                        <p>${productDetails.description}</p>
                        <span class="delivery-item-price">${productDetails.price} x ${quantity} = ₦${itemTotal.toLocaleString()}</span>
                    </div>
                `;
                deliveryCartItems.appendChild(itemDiv);
            }
        }
    }

    document.getElementById('delivery-total').textContent = `Total: ₦${total.toLocaleString()}`;
    document.getElementById('delivery-modal').style.display = 'block';
}

function closeDeliveryModal() {
    document.getElementById('delivery-modal').style.display = 'none';
}

// Delivery form submission
const deliveryForm = document.getElementById('delivery-form');
const deliverySubmitBtn = document.getElementById('delivery-submit-btn');
const deliveryStatus = document.getElementById('delivery-status');

if (deliveryForm) {
    deliveryForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('delivery-name').value.trim();
        const phone = document.getElementById('delivery-phone').value.trim();
        const email = document.getElementById('delivery-email').value.trim();
        const address = document.getElementById('delivery-address').value.trim();
        const city = document.getElementById('delivery-city').value.trim();
        const notes = document.getElementById('delivery-notes').value.trim();

        // Validation
        if (!name || !phone || !address || !city) {
            showDeliveryStatus('Please fill in all required fields.', 'error');
            return;
        }

        if (!isValidPhone(phone)) {
            showDeliveryStatus('Please enter a valid phone number.', 'error');
            return;
        }

        if (email && !isValidEmail(email)) {
            showDeliveryStatus('Please enter a valid email address.', 'error');
            return;
        }

        // Show loading state
        deliverySubmitBtn.disabled = true;
        deliverySubmitBtn.textContent = 'Processing Order...';

        // Simulate order processing (in a real website, this would send to a server)
        setTimeout(() => {
            // Store delivery data in localStorage for demo purposes
            const deliveryData = {
                name,
                phone,
                email,
                address,
                city,
                notes,
                cart: {...cart},
                total: document.getElementById('delivery-total').textContent,
                timestamp: new Date().toISOString(),
                orderId: 'COD_' + Math.floor((Math.random() * 1000000) + 1)
            };

            let orders = JSON.parse(localStorage.getItem('cash_orders')) || [];
            orders.push(deliveryData);
            localStorage.setItem('cash_orders', JSON.stringify(orders));

            // Clear cart
            cart = {};
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();

            // Reset form
            deliveryForm.reset();

            // Show success message
            showDeliveryStatus(`Order placed successfully! Your order ID is ${deliveryData.orderId}. We will contact you at ${phone} for delivery arrangements.`, 'success');

            // Reset button
            deliverySubmitBtn.disabled = false;
            deliverySubmitBtn.textContent = 'Confirm Order';

            // Close modal after a delay
            setTimeout(() => {
                closeDeliveryModal();
            }, 3000);

            console.log('Cash on Delivery order submitted:', deliveryData);
        }, 2000); // Simulate 2 second delay
    });
}

function showDeliveryStatus(message, type) {
    deliveryStatus.textContent = message;
    deliveryStatus.className = type;
    deliveryStatus.style.display = 'block';

    // Hide after 5 seconds for errors, keep success visible
    if (type === 'error') {
        setTimeout(() => {
            deliveryStatus.style.display = 'none';
        }, 5000);
    }
}

closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    // Reset modal state
    document.getElementById('product-details').style.display = 'none';
    document.getElementById('modal-variants').style.display = 'block';
});

window.addEventListener('click', function(e) {
    if (e.target === modal) {
        modal.style.display = 'none';
        // Reset modal state
        document.getElementById('product-details').style.display = 'none';
        document.getElementById('modal-variants').style.display = 'block';
    }
    if (e.target === document.getElementById('delivery-modal')) {
        closeDeliveryModal();
    }
});

function showVariants() {
    const title = document.getElementById('modal-title').textContent;
    const variants = productVariants[title];
    
    if (variants) {
        document.getElementById('modal-title').textContent = title + ' Options';
        const variantsList = document.getElementById('modal-variants');
        variantsList.innerHTML = '';
        
        variants.forEach(variant => {
            const variantItem = document.createElement('div');
            variantItem.className = 'variant-item';
            variantItem.innerHTML = `
                <div class="variant-image">${variant.emoji}</div>
                <div class="variant-details">
                    <h3>${variant.name}</h3>
                    <p>${variant.description}</p>
                    <span class="variant-price">${variant.price}</span>
                </div>
                <button class="btn" onclick="addToCart('${variant.name}')">Add to Cart</button>
            `;
            variantsList.appendChild(variantItem);
        });
        
        // Hide product details and show variants
        document.getElementById('product-details').style.display = 'none';
        document.getElementById('modal-variants').style.display = 'block';
    }
}