const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthcareProvider',
        required: true
    },
    providerName: {
        type: String,
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    isWalkIn: {
        type: Boolean,
        default: false
    },
    patientName: {
        type: String,
        required: true
    },
    patientPhone: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    queueNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    consultationFee: {
        type: Number,
        required: true
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'partial', 'paid'],
        default: 'unpaid'
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Non-unique index for provider queries
appointmentSchema.index({ providerId: 1, date: 1, queueNumber: 1 });

// Unique compound index to prevent duplicate queue numbers for same doctor/date/time
// This ensures atomic queue assignment - if two requests try to create the same queue number,
// one will fail with a duplicate key error and retry with the next number
appointmentSchema.index({ doctorId: 1, date: 1, time: 1, queueNumber: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
