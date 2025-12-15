#!/bin/bash

# Script to download Node.js LTS binaries for AiTer
# This will download Node.js for macOS (Intel and Apple Silicon) and Windows

set -e

# Configuration
NODE_VERSION="v20.18.0"  # LTS version as of 2024
BASE_URL="https://nodejs.org/dist"
RESOURCES_DIR="./resources/nodejs"

# Create resources directory
mkdir -p "$RESOURCES_DIR"

# Function to download and extract Node.js
download_nodejs() {
    local platform=$1
    local arch=$2
    local ext=$3

    local filename="node-${NODE_VERSION}-${platform}-${arch}.${ext}"
    local url="${BASE_URL}/${NODE_VERSION}/${filename}"
    local target_dir="${RESOURCES_DIR}/${platform}-${arch}"

    echo "Downloading Node.js ${NODE_VERSION} for ${platform}-${arch}..."
    echo "URL: ${url}"

    # Create target directory
    mkdir -p "${target_dir}"

    # Download file
    curl -# -L "${url}" -o "/tmp/${filename}"

    # Extract based on extension
    if [ "${ext}" = "tar.gz" ]; then
        echo "Extracting ${filename}..."
        tar -xzf "/tmp/${filename}" -C "${target_dir}" --strip-components=1
    elif [ "${ext}" = "zip" ]; then
        echo "Extracting ${filename}..."
        unzip -q "/tmp/${filename}" -d "${target_dir}"
        # Move files from nested directory
        mv "${target_dir}/node-${NODE_VERSION}-${platform}-${arch}"/* "${target_dir}/"
        rmdir "${target_dir}/node-${NODE_VERSION}-${platform}-${arch}"
    fi

    # Clean up
    rm "/tmp/${filename}"

    echo "✓ Downloaded and extracted ${platform}-${arch}"
}

# Download for macOS Intel (x64)
download_nodejs "darwin" "x64" "tar.gz"

# Download for macOS Apple Silicon (arm64)
download_nodejs "darwin" "arm64" "tar.gz"

# Download for Windows (x64)
download_nodejs "win32" "x64" "zip"

echo ""
echo "✓ All Node.js binaries downloaded successfully!"
echo ""
echo "Directory structure:"
tree -L 2 "${RESOURCES_DIR}" || ls -R "${RESOURCES_DIR}"
