# 🚀 Sharing Feature - Quick Start Guide

## ⚠️ IMPORTANT: Firebase Security Rules Required

**Before the sharing feature will work, you MUST apply the Firestore security rules!**

### Step 1: Apply Security Rules (REQUIRED)

1. Open [FIRESTORE-SECURITY-RULES.md](FIRESTORE-SECURITY-RULES.md)
2. Copy the complete security rules from that file
3. Go to Firebase Console: https://console.firebase.google.com
4. Select your project
5. Navigate to **Firestore Database** → **Rules** tab
6. Paste the rules and click **Publish**

⏱️ Wait 1-2 minutes for rules to propagate globally.

---

## ✅ Quick Test (5 minutes)

### Owner Test (Account A)

1. **Create Invitation**:
   ```
   - Open StudyDock
   - Click "🤝 Compartir Materials"
   - Click "Nova Invitació"
   - Click copy button next to the code
   ```

2. **Share Link**:
   ```
   - Send the copied link to another account
   - OR copy just the code (8 characters)
   ```

### Guest Test (Account B)

3. **Accept Invitation**:
   ```
   - Option A: Click the invitation link
   - Option B: Go to "🤝 Compartir Materials" and enter code manually
   - Click "Acceptar Invitació"
   ```

4. **View Shared Content**:
   ```
   - Click "Veure Materials" next to owner's email
   - Browse notes/tests/audiobooks
   - Notice upload button is hidden (read-only mode)
   - Take a test (your stats are saved separately)
   ```

5. **Return to Own Content**:
   ```
   - Click "Els Meus Materials" in the banner
   ```

---

## 🎯 Real-World Use Cases

### Use Case 1: Study Group
**Scenario**: 5 friends studying for the same exam

**Setup**:
1. One person (coordinator) uploads all shared notes
2. Coordinator creates ONE invitation
3. Shares the invitation link in WhatsApp group
4. All 4 friends click link and accept
5. Everyone now has access to the same materials

**Benefits**:
- No duplicate uploads
- Always up-to-date (coordinator can update notes)
- Each person tracks their own progress

### Use Case 2: Teacher-Student
**Scenario**: Teacher with 20 students

**Setup**:
1. Teacher uploads course materials (notes, tests)
2. Teacher creates ONE invitation
3. Posts invitation link in virtual classroom
4. Students accept and get instant access

**Benefits**:
- Students can't modify teacher's materials
- Teacher maintains full control
- Each student practices independently

### Use Case 3: Paid Tutoring
**Scenario**: Tutor selling access to premium content

**Setup**:
1. Tutor creates exclusive study materials
2. For each paying customer, tutor creates a new invitation
3. Can track who has accepted
4. Can delete invitations to revoke access after subscription ends

**Benefits**:
- Secure content distribution
- Access control per customer
- No technical knowledge required from customers

---

## 🔍 Troubleshooting

### Issue: "Missing or insufficient permissions"

**Quick Fix**:
1. Did you apply the security rules? → [Go to Step 1](#step-1-apply-security-rules-required)
2. Wait 2 minutes after publishing rules
3. Refresh the page
4. Try again

### Issue: Invitation code doesn't work

**Checklist**:
- [ ] Code is exactly 8 characters
- [ ] Code is not expired (30 days from creation)
- [ ] User is signed in
- [ ] Invitation wasn't deleted by owner

### Issue: Can't see shared content

**Checklist**:
- [ ] Invitation was accepted successfully
- [ ] Clicked "Veure Materials" button
- [ ] Owner actually has content uploaded
- [ ] Security rules are applied

### Issue: Guest can upload content

**This should NOT happen if:**
- [ ] Security rules are properly applied
- [ ] App is showing read-only banner
- [ ] Upload button should be hidden

If this happens, security rules are not working correctly. Re-apply them.

---

## 📱 Mobile Sharing Tips

### WhatsApp:
```
Hola! T'he compartit els meus apunts d'estudi.
Fes clic aquí per accedir:
[invitation link]
```

### Email:
```
Subject: Invitació per Accedir a Materials d'Estudi

Hola!

T'he convidat a accedir als meus materials d'estudi a StudyDock.

Enllaç d'accés: [invitation link]

O introdueix aquest codi manualment: [CODE]

L'invitació caduca el: [expiration date]

Salutacions!
```

### SMS:
```
StudyDock: Accedeix als materials d'estudi aquí: [short link]
Codi: [CODE]
```

---

## 🎨 User Experience Flow

### For Content Owner:

```
Home → Compartir Materials → Nova Invitació
                                  ↓
                              [Copy Link]
                                  ↓
                        Share via WhatsApp/Email
                                  ↓
                   Monitor who accepted (usage count)
```

### For Guest:

```
Receive Link → Click Link → Accept Invitation
                                  ↓
                    Compartir Materials → Veure Materials
                                  ↓
                           Browse Content (Read-Only)
                                  ↓
                         Back to My Materials (anytime)
```

---

## 💡 Pro Tips

### For Owners:

1. **Create One Invitation for Multiple People**
   - One code can be used by up to 999 people
   - More efficient than individual invitations

2. **Set Clear Expectations**
   - Tell guests they can't modify content
   - Explain they'll have access for 30 days

3. **Monitor Usage**
   - Check "Usos" count to see how many accepted
   - Delete invitation after your group has accepted

### For Guests:

1. **Bookmark the Sharing Screen**
   - Quick access to all shared materials
   - Easy switching between accounts

2. **Your Stats Are Private**
   - Test scores saved to your account only
   - Study time tracked separately

3. **Multiple Access Points**
   - Can have access to multiple owners simultaneously
   - Switch between them easily

---

## 📊 What Gets Shared

### ✅ Shared (Read-Only):
- 📚 Notes
- ✏️ Tests
- 🎧 Audiobooks

### ❌ NOT Shared (Always Private):
- 📊 Statistics (study time, test scores)
- ⚙️ Settings
- 🔐 Account information

---

## 🔐 Security Features

### For Owners:
- Content remains in your control
- Guests cannot modify anything
- Can delete invitations anytime
- See who has accepted

### For Guests:
- Only see what owner shares
- Cannot accidentally delete content
- Your personal data stays private
- Easy to stop viewing shared content

---

## 🆘 Getting Help

1. **Read Documentation**:
   - [SHARING-IMPLEMENTATION-PLAN.md](SHARING-IMPLEMENTATION-PLAN.md) - Technical details
   - [FIRESTORE-SECURITY-RULES.md](FIRESTORE-SECURITY-RULES.md) - Security setup
   - [SHARING-FEATURE-SUMMARY.md](SHARING-FEATURE-SUMMARY.md) - Complete overview

2. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for errors in Console tab
   - Share error messages when asking for help

3. **Firebase Console**:
   - Check Firestore → Usage for denied requests
   - Review Rules tab for rule status

---

## ✅ Success Indicators

You'll know it's working when:

**As Owner:**
- ✅ Can create invitations
- ✅ Can copy invitation links
- ✅ See usage count increase when others accept

**As Guest:**
- ✅ Can accept invitations
- ✅ See amber "Mode Només Lectura" banner
- ✅ Can view notes/tests/audiobooks
- ✅ Upload button is hidden
- ✅ Can switch back to own materials

---

## 🎉 That's It!

The sharing feature is ready to use. Start sharing your study materials with friends, classmates, or students!

**Remember**: Apply the security rules first, then everything will work smoothly.

---

**Questions?** Check the documentation files or test with two accounts to see how it works in practice.

**Last Updated**: December 2024
