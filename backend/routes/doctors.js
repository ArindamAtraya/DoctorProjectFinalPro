const express = require('express');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const router = express.Router();

// Get all doctors with filters
router.get('/', async (req, res) => {
    try {
        const { specialty, hospital, search } = req.query;
        let filter = {};

        if (specialty) {
            filter.specialty = new RegExp(specialty, 'i');
        }

        if (hospital) {
            filter['hospitals.hospitalId'] = hospital;
        }

        if (search) {
            filter.$or = [
                { specialty: new RegExp(search, 'i') },
                { 'userId.name': new RegExp(search, 'i') }
            ];
        }

        const doctors = await Doctor.find(filter)
            .populate('userId', 'name email phone profile')
            .populate('hospitals.hospitalId', 'name address');

        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('userId', 'name email phone profile')
            .populate('hospitals.hospitalId', 'name address facilities');

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get doctor availability
router.get('/:id/availability', async (req, res) => {
    try {
        const { date } = req.query;
        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Get booked appointments for the date
        const Appointment = require('../models/Appointment');
        const bookedSlots = await Appointment.find({
            doctorId: req.params.id,
            date: new Date(date),
            status: { $in: ['confirmed', 'pending'] }
        }).select('timeSlot');

        const bookedTimes = bookedSlots.map(apt => apt.timeSlot);

        // Get available slots
        const day = new Date(date).getDay();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[day];

        const schedule = doctor.hospitals.reduce((slots, hospital) => {
            const daySchedule = hospital.schedule.find(s => s.day === dayName);
            if (daySchedule) {
                return [...slots, ...daySchedule.slots];
            }
            return slots;
        }, []);

        const availableSlots = schedule.filter(slot => !bookedTimes.includes(slot));

        res.json({ availableSlots });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;