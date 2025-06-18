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
- **Native Module**: Rust (via Neon bindings)
- **State Management**: Local state with AppState pattern
- **RPC Communication**: Custom RPC layer for blockchain interaction
- **Build System**: Webpack 4 + Create React App configuration

### Code Structure

#### Frontend Application (`/src`)
- **Entry Points**: 
  - `index.tsx` - React root
  - `public/electron.js` - Electron main process
  
- **Core Components** (`/src/components/`):
  - `App.tsx` - Main application container
  - `Dashboard.tsx` - Main wallet view
  - `Send.tsx` - Transaction sending interface
  - `Receive.tsx` - Address generation/display
  - `Transactions.tsx` - Transaction history
  - `AppState.ts` - Central state management types
  
- **RPC Layer**: 
  - `rpc.ts` - Handles all blockchain communication through native module

#### Native Module (`/native`)
- Rust codebase using `zecwalletlitelib`
- Provides cryptographic operations and blockchain connectivity
- Built as Node.js addon via Neon
- Communicates with lightwalletd servers

### Key Design Patterns

1. **Light Client Architecture**: Connects to remote lightwalletd servers rather than running a full node
2. **Privacy First**: Default to shielded (z-address) transactions
3. **Automatic Note Management**: Handles UTXO/note selection automatically
4. **Cross-Platform**: Single codebase for Windows, macOS, and Linux

### Network Parameters (BitcoinZ Specific)
- **Coin Type**: 177 (BIP44)
- **Sapling Activation**: Block 328,500
- **Branch ID**: 0x76b809bb
- **Address Prefixes**: t1 (transparent), zs (shielded)

### Important Considerations

1. **Native Module Build**: Always run `yarn neon` before starting development or building
2. **Rust Version**: Requires Rust 1.62+ (specified in `rust-toolchain`)
3. **Node.js Compatibility**: 
   - Requires Node.js v14 or v16 (NOT v17+ due to OpenSSL issues with Webpack 4)
   - Project is configured to use `NODE_OPTIONS=--openssl-legacy-provider` for compatibility
4. **Dependency Structure**: 
   - Requires `zecwallet-light-cli-bitcoinz` cloned in parent directory
   - Both repos must be siblings: `../bitcoinz-light-wallet/` and `../zecwallet-light-cli-bitcoinz/`
5. **Platform Dependencies**: 
   - Windows: May need Visual Studio Build Tools
   - Linux: Requires standard build tools (gcc, make, etc.)
   - macOS: Xcode Command Line Tools
6. **Testing**: Uses Jest with React Testing Library
7. **State Updates**: The RPC class manages all blockchain data updates through callback functions

### Common Development Tasks

#### Adding a New Component
1. Check existing components for patterns and conventions
2. Use TypeScript with proper type definitions
3. Follow the existing state management pattern with AppState
4. Import styles and assets following existing examples

#### Modifying RPC Communication
1. Updates to RPC logic should be made in `src/rpc.ts`
2. Native module interface is in `src/native.node` (auto-generated)
3. Rust implementation is in `native/src/lib.rs`

#### Working with Transactions
- Transaction types are defined in `src/components/AppState.ts`
- Send functionality is in `src/components/Send.tsx`
- Transaction parsing and display logic is in `src/components/Transactions.tsx`

### Security Notes
- Private keys are encrypted and stored locally via electron-settings
- View keys are used for blockchain synchronization
- Never log or expose private keys or seed phrases