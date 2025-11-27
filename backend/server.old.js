const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = 'healthconnect-secret-key-2023';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory database (for demo - enhanced with healthcare providers)
let users = [];
let doctors = [];
let healthcareProviders = [];
let appointments = [];
let tests = [];

// Initialize sample data
function initializeSampleData() {
    // Sample users
    const hashedPassword = bcrypt.hashSync('password123', 10);
    users = [
        {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
            password: hashedPassword,
            phone: '+1234567890',
            role: 'patient',
            createdAt: new Date()
        },
        {
            id: 'doc1',
            name: 'Dr. Sarah Wilson',
            email: 'sarah@hospital.com',
            password: hashedPassword,
            phone: '+1234567891',
            role: 'doctor',
            createdAt: new Date()
        },
        {
            id: 'provider1',
            name: 'Apollo Pharmacy',
            email: 'pharmacy@demo.com',
            password: hashedPassword,
            phone: '+1234567892',
            role: 'pharmacy',
            providerInfo: {
                facilityName: 'Apollo Pharmacy',
                facilityType: 'pharmacy',
                registrationNumber: 'PHARM12345',
                address: '123 Medical Street, City Center'
            },
            createdAt: new Date()
        },
        {
            id: 'provider2',
            name: 'City Health Clinic',
            email: 'clinic@demo.com',
            password: hashedPassword,
            phone: '+1234567893',
            role: 'clinic',
            providerInfo: {
                facilityName: 'City Health Clinic',
                facilityType: 'clinic',
                registrationNumber: 'CLINIC67890',
                address: '456 Health Avenue, Downtown'
            },
            createdAt: new Date()
        },
        {
            id: 'provider3',
            name: 'Metro Hospital',
            email: 'hospital@demo.com',
            password: hashedPassword,
            phone: '+1234567894',
            role: 'hospital',
            providerInfo: {
                facilityName: 'Metro Hospital',
                facilityType: 'hospital',
                registrationNumber: 'HOSPITAL123',
                address: '789 Care Boulevard, Medical District'
            },
            createdAt: new Date()
        }
    ];

    // Sample healthcare providers
    healthcareProviders = [
        {
            id: 'provider1',
            userId: 'provider1',
            name: 'Apollo Pharmacy & Clinic',
            type: 'pharmacy',
            address: '123 Medical Street, City Center',
            phone: '+1234567892',
            email: 'pharmacy@demo.com',
            registrationNumber: 'PHARM12345',
            doctors: [
                {
                    id: 'pharm_doc1',
                    name: 'Dr. Robert Chen',
                    specialty: 'General Medicine',
                    qualification: 'MBBS, MD',
                    experience: '8 years',
                    consultationFee: 500,
                    availableSlots: ['09:00', '11:00', '15:00', '17:00']
                },
                {
                    id: 'pharm_doc2',
                    name: 'Dr. Lisa Wang',
                    specialty: 'Pharmacology',
                    qualification: 'B.Pharm, M.Pharm',
                    experience: '6 years',
                    consultationFee: 400,
                    availableSlots: ['10:00', '14:00', '16:00']
                }
            ],
            facilities: ['Pharmacy', 'Basic Consultation', 'Lab Tests', 'Medicine Delivery'],
            rating: 4.6,
            totalReviews: 89
        },
        {
            id: 'provider2',
            userId: 'provider2',
            name: 'City Health Clinic',
            type: 'clinic',
            address: '456 Health Avenue, Downtown',
            phone: '+1234567893',
            email: 'clinic@demo.com',
            registrationNumber: 'CLINIC67890',
            doctors: [
                {
                    id: 'clinic_doc1',
                    name: 'Dr. Priya Sharma',
                    specialty: 'Dermatology',
                    qualification: 'MBBS, MD - Dermatology',
                    experience: '6 years',
                    consultationFee: 600,
                    availableSlots: ['10:00', '12:00', '14:00', '16:00']
                },
                {
                    id: 'clinic_doc2',
                    name: 'Dr. Michael Brown',
                    specialty: 'Pediatrics',
                    qualification: 'MBBS, DCH',
                    experience: '5 years',
                    consultationFee: 550,
                    availableSlots: ['09:30', '11:30', '15:30']
                }
            ],
            facilities: ['Consultation', 'Minor Procedures', 'Vaccination', 'Lab Tests'],
            rating: 4.7,
            totalReviews: 124
        },
        {
            id: 'provider3',
            userId: 'provider3',
            name: 'Metro Hospital',
            type: 'hospital',
            address: '789 Care Boulevard, Medical District',
            phone: '+1234567894',
            email: 'hospital@demo.com',
            registrationNumber: 'HOSPITAL123',
            doctors: [
                {
                    id: 'hosp_doc1',
                    name: 'Dr. James Wilson',
                    specialty: 'Cardiology',
                    qualification: 'MBBS, MD - Cardiology',
                    experience: '12 years',
                    consultationFee: 800,
                    availableSlots: ['08:00', '10:00', '14:00', '16:00']
                },
                {
                    id: 'hosp_doc2',
                    name: 'Dr. Maria Garcia',
                    specialty: 'Neurology',
                    qualification: 'MBBS, MD - Neurology',
                    experience: '9 years',
                    consultationFee: 750,
                    availableSlots: ['09:00', '11:00', '15:00']
                }
            ],
            facilities: ['Emergency', 'ICU', 'Pharmacy', 'Lab', 'Surgery', 'Radiology', 'ICU'],
            rating: 4.8,
            totalReviews: 256
        }
    ];

    // Sample doctors (now includes provider doctors)
    doctors = [
        {
            id: 'doc1',
            name: 'Dr. Sarah Wilson',
            specialty: 'Cardiology',
            hospital: 'Apollo Hospital',
            rating: 4.9,
            reviews: 124,
            distance: '2.3 km away',
            availability: 'Available Today',
            fee: 800,
            availableSlots: ['09:00', '11:00', '14:00', '16:00'],
            qualifications: ['MBBS, MD - Cardiology'],
            experience: '10+ years',
            about: 'Senior Cardiologist with extensive experience in heart care.'
        },
        {
            id: 'doc2',
            name: 'Dr. Raj Sharma',
            specialty: 'Dermatology',
            hospital: 'City Hospital',
            rating: 4.7,
            reviews: 89,
            distance: '1.8 km away',
            availability: 'Available Tomorrow',
            fee: 600,
            availableSlots: ['10:00', '13:00', '15:00', '17:00'],
            qualifications: ['MBBS, MD - Dermatology'],
            experience: '8+ years',
            about: 'Expert in skin treatments and cosmetic dermatology.'
        },
        {
            id: 'doc3',
            name: 'Dr. Priya Mehta',
            specialty: 'Pediatrics',
            hospital: 'Children Medical Center',
            rating: 4.8,
            reviews: 156,
            distance: '3.2 km away',
            availability: 'Available Today',
            fee: 700,
            availableSlots: ['09:30', '11:30', '14:30', '16:30'],
            qualifications: ['MBBS, DCH, MD - Pediatrics'],
            experience: '12+ years',
            about: 'Specialized in child healthcare and development.'
        }
    ];

    // Add provider doctors to the main doctors list
    healthcareProviders.forEach(provider => {
        provider.doctors.forEach(doctor => {
            doctors.push({
                ...doctor,
                hospital: provider.name,
                rating: provider.rating,
                reviews: provider.totalReviews,
                distance: 'Nearby',
                availability: 'Available Today',
                providerId: provider.id,
                providerType: provider.type,
                qualifications: [doctor.qualification],
                experience: doctor.experience,
                about: `${doctor.specialty} specialist at ${provider.name}`
            });
        });
    });

    // Sample tests
    tests = [
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

    // Sample appointments
    appointments = [
        {
            id: 'appt1',
            doctorId: 'doc1',
            doctorName: 'Dr. Sarah Wilson',
            patientId: 'user1',
            patientName: 'John Doe',
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            status: 'confirmed',
            notes: 'Regular checkup',
            createdAt: new Date()
        }
    ];
}

// Authentication middleware
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

// Helper function for default facilities
function getDefaultFacilities(providerType) {
    const facilities = {
        pharmacy: ['Pharmacy', 'Basic Consultation', 'Medicine Delivery'],
        clinic: ['Consultation', 'Minor Procedures', 'Vaccination', 'Lab Tests'],
        hospital: ['Emergency', 'ICU', 'Pharmacy', 'Lab', 'Surgery', 'Radiology']
    };
    return facilities[providerType] || ['Healthcare Services'];
}

// Routes

// Serve frontend files
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'HealthConnect API is running',
        timestamp: new Date().toISOString(),
        endpoints: [
            '/api/auth/register',
            '/api/auth/login',
            '/api/doctors',
            '/api/hospitals',
            '/api/healthcare-providers',
            '/api/appointments'
        ]
    });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, role = 'patient', providerInfo } = req.body;

        console.log('Registration attempt:', { name, email, role, providerInfo });

        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            phone,
            role,
            providerInfo: providerInfo || null,
            createdAt: new Date()
        };

        users.push(user);

        // If it's a provider, create healthcare provider record
        if (['pharmacy', 'clinic', 'hospital'].includes(role)) {
            const provider = {
                id: user.id,
                userId: user.id,
                name: providerInfo.facilityName,
                type: role,
                address: providerInfo.address,
                phone: phone,
                email: email,
                registrationNumber: providerInfo.registrationNumber,
                doctors: [],
                facilities: getDefaultFacilities(role),
                rating: 4.5,
                totalReviews: 0
            };
            healthcareProviders.push(provider);
            console.log('Healthcare provider registered:', provider.name);
        }

        console.log('User registered successfully:', user.email);

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                providerInfo: user.providerInfo
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', email);

        // Find user
        const user = users.find(user => user.email === email);
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('Invalid password for:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful:', user.email);

        res.json({
            token,
            user: {
                id: user.id,
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

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            providerInfo: user.providerInfo
        }
    });
});

// Doctors Routes
app.get('/api/doctors', (req, res) => {
    const { specialty, hospital, search } = req.query;
    
    let filteredDoctors = doctors;

    if (specialty) {
        filteredDoctors = filteredDoctors.filter(doctor =>
            doctor.specialty.toLowerCase().includes(specialty.toLowerCase())
        );
    }

    if (hospital) {
        filteredDoctors = filteredDoctors.filter(doctor =>
            doctor.hospital.toLowerCase().includes(hospital.toLowerCase())
        );
    }

    if (search) {
        filteredDoctors = filteredDoctors.filter(doctor =>
            doctor.name.toLowerCase().includes(search.toLowerCase()) ||
            doctor.specialty.toLowerCase().includes(search.toLowerCase()) ||
            doctor.hospital.toLowerCase().includes(search.toLowerCase())
        );
    }

    console.log('Returning doctors:', filteredDoctors.length);
    res.json(filteredDoctors);
});

app.get('/api/doctors/:id', (req, res) => {
    const doctor = doctors.find(d => d.id === req.params.id);
    if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
});

// Healthcare Providers Routes
app.get('/api/healthcare-providers', (req, res) => {
    const { type, search } = req.query;
    
    let filteredProviders = healthcareProviders;

    if (type) {
        filteredProviders = filteredProviders.filter(provider =>
            provider.type.toLowerCase() === type.toLowerCase()
        );
    }

    if (search) {
        filteredProviders = filteredProviders.filter(provider =>
            provider.name.toLowerCase().includes(search.toLowerCase()) ||
            provider.doctors.some(doctor => 
                doctor.name.toLowerCase().includes(search.toLowerCase()) ||
                doctor.specialty.toLowerCase().includes(search.toLowerCase())
            )
        );
    }

    console.log('Returning healthcare providers:', filteredProviders.length);
    res.json(filteredProviders);
});

app.get('/api/healthcare-providers/:id', (req, res) => {
    const provider = healthcareProviders.find(p => p.id === req.params.id);
    if (!provider) {
        return res.status(404).json({ error: 'Healthcare provider not found' });
    }
    res.json(provider);
});

// Add doctor to healthcare provider
app.post('/api/healthcare-providers/:id/doctors', authenticateToken, (req, res) => {
    try {
        const { name, specialty, qualification, experience, consultationFee, availableSlots } = req.body;
        const providerId = req.params.id;
        
        const provider = healthcareProviders.find(p => p.id === providerId);
        
        if (!provider) {
            return res.status(404).json({ error: 'Healthcare provider not found' });
        }

        // Check if user owns this provider
        if (provider.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const newDoctor = {
            id: `doc_${Date.now()}`,
            name,
            specialty,
            qualification,
            experience,
            consultationFee,
            availableSlots: availableSlots || []
        };

        provider.doctors.push(newDoctor);

        // Also add to main doctors list
        const mainDoctor = {
            ...newDoctor,
            hospital: provider.name,
            rating: provider.rating,
            reviews: provider.totalReviews,
            distance: 'Nearby',
            availability: 'Available Today',
            providerId: provider.id,
            providerType: provider.type,
            qualifications: [qualification],
            about: `${specialty} specialist at ${provider.name}`
        };
        doctors.push(mainDoctor);

        console.log('Doctor added to provider:', provider.name, newDoctor.name);

        res.status(201).json({
            message: 'Doctor added successfully',
            doctor: newDoctor
        });
    } catch (error) {
        console.error('Add doctor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Hospitals Routes
app.get('/api/hospitals', (req, res) => {
    const hospitalsList = [
        {
            id: 'hosp1',
            name: 'Apollo Hospital',
            specialty: 'Multi-specialty',
            rating: 4.8,
            address: '123 Medical Avenue, City Center',
            distance: '2.3 km away',
            facilities: ['Emergency', 'ICU', 'Pharmacy', 'Lab'],
            doctors: doctors.filter(d => d.hospital === 'Apollo Hospital').length
        },
        {
            id: 'hosp2',
            name: 'City Hospital',
            specialty: 'General Medicine',
            rating: 4.5,
            address: '456 Health Street, Downtown',
            distance: '1.8 km away',
            facilities: ['Emergency', 'Pharmacy', 'Lab'],
            doctors: doctors.filter(d => d.hospital === 'City Hospital').length
        },
        {
            id: 'hosp3',
            name: 'Metro Hospital',
            specialty: 'Super Specialty',
            rating: 4.9,
            address: '789 Care Boulevard, Medical District',
            distance: '3.5 km away',
            facilities: ['Emergency', 'ICU', 'Pharmacy', 'Lab', 'Surgery', 'Radiology'],
            doctors: doctors.filter(d => d.hospital === 'Metro Hospital').length
        }
    ];
    res.json(hospitalsList);
});

// Pharmacies Routes
app.get('/api/pharmacies', (req, res) => {
    const pharmaciesList = [
        {
            id: 'pharm1',
            name: 'MedPlus Pharmacy',
            rating: 4.6,
            address: '123 Health Street, Medical City',
            distance: '1.2 km away',
            delivery: '30 min delivery',
            open24x7: true
        },
        {
            id: 'pharm2',
            name: 'Apollo Pharmacy',
            rating: 4.7,
            address: '456 Care Avenue, Downtown',
            distance: '2.1 km away',
            delivery: '45 min delivery',
            open24x7: false
        },
        {
            id: 'pharm3',
            name: 'Wellness Pharmacy',
            rating: 4.5,
            address: '789 Medical Road, Health District',
            distance: '0.8 km away',
            delivery: '25 min delivery',
            open24x7: true
        }
    ];
    res.json(pharmaciesList);
});

// Tests Routes
app.get('/api/tests', (req, res) => {
    res.json(tests);
});

// Appointments Routes
app.get('/api/appointments', authenticateToken, (req, res) => {
    const userAppointments = appointments.filter(apt => apt.patientId === req.user.id);
    res.json(userAppointments);
});

app.post('/api/appointments', authenticateToken, (req, res) => {
    try {
        const { doctorId, doctorName, providerId, providerName, providerType, date, time, notes } = req.body;

        console.log('Booking appointment:', { doctorId, doctorName, providerId, providerName, date, time });

        const doctor = doctors.find(d => d.id === doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const appointment = {
            id: uuidv4(),
            doctorId,
            doctorName,
            providerId,
            providerName,
            providerType,
            patientId: req.user.id,
            patientName: req.user.name,
            date,
            time,
            notes,
            status: 'confirmed',
            createdAt: new Date(),
            fee: doctor.fee
        };

        appointments.push(appointment);
        console.log('Appointment booked successfully:', appointment.id);

        res.json(appointment);
    } catch (error) {
        console.error('Appointment booking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test data endpoint
app.get('/api/test-data', (req, res) => {
    res.json({
        users: users.length,
        doctors: doctors.length,
        healthcareProviders: healthcareProviders.length,
        appointments: appointments.length,
        tests: tests.length
    });
});

// Demo credentials endpoint
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

// Initialize sample data
initializeSampleData();

app.listen(PORT, HOST, () => {
    console.log(`🚀 HealthConnect server running on ${HOST}:${PORT}`);
    console.log(`📍 Frontend: http://${HOST}:${PORT}`);
    console.log(`🔗 API Base: http://${HOST}:${PORT}/api`);
    console.log(`❤️  Health Check: http://${HOST}:${PORT}/api/health`);
    console.log(`📊 Test Data: http://${HOST}:${PORT}/api/test-data`);
    console.log(`🔑 Demo Credentials: http://${HOST}:${PORT}/api/demo-credentials`);
    console.log('\n📋 Available API Endpoints:');
    console.log('   POST /api/auth/register');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/doctors');
    console.log('   GET  /api/healthcare-providers');
    console.log('   POST /api/healthcare-providers/:id/doctors');
    console.log('   GET  /api/hospitals');
    console.log('   POST /api/appointments');
    console.log('\n👥 Demo Login Credentials:');
    console.log('   Patient: john@example.com / password123');
    console.log('   Pharmacy: pharmacy@demo.com / password123');
    console.log('   Clinic: clinic@demo.com / password123');
    console.log('   Hospital: hospital@demo.com / password123');
});