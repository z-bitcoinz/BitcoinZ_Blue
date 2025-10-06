# Tor Integration Testing Guide

## ✅ Implementation Status

**Version:** 2.1.0
**Status:** Code Complete - Ready for Testing
**Native Module:** Built Successfully (66.5 MB)

## 🎯 What Was Implemented

### Rust Backend (Complete)
- ✅ SOCKS5 proxy support in `lib/src/grpc_connector.rs`
- ✅ ProxyConfig struct with enabled/url fields
- ✅ LightClientConfig proxy configuration
- ✅ Proxy-aware fetch_compact_blocks
- ✅ SetProxyCommand RPC handler
- ✅ Native module compiles without errors

### Frontend (Complete)
- ✅ RPC.setProxy() method in src/rpc.ts
- ✅ "BitcoinZ Tor Hidden Service" in ServerSelectModal
- ✅ Automatic proxy enable/disable on server selection
- ✅ Comprehensive Tor documentation in Help section
- ✅ Version updated to 2.1.0

### Infrastructure (Complete)
- ✅ Electron settings persistence
- ✅ CHANGELOG.md with v2.1.0 release notes
- ✅ Help documentation with troubleshooting

## 🧪 Testing Requirements

### Prerequisites
1. **Node.js Version:** You must use Node.js 14 or 16 (NOT v24!)
   ```bash
   # Check version
   node --version

   # If using nvm, switch to Node 16
   nvm install 16
   nvm use 16
   ```

2. **Tor Installation:**
   - Download from https://www.torproject.org/
   - Start Tor (runs on 127.0.0.1:9050 by default)

### Test Steps

#### 1. Build and Start Wallet
```bash
# With Node 16 installed:
yarn install
yarn neon     # Already done - module built successfully
yarn start    # Start development server
```

#### 2. Test Tor Connection

**Option A: Use Pre-configured Tor Server**
1. Open wallet
2. Go to Settings → Switch Server
3. Select "BitcoinZ Tor Hidden Service"
4. Click "Switch Server"
5. Restart wallet when prompted
6. Verify connection works

**Option B: Use Custom .onion Server**
1. Open wallet
2. Go to Settings → Switch Server
3. Select "Custom Server"
4. Enter: `http://e4lxxtpwqfhbkdio6uq7lwcovwmoh624xj3itzjmctfm7hiartadd7qd.onion:9067`
5. Click "Switch Server"
6. Restart wallet
7. Verify connection works

#### 3. Verify Proxy Settings

Check that settings are persisted:
```javascript
// In Electron settings (should show):
{
  "lwd": {
    "serveruri": "http://e4lxxtpwqfhbkdio6uq7lwcovwmoh624xj3itzjmctfm7hiartadd7qd.onion:9067"
  },
  "proxy": {
    "enabled": true,
    "url": "socks5://127.0.0.1:9050"
  }
}
```

#### 4. Test Sync

- Wallet should sync through Tor
- May be slower than direct connection (normal for Tor)
- Check console for "SOCKS5" log messages

#### 5. Test Documentation

1. Go to Help → Help tab
2. Scroll to "🧅 Tor Support & Privacy" section
3. Verify documentation is clear and helpful

## 🔍 Expected Behavior

### When Tor Server Selected
- ✅ proxy.enabled = true
- ✅ proxy.url = "socks5://127.0.0.1:9050"
- ✅ All gRPC connections route through Tor
- ✅ Wallet syncs successfully (may be slower)

### When Regular Server Selected
- ✅ proxy.enabled = false
- ✅ Direct connection to server
- ✅ Normal sync speed

## 🐛 Troubleshooting

### Error: "Connection failed"
- **Cause:** Tor not running
- **Fix:** Start Tor Browser or standalone Tor

### Error: "Port conflict"
- **Cause:** Tor running on different port
- **Fix:** Configure Tor to use port 9050, or update proxy URL in code

### Wallet won't start with Node v24
- **Cause:** Webpack 4 incompatible with Node v17+
- **Fix:** Install and use Node 16
  ```bash
  nvm install 16
  nvm use 16
  ```

## 📋 Files Modified

### Rust Backend
- `lib/Cargo.toml` - Dependencies
- `lib/src/grpc_connector.rs` - SOCKS5 implementation
- `lib/src/lightclient/lightclient_config.rs` - Proxy config
- `lib/src/lightclient.rs` - Proxy helper
- `lib/src/blaze/fetch_compact_blocks.rs` - Proxy support
- `lib/src/commands.rs` - SetProxyCommand

### Frontend
- `src/rpc.ts` - setProxy method
- `src/components/ServerSelectModal.tsx` - Tor server
- `src/components/Help.tsx` - Documentation + version
- `package.json` - Version 2.1.0
- `CHANGELOG.md` - Release notes

## 🌐 Tor Hidden Service Details

**Server:** `e4lxxtpwqfhbkdio6uq7lwcovwmoh624xj3itzjmctfm7hiartadd7qd.onion`
**Port:** 9067
**Full URL:** `http://e4lxxtpwqfhbkdio6uq7lwcovwmoh624xj3itzjmctfm7hiartadd7qd.onion:9067`
**Protocol:** gRPC over HTTP/2 through SOCKS5

## 🔒 Security Notes

1. **Tor provides network anonymity** - hides your IP from the server
2. **Use shielded addresses** - Tor doesn't encrypt blockchain transactions
3. **Best privacy:** Tor + Z-addresses = Maximum privacy
4. **Tor is optional** - Wallet works normally without it

## ✅ Build Verification

```
✅ Rust native module: 66,559,136 bytes (66.5 MB)
✅ Compilation: Successful with only warnings
✅ All dependencies: Installed correctly
✅ Version bump: 2.0.3 → 2.1.0
✅ Documentation: Complete
```

## 📞 Support

If you encounter issues:
1. Check Tor is running: `curl --socks5 127.0.0.1:9050 https://check.torproject.org`
2. Verify .onion address is reachable
3. Check console logs for error messages
4. Report issues with logs to GitHub

## 🎉 Success Criteria

- [ ] Wallet starts with Node 16
- [ ] Tor server appears in server list
- [ ] Selecting Tor server saves proxy settings
- [ ] Wallet connects through Tor successfully
- [ ] Sync completes (may be slower than normal)
- [ ] Help documentation displays correctly
- [ ] Can switch back to regular server

---

**Ready for production testing with Node 16!**
