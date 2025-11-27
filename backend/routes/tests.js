const express = require('express');
const Test = require('../models/Test');
const router = express.Router();

// Get all tests
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        let filter = {};

        if (category) {
            filter.category = new RegExp(category, 'i');
        }

        if (search) {
            filter.name = new RegExp(search, 'i');
        }

        const tests = await Test.find(filter).populate('labs.labId', 'name address');
        res.json(tests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Book test
router.post('/book', async (req, res) => {
    try {
        const { testId, labId, patientId, preferredDate, homeCollection, address } = req.body;

        const TestBooking = require('../models/TestBooking');
        const booking = new TestBooking({
            testId,
            labId,
            patientId,
            preferredDate: new Date(preferredDate),
            homeCollection,
            collectionAddress: homeCollection ? address : undefined,
            status: 'pending'
        });

        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;