
const UnsplashConfig = {
    accessKey: '4eDpR9sbV7ILSpeNPvZw8BUqqnvnymf4x_OltPaoB6w',
    
    baseUrl: 'https://api.unsplash.com',
    
    categoryImages: {
        'Technology': {
            query: 'technology conference',
            orientation: 'landscape',
            count: 5
        },
        'Business': {
            query: 'business meeting',
            orientation: 'landscape',
            count: 5
        },
        'Entertainment': {
            query: 'concert festival',
            orientation: 'landscape',
            count: 5
        },
        'Education': {
            query: 'education learning',
            orientation: 'landscape',
            count: 5
        },
        'Sports': {
            query: 'sports event',
            orientation: 'landscape',
            count: 5
        },
        'Other': {
            query: 'event celebration',
            orientation: 'landscape',
            count: 5
        }
    },
    
    fallbackImages: {
        'Technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'Business': 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'Entertainment': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'Education': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'Other': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    
    heroImages: [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80'
    ],
    
    imageSettings: {
        width: 800,
        quality: 80,
        format: 'auto'
    },
    
    cache: {
        enabled: true,
        duration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        storageKey: 'eventease_unsplash_cache'
    }
};

class UnsplashHelper {
    constructor(config) {
        this.config = config;
        this.cache = this.loadCache();
    }
    
    loadCache() {
        if (!this.config.cache.enabled) return {};
        
        try {
            const cached = localStorage.getItem(this.config.cache.storageKey);
            return cached ? JSON.parse(cached) : {};
        } catch (error) {
            console.warn('Failed to load Unsplash cache:', error);
            return {};
        }
    }
    
    saveCache(category, images) {
        if (!this.config.cache.enabled) return;
        
        try {
            this.cache[category] = {
                images: images,
                timestamp: Date.now()
            };
            localStorage.setItem(this.config.cache.storageKey, JSON.stringify(this.cache));
        } catch (error) {
            console.warn('Failed to save Unsplash cache:', error);
        }
    }
    
    isCacheValid(category) {
        if (!this.config.cache.enabled) return false;
        
        const cached = this.cache[category];
        if (!cached) return false;
        
        return (Date.now() - cached.timestamp) < this.config.cache.duration;
    }
    
    getRandomImage(images) {
        if (!images || images.length === 0) return null;
        return images[Math.floor(Math.random() * images.length)];
    }
    
    async getImageForCategory(category) {
        try {
            console.log(`getImageForCategory called for: ${category}`);
            
            if (this.config.cache.enabled && this.cache[category] && this.isCacheValid(category)) {
                console.log(`Using cached image for ${category}`);
                return this.getRandomImage(this.cache[category].images);
            }

            if (!this.config.accessKey) {
                console.log(`No API key, using fallback for ${category}`);
                return this.config.fallbackImages[category] || this.config.fallbackImages['Other'];
            }
            
            try {
                console.log(`Fetching from Unsplash for ${category}`);
                const images = await this.fetchImagesFromUnsplash(category);
                if (images && images.length > 0) {
                    console.log(`Successfully fetched ${images.length} images for ${category}`);
                    this.saveCache(category, images);
                    return this.getRandomImage(images);
                }
            } catch (error) {
                console.warn(`Failed to fetch Unsplash images for ${category}:`, error);
            }
            
            console.log(`Using fallback image for ${category}`);
            return this.config.fallbackImages[category] || this.config.fallbackImages['Other'];
        } catch (error) {
            console.error(`Error in getImageForCategory for ${category}:`, error);
            return this.config.fallbackImages[category] || this.config.fallbackImages['Other'];
        }
    }
    
    async fetchImagesFromUnsplash(category) {
        const categoryConfig = this.config.categoryImages[category];
        if (!categoryConfig) {
            console.warn(`No category config found for: ${category}`);
            return null;
        }
        
        const params = new URLSearchParams({
            query: categoryConfig.query,
            orientation: categoryConfig.orientation,
            count: categoryConfig.count,
            client_id: this.config.accessKey
        });
        
        const url = `${this.config.baseUrl}/photos/random?${params}`;
        console.log(`Fetching from URL: ${url}`);
        
        try {
            const response = await fetch(url);
            console.log(`Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Unsplash API error: ${response.status}`, errorText);
                throw new Error(`Unsplash API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Response data:`, data);
            
            if (Array.isArray(data)) {
                const imageUrls = data.map(photo => photo.urls.regular);
                console.log(`Extracted image URLs:`, imageUrls);
                return imageUrls;
            } else {
                console.warn(`Unexpected response format:`, data);
                return null;
            }
        } catch (error) {
            console.error(`Error in fetchImagesFromUnsplash:`, error);
            throw error;
        }
    }
    
    getRandomHeroImage() {
        return this.getRandomImage(this.config.heroImages);
    }
    
    updateHeroBackground() {
        const heroSection = document.querySelector('.hero-bg');
        if (heroSection) {
            const randomImage = this.getRandomHeroImage();
            heroSection.style.backgroundImage = `linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%), url('${randomImage}')`;
        }
    }
    
    async init() {
        this.updateHeroBackground();
        
        setInterval(() => {
            this.updateHeroBackground();
        }, 30000); 
    }
}

window.UnsplashConfig = UnsplashConfig;
window.UnsplashHelper = UnsplashHelper;
