#[macro_use]
extern crate rust_embed;

pub mod blaze;
pub mod commands;
pub mod compact_formats;
pub mod grpc_connector;
pub mod lightclient;
pub mod lightwallet;
pub mod bitcoinz_params;

#[cfg(feature = "embed_params")]
#[derive(RustEmbed)]
#[folder = "zcash-params/"]
pub struct SaplingParams;

#[derive(RustEmbed)]
#[folder = "pubkey/"]
pub struct ServerCert;

pub use zcash_primitives::consensus::Parameters;
pub use crate::bitcoinz_params::{BitcoinZMainNetwork as MainNetwork, BITCOINZ_MAINNET};

// pub mod blaze;
// pub mod compact_formats;
// pub mod grpc_connector;
// pub mod lightclient;
// pub mod lightwallet;

// use lightclient::LightClient;

// fn main() {
//     let seed = std::fs::read_to_string("./testdata/seed.txt").unwrap();
//     let lc = LightClient::new(Some(seed)).unwrap();
//     lc.start_sync();
// }
