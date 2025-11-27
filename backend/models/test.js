const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: String,
    price: {
        type: Number,
        required: true
    },
    homeCollection: {
        type: Boolean,
        default: false
    },
    fastingRequired: {
        type: Boolean,
        default: false
    },
    reportTime: String,
    preparationInstructions: String,
    labs: [{
        labId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lab'
        },
        price: Number,
        available: {
            type: Boolean,
            default: true
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Test', testSchema);