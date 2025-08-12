const fs = require('fs').promises;
const path = require('path');

class DataStorage {
    constructor() {
        this.eventsFile = path.join(__dirname, 'events.json');
        this.events = [];
        this.initialized = false;
    }

    async init() {
        try {
            await this.loadEvents();
            this.initialized = true;
            console.log('Data storage initialized successfully');
        } catch (error) {
            console.error('Error initializing data storage:', error);
            try {
                console.log('Creating default events file...');
                await this.createDefaultEvents();
                this.initialized = true;
                console.log('Default events created successfully');
            } catch (createError) {
                console.error('Failed to create default events:', createError);
                throw createError;
            }
        }
    }

    async loadEvents() {
        try {
            const data = await fs.readFile(this.eventsFile, 'utf8');
            this.events = JSON.parse(data);
            console.log(`Loaded ${this.events.length} events from storage`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('Events file not found, creating with default data...');
                await this.createDefaultEvents();
            } else {
                throw error;
            }
        }
    }

    async saveEvents() {
        try {
            await fs.writeFile(this.eventsFile, JSON.stringify(this.events, null, 2), 'utf8');
            console.log(`Saved ${this.events.length} events to storage`);
        } catch (error) {
            console.error('Error saving events:', error);
            throw error;
        }
    }

    async createDefaultEvents() {
        this.events = [
            {
                id: '1',
                title: 'Tech Conference 2024',
                description: 'Annual technology conference featuring industry leaders',
                date: '2024-06-15',
                time: '09:00',
                location: 'Convention Center, Downtown',
                category: 'Technology',
                capacity: 500,
                attendees: 120,
                price: 299,
                organizer: 'Tech Events Inc.',
                status: 'completed',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Music Festival',
                description: 'Three-day music festival with top artists',
                date: '2024-07-20',
                time: '18:00',
                location: 'Central Park',
                category: 'Entertainment',
                capacity: 1000,
                attendees: 850,
                price: 150,
                organizer: 'Music Productions',
                status: 'completed',
                createdAt: new Date().toISOString()
            },
            {
                id: '3',
                title: 'Business Networking',
                description: 'Professional networking event for entrepreneurs',
                date: '2024-05-10',
                time: '19:00',
                location: 'Grand Hotel',
                category: 'Business',
                capacity: 200,
                attendees: 180,
                price: 75,
                organizer: 'Business Network',
                status: 'completed',
                createdAt: new Date().toISOString()
            }
        ];
        await this.saveEvents();
    }

    getAllEvents() {
        return [...this.events];
    }

    getEventById(id) {
        return this.events.find(event => event.id === id);
    }

    async addEvent(eventData) {
        const newEvent = {
            ...eventData,
            id: eventData.id || this.generateId(),
            attendees: eventData.attendees || 0,
            status: eventData.status || 'upcoming',
            createdAt: eventData.createdAt || new Date().toISOString()
        };
        
        this.events.push(newEvent);
        await this.saveEvents();
        return newEvent;
    }

    async updateEvent(id, updateData) {
        const eventIndex = this.events.findIndex(event => event.id === id);
        if (eventIndex === -1) {
            return null;
        }

        this.events[eventIndex] = { ...this.events[eventIndex], ...updateData };
        await this.saveEvents();
        return this.events[eventIndex];
    }

    async deleteEvent(id) {
        const eventIndex = this.events.findIndex(event => event.id === id);
        if (eventIndex === -1) {
            return null;
        }

        const deletedEvent = this.events.splice(eventIndex, 1)[0];
        await this.saveEvents();
        return deletedEvent;
    }

    async registerForEvent(id) {
        const event = this.getEventById(id);
        if (!event) {
            return null;
        }

        if (event.attendees >= event.capacity) {
            throw new Error('Event is at full capacity');
        }

        event.attendees += 1;
        await this.saveEvents();
        return event;
    }

    getCategories() {
        return [...new Set(this.events.map(event => event.category))];
    }

    getStats() {
        const totalEvents = this.events.length;
        const upcomingEvents = this.events.filter(e => e.status === 'upcoming').length;
        const completedEvents = this.events.filter(e => e.status === 'completed').length;
        const totalAttendees = this.events.reduce((sum, event) => sum + event.attendees, 0);
        const totalRevenue = this.events.reduce((sum, event) => sum + (event.attendees * event.price), 0);

        return {
            totalEvents,
            upcomingEvents,
            completedEvents,
            totalAttendees,
            totalRevenue
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    filterEvents(filters = {}) {
        let filteredEvents = [...this.events];

        if (filters.category) {
            filteredEvents = filteredEvents.filter(event => 
                event.category.toLowerCase() === filters.category.toLowerCase()
            );
        }

        if (filters.status) {
            filteredEvents = filteredEvents.filter(event => 
                event.status === filters.status
            );
        }

        if (filters.search) {
            filteredEvents = filteredEvents.filter(event =>
                event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                event.description.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        return filteredEvents;
    }

    isReady() {
        return this.initialized;
    }
}

module.exports = DataStorage;
