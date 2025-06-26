# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Rules

**NEVER include Claude-specific attribution in git commits:**
- Do NOT add "🤖 Generated with Claude Code" 
- Do NOT add "Co-Authored-By: Claude <noreply@anthropic.com>"
- Keep commits clean and professional without AI assistant references

## Project Overview

BitcoinZ Light Wallet is a z-Addr first, Sapling compatible lightwallet client for BitcoinZ. It's a hybrid TypeScript/React + Rust application built with Electron that provides full privacy features with shielded transactions.

## Key Commands

### Development
```bash
# Install dependencies (required first)
yarn install

# Build native Rust module (required before running)
yarn neon

# Start development server
yarn start

# Run tests
yarn test

# Build production version
yarn build
```

### Building Distributions
```bash
# macOS
yarn dist:mac

# Windows
yarn dist:win

# Linux
yarn dist:linux
```

### Testing a Single Component
```bash
# Run a specific test file
yarn test src/components/ComponentName.test.tsx --watch
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 17 + TypeScript + Electron 13
- **Native Module**: Rust (via Neon bindings) using zecwalletlitelib
- **State Management**: Central AppState pattern with callback-based updates
- **RPC Communication**: Custom RPC layer that bridges JavaScript to Rust native module
- **Build System**: Webpack 4 + Create React App configuration
- **Styling**: CSS Modules for component-specific styles

### Code Structure

#### Frontend Application (`/src`)
- **Entry Points**: 
  - `index.tsx` - React root application entry
  - `public/electron.js` - Electron main process entry
  
- **Core Components** (`/src/components/`):
  - `App.tsx` - Main application container with routing
  - `Dashboard.tsx` - Main wallet overview and balance display
  - `Send.tsx` - Transaction sending interface with multi-recipient support
  - `Receive.tsx` - Address generation and QR code display
  - `Transactions.tsx` - Transaction history with filtering
  - `AppState.ts` - Central state management types and classes
  
- **RPC Layer**: 
  - `rpc.ts` - Main RPC class that handles all blockchain communication through native module
  - Manages wallet synchronization, transaction processing, and balance updates

#### Native Module (`/lib` and `/native`)
- **`/lib`**: Main Rust library (zecwalletlitelib) with blockchain logic
- **`/native`**: Neon.js bindings that expose Rust functionality to Node.js
- Provides cryptographic operations, blockchain connectivity, and wallet management
- Communicates with lightwalletd servers for blockchain data

### Key Design Patterns

1. **Light Client Architecture**: Connects to remote lightwalletd servers (default: lightd.btcz.rocks:9067)
2. **Privacy First**: Defaults to shielded (z-address) transactions, automatically shields transparent funds
3. **Automatic Note Management**: Handles UTXO/note selection automatically, enforces 5-confirmation rule for Sapling
4. **Real-time Updates**: Uses polling with change detection for fast UI updates
5. **Cross-Platform**: Single codebase with platform-specific builds and signing

### Network Parameters (BitcoinZ Specific)
- **Coin Type**: 177 (BIP44)
- **Sapling Activation**: Block 328,500
- **Branch ID**: 0x76b809bb
- **Address Prefixes**: t1 (transparent), zs1 (shielded)
- **Note**: BitcoinZ does NOT support Unified addresses (Orchard)

### RPC Communication Pattern

The RPC class (`src/rpc.ts`) acts as the central coordinator:
- **Native Module Interface**: Calls `native.litelib_execute(command, params)` for all operations
- **Callback-Based Updates**: Uses function callbacks to update UI state
- **Change Detection**: Polls for changes in txid, balance, and transaction count
- **Automatic Sync**: Triggers blockchain sync when new blocks detected

### Important Considerations

1. **Native Module Build**: Always run `yarn neon` before starting development or building
2. **Rust Version**: Requires Rust 1.62+ (specified in `rust-toolchain`)
3. **Node.js Compatibility**: 
   - Requires Node.js v14 or v16 (NOT v17+ due to OpenSSL issues with Webpack 4)
   - Node.js 16 is recommended for best compatibility
4. **Dependency Structure**: 
   - Uses custom zecwalletlitelib in `/lib` directory
   - Native bindings built via Neon.js in `/native` directory
5. **Platform Dependencies**: 
   - Windows: Visual Studio Build Tools required
   - Linux: Standard build tools (gcc, make, etc.)
   - macOS: Xcode Command Line Tools
6. **Testing**: Uses Jest with React Testing Library, configured for TypeScript
7. **State Management**: All blockchain data flows through RPC callbacks to update central AppState

### Common Development Tasks

#### Adding a New Component
1. Check existing components for patterns (CSS Modules, TypeScript interfaces)
2. Use proper TypeScript with interfaces from AppState.ts
3. Follow callback pattern for state updates via RPC class
4. Import and use existing utility functions from `src/utils/`

#### Modifying RPC Communication
1. Primary RPC logic in `src/rpc.ts` with native module interface
2. Rust implementation in `lib/src/` (main library logic)
3. Node.js bindings in `native/src/lib.rs` (Neon.js wrapper)
4. Test changes with both shielded and transparent transactions

#### Working with Transactions
- Transaction types defined in `src/components/AppState.ts`
- Sending logic in `src/components/Send.tsx` with progress tracking
- History display in `src/components/Transactions.tsx` with memo combination
- Multi-part memo handling and transaction grouping in RPC layer

#### Price Integration
- Uses CoinGecko API for BitcoinZ price data with 5-minute caching
- Fallback to native module price method if API fails
- Price data flows through RPC callbacks to update UI

### Security Considerations
- Private keys encrypted via sodiumoxide and stored locally with electron-settings
- View keys used for blockchain synchronization (privacy preservation)
- Never log private keys, seeds, or sensitive data
- Code signing implemented for all platforms (ad-hoc signing for macOS)

### Build Configuration
- Electron Builder for cross-platform packaging
- Platform-specific signing configurations in package.json
- AsarUnpack settings for native modules
- Resource files in `/resources` directory