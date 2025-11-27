# HealthConnect Setup Guide

## System Overview

HealthConnect is now fully integrated with MongoDB and ready for use. The system includes:

### For Healthcare Providers (Pharmacy/Clinic/Hospital)
1. **Provider Registration** - Create your facility account
2. **Doctor Management** - Add doctors with complete profiles
3. **Appointment Tracking** - Monitor patient bookings with queue management
4. **Payment Tracking** - Track consultation fees and payments

### For Patients
1. **Browse Doctors** - Search by specialty, location, or name
2. **Book Appointments** - Real-time booking with queue numbers
3. **Payment Information** - Clear fee structure and payment tracking

## Getting Started

### Step 1: Register as a Provider

1. Click "For Providers" button on the homepage
2. Click "Register" tab
3. Fill in your facility details:
   - Facility Name
   - Type (Pharmacy/Clinic/Hospital)
   - Registration Number
   - Address
   - Email and Password

### Step 2: Access Provider Dashboard

After registration, you'll be automatically logged in to the provider dashboard where you can:

- **Overview Tab**: See statistics (total doctors, today's appointments, revenue)
- **Manage Doctors Tab**: Add and manage your doctors
- **Appointments Tab**: View and manage patient bookings
- **Settings Tab**: View your facility information

### Step 3: Add Doctors

1. Go to "Manage Doctors" tab
2. Click "Add Doctor" button
3. Fill in doctor details:
   - Upload photo (optional but recommended)
   - Name
   - Specialty (e.g., Cardiology, Dermatology)
   - Primary Qualification (e.g., MBBS, MD)
   - Additional Degrees (click "Add Degree" to add more)
   - Experience (e.g., "10 years")
   - Consultation Fee (in ₹)
   - Available Slots Per Day (default: 10)
   - About Doctor (brief description)

4. Click "Save Doctor"

### Step 4: Manage Appointments

When patients book appointments:

1. Go to "Appointments" tab
2. View all bookings with:
   - **Queue Number** - Automatic sequential numbering
   - Patient details (name, phone)
   - Doctor name
   - Date and time
   - Fee, amount paid, and balance
   - Status (pending/confirmed/completed/cancelled)

3. Manage appointments:
   - Click "Payment" to update amount paid
   - Click "Confirm" to confirm pending appointments
   - Click "Complete" to mark confirmed appointments as done

## Patient Booking Flow

1. Visit homepage
2. Browse doctors by:
   - Scrolling through "Top Doctors Near You"
   - Using specialty filters
   - Clicking "Find Doctors" to search
3. Click "Book Now" on any doctor card
4. Login or register as patient
5. Select date and time
6. Receive confirmation with queue number

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user/provider
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get specific doctor
- `POST /api/doctors` - Add new doctor (provider only)
- `PUT /api/doctors/:id` - Update doctor (provider only)
- `DELETE /api/doctors/:id` - Delete doctor (provider only)

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/my-appointments` - Get patient's appointments
- `GET /api/provider-appointments` - Get provider's appointments
- `PUT /api/appointments/:id/payment` - Update payment
- `PUT /api/appointments/:id/status` - Update status

### Providers
- `GET /api/healthcare-providers` - Get all providers
- `GET /api/my-provider` - Get current provider details
- `GET /api/my-doctors` - Get provider's doctors

## Database Schema

### User
- name, email, password, phone, role
- providerInfo (for providers)

### HealthcareProvider
- userId, name, type, address, phone, email
- registrationNumber, facilities, rating

### Doctor
- providerId, name, photo, specialty, qualification
- degrees[], experience, consultationFee
- availableSlots[], slotsPerDay, about

### Appointment
- doctorId, providerId, patientId
- date, time, queueNumber
- consultationFee, amountPaid, paymentStatus
- status, notes

## Features

✅ MongoDB database integration
✅ Photo upload for doctors
✅ Multiple degrees tracking
✅ Queue number management
✅ Payment tracking
✅ Appointment status workflow
✅ Device responsive design
✅ Search and filter functionality
✅ Provider and patient dashboards

## Troubleshooting

### No Doctors Showing?
- Make sure you've registered as a provider
- Add doctors via the provider dashboard
- Doctors will automatically appear on the homepage

### Can't Upload Photos?
- Supported formats: JPG, PNG
- Photos are stored in `/frontend/uploads/`
- Default placeholder shown if no photo uploaded

### Appointments Not Showing?
- Check that you're logged in as the correct provider
- Use date filters to find specific appointments
- Queue numbers are assigned automatically

## Next Steps

1. ✅ Register your facility
2. ✅ Add your doctors with photos and details
3. ✅ Test the booking flow
4. ✅ Manage appointments and payments
5. 🚀 Start accepting patient bookings!

## Support

For issues or questions, check:
- MongoDB connection is active
- All required fields are filled
- Server is running on port 5000
- Browser console for any errors
