require('dotenv').config(); // MUST be first line to load .env
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const connectDB = require('./config/database');

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const HealthcareProvider = require('./models/HealthcareProvider');
const Appointment = require('./models/Appointment');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'healthconnect-secret-key-2023';

async function startServer() {
    await connectDB();
    
    app.listen(PORT, HOST, () => {
        console.log(`🚀 HealthConnect server running on ${HOST}:${PORT}`);
        console.log(`📍 Frontend: http://${HOST}:${PORT}`);
        console.log(`🔗 API Base: http://${HOST}:${PORT}/api`);
        console.log(`❤️  Health Check: http://${HOST}:${PORT}/api/health`);
        console.log('\n📋 Available API Endpoints:');
        console.log('   POST /api/auth/register');
        console.log('   POST /api/auth/login');
        console.log('   GET  /api/doctors');
        console.log('   POST /api/doctors (add doctor)');
        console.log('   GET  /api/healthcare-providers');
        console.log('   POST /api/appointments');
        console.log('   GET  /api/provider-appointments');
        console.log('   GET  /api/all-doctors-with-providers');
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../frontend/uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/uploads')));

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

function requireProvider(req, res, next) {
    if (!['pharmacy', 'clinic', 'hospital'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied. Provider role required.' });
    }
    next();
}

function requirePatient(req, res, next) {
    if (req.user.role !== 'patient') {
        return res.status(403).json({ error: 'Access denied. Patient role required.' });
    }
    next();
}

function getDefaultFacilities(providerType) {
    const facilities = {
        pharmacy: ['Pharmacy', 'Basic Consultation', 'Medicine Delivery'],
        clinic: ['Consultation', 'Minor Procedures', 'Vaccination', 'Lab Tests'],
        hospital: ['Emergency', 'ICU', 'Pharmacy', 'Lab', 'Surgery', 'Radiology']
    };
    return facilities[providerType] || ['Healthcare Services'];
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/provider-auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/provider-auth.html'));
});

app.get('/provider-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/provider-dashboard.html'));
});

app.get('/appointment-history.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/appointment-history.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'HealthConnect API is running',
        timestamp: new Date().toISOString(),
        database: 'MongoDB Connected'
    });
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, role = 'patient', providerInfo } = req.body;
        
        console.log('🔐 REGISTRATION ATTEMPT:', { email, role, hasProviderInfo: !!providerInfo });

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('❌ User already exists:', email);
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role,
            providerInfo: providerInfo || null
        });

        await user.save();
        console.log('✅ User created:', { id: user._id, email: user.email, role: user.role });

        if (['pharmacy', 'clinic', 'hospital'].includes(role)) {
            const provider = new HealthcareProvider({
                userId: user._id,
                name: providerInfo.facilityName,
                type: role,
                address: providerInfo.address,
                district: providerInfo.district || 'Not specified',
                state: providerInfo.state || 'Not specified',
                phone: phone,
                email: email,
                registrationNumber: providerInfo.registrationNumber,
                facilities: getDefaultFacilities(role)
            });
            await provider.save();
            console.log('✅ Healthcare provider created:', { userId: user._id, type: role });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('✅ Token generated with role:', user.role);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                providerInfo: user.providerInfo
            }
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                providerInfo: user.providerInfo
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                providerInfo: user.providerInfo
            }
        });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/doctors', async (req, res) => {
    try {
        const { specialty, search } = req.query;
        
        let query = {};

        if (specialty) {
            query.specialty = new RegExp(specialty, 'i');
        }

        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { specialty: new RegExp(search, 'i') }
            ];
        }

        const doctors = await Doctor.find(query).populate('providerId');
        
        const formattedDoctors = doctors.map(doctor => ({
            id: doctor._id,
            name: doctor.name,
            photo: doctor.photo || '/uploads/default-doctor.png',
            specialty: doctor.specialty,
            qualification: doctor.qualification,
            degrees: doctor.degrees,
            experience: doctor.experience,
            consultationFee: doctor.consultationFee,
            fee: doctor.consultationFee,
            availableSlots: doctor.availableSlots,
            visitingHours: doctor.visitingHours || [],
            slotsPerDay: doctor.slotsPerDay,
            about: doctor.about,
            hospital: doctor.providerId ? doctor.providerId.name : 'N/A',
            providerId: doctor.providerId ? doctor.providerId._id : null,
            providerType: doctor.providerId ? doctor.providerId.type : null,
            providerDistrict: doctor.providerId ? doctor.providerId.district : 'N/A',
            rating: doctor.providerId ? doctor.providerId.rating : 4.5,
            reviews: doctor.providerId ? doctor.providerId.totalReviews : 0,
            availability: 'Available'
        }));

        res.json(formattedDoctors);
    } catch (error) {
        console.error('Get doctors error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/all-doctors-with-providers', async (req, res) => {
    try {
        const doctors = await Doctor.find().populate('providerId');
        
        const grouped = {};
        
        doctors.forEach(doctor => {
            if (doctor.providerId) {
                const key = `${doctor.providerId._id}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        providerId: doctor.providerId._id,
                        providerName: doctor.providerId.name,
                        providerType: doctor.providerId.type,
                        providerDistrict: doctor.providerId.district,
                        providerAddress: doctor.providerId.address,
                        providerPhone: doctor.providerId.phone,
                        doctors: []
                    };
                }
                
                grouped[key].doctors.push({
                    id: doctor._id,
                    name: doctor.name,
                    specialty: doctor.specialty,
                    qualification: doctor.qualification,
                    experience: doctor.experience,
                    consultationFee: doctor.consultationFee,
                    photo: doctor.photo || '/uploads/default-doctor.png'
                });
            }
        });
        
        res.json(Object.values(grouped));
    } catch (error) {
        console.error('Get all doctors with providers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/doctors/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('providerId');
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        res.json({
            id: doctor._id,
            name: doctor.name,
            photo: doctor.photo || '/uploads/default-doctor.png',
            specialty: doctor.specialty,
            qualification: doctor.qualification,
            degrees: doctor.degrees,
            experience: doctor.experience,
            consultationFee: doctor.consultationFee,
            availableSlots: doctor.availableSlots,
            visitingHours: doctor.visitingHours || [],
            slotsPerDay: doctor.slotsPerDay,
            about: doctor.about,
            hospital: doctor.providerId ? doctor.providerId.name : 'N/A',
            providerId: doctor.providerId ? doctor.providerId._id : null,
            rating: doctor.providerId ? doctor.providerId.rating : 4.5
        });
    } catch (error) {
        console.error('Get doctor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/healthcare-providers', async (req, res) => {
    try {
        const { type, search } = req.query;
        
        let query = {};

        if (type) {
            query.type = type.toLowerCase();
        }

        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { district: new RegExp(search, 'i') },
                { state: new RegExp(search, 'i') },
                { address: new RegExp(search, 'i') }
            ];
        }

        const providers = await HealthcareProvider.find(query);
        res.json(providers);
    } catch (error) {
        console.error('Get providers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/healthcare-providers/:id', async (req, res) => {
    try {
        const provider = await HealthcareProvider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ error: 'Healthcare provider not found' });
        }
        res.json(provider);
    } catch (error) {
        console.error('Get provider error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/my-provider', authenticateToken, requireProvider, async (req, res) => {
    try {
        const provider = await HealthcareProvider.findOne({ userId: req.user.id });
        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }
        res.json(provider);
    } catch (error) {
        console.error('Get my provider error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/my-doctors', authenticateToken, requireProvider, async (req, res) => {
    try {
        const provider = await HealthcareProvider.findOne({ userId: req.user.id });
        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        const doctors = await Doctor.find({ providerId: provider._id });
        res.json(doctors);
    } catch (error) {
        console.error('Get my doctors error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/doctors', authenticateToken, requireProvider, upload.single('photo'), async (req, res) => {
    try {
        const { name, specialty, qualification, experience, consultationFee, about, slotsPerDay, degrees } = req.body;
        
        console.log('Adding doctor with data:', { name, specialty, qualification, experience, consultationFee });
        
        const provider = await HealthcareProvider.findOne({ userId: req.user.id });
        
        if (!provider) {
            console.log('Provider not found for user:', req.user.id);
            return res.status(404).json({ error: 'Healthcare provider not found' });
        }

        if (!name || !specialty || !qualification || !experience || !consultationFee) {
            return res.status(400).json({ error: 'Missing required fields: name, specialty, qualification, experience, consultationFee' });
        }

        let photoPath = '';
        if (req.file) {
            photoPath = '/uploads/' + req.file.filename;
        }

        let parsedDegrees = [];
        if (degrees) {
            try {
                parsedDegrees = JSON.parse(degrees);
            } catch (e) {
                console.error('Error parsing degrees:', e);
                parsedDegrees = [];
            }
        }

        let visitingHours = [];
        const { visitingHours: vhours } = req.body;
        if (vhours) {
            try {
                visitingHours = JSON.parse(vhours);
            } catch (e) {
                console.error('Error parsing visiting hours:', e);
                visitingHours = [];
            }
        }

        const newDoctor = new Doctor({
            providerId: provider._id,
            name,
            photo: photoPath,
            specialty,
            qualification,
            degrees: parsedDegrees,
            experience,
            consultationFee: parseInt(consultationFee),
            about: about || '',
            slotsPerDay: parseInt(slotsPerDay) || 10,
            visitingHours: visitingHours,
            availableSlots: []
        });

        await newDoctor.save();

        console.log('Doctor added successfully:', newDoctor._id);
        res.status(201).json({
            message: 'Doctor added successfully',
            doctor: newDoctor
        });
    } catch (error) {
        console.error('Add doctor error:', error);
        res.status(500).json({ error: error.message || 'Internal server error', details: error.toString() });
    }
});

app.put('/api/doctors/:id', authenticateToken, requireProvider, upload.single('photo'), async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('providerId');
        
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (doctor.providerId.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { name, specialty, qualification, experience, consultationFee, about, slotsPerDay, degrees, visitingHours: vhours } = req.body;

        if (req.file) {
            doctor.photo = '/uploads/' + req.file.filename;
        }

        doctor.name = name || doctor.name;
        doctor.specialty = specialty || doctor.specialty;
        doctor.qualification = qualification || doctor.qualification;
        doctor.experience = experience || doctor.experience;
        doctor.consultationFee = consultationFee ? parseInt(consultationFee) : doctor.consultationFee;
        doctor.about = about !== undefined ? about : doctor.about;
        doctor.slotsPerDay = slotsPerDay ? parseInt(slotsPerDay) : doctor.slotsPerDay;

        if (degrees) {
            try {
                doctor.degrees = JSON.parse(degrees);
            } catch (e) {
                console.error('Error parsing degrees');
            }
        }

        if (vhours) {
            try {
                doctor.visitingHours = JSON.parse(vhours);
            } catch (e) {
                console.error('Error parsing visiting hours');
            }
        }

        await doctor.save();

        res.json({
            message: 'Doctor updated successfully',
            doctor
        });
    } catch (error) {
        console.error('Update doctor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/doctors/:id', authenticateToken, requireProvider, async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('providerId');
        
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (doctor.providerId.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Doctor.findByIdAndDelete(req.params.id);

        res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        console.error('Delete doctor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/doctors/:id/slots', authenticateToken, requireProvider, async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('providerId');
        
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (doctor.providerId.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { availableSlots } = req.body;
        
        doctor.availableSlots = availableSlots;
        await doctor.save();

        res.json({
            message: 'Time slots updated successfully',
            doctor
        });
    } catch (error) {
        console.error('Update slots error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
    const maxRetries = 5;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            const { doctorId, date, time, notes } = req.body;

            const doctor = await Doctor.findById(doctorId).populate('providerId');
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor not found' });
            }

            const patient = await User.findById(req.user.id);
            if (!patient) {
                return res.status(404).json({ error: 'Patient not found' });
            }

            const maxQueueResult = await Appointment.aggregate([
                {
                    $match: {
                        providerId: doctor.providerId._id,
                        date: date
                    }
                },
                {
                    $group: {
                        _id: null,
                        maxQueue: { $max: '$queueNumber' }
                    }
                }
            ]);

            const queueNumber = maxQueueResult.length > 0 && maxQueueResult[0].maxQueue
                ? maxQueueResult[0].maxQueue + 1
                : 1;

            const appointment = new Appointment({
                doctorId: doctor._id,
                doctorName: doctor.name,
                providerId: doctor.providerId._id,
                providerName: doctor.providerId.name,
                patientId: patient._id,
                patientName: patient.name,
                patientPhone: patient.phone,
                date,
                time,
                queueNumber,
                consultationFee: doctor.consultationFee,
                notes: notes || ''
            });

            await appointment.save();

            res.status(201).json({
                message: 'Appointment booked successfully',
                appointment: {
                    id: appointment._id,
                    queueNumber: appointment.queueNumber,
                    doctorName: appointment.doctorName,
                    providerName: appointment.providerName,
                    date: appointment.date,
                    time: appointment.time,
                    consultationFee: appointment.consultationFee,
                    paymentStatus: appointment.paymentStatus
                }
            });
            return;
        } catch (error) {
            if (error.code === 11000 && retries < maxRetries - 1) {
                retries++;
                continue;
            }
            console.error('Book appointment error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
    }
    
    res.status(500).json({ error: 'Failed to book appointment after multiple attempts' });
});

app.get('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('doctorId')
            .populate('providerId')
            .populate('patientId');
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        res.json({
            _id: appointment._id,
            doctorName: appointment.doctorName,
            providerName: appointment.providerName,
            patientName: appointment.patientName,
            patientId: appointment.patientId,
            date: appointment.date,
            time: appointment.time,
            queueNumber: appointment.queueNumber,
            consultationFee: appointment.consultationFee,
            paymentStatus: appointment.paymentStatus,
            status: appointment.status
        });
    } catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/doctor-appointments/:doctorId', async (req, res) => {
    try {
        const { date } = req.query;
        const doctorId = req.params.doctorId;
        
        let query = { doctorId: doctorId };
        if (date) {
            query.date = date;
        }
        
        const appointments = await Appointment.find(query);
        res.json(appointments);
    } catch (error) {
        console.error('Get doctor appointments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/my-appointments', authenticateToken, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.id })
            .populate('doctorId')
            .populate('providerId')
            .sort({ createdAt: -1 });

        res.json(appointments);
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/provider-appointments', authenticateToken, requireProvider, async (req, res) => {
    try {
        const provider = await HealthcareProvider.findOne({ userId: req.user.id });
        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        const { status, date } = req.query;
        let query = { providerId: provider._id };

        if (status) {
            query.status = status;
        }

        if (date) {
            query.date = date;
        }

        const appointments = await Appointment.find(query)
            .populate('doctorId')
            .populate('patientId')
            .sort({ queueNumber: 1 });

        res.json(appointments);
    } catch (error) {
        console.error('Get provider appointments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/appointments/:id/payment', authenticateToken, requireProvider, async (req, res) => {
    try {
        const { amountPaid } = req.body;
        
        const appointment = await Appointment.findById(req.params.id).populate('providerId');
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (appointment.providerId.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        appointment.amountPaid = parseFloat(amountPaid);
        
        if (appointment.amountPaid >= appointment.consultationFee) {
            appointment.paymentStatus = 'paid';
        } else if (appointment.amountPaid > 0) {
            appointment.paymentStatus = 'partial';
        } else {
            appointment.paymentStatus = 'unpaid';
        }

        await appointment.save();

        res.json({
            message: 'Payment updated successfully',
            appointment
        });
    } catch (error) {
        console.error('Update payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/appointments/:id/status', authenticateToken, requireProvider, async (req, res) => {
    try {
        const { status } = req.body;
        
        const appointment = await Appointment.findById(req.params.id).populate('providerId');
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (appointment.providerId.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        appointment.status = status;
        await appointment.save();

        res.json({
            message: 'Appointment status updated successfully',
            appointment
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/hospitals', async (req, res) => {
    try {
        const hospitals = await HealthcareProvider.find({ type: 'hospital' });
        
        const hospitalsList = await Promise.all(hospitals.map(async (hospital) => {
            const doctorCount = await Doctor.countDocuments({ providerId: hospital._id });
            
            return {
                id: hospital._id,
                name: hospital.name,
                specialty: 'Multi-specialty',
                rating: hospital.rating,
                address: hospital.address,
                distance: 'Nearby',
                facilities: hospital.facilities,
                doctors: doctorCount
            };
        }));

        res.json(hospitalsList);
    } catch (error) {
        console.error('Get hospitals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/pharmacies', async (req, res) => {
    try {
        const pharmacies = await HealthcareProvider.find({ type: 'pharmacy' });
        
        const pharmaciesList = pharmacies.map(pharmacy => ({
            id: pharmacy._id,
            name: pharmacy.name,
            address: pharmacy.address,
            distance: 'Nearby',
            rating: pharmacy.rating,
            type: 'pharmacy',
            facilities: pharmacy.facilities
        }));

        res.json(pharmaciesList);
    } catch (error) {
        console.error('Get pharmacies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/tests', async (req, res) => {
    try {
        const mockTests = [
            {
                id: 'test1',
                name: 'Complete Blood Count',
                description: 'Measures different components of blood including red cells, white cells, and platelets',
                price: 499,
                homeCollection: true,
                fasting: false,
                reportTime: '24 hours'
            },
            {
                id: 'test2',
                name: 'Blood Sugar Test',
                description: 'Measures glucose levels in blood to screen for diabetes',
                price: 299,
                homeCollection: true,
                fasting: true,
                reportTime: '6 hours'
            },
            {
                id: 'test3',
                name: 'Thyroid Profile',
                description: 'Comprehensive thyroid function test',
                price: 699,
                homeCollection: true,
                fasting: false,
                reportTime: '24 hours'
            }
        ];
        res.json(mockTests);
    } catch (error) {
        console.error('Get tests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/patient-appointments', authenticateToken, requirePatient, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.id })
            .populate('doctorId')
            .populate('providerId')
            .sort({ date: -1, time: -1 });
        
        const formatted = appointments.map(apt => ({
            _id: apt._id,
            doctorName: apt.doctorName,
            providerName: apt.providerName,
            date: apt.date,
            time: apt.time,
            queueNumber: apt.queueNumber,
            status: apt.status,
            consultationFee: apt.consultationFee,
            paymentStatus: apt.paymentStatus,
            notes: apt.notes,
            createdAt: apt.createdAt,
            isUpcoming: new Date(`${apt.date}T${apt.time}`) > new Date()
        }));
        
        res.json(formatted);
    } catch (error) {
        console.error('Get patient appointments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/appointments/:id/reschedule', authenticateToken, requirePatient, async (req, res) => {
    try {
        const { newDate, newTime } = req.body;
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        if (appointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
            return res.status(400).json({ error: `Cannot reschedule a ${appointment.status} appointment` });
        }
        
        const existing = await Appointment.findOne({
            providerId: appointment.providerId,
            doctorId: appointment.doctorId,
            date: newDate,
            time: newTime,
            _id: { $ne: appointment._id }
        });
        
        if (existing) {
            return res.status(400).json({ error: 'This time slot is already booked' });
        }
        
        appointment.date = newDate;
        appointment.time = newTime;
        appointment.status = 'pending';
        await appointment.save();
        
        res.json({
            message: 'Appointment rescheduled successfully',
            appointment: {
                _id: appointment._id,
                date: appointment.date,
                time: appointment.time,
                status: appointment.status
            }
        });
    } catch (error) {
        console.error('Reschedule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/appointments/:id/cancel', authenticateToken, requirePatient, async (req, res) => {
    try {
        const { reason } = req.body;
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        if (appointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        if (appointment.status === 'completed') {
            return res.status(400).json({ error: 'Cannot cancel a completed appointment' });
        }
        
        appointment.status = 'cancelled';
        appointment.notes = `Cancelled - ${reason || 'No reason provided'}`;
        await appointment.save();
        
        res.json({
            message: 'Appointment cancelled successfully',
            appointment: {
                _id: appointment._id,
                status: appointment.status
            }
        });
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/appointments/:id/complete', authenticateToken, async (req, res) => {
    try {
        const { prescription, notes } = req.body;
        const appointment = await Appointment.findById(req.params.id).populate('providerId');
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        if (appointment.providerId.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        appointment.status = 'completed';
        appointment.notes = notes || appointment.notes;
        if (prescription) {
            appointment.notes += `\n\nPrescription: ${prescription}`;
        }
        await appointment.save();
        
        res.json({
            message: 'Appointment marked as completed',
            appointment: {
                _id: appointment._id,
                status: appointment.status
            }
        });
    } catch (error) {
        console.error('Complete appointment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/appointments/:id/notes', authenticateToken, async (req, res) => {
    try {
        const { notes } = req.body;
        const appointment = await Appointment.findById(req.params.id).populate('providerId');
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        const isProvider = appointment.providerId.userId.toString() === req.user.id;
        const isPatient = appointment.patientId.toString() === req.user.id;
        
        if (!isProvider && !isPatient) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const prefix = isProvider ? '[Doctor Notes]' : '[Patient Notes]';
        const timestamp = new Date().toLocaleString();
        appointment.notes += `\n\n${prefix} (${timestamp}):\n${notes}`;
        await appointment.save();
        
        res.json({
            message: 'Notes added successfully',
            appointment: {
                _id: appointment._id,
                notes: appointment.notes
            }
        });
    } catch (error) {
        console.error('Add notes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/appointment-stats', authenticateToken, async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'patient') {
            query = { patientId: req.user.id };
        } else if (['pharmacy', 'clinic', 'hospital'].includes(req.user.role)) {
            const provider = await HealthcareProvider.findOne({ userId: req.user.id });
            query = { providerId: provider._id };
        }
        
        const total = await Appointment.countDocuments(query);
        const upcoming = await Appointment.countDocuments({
            ...query,
            status: { $in: ['pending', 'confirmed'] }
        });
        const completed = await Appointment.countDocuments({
            ...query,
            status: 'completed'
        });
        const cancelled = await Appointment.countDocuments({
            ...query,
            status: 'cancelled'
        });
        
        res.json({
            total,
            upcoming,
            completed,
            cancelled
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/demo-credentials', (req, res) => {
    res.json({
        patient: {
            email: 'john@example.com',
            password: 'password123'
        },
        providers: {
            pharmacy: {
                email: 'pharmacy@demo.com',
                password: 'password123'
            },
            clinic: {
                email: 'clinic@demo.com',
                password: 'password123'
            },
            hospital: {
                email: 'hospital@demo.com',
                password: 'password123'
            }
        }
    });
});