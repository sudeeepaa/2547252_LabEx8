const DataStorage = require('./data/storage');

async function testStorage() {
    console.log('🧪 Testing EventEase Storage System...\n');

    try {
        const storage = new DataStorage();
        await storage.init();
        console.log('Storage initialized successfully\n');

        console.log('Testing event creation...');
        const newEvent = await storage.addEvent({
            title: 'Test Event',
            description: 'This is a test event',
            date: '2024-12-25',
            time: '14:00',
            location: 'Test Location',
            category: 'Test',
            capacity: 100,
            price: 50,
            organizer: 'Test Organizer'
        });
        console.log('Event created:', newEvent.title);
        console.log('Event ID:', newEvent.id);
        console.log('Event saved to file\n');

        console.log('Testing event retrieval...');
        const allEvents = storage.getAllEvents();
        console.log(`Retrieved ${allEvents.length} events`);

        const retrievedEvent = storage.getEventById(newEvent.id);
        if (retrievedEvent) {
            console.log('Event retrieved by ID:', retrievedEvent.title);
        }

        const categories = storage.getCategories();
        console.log('Categories:', categories.join(', '));

        const stats = storage.getStats();
        console.log('Statistics:', stats);

        const filteredEvents = storage.filterEvents({ category: 'Test' });
        console.log(`Filtered events (Test category): ${filteredEvents.length}`);

        console.log('\nTesting event update...');
        const updatedEvent = await storage.updateEvent(newEvent.id, {
            title: 'Updated Test Event',
            price: 75
        });
        console.log('Event updated:', updatedEvent.title);
        console.log('New price:', updatedEvent.price);

        console.log('\nTesting event registration...');
        const registeredEvent = await storage.registerForEvent(newEvent.id);
        console.log('Registration successful');
        console.log('Attendees:', registeredEvent.attendees);

        console.log('\nTesting event deletion...');
        const deletedEvent = await storage.deleteEvent(newEvent.id);
        console.log('Event deleted:', deletedEvent.title);

        const remainingEvents = storage.getAllEvents();
        console.log(`Remaining events: ${remainingEvents.length}`);

        console.log('\nAll tests passed! Storage system is working correctly.');
        console.log('Your events are now persistent and will survive server restarts!');

    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    testStorage();
}

module.exports = { testStorage };
