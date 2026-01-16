# Team Registration Implementation Guide

## Overview
The registration system has been completely revamped to support team-based registrations for the hackathon event with MIT/Non-MIT categorization and comprehensive security validation.

## Key Features Implemented

### 1. **Dual Registration Categories**
- **MIT Registration (Free)**: Directly stored in Firestore upon submission
- **Non-MIT Registration (Paid)**: Redirects to payment portal, stored in Firestore after payment confirmation

### 2. **Form Structure - Team Registration**

#### Leader Details Section
- Full Name (2-100 chars, letters/spaces/hyphens/apostrophes only)
- Email Address (RFC 5322 format)
  - MIT Students: Must use `mitblr202X@learner.manipal.edu` (where X = 2,3,4,5)
  - Non-MIT Students: Any valid email format
- Academic Year (1st-5th year dropdown)
- College Name (2-150 chars)
- Phone Number (7-15 numeric digits, max 10 chars after sanitization)
- Gender (Male/Female/Other dropdown)

#### Team Details Section
- Team Name (2-100 chars)
- Team Size (2-4 members dropdown)

#### Dynamic Member Details (1-4 members based on team size)
Each member requires:
- Full Name
- Email Address (with same MIT validation as leader if MIT registration)
- Phone Number
- Gender
- Academic Year

#### Security Features
- Honeypot field (hidden) to prevent bot submissions
- XSS prevention (HTML tags, script tags, event handlers removed)
- SQL injection prevention (MongoDB operators removed)
- CSRF protection capability

### 3. **Validation System**

#### Input Validator (`src/js/input-validator.js`)
New validation method added: `validateTeamRegistrationForm(formData)`

```javascript
// Usage:
const validation = validator.validateTeamRegistrationForm({
    collegeType: 'mit',
    leaderName: 'John Doe',
    leaderEmail: 'john.mitblr2023@learner.manipal.edu',
    // ... other fields
});

if (validation.valid) {
    const sanitizedData = validation.sanitizedData;
    // Proceed with Firestore storage or payment
}
```

#### Validation Rules
1. **Names**: Letters, spaces, hyphens, apostrophes only (2-100 chars)
2. **Emails**: RFC 5322 format (254 chars max)
   - **MIT**: Must match `name.mitblr202[2-5]@learner.manipal.edu`
   - **Non-MIT**: Any valid email
3. **Phone**: 7-15 numeric digits (all punctuation stripped)
4. **College**: 2-150 alphanumeric characters
5. **Academic Year**: Dropdown only (1st-5th)
6. **Gender**: Dropdown only (Male/Female/Other)
7. **Team Size**: 2-4 members only
8. **Honeypot**: Must be empty (bot protection)

### 4. **Firestore Integration**

#### Collections
- `hackathon_registrations` - Team registration data
- `registrations` - Individual registrations
- `symposium_registrations` - Symposium registrations

#### Document Structure (Team Registration)
```javascript
{
    collegeType: 'mit' | 'non-mit',
    leaderName: string,
    leaderEmail: string,
    leaderPhone: string,
    leaderCollege: string,
    leaderAcademicYear: '1st' | '2nd' | '3rd' | '4th' | '5th',
    leaderGender: 'Male' | 'Female' | 'Other',
    teamName: string,
    teamSize: 2 | 3 | 4,
    members: [
        {
            name: string,
            email: string,
            phone: string,
            gender: string,
            academicYear: string
        }
    ],
    paymentStatus: 'confirmed' | 'pending',
    timestamp: ISO string
}
```

### 5. **Form Flow**

#### MIT Registration Flow
1. User selects "MIT (Free)" option
2. Fills in all required fields
3. Client-side validation occurs
4. Directly stored in Firestore (`hackathon_registrations`)
5. Success animation and modal displayed
6. User redirected to home page

#### Non-MIT Registration Flow
1. User selects "Non-MIT (Paid)" option
2. Fills in all required fields
3. Client-side validation occurs
4. Data stored in sessionStorage
5. User redirected to payment portal
6. After payment confirmation:
   - Data stored in Firestore with `paymentStatus: 'confirmed'`
   - Success message displayed
   - User redirected to home page

### 6. **Dynamic Team Member Fields**

The form automatically shows/hides member fields based on team size selection:

```javascript
// Triggered by: onchange="updateTeamMembers()"
// When team size = 2: Shows Member 1 and 2 only
// When team size = 3: Shows Members 1, 2, and 3
// When team size = 4: Shows all 4 member fields
```

### 7. **Security Implementation**

#### Input Sanitization
All user inputs are sanitized against:
- HTML/Script tags: `<script>`, `<img>`, event handlers removed
- NoSQL Operators: `$where`, `$regex`, `$ne`, etc. removed
- JavaScript Protocols: `javascript:`, `vbscript:`, `data:text/html` removed
- Length limits enforced per field type

#### XSS Prevention
- No eval() or innerHTML usage with user data
- All data escaped before storage
- Content Security Policy headers recommended

#### Protection Features
- Honeypot field prevents automated bots
- Rate limiting available via `validator.checkRateLimit()`
- CSRF token validation available

### 8. **File Structure**

#### Modified Files
- `hackathon.html` - Main hackathon registration form
- `src/js/input-validator.js` - Added `validateTeamRegistrationForm()` method
- `payment.html` - Updated to display team registration details

#### Key JavaScript Functions
- `updateTeamMembers()` - Shows/hides member form sections
- `showMessage(text, type)` - Displays success/error messages
- `handleSubmit()` - Processes form submission (MIT/Non-MIT logic)

### 9. **Error Handling**

All validation errors are collected and displayed to the user:
- Form-level validation errors shown in message box
- Firebase errors caught and logged
- User-friendly error messages displayed
- Form reset available via Cancel button

### 10. **Firestore Rules**

Ensure these rules are set in `firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /hackathon_registrations/{document=**} {
      allow create: true;
      allow read, list: true;
      allow update, delete: false;
    }
  }
}
```

## Integration Checklist

✅ Input validator updated with MIT email validation
✅ Team registration form created with dynamic member fields
✅ Firestore integration for both MIT and Non-MIT flows
✅ Payment portal integration for paid registrations
✅ Success modal/animation implemented
✅ XSS/SQL injection prevention
✅ Comprehensive field validation
✅ Honeypot bot protection

## Testing Instructions

### Test MIT Registration
1. Navigate to hackathon.html
2. Click "Register Now"
3. Select "MIT (Free)"
4. Fill in leader details (use valid MIT email: `name.mitblr202X@learner.manipal.edu`)
5. Fill in team details
6. Click Register
7. Should see success message and animation
8. Check Firestore for entry in `hackathon_registrations`

### Test Non-MIT Registration
1. Navigate to hackathon.html
2. Click "Register Now"
3. Select "Non-MIT (Paid)"
4. Fill in all details (any valid email)
5. Click Register
6. Should redirect to payment.html
7. Review details and click "Confirm Payment"
8. Should store in Firestore with `paymentStatus: 'confirmed'`

### Test Validation
1. Try to submit with incomplete fields - should show error
2. Try invalid MIT email for MIT registration - should reject
3. Try HTML/script in name field - should be sanitized
4. Try team size mismatch - should require correct members

## Database Queries

### Get all MIT hackathon registrations
```
db.collection('hackathon_registrations').where('collegeType', '==', 'mit').get()
```

### Get all Non-MIT hackathon registrations (paid)
```
db.collection('hackathon_registrations').where('collegeType', '==', 'non-mit').get()
```

### Get unpaid registrations
```
db.collection('hackathon_registrations').where('paymentStatus', '==', 'pending').get()
```

## Future Enhancements

1. Email verification for team members
2. Payment gateway integration (Razorpay/Stripe)
3. Team leader notification system
4. Duplicate registration prevention
5. CSV export for admin dashboard
6. SMS notifications for confirmation
7. QR code generation for event check-in

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Firestore configuration is correct
3. Check that input-validator.js is properly loaded
4. Ensure Firebase credentials are valid
