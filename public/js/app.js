class EventEase {
    constructor() {
        this.events = [];
        this.categories = [];
        this.currentSection = 'dashboard';
        this.unsplashHelper = new UnsplashHelper(UnsplashConfig); 
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.setupMobileMenu();
        this.showSection('dashboard');
        this.unsplashHelper.init(); 
    }

    setupEventListeners() {
        document.getElementById('search-input')?.addEventListener('input', async (e) => {
            await this.filterEvents();
        });

        document.getElementById('category-filter')?.addEventListener('change', async (e) => {
            await this.filterEvents();
        });

        document.getElementById('status-filter')?.addEventListener('change', async (e) => {
            await this.filterEvents();
        });

        document.getElementById('create-event-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createEvent();
        });

        document.getElementById('mobile-menu-button')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
    }

    setupMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuButton = document.getElementById('mobile-menu-button');

        if (mobileMenu && mobileMenuButton) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });

            document.querySelectorAll('.mobile-nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                });
            });
        }
    }

    async loadInitialData() {
        try {
            this.showLoading(true);
            
            const [eventsResponse, categoriesResponse, statsResponse] = await Promise.all([
                this.apiCall('/api/events'),
                this.apiCall('/api/categories'),
                this.apiCall('/api/stats')
            ]);

            if (eventsResponse.success) {
                this.events = eventsResponse.data;
                await this.renderEvents();
                await this.renderRecentEvents();
            }

            if (categoriesResponse.success) {
                this.categories = categoriesResponse.data;
                this.populateCategoryFilters();
            }

            if (statsResponse.success) {
                this.updateDashboardStats(statsResponse.data);
            }

        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Error loading data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async apiCall(endpoint, options = {}) {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    showSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });

        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.remove('active', 'bg-primary', 'text-white');
            link.classList.add('text-gray-600', 'hover:text-gray-900');
        });

        const activeLinks = document.querySelectorAll(`[onclick="showSection('${sectionName}')"]`);
        activeLinks.forEach(link => {
            link.classList.remove('text-gray-600', 'hover:text-gray-900');
            link.classList.add('active', 'bg-primary', 'text-white');
        });

        this.currentSection = sectionName;

        if (sectionName === 'events') {
            this.renderEvents();
        } else if (sectionName === 'stats') {
            this.renderStatistics();
        }
    }

    async getEventImage(category) {
        try {
            console.log(`Fetching image for category: ${category}`);
            const imageUrl = await this.unsplashHelper.getImageForCategory(category);
            console.log(`Image URL for ${category}:`, imageUrl);
            return imageUrl;
        } catch (error) {
            console.error(`Error fetching image for ${category}:`, error);
            return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
        }
    }

    async renderEvents() {
        const eventsGrid = document.getElementById('events-grid');
        if (!eventsGrid) return;

        const eventsWithImages = await Promise.all(this.events.map(async event => {
            const imageUrl = await this.getEventImage(event.category);
            return { ...event, imageUrl };
        }));

        const eventsToRender = this.currentSection === 'dashboard' ? 
            eventsWithImages.slice(0, 3) : eventsWithImages;

        const eventsHTML = eventsToRender.map(event => this.createEventCard(event)).join('');
        eventsGrid.innerHTML = eventsHTML;
    }

    async renderRecentEvents() {
        const recentEvents = document.getElementById('recent-events');
        if (!recentEvents) return;

        const recentEventsWithImages = await Promise.all(this.events.slice(0, 3).map(async event => {
            const imageUrl = await this.getEventImage(event.category);
            return { ...event, imageUrl };
        }));

        const recentEventsHTML = recentEventsWithImages
            .map(event => this.createEventCard(event))
            .join('');

        recentEvents.innerHTML = recentEventsHTML;
    }

    createEventCard(event) {
        const statusColor = event.status === 'upcoming' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-gray-500 to-gray-600';
        const statusText = event.status === 'upcoming' ? 'Upcoming' : 'Completed';
        
        return `
            <div class="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 card-hover border border-gray-100 overflow-hidden group">
                <div class="relative h-48 overflow-hidden">
                    <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div class="absolute top-4 right-4">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold text-white ${statusColor} shadow-lg">
                            ${statusText}
                        </span>
                    </div>
                    <div class="absolute bottom-4 left-4">
                        <div class="flex items-center space-x-2 text-white">
                            <i class="fas fa-map-marker-alt text-sm"></i>
                            <span class="text-sm font-medium">${event.location}</span>
                        </div>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="mb-4">
                        <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">${event.title}</h3>
                        <p class="text-gray-600 text-sm line-clamp-2">${event.description}</p>
                    </div>
                    
                    <div class="space-y-3 mb-6">
                        <div class="flex items-center text-sm text-gray-500">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-calendar text-blue-600 text-sm"></i>
                            </div>
                            <span>${this.formatDate(event.date)} ${event.time ? `at ${event.time}` : ''}</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-500">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-tag text-purple-600 text-sm"></i>
                            </div>
                            <span>${event.category}</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center space-x-2">
                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-users text-green-600 text-sm"></i>
                            </div>
                            <span class="text-sm text-gray-600">
                                <span class="font-semibold text-gray-900">${event.attendees}</span> / ${event.capacity}
                            </span>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-primary">
                                ${event.price > 0 ? `$${event.price}` : 'Free'}
                            </div>
                            <div class="text-xs text-gray-500">per person</div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="eventEase.viewEvent('${event.id}')" 
                                class="flex-1 bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-primary/90 hover:to-purple-600/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            <i class="fas fa-eye mr-2"></i>View Details
                        </button>
                        ${event.status === 'upcoming' ? `
                            <button onclick="eventEase.registerForEvent('${event.id}')" 
                                    class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-green-500/90 hover:to-green-600/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                <i class="fas fa-ticket-alt mr-2"></i>Register
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    populateCategoryFilters() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter) return;

        const options = this.categories.map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');

        categoryFilter.innerHTML = '<option value="">All Categories</option>' + options;
    }

    async filterEvents() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';

        let filteredEvents = this.events.filter(event => {
            const matchesSearch = !searchTerm || 
                event.title.toLowerCase().includes(searchTerm) ||
                event.description.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || event.category === categoryFilter;
            const matchesStatus = !statusFilter || event.status === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        await this.renderFilteredEvents(filteredEvents);
    }

    async renderFilteredEvents(filteredEvents) {
        const eventsGrid = document.getElementById('events-grid');
        if (!eventsGrid) return;

        if (filteredEvents.length === 0) {
            eventsGrid.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-search text-4xl text-gray-300"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">No events found</h3>
                    <p class="text-gray-500">Try adjusting your search criteria or browse all events</p>
                </div>
            `;
            return;
        }

        const eventsWithImages = await Promise.all(filteredEvents.map(async event => {
            const imageUrl = await this.getEventImage(event.category);
            return { ...event, imageUrl };
        }));

        const eventsHTML = eventsWithImages.map(event => this.createEventCard(event)).join('');
        eventsGrid.innerHTML = eventsHTML;
    }

    async createEvent() {
        const form = document.getElementById('create-event-form');
        const formData = new FormData(form);
        
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            date: formData.get('date'),
            time: formData.get('time'),
            location: formData.get('location'),
            category: formData.get('category'),
            capacity: parseInt(formData.get('capacity')),
            price: parseFloat(formData.get('price')),
            organizer: formData.get('organizer')
        };

        try {
            this.showLoading(true);
            
            const response = await this.apiCall('/api/events', {
                method: 'POST',
                body: JSON.stringify(eventData)
            });

            if (response.success) {
                this.showToast('🎉 Event created successfully!', 'success');
                this.events.unshift(response.data);
                this.categories = [...new Set(this.events.map(e => e.category))];
                this.populateCategoryFilters();
                this.resetForm();
                this.showSection('events');
                await this.renderEvents();
                await this.renderRecentEvents();
            }
        } catch (error) {
            this.showToast(error.message || 'Error creating event', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    resetForm() {
        const form = document.getElementById('create-event-form');
        if (form) {
            form.reset();
        }
    }

    async viewEvent(eventId) {
        try {
            const response = await this.apiCall(`/api/events/${eventId}`);
            if (response.success) {
                const event = response.data;
                const imageUrl = await this.getEventImage(event.category); // Fetch image for modal
                this.showEventModal({ ...event, imageUrl }); // Pass event with image URL
            }
        } catch (error) {
            this.showToast('Error loading event details', 'error');
        }
    }

    showEventModal(event) {
        const modal = document.getElementById('event-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');

        if (modal && modalTitle && modalContent) {
            modalTitle.textContent = event.title;
            
            modalContent.innerHTML = `
                <div class="space-y-6">
                    <div class="relative h-48 rounded-xl overflow-hidden">
                        <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        <div class="absolute bottom-4 left-4">
                            <span class="px-3 py-1 rounded-full text-sm font-semibold text-white ${event.status === 'upcoming' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'}">
                                ${event.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                            </span>
                        </div>
                    </div>
                    
                    <p class="text-gray-600 text-lg leading-relaxed">${event.description}</p>
                    
                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-gray-50 rounded-xl p-4">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-calendar text-primary mr-3"></i>
                                <span class="font-semibold text-gray-700">Date & Time</span>
                            </div>
                            <p class="text-gray-600">${this.formatDate(event.date)} ${event.time ? `at ${event.time}` : ''}</p>
                        </div>
                        <div class="bg-gray-50 rounded-xl p-4">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-map-marker-alt text-primary mr-3"></i>
                                <span class="font-semibold text-gray-700">Location</span>
                            </div>
                            <p class="text-gray-600">${event.location}</p>
                        </div>
                        <div class="bg-gray-50 rounded-xl p-4">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-tag text-primary mr-3"></i>
                                <span class="font-semibold text-gray-700">Category</span>
                            </div>
                            <p class="text-gray-600">${event.category}</p>
                        </div>
                        <div class="bg-gray-50 rounded-xl p-4">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-users text-primary mr-3"></i>
                                <span class="font-semibold text-gray-700">Capacity</span>
                            </div>
                            <p class="text-gray-600">${event.attendees}/${event.capacity}</p>
                        </div>
                        <div class="bg-gray-50 rounded-xl p-4">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-dollar-sign text-primary mr-3"></i>
                                <span class="font-semibold text-gray-700">Price</span>
                            </div>
                            <p class="text-gray-600">${event.price > 0 ? `$${event.price}` : 'Free'}</p>
                        </div>
                        <div class="bg-gray-50 rounded-xl p-4">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-user text-primary mr-3"></i>
                                <span class="font-semibold text-gray-700">Organizer</span>
                            </div>
                            <p class="text-gray-600">${event.organizer}</p>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 pt-6">
                        ${event.status === 'upcoming' ? `
                            <button onclick="eventEase.registerForEvent('${event.id}')" 
                                    class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-500/90 hover:to-green-600/90 transition-all duration-300 shadow-lg hover:shadow-xl">
                                <i class="fas fa-ticket-alt mr-2"></i>Register for Event
                            </button>
                        ` : ''}
                        <button onclick="eventEase.closeModal()" 
                                class="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300">
                            Close
                        </button>
                    </div>
                </div>
            `;
            
            modal.classList.remove('hidden');
        }
    }

    closeModal() {
        const modal = document.getElementById('event-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async registerForEvent(eventId) {
        try {
            const response = await this.apiCall(`/api/events/${eventId}/register`, {
                method: 'POST'
            });

            if (response.success) {
                this.showToast('🎉 Successfully registered for event!', 'success');
                this.closeModal();
                
                // Update local event data
                const eventIndex = this.events.findIndex(e => e.id === eventId);
                if (eventIndex !== -1) {
                    this.events[eventIndex] = response.data;
                }
                
                await this.renderEvents();
                await this.renderRecentEvents();
            }
        } catch (error) {
            this.showToast(error.message || 'Error registering for event', 'error');
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('total-events').textContent = stats.totalEvents;
        document.getElementById('total-attendees').textContent = stats.totalAttendees;
        document.getElementById('upcoming-events').textContent = stats.upcomingEvents;
        document.getElementById('total-revenue').textContent = `$${stats.totalRevenue}`;
    }

    renderStatistics() {
        const categoryChart = document.getElementById('category-chart');
        const monthlyChart = document.getElementById('monthly-chart');

        if (categoryChart) {
            categoryChart.innerHTML = this.createCategoryChart();
        }

        if (monthlyChart) {
            monthlyChart.innerHTML = this.createMonthlyChart();
        }
    }

    createCategoryChart() {
        const categoryCounts = {};
        this.events.forEach(event => {
            categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
        });

        if (Object.keys(categoryCounts).length === 0) {
            return `
                <div class="text-center text-gray-500">
                    <i class="fas fa-chart-pie text-4xl mb-4"></i>
                    <p>No events to display</p>
                </div>
            `;
        }

        const chartHTML = Object.entries(categoryCounts).map(([category, count]) => {
            const percentage = ((count / this.events.length) * 100).toFixed(1);
            const colors = ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-orange-500 to-orange-600', 'from-pink-500 to-pink-600', 'from-indigo-500 to-indigo-600'];
            const colorIndex = Object.keys(categoryCounts).indexOf(category) % colors.length;
            
            return `
                <div class="flex items-center justify-between py-4 border-b border-gray-100">
                    <div class="flex items-center space-x-3">
                        <div class="w-4 h-4 bg-gradient-to-r ${colors[colorIndex]} rounded-full"></div>
                        <span class="font-semibold text-gray-700">${category}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-primary">${count}</div>
                        <div class="text-sm text-gray-500">${percentage}%</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="space-y-2">
                ${chartHTML}
            </div>
        `;
    }

    createMonthlyChart() {
        const monthlyCounts = {};
        this.events.forEach(event => {
            const month = new Date(event.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
        });

        if (Object.keys(monthlyCounts).length === 0) {
            return `
                <div class="text-center text-gray-500">
                    <i class="fas fa-chart-line text-4xl mb-4"></i>
                    <p>No events to display</p>
                </div>
            `;
        }

        const chartHTML = Object.entries(monthlyCounts).map(([month, count]) => {
            const maxCount = Math.max(...Object.values(monthlyCounts));
            const barHeight = (count / maxCount) * 100;
            
            return `
                <div class="flex items-center space-x-4 py-3">
                    <div class="w-24 text-sm font-medium text-gray-700">${month}</div>
                    <div class="flex-1">
                        <div class="bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div class="bg-gradient-to-r from-secondary to-green-600 h-full rounded-full transition-all duration-1000" style="width: ${barHeight}%"></div>
                        </div>
                    </div>
                    <div class="w-12 text-right">
                        <span class="text-lg font-bold text-secondary">${count}</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="space-y-2">
                ${chartHTML}
            </div>
        `;
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.toggle('hidden', !show);
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                       type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-blue-600';
        
        toast.className = `${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl transform translate-x-full transition-all duration-500 backdrop-blur-sm`;
        toast.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} text-xl"></i>
                <span class="font-medium">${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 500);
        }, 5000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    }
}

function showSection(sectionName) {
    eventEase.showSection(sectionName);
}

function resetForm() {
    eventEase.resetForm();
}

function closeModal() {
    eventEase.closeModal();
}

document.addEventListener('DOMContentLoaded', () => {
    window.eventEase = new EventEase();
});

document.addEventListener('click', (e) => {
    const modal = document.getElementById('event-modal');
    if (modal && e.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});


