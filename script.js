// ============================================================================
// MY PAW COLORS - REFACTORED & OPTIMIZED
// ============================================================================

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
const CONFIG = {
    ANIMATION_DELAY: 150,
    PARTICLE_COUNT: 50,
    PARTICLE_MAX: 60,
    SCROLL_OFFSET: 80,
    FILTER_DELAY: 100
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
const AppState = {
    artworks: [],
    currentFilter: 'all',
    currentArtwork: null,
    hideSold: false,
    
    setArtworks(artworks) {
        this.artworks = artworks;
    },
    
    setFilter(filter) {
        this.currentFilter = filter;
    },
    
    setCurrentArtwork(artwork) {
        this.currentArtwork = artwork;
    },
    
    setHideSold(value) {
        this.hideSold = value;
    },
    
    getFilteredArtworks() {
        if (this.currentFilter === 'all') return this.artworks;
        return this.artworks.filter(art => art.category === this.currentFilter);
    }
};

// ============================================================================
// PARTICLES SYSTEM
// ============================================================================
class ParticleSystem {
    constructor(containerId = 'particles') {
        this.container = document.getElementById(containerId);
        if (this.container) this.init();
    }

    init() {
        this.particles = [];
        this.createParticles(CONFIG.PARTICLE_COUNT);
        this.startAnimation();
    }

    createParticles(count) {
        for (let i = 0; i < count; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        Object.assign(particle.style, {
            left: `${Math.random() * 100}vw`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`
        });
        
        this.container.appendChild(particle);
        this.particles.push(particle);
    }

    startAnimation() {
        setInterval(() => {
            if (this.particles.length < CONFIG.PARTICLE_MAX) {
                this.createParticle();
            }
        }, 5000);
    }
}

// ============================================================================
// PARALLAX EFFECT
// ============================================================================
class ParallaxEffect {
    constructor() {
        this.elements = document.querySelectorAll('.parallax');
        if (this.elements.length > 0) this.init();
    }

    init() {
        this.handleScroll = this.handleScroll.bind(this);
        window.addEventListener('scroll', this.handleScroll, { passive: true });
    }

    handleScroll() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        this.elements.forEach(el => {
            el.style.transform = `translateY(${rate}px)`;
        });
    }
}

// ============================================================================
// ANIMATION OBSERVER
// ============================================================================
class AnimationObserver {
    constructor() {
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        this.observe();
    }

    observe() {
        document.querySelectorAll('.fade-in, .gallery-item, .class-card')
            .forEach(el => this.observer.observe(el));
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in', 'show');
                
                if (entry.target.classList.contains('gallery-item')) {
                    const index = Array.from(entry.target.parentNode.children).indexOf(entry.target);
                    entry.target.style.animationDelay = `${index * 0.1}s`;
                }
            }
        });
    }
}

// ============================================================================
// ARTWORK MANAGER
// ============================================================================
class ArtworkManager {
    static async loadFromJSON() {
        try {
            const response = await fetch('artworks.json');
            if (!response.ok) throw new Error('Failed to load artworks');
            
            const artworks = await response.json();
            AppState.setArtworks(artworks);
            
            this.generateFilters(artworks);
            this.displayArtworks(artworks);
            this.updateStats(artworks);
            
            return artworks;
        } catch (error) {
            console.error('Error loading artworks:', error);
            return this.loadSampleArtworks();
        }
    }

    static generateFilters(artworks) {
        const container = document.getElementById('dynamic-filters');
        if (!container) return;
        
        const categories = [...new Set(artworks.map(art => art.category))];
        container.innerHTML = '';
        
        // Add "All Works" filter
        container.appendChild(this.createFilterButton('all', 'All Works', true));
        
        // Add category filters
        categories.forEach(category => {
            const displayName = this.formatCategoryName(category);
            container.appendChild(this.createFilterButton(category, displayName, false));
        });
        
        console.log(`Generated ${categories.length} filter buttons`);
    }

    static createFilterButton(filter, label, active = false) {
        const button = document.createElement('div');
        button.className = `supply-item paint-tube filter-btn${active ? ' tube-active' : ''}`;
        button.setAttribute('data-filter', filter);
        button.innerHTML = `<div class="tube-body">${label}</div>`;
        return button;
    }

    static formatCategoryName(category) {
        return category
            .split(/[-_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    static displayArtworks(artworks) {
        const container = document.getElementById('galleryContainer');
        if (!container) return;
        
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        artworks.forEach((artwork, index) => {
            fragment.appendChild(this.createArtworkCard(artwork, index));
        });
        
        container.appendChild(fragment);
        
        // Trigger staggered animations
        requestAnimationFrame(() => {
            const items = container.querySelectorAll('.gallery-item');
            items.forEach((item, index) => {
                setTimeout(() => item.classList.add('animate-in'), index * CONFIG.ANIMATION_DELAY);
            });
        });
        
        console.log(`Displayed ${artworks.length} artworks`);
    }

    static createArtworkCard(artwork, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'col-lg-4 col-md-6 col-sm-6 mb-4';
        wrapper.style.animationDelay = `${index * 0.1}s`;
        
        const card = document.createElement('div');
        card.className = `gallery-item ${artwork.category}`;
        card.setAttribute('data-category', artwork.category);
        card.setAttribute('data-artwork-id', artwork.id);
        
        const statusClass = artwork.status === 'sold' ? 'status-sold' : 'status-available';
        const statusText = artwork.status === 'sold' ? 'Sold' : 'Available';
        const imageUrl = artwork.image || '';
        const description = artwork.description 
            ? (artwork.description.substring(0, 80) + (artwork.description.length > 80 ? '...' : ''))
            : 'Custom artwork piece';
        
        card.innerHTML = `
            <div class="artwork-image-container">
                <div class="image-placeholder">
                    <i class="bi bi-image loading"></i>
                </div>
                <img src="${imageUrl}" alt="${artwork.title}" loading="lazy" class="artwork-image" style="opacity: 0;">
                <div class="gallery-overlay">
                    <div class="overlay-content">
                        <button class="btn btn-light btn-sm fullscreen-btn" title="View Fullscreen">
                            <i class="bi bi-arrows-fullscreen"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="gallery-info">
                <h5 class="artwork-title">${artwork.title}</h5>
                <div class="artwork-meta">
                    <span class="artwork-price">${artwork.price}</span>
                    <span class="artwork-status ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
        
        // Attach event listeners
        this.attachCardEvents(card, artwork);
        wrapper.appendChild(card);
        
        return wrapper;
    }

    static attachCardEvents(card, artwork) {
        const img = card.querySelector('.artwork-image');
        const placeholder = card.querySelector('.image-placeholder');
        const viewBtn = card.querySelector('.view-btn');
        const fullscreenBtn = card.querySelector('.fullscreen-btn');
        
        // Image loading
        img.addEventListener('load', function() {
            placeholder.style.display = 'none';
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            placeholder.innerHTML = '<i class="bi bi-image-alt text-muted"></i>';
            this.style.display = 'none';
        });
        
        // Helper function to get artwork by ID from card
        const getArtworkFromCard = (cardElement) => {
            const artworkId = parseInt(cardElement.getAttribute('data-artwork-id'));
            return AppState.artworks.find(art => art.id === artworkId);
        };
        
        // Button events - retrieve artwork from data attribute to avoid closure issues
        viewBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const artworkData = getArtworkFromCard(card);
            if (artworkData) ModalManager.open(artworkData);
        });
        
        fullscreenBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const artworkData = getArtworkFromCard(card);
            if (artworkData) FullscreenViewer.open(artworkData);
        });
        
        // Card click - retrieve artwork from data attribute to avoid closure issues
        card.addEventListener('click', (e) => {
            // Ignore clicks on filter buttons
            if (e.target.closest('.filter-btn')) return;
            
            const artworkData = getArtworkFromCard(card);
            if (artworkData) ModalManager.open(artworkData);
        });
    }

    static filterArtworks(category) {
        AppState.setFilter(category);
        
        const container = document.getElementById('galleryContainer');
        if (!container) return;
        
        // Get all wrapper divs (col-lg-4)
        const wrappers = container.querySelectorAll('.col-lg-4, .col-md-6, .col-sm-6');
        let visibleIndex = 0;
        
        wrappers.forEach(wrapper => {
            const item = wrapper.querySelector('.gallery-item');
            if (!item) return;
            
            const itemCategory = item.getAttribute('data-category');
            const artworkId = parseInt(item.getAttribute('data-artwork-id'));
            const artwork = AppState.artworks.find(art => art.id === artworkId);
            
            const categoryMatch = category === 'all' || itemCategory === category;
            const soldFilter = AppState.hideSold ? (artwork && artwork.status?.toLowerCase() !== 'sold') : true;
            const shouldShow = categoryMatch && soldFilter;
            
            if (shouldShow) {
                wrapper.classList.remove('hide');
                wrapper.style.display = 'block';
                
                // Re-trigger animation with stagger
                setTimeout(() => {
                    item.classList.remove('animate-in');
                    setTimeout(() => item.classList.add('animate-in'), 50);
                }, visibleIndex * CONFIG.FILTER_DELAY);
                
                visibleIndex++;
            } else {
                wrapper.classList.add('hide');
                setTimeout(() => wrapper.style.display = 'none', 300);
            }
        });
        
        console.log(`Filtered: ${category} (${visibleIndex} items visible)`);
    }

    static updateStats(artworks) {
        const totalEl = document.getElementById('totalArtworks');
        const availableEl = document.getElementById('availableArtworks');
        
        if (totalEl) totalEl.textContent = artworks.length;
        
        if (availableEl) {
            const available = artworks.filter(art => 
                art.status?.toLowerCase() === 'available'
            ).length;
            availableEl.textContent = available;
        }
    }

    static loadSampleArtworks() {
        const samples = [
            {
                id: 1, title: "Sunset Dreams", artist: "Artist Name", category: "paintings",
                image: "https://via.placeholder.com/400x300/FF8C00/FFFFFF?text=Sunset+Dreams",
                price: "$150", status: "available",
                description: "A beautiful sunset painting that captures the warmth and tranquility of evening light.",
                specifications: { medium: "Acrylic on Canvas", size: "16\" x 20\"", year: "2024", frame: "Unframed" }
            },
            {
                id: 2, title: "Ocean Waves", artist: "Artist Name", category: "paintings",
                image: "https://via.placeholder.com/400x300/0047AB/FFFFFF?text=Ocean+Waves",
                price: "On Request", status: "available",
                description: "Dynamic ocean waves captured in vibrant blues and whites.",
                specifications: { medium: "Oil on Canvas", size: "24\" x 30\"", year: "2024", frame: "Framed" }
            }
        ];
        
        AppState.setArtworks(samples);
        this.displayArtworks(samples);
        return samples;
    }
}

// ============================================================================
// HERO IMAGE MANAGER
// ============================================================================
class HeroImageManager {
    static async loadRandomHero() {
        try {
            const response = await fetch('artworks.json');
            if (!response.ok) throw new Error('Failed to load artworks');
            
            const artworks = await response.json();
            const heroArtworks = artworks.filter(art => art.hero === true);
            
            if (heroArtworks.length === 0) return;
            
            const selected = heroArtworks[Math.floor(Math.random() * heroArtworks.length)];
            this.displayHero(selected);
        } catch (error) {
            console.error('Error loading hero image:', error);
            this.hideLoading();
        }
    }

    static displayHero(artwork) {
        const heroImage = document.getElementById('heroImage');
        const loading = document.getElementById('imageLoading');
        
        if (!heroImage || !artwork.image) return;
        
        if (loading) loading.style.display = 'flex';
        
        heroImage.src = artwork.image;
        heroImage.alt = `${artwork.title} by ${artwork.artist}`;
        heroImage.style.cursor = 'pointer';
        
        heroImage.addEventListener('load', () => this.hideLoading(), { once: true });
        heroImage.addEventListener('error', () => this.hideLoading(), { once: true });
        
        heroImage.addEventListener('click', () => ModalManager.open(artwork));
    }

    static hideLoading() {
        const loading = document.getElementById('imageLoading');
        if (loading) loading.style.display = 'none';
    }
}

// ============================================================================
// MODAL MANAGER
// ============================================================================
class ModalManager {
    static init() {
        const backdrop = document.getElementById('modalBackdrop');
        const closeBtn = document.getElementById('closeModal');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        
        backdrop?.addEventListener('click', () => this.close());
        closeBtn?.addEventListener('click', () => this.close());
        
        fullscreenBtn?.addEventListener('click', () => {
            const image = document.getElementById('modalImage');
            const title = document.getElementById('modalArtworkTitle');
            const artist = document.getElementById('modalArtist');
            
            if (image?.src) {
                FullscreenViewer.open({
                    title: title?.textContent || 'Artwork',
                    artist: artist?.textContent || 'Unknown Artist',
                    image: image.src
                });
            }
        });
    }

    static open(artwork) {
        const modal = document.getElementById('artworkModal');
        if (!modal) return;
        
        AppState.setCurrentArtwork(artwork);
        this.updateContent(artwork);
        
        modal.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }

    static updateContent(artwork) {
        const elements = {
            image: document.getElementById('modalImage'),
            title: document.getElementById('modalArtworkTitle'),
            artist: document.getElementById('modalArtist'),
            price: document.getElementById('modalPrice'),
            description: document.getElementById('modalDescription'),
            status: document.getElementById('modalStatus'),
            specsList: document.getElementById('modalSpecsList')
        };
        
        if (elements.image) {
            elements.image.style.opacity = '0.5';
            elements.image.src = artwork.image || '';
            elements.image.alt = artwork.title;
            elements.image.onload = function() {
                this.style.opacity = '1';
                this.style.transition = 'opacity 0.3s ease';
            };
            elements.image.style.cursor = 'pointer';
            
            // Remove any existing onclick handler to prevent stale references
            elements.image.onclick = null;
            elements.image.onclick = (e) => {
                e.stopPropagation();
                FullscreenViewer.open(artwork);
            };
        }
        
        if (elements.title) elements.title.textContent = artwork.title;
        if (elements.artist) elements.artist.textContent = `by ${artwork.artist}`;
        if (elements.price) elements.price.textContent = artwork.price;
        if (elements.description) {
            elements.description.textContent = artwork.description || 
                'A beautiful custom artwork piece created with attention to detail and artistic excellence.';
        }
        
        if (elements.status) {
            const statusClass = artwork.status === 'sold' ? 'status-sold' : 'status-available';
            const statusText = artwork.status === 'sold' ? 'Sold' : 'Available';
            elements.status.innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
        }
        
        if (elements.specsList) {
            elements.specsList.innerHTML = '';
            if (artwork.specifications) {
                Object.entries(artwork.specifications).forEach(([key, value]) => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}`;
                    elements.specsList.appendChild(li);
                });
            }
        }
    }

    static close() {
        const modal = document.getElementById('artworkModal');
        if (modal) {
            modal.classList.remove('modal-open');
            document.body.style.overflow = 'auto';
        }
    }
}

// ============================================================================
// FULLSCREEN VIEWER
// ============================================================================
class FullscreenViewer {
    static open(artwork) {
        const overlay = this.createOverlay(artwork);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => overlay.classList.add('active'), 10);
        
        this.attachEvents(overlay, artwork);
    }

    static createOverlay(artwork) {
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        overlay.innerHTML = `
            <div class="fullscreen-content">
                <button class="fullscreen-close" title="Close">
                    <i class="bi bi-x-lg"></i>
                </button>
                <div class="fullscreen-image-container">
                    <img src="${artwork.image}" alt="${artwork.title}" class="fullscreen-image">
                    <div class="fullscreen-info">
                        <h3>${artwork.title}</h3>
                        <p class="text-muted">by ${artwork.artist}</p>
                    </div>
                </div>
            </div>
        `;
        return overlay;
    }

    static attachEvents(overlay, artwork) {
        const closeBtn = overlay.querySelector('.fullscreen-close');
        
        const close = () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleKey);
            }, 300);
        };
        
        const handleKey = (e) => {
            if (e.key === 'Escape') close();
        };
        
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', handleKey);
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
class EventManager {
    static init() {
        this.setupFilters();
        this.setupContactForm();
        this.setupNavigation();
        this.setupScrollEffects();
    }

    static setupFilters() {
        const container = document.getElementById('dynamic-filters');
        if (!container) return;
        
        container.addEventListener('click', (e) => {
            console.log('Filter container clicked, target:', e.target);
            
            // Check if clicked element or any parent up to container is a filter button
            const btn = e.target.closest('.filter-btn');
            console.log('Found filter button:', btn);
            
            if (!btn || !container.contains(btn)) {
                console.log('No valid filter button found');
                return;
            }
            
            // CRITICAL: Stop propagation in both capture and bubble phases
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const filterValue = btn.getAttribute('data-filter');
            console.log('Filter button clicked:', filterValue);
            
            // Update active state
            container.querySelectorAll('.filter-btn')
                .forEach(b => b.classList.remove('tube-active'));
            btn.classList.add('tube-active');
            
            // Filter artworks
            ArtworkManager.filterArtworks(filterValue);
            
            return false;
        }, true); // Use capture phase to intercept before any bubble handlers
        
        // Setup hide sold checkbox
        const hideSoldCheckbox = document.getElementById('hideSoldCheckbox');
        if (hideSoldCheckbox) {
            hideSoldCheckbox.addEventListener('change', (e) => {
                AppState.setHideSold(e.target.checked);
                ArtworkManager.filterArtworks(AppState.currentFilter);
            });
        }
    }

    static setupContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            
            if (!data.name || !data.email || !data.message) {
                alert('Please fill in all required fields.');
                return;
            }
            
            alert('Thank you for your message! We will get back to you soon.');
            e.target.reset();
        });
    }

    static setupNavigation() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - CONFIG.SCROLL_OFFSET,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    static setupScrollEffects() {
        let lastScroll = 0;
        const navbar = document.querySelector('.navbar');
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Update navbar style
            if (navbar) {
                if (currentScroll > 50) {
                    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                    navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
                    navbar.style.backdropFilter = 'blur(15px)';
                } else {
                    navbar.style.background = '';
                    navbar.style.backdropFilter = '';
                    navbar.style.boxShadow = '';
                }
                
                // Hide on scroll down
                if (currentScroll > lastScroll && currentScroll > 100) {
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    navbar.style.transform = 'translateY(0)';
                }
            }
            
            lastScroll = currentScroll;
        }, { passive: true });
    }
}

// ============================================================================
// UTILITIES
// ============================================================================
const Utils = {
    scrollToArtwork(artworkId) {
        const gallery = document.getElementById('gallery');
        if (gallery) gallery.scrollIntoView({ behavior: 'smooth' });
        
        const searchResults = document.getElementById('heroSearchResults');
        if (searchResults) searchResults.style.display = 'none';
        
        setTimeout(() => {
            const card = document.querySelector(`[data-artwork-id="${artworkId}"]`);
            if (card) card.click();
        }, 1000);
    },
    
    initStaticIframe() {
        const iframe = document.getElementById('contactFormIframe');
        if (!iframe) return;
        
        iframe.addEventListener('load', () => console.log('Forms iframe loaded'));
        iframe.addEventListener('error', () => console.error('Forms iframe failed'));
    }
};

// ============================================================================
// SIDE NAVIGATION
// ============================================================================
class SideNavigation {
    static init() {
        const navTrigger = document.getElementById('navTrigger');
        const sideNav = document.getElementById('sideNav');
        const navBackdrop = document.getElementById('navBackdrop');
        
        if (!navTrigger || !sideNav || !navBackdrop) return;
        
        const openMenu = () => {
            sideNav.classList.add('nav-open');
            navBackdrop.classList.add('active');
        };
        
        const closeMenu = () => {
            sideNav.classList.remove('nav-open');
            navBackdrop.classList.remove('active');
        };
        
        navTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sideNav.classList.contains('nav-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        
        navBackdrop.addEventListener('click', closeMenu);
        
        document.addEventListener('click', (e) => {
            // Don't close if clicking inside the nav or on the trigger
            if (!sideNav.contains(e.target) && 
                !navTrigger.contains(e.target) && 
                sideNav.classList.contains('nav-open')) {
                closeMenu();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sideNav.classList.contains('nav-open')) {
                closeMenu();
            }
        });
        
        const menuItems = sideNav.querySelectorAll('.nav-menu a');
        menuItems.forEach(item => item.addEventListener('click', closeMenu));
    }
}

// ============================================================================
// LOADING SCREEN
// ============================================================================
class LoadingScreen {
    static init() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 2000);
    }
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================
class HeroSearch {
    static init() {
        const searchInput = document.getElementById('heroSearchInput');
        const searchBtn = document.getElementById('heroSearchBtn');
        const searchResults = document.getElementById('heroSearchResults');
        
        if (!searchInput || !searchBtn || !searchResults) return;
        
        let allArtworks = [];
        let searchTimeout;
        
        // Load artworks for search
        fetch('artworks.json')
            .then(response => response.json())
            .then(data => { allArtworks = data; })
            .catch(error => console.error('Error loading artworks for search:', error));
        
        const performSearch = () => {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
                return;
            }
            
            const results = allArtworks.filter(artwork => 
                artwork.title.toLowerCase().includes(query) ||
                artwork.artist.toLowerCase().includes(query) ||
                artwork.category.toLowerCase().includes(query) ||
                (artwork.description && artwork.description.toLowerCase().includes(query))
            );
            
            HeroSearch.displayResults(results, searchResults);
        };
        
        searchBtn.addEventListener('click', performSearch);
        
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 300);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                performSearch();
            }
        });
        
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) performSearch();
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.hero-search-container')) {
                searchResults.style.display = 'none';
            }
        });
    }
    
    static displayResults(results, searchResults) {
        if (results.length === 0) {
            searchResults.innerHTML = '<p class="no-results">No artworks found</p>';
        } else {
            searchResults.innerHTML = results.slice(0, 5).map(artwork => `
                <div class="search-result-item" data-artwork-id="${artwork.id}">
                    <img src="${artwork.images?.thumbnail || artwork.image}" alt="${artwork.title}" class="result-thumbnail">
                    <div class="result-info">
                        <h4>${artwork.title}</h4>
                        <p>${artwork.artist}</p>
                        <span class="result-price">${artwork.price}</span>
                    </div>
                </div>
            `).join('');
            
            // Add click handlers to search results
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const artworkId = parseInt(item.getAttribute('data-artwork-id'));
                    const artwork = AppState.artworks.find(art => art.id === artworkId);
                    if (artwork) {
                        ModalManager.open(artwork);
                    }
                    searchResults.style.display = 'none';
                });
            });
        }
        searchResults.style.display = 'block';
    }
}

// ============================================================================
// FAVORITES MANAGEMENT
// ============================================================================
class FavoritesManager {
    static isLiked(artworkId) {
        const favorites = JSON.parse(localStorage.getItem('artworkFavorites') || '[]');
        return favorites.includes(artworkId.toString());
    }
    
    static toggleFavorite(artworkId) {
        const favorites = JSON.parse(localStorage.getItem('artworkFavorites') || '[]');
        const id = artworkId.toString();
        
        if (favorites.includes(id)) {
            const index = favorites.indexOf(id);
            favorites.splice(index, 1);
        } else {
            favorites.push(id);
        }
        
        localStorage.setItem('artworkFavorites', JSON.stringify(favorites));
        
        // Update button appearance
        const heartBtn = document.querySelector(`[data-artwork-id="${artworkId}"]`);
        if (heartBtn) {
            const icon = heartBtn.querySelector('i');
            if (favorites.includes(id)) {
                icon.className = 'bi bi-heart-fill';
                icon.style.color = '#e74c3c';
            } else {
                icon.className = 'bi bi-heart';
                icon.style.color = '';
            }
        }
    }
}

// ============================================================================
// SMOOTH SCROLLING
// ============================================================================
class SmoothScrolling {
    static init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('My Paw Colors - Initializing...');
    
    // Initialize loading screen
    LoadingScreen.init();
    
    // Initialize side navigation
    SideNavigation.init();
    
    // Initialize search
    HeroSearch.init();
    
    // Initialize smooth scrolling
    SmoothScrolling.init();
    
    // Initialize effects
    new ParticleSystem();
    new ParallaxEffect();
    new AnimationObserver();
    
    // Load content
    await ArtworkManager.loadFromJSON();
    await HeroImageManager.loadRandomHero();
    
    // Initialize managers
    ModalManager.init();
    EventManager.init();
    Utils.initStaticIframe();
    
    console.log('My Paw Colors - Ready!');
});

// ============================================================================
// GLOBAL API
// ============================================================================
window.MyPawColors = {
    loadArtworks: () => ArtworkManager.loadFromJSON(),
    filterArtworks: (category) => ArtworkManager.filterArtworks(category),
    displayArtworks: (artworks) => ArtworkManager.displayArtworks(artworks),
    openArtworkModal: (artwork) => ModalManager.open(artwork),
    closeArtworkModal: () => ModalManager.close(),
    scrollToArtwork: (id) => Utils.scrollToArtwork(id),
    FullscreenViewer: FullscreenViewer,
    toggleFavorite: (id) => FavoritesManager.toggleFavorite(id),
    isLiked: (id) => FavoritesManager.isLiked(id)
};
