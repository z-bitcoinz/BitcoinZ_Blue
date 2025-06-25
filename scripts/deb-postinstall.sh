#!/bin/bash

# Create wrapper script for BitcoinZ Blue
cat > /usr/bin/bitcoinz-wallet-lite-wrapper << 'EOF'
#!/bin/bash
export LD_LIBRARY_PATH="/opt/BitcoinZ Blue:${LD_LIBRARY_PATH}"
exec "/opt/BitcoinZ Blue/bitcoinz-wallet-lite" "$@"
EOF

# Make wrapper executable
chmod +x /usr/bin/bitcoinz-wallet-lite-wrapper

# Update desktop file to use wrapper
if [ -f "/usr/share/applications/bitcoinz-wallet-lite.desktop" ]; then
    sed -i 's|Exec=.*|Exec=bitcoinz-wallet-lite-wrapper %U|' "/usr/share/applications/bitcoinz-wallet-lite.desktop"
fi

exit 0