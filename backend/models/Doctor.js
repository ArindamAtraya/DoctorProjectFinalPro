const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthcareProvider',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        default: ''
    },
    specialty: {
        type: String,
        required: true
    },
    qualification: {
        type: String,
        required: true
    },
    degrees: [{
        degree: String,
        institution: String,
        year: String
    }],
    experience: {
        type: String,
        required: true
    },
    consultationFee: {
        type: Number,
        required: true
    },
    availableSlots: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        timeSlots: [String]
    }],
    visitingHours: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        startTime: String,
        endTime: String
    }],
    about: {
        type: String,
        default: ''
    },
    slotsPerDay: {
        type: Number,
        default: 10
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
