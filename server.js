const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const DataStorage = require('./data/storage');

const app = express();
const PORT = process.env.PORT || 3000;

const dataStorage = new DataStorage();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let isStorageReady = false;
dataStorage.init().then(() => {
    isStorageReady = true;
    console.log('EventEase server ready with persistent storage!');
}).catch(error => {
    console.error('Failed to initialize storage:', error);
    process.exit(1);
});


app.get('/api/events', (req, res) => {
  try {
    if (!isStorageReady) {
      return res.status(503).json({
        success: false,
        message: 'Storage not ready yet'
      });
    }

    const { category, status, search } = req.query;
    const filters = {};
    
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (search) filters.search = search;

    const filteredEvents = dataStorage.filterEvents(filters);

    res.json({
      success: true,
      data: filteredEvents,
      total: filteredEvents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
});

app.get('/api/events/:id', (req, res) => {
  try {
    if (!isStorageReady) {
      return res.status(503).json({
        success: false,
        message: 'Storage not ready yet'
      });
    }

    const event = dataStorage.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    if (!isStorageReady) {
      return res.status(503).json({
        success: false,
        message: 'Storage not ready yet'
      });
    }

    const {
      title,
      description,
      date,
      time,
      location,
      category,
      capacity,
      price,
      organizer
    } = req.body;

    if (!title || !description || !date || !location || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const eventData = {
      title,
      description,
      date,
      time: time || '00:00',
      location,
      category,
      capacity: capacity || 100,
      price: price || 0,
      organizer: organizer || 'Anonymous'
    };

    const newEvent = await dataStorage.addEvent(eventData);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    if (!isStorageReady) {
      return res.status(503).json({
        success: false,
        message: 'Storage not ready yet'
      });
    }

    const updatedEvent = await dataStorage.updateEvent(req.params.id, req.body);
    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    if (!isStorageReady) {
      return res.status(503).json({
        success: false,
        message: 'Storage not ready yet'
      });
    }

    const deletedEvent = await dataStorage.deleteEvent(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
      data: deletedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
});

app.post('/api/events/:id/register', async (req, res) => {
  try {
    if (!isStorageReady) {
      return res.status(503).json({
        success: false,
        message: 'Storage not ready yet'
      });
    }

    const event = await dataStorage.registerForEvent(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Successfully registered for event',
      data: event
    });
  } catch (error) {
    if (error.message === 'Event is at full capacity') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error registering for event',
      error: error.message
    });
  }
});

app.get('/api/categories', (req, res) => {
  try {
    if (!isStorageReady) {
      return res.status(503).json({
        success: false,
        message: 'Storage not ready yet'
      });
    }

    const categories = dataStorage.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    if (!isStorageReady) {
      return res.status(503).json({
        success: false,
        message: 'Storage not ready yet'
      });
    }

    const stats = dataStorage.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`EventEase server starting on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log(`Initializing persistent storage...`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (isStorageReady) {
    console.log('Ensuring all data is saved...');
    try {
      await dataStorage.saveEvents();
      console.log('All data saved successfully');
    } catch (error) {
      console.error('Error saving data during shutdown:', error);
    }
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  if (isStorageReady) {
    console.log('Ensuring all data is saved...');
    try {
      await dataStorage.saveEvents();
      console.log('All data saved successfully');
    } catch (error) {
      console.error('Error saving data during shutdown:', error);
    }
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;