#!/bin/bash

# BitcoinZ Blue Local Build Script for All Platforms
# Builds for macOS, Windows, and Linux from your local machine

set -e

echo "🚀 BitcoinZ Blue Local Build Script"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check current platform
PLATFORM=$(uname -s)
echo -e "${YELLOW}Current platform: $PLATFORM${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js v14 or v16${NC}"
        exit 1
    fi
    echo "✅ Node.js: $(node --version)"
    
    # Check Yarn
    if ! command -v yarn &> /dev/null; then
        echo -e "${RED}❌ Yarn not found. Please install Yarn${NC}"
        exit 1
    fi
    echo "✅ Yarn: $(yarn --version)"
    
    # Check Rust
    if ! command -v rustc &> /dev/null; then
        echo -e "${RED}❌ Rust not found. Please install Rust${NC}"
        exit 1
    fi
    echo "✅ Rust: $(rustc --version)"
    
    echo ""
}

# Function to clean build artifacts
clean_build() {
    echo -e "${YELLOW}Cleaning previous build artifacts...${NC}"
    rm -rf dist
    rm -rf build
    echo "✅ Clean complete"
    echo ""
}

# Function to install dependencies
install_deps() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    yarn install
    echo "✅ Dependencies installed"
    echo ""
}

# Function to build native module
build_native() {
    echo -e "${YELLOW}Building native Rust module...${NC}"
    yarn neon
    echo "✅ Native module built"
    echo ""
}

# Function to build the app
build_app() {
    echo -e "${YELLOW}Building application...${NC}"
    yarn build
    
    # Copy native module to build directory
    if [ -f "src/native.node" ]; then
        cp src/native.node build/
        echo "✅ Native module copied to build directory"
    fi
    
    echo "✅ Application built"
    echo ""
}

# Function to build for macOS
build_mac() {
    echo -e "${GREEN}🍎 Building for macOS...${NC}"
    
    # Set environment variables for ad-hoc signing
    export CSC_IDENTITY_AUTO_DISCOVERY=false
    export CSC_LINK=""
    export CSC_KEY_PASSWORD=""
    export CODESIGN_IDENTITY="-"
    export ELECTRON_BUILDER_SKIP_REBUILD=true
    
    # Build with electron-builder
    npx electron-builder -m \
        -c.mac.identity=null \
        -c.mac.type=distribution \
        -c.npmRebuild=false \
        -c.buildDependenciesFromSource=false \
        --publish never
    
    # Apply ad-hoc signing to ensure no "damaged" errors
    echo -e "${YELLOW}Applying ad-hoc signatures...${NC}"
    find dist -name "*.app" -type d | while read -r app; do
        echo "Signing: $app"
        codesign --force --deep --sign - "$app"
        xattr -cr "$app"
    done
    
    echo -e "${GREEN}✅ macOS build complete!${NC}"
    echo ""
}

# Function to build for Windows (cross-compile on macOS/Linux)
build_windows() {
    echo -e "${GREEN}🪟 Building for Windows...${NC}"
    
    if [[ "$PLATFORM" == "Darwin" ]] || [[ "$PLATFORM" == "Linux" ]]; then
        echo -e "${YELLOW}Note: Cross-compiling for Windows${NC}"
        
        # Install wine if needed for Windows builds on non-Windows
        if ! command -v wine &> /dev/null; then
            echo -e "${YELLOW}Wine not installed. Windows build may have limitations.${NC}"
        fi
    fi
    
    # Build with electron-builder
    npx electron-builder -w \
        -c.npmRebuild=false \
        -c.buildDependenciesFromSource=false \
        --publish never
    
    echo -e "${GREEN}✅ Windows build complete!${NC}"
    echo ""
}

# Function to build for Linux
build_linux() {
    echo -e "${GREEN}🐧 Building for Linux...${NC}"
    
    # Build with electron-builder
    npx electron-builder -l \
        -c.npmRebuild=false \
        -c.buildDependenciesFromSource=false \
        --publish never
    
    echo -e "${GREEN}✅ Linux build complete!${NC}"
    echo ""
}

# Function to sign with local test script
sign_locally() {
    echo -e "${YELLOW}Running local signing tests...${NC}"
    
    if [ -f "scripts/test-signing-local.sh" ]; then
        ./scripts/test-signing-local.sh || echo "Signing tests completed with warnings"
    fi
    
    echo ""
}

# Function to display results
show_results() {
    echo -e "${GREEN}🎉 Build Complete!${NC}"
    echo -e "${GREEN}=================${NC}"
    echo ""
    echo "Built artifacts are in the 'dist' directory:"
    echo ""
    
    if [ -d "dist" ]; then
        ls -la dist/
    fi
    
    echo ""
    echo -e "${YELLOW}Platform-specific files:${NC}"
    echo "• macOS: BitcoinZ Blue-*-mac.zip"
    echo "• Windows: BitcoinZ Blue Setup *.exe"
    echo "• Linux: BitcoinZ Blue-*.AppImage, *.deb"
    echo ""
    echo -e "${YELLOW}To test macOS app:${NC}"
    echo "1. Extract the ZIP file"
    echo "2. Right-click on BitcoinZ Blue.app → Open"
    echo "3. Click 'Open' when security dialog appears"
}

# Main execution
main() {
    check_prerequisites
    clean_build
    install_deps
    build_native
    build_app
    
    # Ask which platforms to build
    echo -e "${YELLOW}Which platforms would you like to build for?${NC}"
    echo "1) macOS only"
    echo "2) Windows only"
    echo "3) Linux only"
    echo "4) All platforms"
    echo ""
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            build_mac
            ;;
        2)
            build_windows
            ;;
        3)
            build_linux
            ;;
        4)
            build_mac
            build_windows
            build_linux
            ;;
        *)
            echo -e "${RED}Invalid choice. Building for current platform only.${NC}"
            if [[ "$PLATFORM" == "Darwin" ]]; then
                build_mac
            elif [[ "$PLATFORM" == "Linux" ]]; then
                build_linux
            fi
            ;;
    esac
    
    # Run local signing tests
    sign_locally
    
    # Show results
    show_results
}

# Run main function
main
