use zcash_primitives::{
    consensus::{BlockHeight, NetworkUpgrade, Parameters},
};
use std::convert::TryFrom;

// BitcoinZ network parameters
#[derive(PartialEq, Copy, Clone, Debug)]
pub struct BitcoinZMainNetwork;

impl Parameters for BitcoinZMainNetwork {
    fn activation_height(&self, nu: NetworkUpgrade) -> Option<BlockHeight> {
        match nu {
            NetworkUpgrade::Overwinter => Some(BlockHeight::from(1)), 
            NetworkUpgrade::Sapling => Some(BlockHeight::from(328_500)), // BitcoinZ Sapling activation
            NetworkUpgrade::Blossom => None, // BitcoinZ doesn't have Blossom
            NetworkUpgrade::Heartwood => None, // BitcoinZ doesn't have Heartwood
            NetworkUpgrade::Canopy => None, // BitcoinZ doesn't have Canopy
            NetworkUpgrade::Nu5 => None, // BitcoinZ doesn't have Nu5
            #[cfg(feature = "zfuture")]
            NetworkUpgrade::ZFuture => None,
        }
    }


    fn coin_type(&self) -> u32 {
        177 // BitcoinZ coin type
    }

    fn hrp_sapling_extended_spending_key(&self) -> &str {
        "btcz-secret-extended-key-main"
    }

    fn hrp_sapling_extended_full_viewing_key(&self) -> &str {
        "btczxviews"
    }

    fn hrp_sapling_payment_address(&self) -> &str {
        "zs" // BitcoinZ uses same shielded address prefix as Zcash
    }

    fn b58_pubkey_address_prefix(&self) -> [u8; 2] {
        [0x1c, 0xb8] // Produces t1 addresses
    }

    fn b58_script_address_prefix(&self) -> [u8; 2] {
        [0x1c, 0xbd] // BitcoinZ script addresses
    }

    fn address_network(&self) -> Option<zcash_address::Network> {
        Some(zcash_address::Network::Main) // TODO: May need custom BitcoinZ network
    }
}

pub const BITCOINZ_MAINNET: BitcoinZMainNetwork = BitcoinZMainNetwork;

// BitcoinZ testnet parameters
#[derive(PartialEq, Copy, Clone, Debug)]
pub struct BitcoinZTestNetwork;

impl Parameters for BitcoinZTestNetwork {
    fn activation_height(&self, nu: NetworkUpgrade) -> Option<BlockHeight> {
        match nu {
            NetworkUpgrade::Overwinter => Some(BlockHeight::from(1)),
            NetworkUpgrade::Sapling => Some(BlockHeight::from(1)), // Testnet has Sapling from block 1
            NetworkUpgrade::Blossom => None,
            NetworkUpgrade::Heartwood => None,
            NetworkUpgrade::Canopy => None,
            NetworkUpgrade::Nu5 => None,
            #[cfg(feature = "zfuture")]
            NetworkUpgrade::ZFuture => None,
        }
    }


    fn coin_type(&self) -> u32 {
        1 // Testnet coin type
    }

    fn hrp_sapling_extended_spending_key(&self) -> &str {
        "secret-extended-key-test"
    }

    fn hrp_sapling_extended_full_viewing_key(&self) -> &str {
        "zxviewtestsapling"
    }

    fn hrp_sapling_payment_address(&self) -> &str {
        "ztestsapling" // BitcoinZ testnet uses same prefix as Zcash
    }

    fn b58_pubkey_address_prefix(&self) -> [u8; 2] {
        [0x1d, 0x25] // Produces tm addresses
    }

    fn b58_script_address_prefix(&self) -> [u8; 2] {
        [0x1c, 0xba] // BitcoinZ testnet script addresses
    }

    fn address_network(&self) -> Option<zcash_address::Network> {
        Some(zcash_address::Network::Test) // TODO: May need custom BitcoinZ testnet
    }
}

pub const BITCOINZ_TESTNET: BitcoinZTestNetwork = BitcoinZTestNetwork;