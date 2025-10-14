# 🧪 Testing Guide - Clinical Trial Enrollment System

## Quick Start

### 1. Install Dependencies
```bash
cd /Users/user/Documents/GitHub/Hackathon/trial-compass-pro
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Open http://localhost:5173

### 3. Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **CRC** | `crc_test` | `TestCRC@2025!` |
| **StudyAdmin** | `studyadmin_test` | `TestAdmin@2025!` |
| **PI** | `pi_test` | `TestPI@2025!` |

---

## Test Scenarios

### ✅ Authentication Tests

#### Test 1: Login with Valid Credentials
1. Go to http://localhost:5173/login
2. Enter `crc_test` / `TestCRC@2025!`
3. Click "Sign In"
4. **Expected**: Redirect to `/dashboard`, toast shows "Welcome back, Sarah Johnson (CRC)!"

#### Test 2: Login with Invalid Credentials
1. Enter `crc_test` / `wrongpassword`
2. Click "Sign In"
3. **Expected**: Error toast shows "Invalid username or password"

#### Test 3: Token in API Requests
1. Login as any user
2. Open browser DevTools → Network tab
3. Navigate to Eligibility Check page
4. Search for a protocol
5. **Expected**: All API requests have `Authorization: Bearer <token>` header

#### Test 4: Logout
1. Login as any user
2. Click profile icon → "Logout"
3. **Expected**: Redirect to `/login`, token cleared

---

### ✅ Role-Based Access Control (RBAC) Tests

#### Test 5: CRC Access
1. Login as `crc_test`
2. **Can access**: Dashboard, Eligibility Check
3. **Cannot access**: Protocols (StudyAdmin), Enrollment (PI)
4. Navigate to `/protocols`
5. **Expected**: Redirected to dashboard or 403 error

#### Test 6: StudyAdmin Access
1. Login as `studyadmin_test`
2. **Can access**: Dashboard, Eligibility Check, Protocols
3. **Cannot access**: Enrollment (PI only)
4. Navigate to `/enrollment`
5. **Expected**: Redirected or limited view

#### Test 7: PI Full Access
1. Login as `pi_test`
2. **Can access**: All dashboards (Dashboard, Eligibility Check, Protocols, Enrollment)
3. Navigate through all pages
4. **Expected**: Full access to all features

---

### ✅ Eligibility Check (CRC Dashboard) - REAL API

#### Test 8: Protocol Search
1. Login as `crc_test`
2. Go to "Eligibility Check"
3. Click "Search protocols..."
4. Type "oncology"
5. **Expected**: Mock protocol list appears (ONCOLOGY-2024-001, etc.)

#### Test 9: Patient Form Validation
1. Select a protocol
2. Click "Check Eligibility" without filling form
3. **Expected**: Toast error "Please fill in required patient information"

#### Test 10: Eligibility Check with Real Backend
1. Select protocol "ONCOLOGY-2024-001"
2. Fill patient data:
   - Age: `45`
   - Gender: `Male`
   - ECOG Status: `1`
   - Cancer Type: `Advanced Melanoma`
   - Stage: `IV`
   - Prior Treatments: Check "Chemotherapy"
   - Lab Values → Hemoglobin: `12.5`
3. Click "Check Eligibility"
4. **Expected**:
   - Loading state shows "Analyzing with AWS Comprehend Medical..."
   - After 3-5 seconds, results display
   - Overall confidence badge (green/yellow/red)
   - Accordion with criteria breakdown
   - Each criterion shows Met/Not Met badge

#### Test 11: API Error Handling
1. Turn off WiFi or disconnect network
2. Try eligibility check
3. **Expected**: Error toast "Cannot connect to server. Check your connection."

#### Test 12: FHIR Transformation
1. Open browser DevTools → Network tab
2. Perform eligibility check
3. Find POST request to `/check-criteria`
4. Check Request Payload
5. **Expected**: FHIR Bundle format:
```json
{
  "trial_id": "ONCOLOGY-2024-001",
  "patient_fhir_data": {
    "resourceType": "Bundle",
    "type": "collection",
    "entry": [
      {
        "resource": {
          "resourceType": "Patient",
          "birthDate": "1980-01-01",
          "gender": "male"
        }
      },
      {
        "resource": {
          "resourceType": "Observation",
          "code": {
            "coding": [{
              "system": "http://loinc.org",
              "code": "89247-1",
              "display": "ECOG Performance Status"
            }]
          },
          "valueInteger": 1
        }
      }
    ]
  }
}
```

---

### ✅ Protocol Management (StudyAdmin Dashboard) - MOCK

#### Test 13: Protocol Table
1. Login as `studyadmin_test`
2. Go to "Protocols"
3. **Expected**: Table with 3 mock protocols displays
4. Try sorting by clicking column headers
5. Try searching in global search box
6. **Expected**: Table updates accordingly

#### Test 14: Protocol Upload
1. Click "Upload Protocol" button
2. Drag & drop a PDF file or click to browse
3. **Expected**:
   - Progress bar appears
   - After 2 seconds: Toast "Protocol uploaded successfully"
   - Status shows "Processing"

---

### ✅ Enrollment Dashboard (PI) - MOCK

#### Test 15: Enrollment Overview
1. Login as `pi_test`
2. Go to "Enrollment"
3. **Expected**:
   - Charts render (bar, line, pie charts)
   - Summary cards show metrics
   - Data tables with sparklines

#### Test 16: Match Review Queue
1. Scroll to "Pending Matches" section
2. **Expected**: Table with 3 mock pending matches
3. Click on a match row
4. **Expected**: Detail modal opens
5. Click "Approve for Screening"
6. **Expected**: Toast "Match approved successfully"

---

### ✅ UI/UX Tests

#### Test 17: Responsive Design
1. Resize browser to mobile width (375px)
2. Navigate through pages
3. **Expected**:
   - Sidebar collapses to hamburger menu
   - Tables stack columns
   - Forms reorganize for mobile
   - No horizontal scroll

#### Test 18: Dark Mode
1. Click moon/sun icon in header
2. **Expected**: Theme switches, preference persists on refresh

#### Test 19: Loading States
1. Perform eligibility check
2. **Expected**: Skeleton loaders (not spinners) during loading

#### Test 20: Toast Notifications
1. Perform various actions (login, eligibility check, etc.)
2. **Expected**: Sonner toasts appear in bottom-right:
   - Success: Green with checkmark
   - Error: Red with X
   - Auto-dismiss after 3-5 seconds

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to server"
**Cause**: API Gateway URL not set or incorrect

**Fix**:
```bash
# Check .env.local
cat .env.local

# Should have:
VITE_API_BASE_URL=https://gt7dlyqj78.execute-api.us-east-1.amazonaws.com/prod/

# Restart dev server after changing
npm run dev
```

### Issue 2: "401 Unauthorized"
**Cause**: JWT token expired or invalid

**Fix**:
1. Logout and login again
2. Check if Cognito User Pool ID is correct in `.env.local`
3. Verify user exists in Cognito:
```bash
aws cognito-idp list-users --user-pool-id us-east-1_zLcYERVQI --region us-east-1
```

### Issue 3: "403 Forbidden"
**Cause**: User doesn't have permission (RBAC)

**Fix**:
1. Verify user is in correct Cognito group
2. Check user groups:
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_zLcYERVQI \
  --username crc_test \
  --region us-east-1
```

### Issue 4: Eligibility Check Returns Empty Results
**Cause**: Backend response format doesn't match expected format

**Fix**:
1. Check browser console for errors
2. Check Network tab for API response format
3. Adjust response transformation in `src/services/api.ts` line 267-277

### Issue 5: Login Redirects to Wrong Page
**Cause**: Role extraction from JWT token failing

**Fix**:
1. Open browser console
2. Login and check for errors
3. Verify `cognito:groups` claim exists in ID token:
```bash
# Get token and decode at jwt.io
cd /Users/user/Documents/GitHub/Hackathon/aws-trial-enrollment-agent/infrastructure
python3 get_jwt_token.py --role crc --show-payload
```

---

## 📊 Performance Benchmarks

### Expected Load Times
- **Login**: < 2 seconds
- **Dashboard Load**: < 1 second
- **Eligibility Check**: 3-5 seconds (depends on backend)
- **Protocol Search**: < 500ms (mock)
- **Table Rendering**: < 1 second

### Network Activity
- **API Requests**: All requests should complete within 10 seconds
- **Failed Requests**: Should show user-friendly error messages
- **Retries**: Axios should NOT auto-retry (to avoid duplicate submissions)

---

## 🔒 Security Checklist

- [ ] JWT tokens stored in memory (not localStorage)
- [ ] Tokens sent only over HTTPS
- [ ] Authorization header on all API requests
- [ ] 401/403 errors handled gracefully
- [ ] No sensitive data in browser console
- [ ] CORS configured correctly on backend
- [ ] CSP headers present (check in Network tab)

---

## 📝 Test Report Template

```markdown
## Test Session Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: Local Dev Server
**Build**: npm run dev

### Tests Performed
- [ ] Authentication (Tests 1-4)
- [ ] RBAC (Tests 5-7)
- [ ] Eligibility Check (Tests 8-12)
- [ ] Protocol Management (Tests 13-14)
- [ ] Enrollment Dashboard (Tests 15-16)
- [ ] UI/UX (Tests 17-20)

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce: [Steps]
   - Screenshot: [Link]

### Passed Tests
- [List of test numbers that passed]

### Failed Tests
- [List of test numbers that failed with reasons]

### Notes
[Any additional observations]
```

---

## 🚀 Next Steps After Testing

1. **Deploy to AWS Amplify Hosting**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "feat: Connect real backend APIs"
   git push origin main

   # Then deploy via Amplify Console
   ```

2. **Monitor CloudWatch Logs**
   ```bash
   # Check Lambda Authorizer logs
   aws logs tail /aws/lambda/TrialEnrollment-Authorizer --follow --region us-east-1

   # Check FHIR Search logs
   aws logs tail /aws/lambda/TrialEnrollment-FHIRSearch --follow --region us-east-1
   ```

3. **Performance Testing**
   - Use Lighthouse for performance audit
   - Test with large patient datasets
   - Load test API endpoints

4. **Security Audit**
   - Run OWASP ZAP scan
   - Check for XSS vulnerabilities
   - Verify HIPAA compliance

---

**Happy Testing! 🎉**
