# Quick Reference: Team Registration System

## Summary
A comprehensive team registration system for hackathons with MIT (free) and Non-MIT (paid) flows, featuring advanced input validation, security against common web attacks, and Firestore integration.

## Core Technologies
- **Vanilla JavaScript** (ES6+)
- **Firebase Firestore** for data storage
- **Input Validator** for comprehensive sanitization
- **THREE.js** for success animations

---

## Quick Setup

### 1. Firebase Configuration
Ensure Firebase is initialized in hackathon.html:
```javascript
const firebaseConfig = {
    apiKey: "...",
    projectId: "turinger26",
    // ... other config
};
```

### 2. Load Dependencies
```html
<script src="src/js/input-validator.js"></script>
<script type="module">
    // Firebase initialization
</script>
```

### 3. Initialize Form
The form automatically initializes on page load. No additional setup needed!

---

## Key Functions

### `updateTeamMembers()`
Shows/hides member form sections based on team size.
```javascript
// Called automatically when team size dropdown changes
// Also called on page load to initialize visibility
updateTeamMembers();
```

### `showMessage(text, type)`
Displays success or error messages to the user.
```javascript
showMessage('Registration successful!', 'success');
showMessage('Invalid email format', 'error');
```

### `validator.validateTeamRegistrationForm(formData)`
Validates entire team registration form.
```javascript
const result = validator.validateTeamRegistrationForm({
    collegeType: 'mit',
    leaderName: 'John Doe',
    leaderEmail: 'john.mitblr2023@learner.manipal.edu',
    leaderAcademicYear: '1st',
    leaderCollege: 'MAHE',
    leaderPhone: '9876543210',
    leaderGender: 'Male',
    teamName: 'Alpha Team',
    teamSize: 2,
    member1Name: 'Jane Smith',
    member1Email: 'jane.mitblr2023@learner.manipal.edu',
    member1Phone: '9876543211',
    member1Gender: 'Female',
    member1AcademicYear: '2nd'
});

if (result.valid) {
    console.log(result.sanitizedData);
}
```

---

## Form Field Validation

### MIT Email Format
- Pattern: `firstname.mitblr202X@learner.manipal.edu`
- X must be 2, 3, 4, or 5 (batch year)
- Example: `shane.mitblr2023@learner.manipal.edu` ✓

### Non-MIT Email Format
- Any valid RFC 5322 format email
- No domain restrictions

### Phone Number
- 7-15 numeric digits
- All punctuation will be stripped
- Examples: "9876543210", "+91-98765-43210", "(987) 654-3210" all valid

### Name Fields
- 2-100 characters
- Letters, spaces, hyphens, apostrophes only
- HTML/script tags automatically removed

### Team Size
- Minimum: 2 members
- Maximum: 4 members
- Only dropdown values accepted

---

## Registration Flows

### MIT (Free) Registration
```
1. User fills form → Validation → Firestore Storage → Success Animation
2. Collection: hackathon_registrations
3. Field: collegeType = 'mit'
4. No payment step required
```

### Non-MIT (Paid) Registration
```
1. User fills form → Validation → Session Storage
2. → Redirect to payment.html
3. → User confirms payment
4. → Firestore Storage (paymentStatus: 'confirmed')
5. → Success message and redirect home
6. Collection: hackathon_registrations
7. Field: collegeType = 'non-mit'
```

---

## Security Features

### XSS Protection
- HTML tags removed: `<script>`, `<img>`, event handlers
- JavaScript protocols blocked: `javascript:`, `vbscript:`
- All content escaped before storage

### SQL Injection Prevention
- MongoDB operators removed: `$where`, `$regex`, `$ne`, `$gt`, etc.
- NoSQL queries cannot be injected

### CSRF Protection
- Honeypot field prevents bots
- Rate limiting available
- Session-based data handling

### Input Validation
All fields validated for:
- Type correctness
- Length limits
- Format conformance
- Content safety

---

## Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Name must be at least 2 characters" | Name too short | Use full name |
| "Invalid email format" | Malformed email | Use valid email |
| "MAHE students must use @learner.manipal.edu" | Wrong domain | Use @learner.manipal.edu domain |
| "MAHE email must be in format: name.mitblr202X" | Wrong MAHE format | Use name.mitblr202[2-5]@learner.manipal.edu |
| "Phone number must be 7-15 digits" | Invalid phone | Use 10-digit number |
| "Please select a year" | Year not selected | Choose 1st-5th year |
| "Team Size: Must select 2-4 members" | Invalid team size | Select 2, 3, or 4 |

---

## Firestore Document Example

```json
{
  "collegeType": "mit",
  "leaderName": "John Doe",
  "leaderEmail": "john.mitblr2023@learner.manipal.edu",
  "leaderPhone": "9876543210",
  "leaderCollege": "Manipal University",
  "leaderAcademicYear": "3rd",
  "leaderGender": "Male",
  "teamName": "Code Warriors",
  "teamSize": 3,
  "members": [
    {
      "name": "Jane Smith",
      "email": "jane.mitblr2023@learner.manipal.edu",
      "phone": "9876543211",
      "gender": "Female",
      "academicYear": "2nd"
    },
    {
      "name": "Bob Johnson",
      "email": "bob.mitblr2023@learner.manipal.edu",
      "phone": "9876543212",
      "gender": "Male",
      "academicYear": "3rd"
    }
  ],
  "paymentStatus": "confirmed",
  "timestamp": "2026-01-16T12:00:00.000Z",
  "event": "hackathon"
}
```

---

## Debugging

### Check if form is loaded
```javascript
console.log(document.getElementById('registrationForm')); // Should be element
```

### Check if validator is loaded
```javascript
console.log(typeof validator); // Should be "object"
```

### Check if Firebase is ready
```javascript
console.log(window.firebaseReady); // Should be true
```

### View form data before submission
```javascript
const formData = new FormData(document.getElementById('registrationForm'));
console.log(Object.fromEntries(formData));
```

---

## Troubleshooting

### Form won't submit
- Check browser console for errors
- Verify all required fields are filled
- Ensure team size matches number of member fields filled

### Validation errors appear but fields look correct
- Check for extra spaces in inputs
- Verify special characters are allowed
- For email, ensure exact domain match for MIT students

### Firestore not storing data
- Check Firebase initialization
- Verify Firestore rules allow creation
- Check network tab in DevTools for failed requests

### Payment redirect not working
- Ensure sessionStorage has data
- Check payment.html path is correct
- Verify browser allows cross-page navigation

---

## Admin Tasks

### View All Registrations
```javascript
// In Firebase Console
db.collection('hackathon_registrations').get()
```

### Filter by Registration Type
```javascript
db.collection('hackathon_registrations')
  .where('collegeType', '==', 'mit')
  .get()
```

### Export to CSV
```javascript
// Manual: Use Firebase Admin SDK
// Or: Export from Firebase Console → Download as CSV
```

---

## Files Modified

- ✅ `hackathon.html` - Team registration form UI
- ✅ `src/js/input-validator.js` - Validation logic
- ✅ `payment.html` - Payment confirmation
- ✅ `REGISTRATION_IMPLEMENTATION.md` - Full documentation

---

## Support

For detailed information, see `REGISTRATION_IMPLEMENTATION.md`

For API references, check `src/js/input-validator.js` class comments.
