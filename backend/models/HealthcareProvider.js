const mongoose = require('mongoose');

const healthcareProviderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['pharmacy', 'clinic', 'hospital'],
        required: true
    },
    address: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: false,
        default: 'Not specified'
    },
    state: {
        type: String,
        required: false,
        default: 'Not specified'
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    registrationNumber: {
        type: String,
        required: true
    },
    facilities: [String],
    rating: {
        type: Number,
        default: 4.5
    },
    totalReviews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('HealthcareProvider', healthcareProviderSchema);
