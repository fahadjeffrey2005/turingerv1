# Testing Guide: Team Registration System

## Pre-Test Checklist
- [ ] Firebase is properly configured in hackathon.html
- [ ] input-validator.js is loaded
- [ ] Firestore rules allow document creation
- [ ] Browser console has no errors on page load
- [ ] All form fields are visible and interactive

---

## Test Case 1: MIT Registration (Valid Data)

### Steps
1. Navigate to `hackathon.html`
2. Click "Register Now" button
3. Select "MIT (Free)" option
4. Fill in the following data:

| Field | Value |
|-------|-------|
| Leader Name | John Developer |
| Leader Email | john.mitblr2023@learner.manipal.edu |
| Leader Academic Year | 3rd Year |
| Leader College | Manipal Institute of Technology |
| Leader Phone | 9876543210 |
| Leader Gender | Male |
| Team Name | Code Warriors |
| Team Size | 2 |
| Member 1 Name | Jane Smith |
| Member 1 Email | jane.mitblr2023@learner.manipal.edu |
| Member 1 Phone | 9876543211 |
| Member 1 Gender | Female |
| Member 1 Academic Year | 2nd Year |

5. Click "Register" button
6. Leave honeypot field empty

### Expected Results
✓ No validation errors appear
✓ Success message "✓ Registration successful! See you at Turinger!" displayed
✓ Success animation plays (rotating globe with checkmark)
✓ Modal closes after animation
✓ Form resets
✓ Entry appears in Firestore `hackathon_registrations` collection with:
  - collegeType: "mit"
  - paymentStatus: not set or "confirmed"
  - All member details preserved

---

## Test Case 2: Non-MIT Registration (Valid Data)

### Steps
1. Navigate to `hackathon.html`
2. Click "Register Now" button
3. Select "Non-MIT (Paid)" option
4. Fill in the following data:

| Field | Value |
|-------|-------|
| Leader Name | Alice Developer |
| Leader Email | alice@example.com |
| Leader Academic Year | 1st Year |
| Leader College | XYZ University |
| Leader Phone | 9123456789 |
| Leader Gender | Female |
| Team Name | Innovators |
| Team Size | 3 |
| Member 1 Name | Bob Smith |
| Member 1 Email | bob@example.com |
| Member 1 Phone | 9123456790 |
| Member 1 Gender | Male |
| Member 1 Academic Year | 2nd Year |
| Member 2 Name | Carol Jones |
| Member 2 Email | carol@example.com |
| Member 2 Phone | 9123456791 |
| Member 2 Gender | Female |
| Member 2 Academic Year | 1st Year |

5. Click "Register" button

### Expected Results
✓ Form validates without errors
✓ Success message "Redirecting to payment..." displayed
✓ Redirected to `payment.html` after ~1.5 seconds
✓ Payment page shows:
  - Leader Name: "Alice Developer"
  - Team Name: "Innovators"
  - Team Size: "3"
  - College Type: "Non-MIT"
✓ Data stored in sessionStorage for payment verification

### Payment Confirmation Steps
1. On payment.html, click "Confirm Payment" button
2. Button shows "Processing..."

### Expected Results
✓ Success message "✓ Payment confirmed! Registration complete!" displayed
✓ Entry appears in Firestore with `paymentStatus: "confirmed"`
✓ Redirected to home page after 3 seconds
✓ sessionStorage cleared

---

## Test Case 3: MIT Email Validation

### Test 3a: Invalid MIT Email Format

**Steps**
1. Select MIT registration
2. Enter Leader Email: `john@learner.manipal.edu` (missing mitblr format)
3. Try to submit

**Expected**
✗ Error: "MAHE email must be in format: name.mitblr202X@learner.manipal.edu (where X is 2, 3, 4, or 5)"

### Test 3b: Invalid Year in MIT Email

**Steps**
1. Select MIT registration
2. Enter Leader Email: `john.mitblr2021@learner.manipal.edu` (year 2021 invalid)
3. Try to submit

**Expected**
✗ Error: "MAHE email must be in format: name.mitblr202X@learner.manipal.edu (where X is 2, 3, 4, or 5)"

### Test 3c: Valid MIT Email Variations

**Valid Formats** (should all be accepted)
- `shane.mitblr2022@learner.manipal.edu` (2022 batch)
- `priya.mitblr2023@learner.manipal.edu` (2023 batch)
- `rahul.mitblr2024@learner.manipal.edu` (2024 batch)
- `neha.mitblr2025@learner.manipal.edu` (2025 batch)

---

## Test Case 4: Team Size Dynamics

### Test 4a: Team Size 2
**Steps**
1. Open registration form
2. Select Team Size: "2"

**Expected**
✓ Member 1 section: Visible
✓ Member 2 section: Visible
✓ Member 3 section: Hidden
✓ Member 4 section: Hidden
✓ All visible fields marked as required

### Test 4b: Team Size 3
**Steps**
1. Select Team Size: "3"

**Expected**
✓ Member 1, 2, 3 sections: Visible
✓ Member 4 section: Hidden

### Test 4c: Team Size 4
**Steps**
1. Select Team Size: "4"

**Expected**
✓ All 4 Member sections: Visible
✓ Changing back to size 2: Member 3 & 4 hidden and cleared

---

## Test Case 5: Form Validation Errors

### Test 5a: Empty Required Fields

**Steps**
1. Leave any required field empty
2. Click Register

**Expected**
✗ Error message appears listing missing fields

### Test 5b: Invalid Phone Number

**Test Cases**
- Input: "123" (too short)
  - Expected: ✗ "Phone number must be 7-15 digits"
- Input: "123ABC456" (contains letters)
  - Expected: ✗ "Phone number must be 7-15 digits"
- Input: "12345678" (8 digits - valid)
  - Expected: ✓ Accepted

### Test 5c: Invalid Name

**Test Cases**
- Input: "A" (too short)
  - Expected: ✗ "Name must be at least 2 characters"
- Input: "John123" (contains numbers)
  - Expected: ✗ "Name contains invalid characters"
- Input: "John O'Brien-Smith" (valid)
  - Expected: ✓ Accepted

### Test 5d: Invalid College Name

**Test Cases**
- Input: "" (empty)
  - Expected: ✗ "College is required"
- Input: "X" (too short)
  - Expected: ✗ "College name must be at least 2 characters"
- Input: "MIT Bangalore" (valid)
  - Expected: ✓ Accepted

---

## Test Case 6: Security Tests

### Test 6a: XSS Prevention

**Attempt 1: Script Tag in Name**
- Input: `<script>alert('XSS')</script>John`
- Expected: ✓ Tags removed, stored as "John"

**Attempt 2: HTML Tags in College**
- Input: `<img src=x onerror="alert('xss')">MIT`
- Expected: ✓ Tags removed, stored as "MIT"

**Attempt 3: JavaScript Protocol**
- Input: `javascript:alert('xss')john@example.com`
- Expected: ✓ Protocol removed, sanitized appropriately

### Test 6b: SQL Injection Prevention

**Attempt 1: NoSQL Operator in Name**
- Input: `$where: 1==1`
- Expected: ✓ Operators removed, safe value stored

**Attempt 2: MongoDB Query**
- Input: `{$ne: null}`
- Expected: ✓ Query syntax removed

### Test 6c: Honeypot Protection

**Steps**
1. Inspect form with DevTools
2. Find hidden field: `<input id="website" style="display:none">`
3. Fill it with: "http://attacker.com"
4. Submit form

**Expected**
✗ Form submission ignored (bot detected in console)

---

## Test Case 7: Team Member Data Validation

### Test 7a: Member Email Validation (MIT)

**When Team Size = 2 and MIT selected**
- Member 1 Email: `john.mitblr2023@learner.manipal.edu` (valid)
  - Expected: ✓ Accepted
- Member 2 Email: `jane.mitblr2023@learner.manipal.edu` (valid)
  - Expected: ✓ Accepted
- Member 3 Email: NOT REQUIRED (hidden)
  - Expected: ✓ Not validated

### Test 7b: Member Email Validation (Non-MIT)

**When Team Size = 2 and Non-MIT selected**
- Member 1 Email: `john@gmail.com` (valid)
  - Expected: ✓ Accepted
- Member 1 Email: `invalid.email` (missing @domain)
  - Expected: ✗ "Invalid email format"

### Test 7c: All Member Fields Required When Visible

**When Team Size = 3**
- Leave Member 3 Name empty
- Click Register
- Expected: ✗ Error about Member 3 Name being required

---

## Test Case 8: Form Reset After Submit

### Steps
1. Fill MIT registration form completely
2. Click Register
3. After success, check if form is reset

### Expected Results
✓ Form fields cleared (values empty)
✓ Team Size resets to blank (no members shown)
✓ College Type resets to unselected
✓ Form ready for new submission

---

## Test Case 9: Cancel Button Functionality

### Steps
1. Open registration modal
2. Fill some (not all) fields
3. Click "Cancel" button

### Expected Results
✓ Modal closes immediately
✓ Form resets (all fields cleared)
✓ No validation errors shown
✓ Can reopen and start fresh

---

## Test Case 10: Session Storage Data Persistence

### Test for Non-MIT Flow
1. Start Non-MIT registration
2. Fill form and submit
3. Note: Don't complete payment yet
4. Open DevTools → Application → Session Storage
5. Check "registrationData" key

### Expected
✓ Contains complete registration data
✓ "collegeType": "non-mit"
✓ All member details present
✓ "isNonMIT": "true"

### Clear and Test Again
1. On payment.html, click "Go Back"
2. Open registration form again
3. Fill different data
4. sessionStorage should update with new data

---

## Firestore Verification

### Check MIT Registration Created
```javascript
// In Firebase Console
db.collection('hackathon_registrations')
  .where('collegeType', '==', 'mit')
  .get()
  .then(docs => {
    docs.forEach(doc => console.log(doc.data()));
  });
```

### Check Non-MIT with Payment
```javascript
db.collection('hackathon_registrations')
  .where('collegeType', '==', 'non-mit')
  .get()
  .then(docs => {
    docs.forEach(doc => {
      if (doc.data().paymentStatus === 'confirmed') {
        console.log('Paid registration:', doc.data());
      }
    });
  });
```

---

## Performance Tests

### Test Page Load Time
- Measure time from page load to form ready
- Expected: < 2 seconds

### Test Form Submission Time
- Measure from click to Firestore write
- Expected: < 3 seconds for MIT, < 5 seconds for redirect

### Test Validation Speed
- Validate 10 concurrent form submissions
- Expected: All processed within 1 second

---

## Browser Compatibility Tests

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

Expected: All forms render correctly and function properly

---

## Accessibility Tests

- [ ] Tab navigation works through form fields
- [ ] Error messages announced by screen readers
- [ ] Form labels properly associated with inputs
- [ ] Success animation doesn't cause seizure risk
- [ ] Contrast ratios meet WCAG AA standards

---

## Error Recovery Tests

### Test Firebase Offline
1. Disconnect internet (DevTools Network → Offline)
2. Try MIT registration
3. Expected: "Firebase not initialized" error message

### Test Invalid Firestore Rules
1. Modify Firestore rules to deny creation
2. Try Non-MIT registration → Payment → Confirm
3. Expected: "Error: Missing or insufficient permissions" error

---

## Sign-Off Checklist

- [ ] All test cases passed
- [ ] No JavaScript errors in console
- [ ] Firestore documents created with correct structure
- [ ] MIT and Non-MIT flows work independently
- [ ] Validation prevents all malicious inputs
- [ ] Success animations play correctly
- [ ] Data persists in Firestore
- [ ] Payment flow redirects correctly
- [ ] Form resets after successful submission
- [ ] Error messages are user-friendly
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility confirmed

---

## Known Limitations

1. Payment gateway not integrated (mock redirect only)
2. Email verification not implemented
3. Duplicate registration not prevented
4. No SMS notifications
5. No QR code generation for check-in

---

## Reporting Issues

If test fails:
1. Check browser console for error messages
2. Verify Firebase configuration
3. Check Firestore rules allow creation
4. Inspect Network tab for failed requests
5. Review form data with DevTools debugger
6. Compare with expected results above

Document:
- Step number where it failed
- Exact error message
- Browser and OS used
- Screenshot of console errors
