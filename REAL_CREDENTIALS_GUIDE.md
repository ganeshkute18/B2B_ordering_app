# Real Credentials Guide
## When & How to Use Real Credentials Instead of Sample Ones

---

## 📅 Timeline

### **RIGHT NOW (April 23, 2026)**
```
Current Status: Using Sample Credentials
Sample Users:
  - owner@distro.com / Password@123
  - staff@distro.com / Password@123
  - customer@distro.com / Password@123

Purpose: 
  ✅ Local testing
  ✅ Feature development
  ✅ Internal QA
```

### **NEXT PHASE: Ready to Show Client (This Week)**
```
Action Required:
  1. Deploy to AWS/Railway/Production
  2. Decide: Client signs up OR you create account
  3. Remove sample users from production
  4. Create real production credentials

Timeline: 1-2 hours setup
```

### **FINAL PHASE: Client Using App (Next Week+)**
```
Status: Production with Real Data
  ✅ Client/staff using real accounts
  ✅ Real data being created
  ✅ Sample accounts removed
  ✅ Audit logs recording everything
```

---

## 🎯 When to Switch to Real Credentials

### **BEFORE YOU SWITCH:**

#### ✅ Checklist
- [ ] All features working locally
- [ ] Database migrations tested
- [ ] Authentication system verified
- [ ] Invitation codes working
- [ ] API endpoints tested in Swagger
- [ ] Web app UI tested
- [ ] Code pushed to GitHub
- [ ] Ready to deploy to production

#### ✗ Don't Switch If:
- [ ] Still finding bugs locally
- [ ] Features not working properly
- [ ] Haven't tested invitation system
- [ ] Database has issues

---

## 🚀 Three Options for Real Credentials

### **Option 1: Client Self-Registers (RECOMMENDED)**

**Best for:** Client demo → real usage transition

**Timeline:** 10 minutes total

**Steps:**

1. **Deploy clean production (no sample users)**
   ```bash
   # Remove sample users from seed
   # Edit apps/api/prisma/seed.ts
   # Keep products/categories, remove users
   
   git add apps/api/prisma/seed.ts
   git commit -m "chore: remove sample users from production"
   git push origin main
   
   # AWS auto-deploys (5-10 min)
   ```

2. **Client signs up**
   ```
   Go to: https://your-app-url.com
   Click "Sign Up as Customer"
   
   Enter:
   - Email: client@company.com
   - Password: Their secure password
   - Name: Owner Name
   - Business: Company Name
   
   Submit → Auto-login as CUSTOMER
   ```

3. **You promote to OWNER**
   ```bash
   # Option A: Using Prisma Studio
   cd apps/api
   npx prisma studio
   # Find user → Edit role → Change to OWNER → Save
   
   # Option B: Using SQL (if connected to RDS)
   UPDATE users SET role = 'OWNER' 
   WHERE email = 'client@company.com';
   
   # Option C: Using AWS Console
   # RDS → Query Editor → Run above SQL
   ```

4. **Client logs out and logs back in**
   ```
   New session now has OWNER privileges
   Can generate staff invitation codes
   Full admin access
   ```

**Advantages:**
- ✅ Simple
- ✅ Client controls own password
- ✅ Works immediately
- ✅ No shared secrets

---

### **Option 2: You Create & Share (QUICK DEMO)**

**Best for:** Quick client review

**Timeline:** 5 minutes total

**Steps:**

1. **Create owner account**
   ```bash
   cd apps/api
   
   # Use interactive script
   npx ts-node prisma/create-real-user.ts
   
   # Follow prompts:
   # - Email: client@company.com
   # - Name: Client Owner
   # - Business: Their Company
   # - Password: Generate strong one
   ```

2. **Get credentials**
   ```
   Script outputs:
   Email: client@company.com
   Password: GeneratedSecurePassword123!
   ```

3. **Share securely**
   ```
   ❌ DON'T: Send via Slack/Email
   ✅ DO:    Share via:
            - Encrypted message
            - Password manager link
            - Phone call
            - In-person meeting
   ```

4. **Client logs in**
   ```
   URL: https://your-app.com
   Email: client@company.com
   Password: GeneratedSecurePassword123!
   
   Can immediately access as OWNER
   ```

**Advantages:**
- ✅ Fastest
- ✅ No client action needed
- ✅ Ready to use immediately

**Disadvantages:**
- ⚠️ You know their password
- ⚠️ Need to share password securely

---

### **Option 3: Bulk Create Multiple Users**

**Best for:** Multiple clients / teams

**Timeline:** 15 minutes total

**Steps:**

1. **Create CSV with user data**
   ```csv
   email,name,businessName,password,role
   owner1@client1.com,John Owner,Client 1 Corp,SecurePass123!,OWNER
   staff1@client1.com,Jane Staff,Client 1 Corp,SecurePass456!,STAFF
   ```

2. **Create import script**
   ```bash
   # Create apps/api/prisma/bulk-create-users.ts
   # Read CSV → Hash passwords → Create users
   ```

3. **Run import**
   ```bash
   npx ts-node prisma/bulk-create-users.ts
   ```

4. **Export credentials**
   ```
   Share with clients securely
   Each person gets their own credentials
   ```

---

## 🔐 Security: Sharing Real Credentials

### **NEVER:**
- ❌ Slack / Teams message
- ❌ Unencrypted email
- ❌ Shared document
- ❌ Cloud drive (Google Drive, Dropbox)
- ❌ Screenshots

### **ALWAYS USE:**
- ✅ 1Password Business
- ✅ Bitwarden
- ✅ LastPass Teams
- ✅ Phone call
- ✅ In-person handoff
- ✅ Encrypted email (ProtonMail)

**Example using 1Password:**
```
1. Create vault item with credentials
2. Share link with expiration (24 hours)
3. Recipient opens link
4. Can view password once
5. Link expires automatically
```

---

## 🛠️ How to Create Real Credentials

### **Method 1: Interactive Script**

```bash
cd apps/api

# Run script
npx ts-node prisma/create-real-user.ts

# Follow prompts:
# - Email: user@company.com
# - Name: Full Name
# - Business: Company Name
# - Password: (min 8 chars)

# Output:
# ✅ User created successfully!
# Login with:
#   Email: user@company.com
#   Password: (shown on screen)
```

### **Method 2: Prisma Studio (GUI)**

```bash
cd apps/api

# Open GUI
npx prisma studio

# In browser:
# 1. Click "users" table
# 2. Click "Add record"
# 3. Fill in fields:
#    - Email: user@company.com
#    - Name: Full Name
#    - PasswordHash: (use bcrypt hash)
#    - Role: OWNER
#    - IsActive: true

# 4. Save
```

### **Method 3: Database Query**

```bash
# Connect to RDS PostgreSQL
psql -h your-rds-endpoint.amazonaws.com -U distro_admin -d distro_platform

# Generate bcrypt hash first:
# Use online tool or:
echo "your-password" | htpasswd -cB - temp | grep "temp" | cut -d: -f2

# Insert user:
INSERT INTO users (
  id, 
  email, 
  name, 
  "passwordHash", 
  role, 
  "businessName", 
  "isActive", 
  "createdAt", 
  "updatedAt"
) VALUES (
  'cuid_value_here',
  'user@company.com',
  'Full Name',
  '$2b$12$hashed_password_here',
  'OWNER',
  'Company Name',
  true,
  NOW(),
  NOW()
);
```

---

## 📊 Account Types After Migration

### **Sample Accounts (Local Testing Only)**
```
owner@distro.com / Password@123
staff@distro.com / Password@123
customer@distro.com / Password@123

✅ Use for: Local development
❌ Don't use for: Production
```

### **Real Accounts (Production)**
```
client@company.com / Their Strong Password
staff@company.com / Their Strong Password
customer@company.com / Their Strong Password

✅ Use for: Production
✅ Share securely
✅ Each person unique password
```

---

## 📋 Checklist: Ready for Real Credentials?

### **Technical**
- [ ] App deployed to production
- [ ] Database migrations completed
- [ ] All endpoints tested
- [ ] Authentication working
- [ ] Invitation system working
- [ ] Error handling in place

### **Data**
- [ ] Sample products seeded
- [ ] Sample categories seeded
- [ ] Sample agencies seeded
- [ ] NO sample users in production
- [ ] Clean database ready

### **Security**
- [ ] HTTPS enabled
- [ ] Secrets in AWS Secrets Manager
- [ ] .env file not committed
- [ ] Password requirements set (min 8 chars)
- [ ] Audit logging enabled
- [ ] Rate limiting configured

### **Documentation**
- [ ] Shared deployment docs with client
- [ ] Shared test credentials safely
- [ ] Provided user guide
- [ ] Provided support contact

### **Client Ready**
- [ ] Client informed of launch
- [ ] Client has credentials
- [ ] Client knows how to sign up (if self-register)
- [ ] Client knows how to create staff accounts
- [ ] Client has support number/email

---

## 🚀 Timeline: Sample → Real Credentials

```
TODAY (April 23):
  ✅ Testing with sample credentials locally

TOMORROW:
  1. Deploy to production
  2. Remove sample users
  3. Create real owner account
  4. Share credentials securely

NEXT FEW DAYS:
  ✅ Client starts using real credentials
  ✅ Creates real staff accounts
  ✅ Starts testing with real data

NEXT WEEK:
  ✅ Client provides feedback
  ✅ You make requested changes
  ✅ App goes live for real usage
```

---

## 📞 Common Questions

**Q: When exactly should I create real credentials?**
```
A: Right before showing the app to the client.
   You want them using real credentials from day 1,
   not switching later.
```

**Q: Can I keep sample users in production?**
```
A: Technically yes, but:
   ❌ Not recommended for security
   ❌ Confusing for client
   ❌ Hard to track real data vs test data
   
   ✅ Always remove from production
```

**Q: What if client forgets their password?**
```
A: Create password reset endpoint:
   POST /api/v1/auth/forgot-password
   (Implementation needed)
   
   Until then: You reset in database
```

**Q: Can I change real credentials later?**
```
A: Yes! Anytime
   - Update database directly, or
   - Client changes via "Change Password" in app
   - You create new account
```

**Q: Should I keep backup of credentials?**
```
A: YES! Use password manager:
   - Store encrypted
   - Access-controlled
   - Audit trail
   - Recovery option
```

---

## ✅ You're Ready When:

- ✅ App working locally with sample credentials
- ✅ Code pushed to GitHub
- ✅ Deployment tested
- ✅ Database clean (no sample users in production)
- ✅ Real credentials created
- ✅ Credentials shared securely with client
- ✅ Client can login and test

**Then: You can show the client the live app!** 🎉

