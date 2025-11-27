const express = require('express');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user appointments
router.get('/', auth, async (req, res) => {
    try {
        let filter = {};
        
        if (req.user.role === 'patient') {
            filter.patientId = req.user.userId;
        } else if (req.user.role === 'doctor') {
            filter.doctorId = req.user.userId;
        }

        const appointments = await Appointment.find(filter)
            .populate('patientId', 'name phone profile')
            .populate('doctorId', 'userId specialty')
            .populate('hospitalId', 'name address')
            .sort({ date: 1, timeSlot: 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create appointment
router.post('/', auth, async (req, res) => {
    try {
        const { doctorId, hospitalId, date, timeSlot, type, notes, symptoms } = req.body;

        // Check if slot is available
        const existingAppointment = await Appointment.findOne({
            doctorId,
            date: new Date(date),
            timeSlot,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingAppointment) {
            return res.status(400).json({ error: 'Time slot not available' });
        }

        // Get doctor's fee
        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Calculate queue position
        const sameDayAppointments = await Appointment.find({
            doctorId,
            date: new Date(date),
            status: { $in: ['pending', 'confirmed'] }
        }).sort({ timeSlot: 1 });

        const queuePosition = sameDayAppointments.length + 1;
        const estimatedWaitTime = queuePosition * 15; // 15 minutes per patient

        const appointment = new Appointment({
            patientId: req.user.userId,
            doctorId,
            hospitalId,
            date: new Date(date),
            timeSlot,
            type: type || 'in-person',
            notes,
            symptoms,
            queuePosition,
            estimatedWaitTime,
            consultationFee: doctor.consultationFee
        });

        await appointment.save();
        await appointment.populate([
            { path: 'patientId', select: 'name phone profile' },
            { path: 'doctorId', populate: { path: 'userId', select: 'name' } },
            { path: 'hospitalId', select: 'name address' }
        ]);

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update appointment status
router.put('/:id', auth, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Check permissions
        if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        Object.assign(appointment, req.body);
        await appointment.save();

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;