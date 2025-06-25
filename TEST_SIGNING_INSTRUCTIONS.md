# 🧪 Testing the Free Code Signing Implementation

## 📍 Current Status
- ✅ Code pushed to master branch
- ✅ Test tag `v1.0.7-test-signing` created and pushed
- ⏳ GitHub Actions workflow should be running now

## 🔍 How to Monitor the Build

### 1. **Check GitHub Actions**
Go to: https://github.com/z-bitcoinz/BitcoinZ_Blue/actions

You should see:
- A new workflow run triggered by the tag `v1.0.7-test-signing`
- Three platform builds running (macOS, Windows, Linux)
- A Sigstore signing job that runs after builds complete

### 2. **What to Look For**

#### macOS Build:
- Look for "Applying ad-hoc code signing to macOS apps..."
- Should see "✅ Ad-hoc signing complete"
- No errors in the signing step

#### Windows Build:
- Look for "Testing Windows self-signing..."
- Should see certificate creation and signing steps
- "✅ Certificate exported to: dist\BitcoinZ-Blue-Certificate.cer"

#### Sigstore Signing:
- Should run after all builds complete
- Creates .sig and .pem files for each artifact
- "🎉 Sigstore signing complete!"

### 3. **Download and Test Artifacts**

Once the workflow completes:

1. Go to the workflow run page
2. Download the artifacts:
   - `BitcoinZ-Blue-macOS-AppleSilicon`
   - `BitcoinZ-Blue-macOS-Intel`
   - `BitcoinZ-Blue-Windows-Installer`
   - `BitcoinZ-Blue-Signed-Artifacts` (contains signatures)

### 4. **Test macOS App**

1. Download the macOS ZIP for your architecture
2. Extract the ZIP
3. **Right-click** on the app → **Open**
4. You should see "unidentified developer" (NOT "damaged")
5. Click "Open" to run

Expected: No "damaged app" error! 🎉

### 5. **Test Windows App**

1. Download the Windows installer
2. Run the installer
3. You should see SmartScreen warning (click "More info" → "Run anyway")
4. Check signature:
   ```powershell
   Get-AuthenticodeSignature "BitcoinZ Blue Setup.exe"
   ```

### 6. **Test Sigstore Signatures**

Download the signed artifacts and verify:
```bash
# Install cosign if needed
brew install cosign  # macOS

# Verify a file
cosign verify-blob \
  --certificate="BitcoinZ-Blue-mac.zip.pem" \
  --signature="BitcoinZ-Blue-mac.zip.sig" \
  "BitcoinZ-Blue-mac.zip"
```

## 🧪 Run Test Workflow

You can also run the test workflow manually:

1. Go to: https://github.com/z-bitcoinz/BitcoinZ_Blue/actions
2. Click on "Test Code Signing" workflow
3. Click "Run workflow"
4. Select platform to test (or "all")
5. Monitor the results

## 🐛 Troubleshooting

### If the workflow fails:
1. Check the workflow logs for specific errors
2. Common issues:
   - Node.js version conflicts
   - Missing dependencies
   - Permissions issues

### If signing doesn't work:
1. Check that all files were committed correctly
2. Verify entitlements file exists: `configs/entitlements.mac.plist`
3. Check package.json has the mac signing configuration

## ✅ Success Indicators

- macOS: No "damaged app" errors
- Windows: Self-signed certificate visible
- Sigstore: .sig and .pem files created
- All artifacts downloadable from GitHub

## 📝 Next Steps

After successful testing:
1. Delete the test tag (optional)
2. Create a proper release tag when ready
3. Monitor user feedback
4. Update documentation if needed

---

**Test Started:** January 25, 2025, 7:06 PM
**Repository:** https://github.com/z-bitcoinz/BitcoinZ_Blue
