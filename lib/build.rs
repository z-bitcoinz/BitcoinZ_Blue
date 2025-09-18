fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Try to use system protoc if available to avoid CMake issues
    if std::process::Command::new("protoc")
        .arg("--version")
        .output()
        .is_ok()
    {
        std::env::set_var("PROTOC", "protoc");
    }

    tonic_build::configure()
        .build_server(true)
        .compile(&["proto/service.proto", "proto/compact_formats.proto"], &["proto"])?;
    println!("cargo:rerun-if-changed=proto/service.proto");
    Ok(())
}
