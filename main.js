const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const cartModal = document.getElementById('carrinho');
const closeCart = document.querySelector('.close-cart');
const clearCartBtn = document.getElementById('clear-cart');
const requestQuoteBtn = document.getElementById('request-quote');
const cartItemsContainer = document.querySelector('.cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCount = document.getElementById('cart-count');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const contactForm = document.getElementById('contactForm');

let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadCartFromStorage();
    updateCartUI();
    setupThemeToggle();
});


function setupEventListeners() {
    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
        
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && 
                !menuToggle.contains(e.target) && 
                !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('open');
            }
        });
        
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                    menuToggle.classList.remove('open');
                }
            });
        });
    }

    // Configuração do carrossel
    const trabalhos = document.querySelector('.trabalhos');
    const items = document.querySelectorAll('.trabalhos-item');
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    let currentIndex = 0;
    let intervalId;

    if (trabalhos && items.length > 0) {
        // Função para rolar para um item específico
        function scrollToItem(index) {
            const itemWidth = items[0].offsetWidth;
            const gap = 20; // O gap definido no CSS
            trabalhos.scrollTo({
                left: (itemWidth + gap) * index,
                behavior: 'smooth'
            });
        }

        // Função para ir para o próximo item
        function scrollToNext() {
            currentIndex = (currentIndex + 1) % items.length;
            scrollToItem(currentIndex);
        }

        // Função para ir para o item anterior
        function scrollToPrev() {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            scrollToItem(currentIndex);
        }

        // Iniciar o carrossel automático
        function startAutoScroll() {
            stopAutoScroll();
            intervalId = setInterval(scrollToNext, 5000); // Rola a cada 5 segundos
        }

        // Parar o carrossel automático
        function stopAutoScroll() {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }

        // Eventos dos botões de navegação
        if (nextButton && prevButton) {
            nextButton.addEventListener('click', () => {
                stopAutoScroll();
                scrollToNext();
                startAutoScroll();
            });

            prevButton.addEventListener('click', () => {
                stopAutoScroll();
                scrollToPrev();
                startAutoScroll();
            });
        }

        // Eventos de mouse
        trabalhos.addEventListener('mouseenter', stopAutoScroll);
        trabalhos.addEventListener('mouseleave', startAutoScroll);

        // Eventos de touch para dispositivos móveis
        let touchStartX = 0;
        let touchEndX = 0;

        trabalhos.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoScroll();
        }, { passive: true });

        trabalhos.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const difference = touchStartX - touchEndX;

            if (Math.abs(difference) > 50) { // Mínimo de 50px para considerar como swipe
                if (difference > 0) {
                    scrollToNext();
                } else {
                    scrollToPrev();
                }
            }

            startAutoScroll();
        }, { passive: true });

        // Iniciar o carrossel
        startAutoScroll();
    }

    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });

    // Fechar carrinho
    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cartModal.classList.remove('active');
        });
    }

    // Abrir carrinho
    document.querySelector('.cart-icon').addEventListener('click', (e) => {
        e.preventDefault();
        cartModal.classList.add('active');
    });

    // Fechar carrinho fora do modal
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });

    // Limpar carrinho
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }

    // Solicitar orçamento
    if (requestQuoteBtn) {
        requestQuoteBtn.addEventListener('click', requestQuote);
    }

    // Formulário de contato
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Scroll suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#carrinho') {
                e.preventDefault();
                return
            }
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const headerHeight = document.querySelector('header').offsetHeight;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
                    window.scrollTo({
                        top: targetPosition - headerHeight,
                        behavior: 'smooth'
                    });
                    // Fechar menu mobile se estiver aberto
                    navLinks.classList.remove('active');
                }
            
        });
    });

    // Scroll da página para ativar elementos
    window.addEventListener('scroll', revealOnScroll);
}


// Funções do Carrinho
function addToCart(e) {
    const serviceCard = e.target.closest('.service-card');
    const serviceId = parseInt(serviceCard.dataset.id);
    const serviceName = serviceCard.querySelector('h3').textContent;
    const servicePrice = parseFloat(serviceCard.dataset.price);

    // Verificar se o serviço já está no carrinho
    const existingItem = cart.find(item => item.id === serviceId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: serviceId,
            name: serviceName,
            price: servicePrice,
            quantity: 1
        });
    }

    // Notificação d adicionado
    showNotification(`${serviceName} adicionado ao orçamento!`);

    // Atualizar carrinho
    saveCartToStorage();
    updateCartUI();
}

function updateCartUI(){
    // Atualizar contagem de itens
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Atualizar itens no modal
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Seu orçamento está vazio.</p>';
    } else {
        cart.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>R$ ${item.price.toFixed(2)}</p>
                </div>
                                <div class="cart-item-actions">
                    <button class="decrease" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="increase" data-id="${item.id}">+</button>
                    <button class="remove" data-id="${item.id}">Remover</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });
    }

    // Atualizar preço total
    const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    cartTotalPrice.textContent = `R$ ${totalPrice.toFixed(2)}`;

    // Botões de ação em cada item
    document.querySelectorAll('.decrease').forEach(btn => {
        btn.addEventListener('click', decreaseItemQuantity);
    });
    document.querySelectorAll('.increase').forEach(btn => {
        btn.addEventListener('click', increaseItemQuantity);
    });
    document.querySelectorAll('.remove').forEach(btn => {
        btn.addEventListener('click', removeItem);
    });
}

function decreaseItemQuantity(e) {
    const id = parseInt(e.target.dataset.id);
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity--;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    saveCartToStorage();
    updateCartUI();
}

function increaseItemQuantity(e) {
    const id = parseInt(e.target.dataset.id);
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity++;
    }
    saveCartToStorage();
    updateCartUI();
}

function removeItem(e) {
    const id = parseInt(e.target.dataset.id);
    cart = cart.filter(i => i.id !== id);
    saveCartToStorage();
    updateCartUI();
}

function clearCart() {
    cart = [];
    saveCartToStorage();
    updateCartUI();
    showNotification('Orçamento limpo com sucesso!');
}

function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

function requestQuote() {
    if (cart.length === 0) {
        showNotification('Adicione serviços ao carrinho antes de solicitar o orçamento.');
        return;
    }

    let message = 'Olá, gostaria de solicitar um orçamento para os seguintes serviços:\n\n';
    cart.forEach(item => {
        message += `- ${item.name} (Quantidade: ${item.quantity}) - R$ ${item.price.toFixed(2)}\n`;
    });
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    message += `\nValor Total: R$ ${total.toFixed(2)}\n\nObrigado!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/5534999629712?text=${encodedMessage}`;

    window.open(whatsappURL, '_blank');
}

function handleContactForm(e) {
    e.preventDefault();
    showNotification('Mensagem enviada com sucesso! Entraremos em contato em breve.');
    contactForm.reset();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        const windowHeight = window.innerHeight;
        const revealTop = el.getBoundingClientRect().top;
        const revealPoint = 150;

        if (revealTop < windowHeight - revealPoint) {
            el.classList.add('active');
        }
    });
}

// Função para configurar o alternador de tema
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Carrega o tema salvo ou usa a preferência do sistema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme === 'dark');
    } else if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon(true);
    }

    // Alterna o tema quando o botão é clicado
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme === 'dark');
    });
}

// Atualiza o ícone do botão de tema
function updateThemeIcon(isDark) {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    
    if (isDark) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

