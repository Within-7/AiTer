# AiTer Auto-Installer Script for Windows
# Automatically downloads and installs AiTer from GitHub Releases
# Handles Windows SmartScreen and automatic installation

#Requires -RunAsAdministrator

param(
    [switch]$Silent,
    [switch]$NoDesktopShortcut,
    [switch]$NoStartMenu
)

# GitHub repository information
$GITHUB_REPO = "Within-7/AiTer"
$GITHUB_API = "https://api.github.com/repos/$GITHUB_REPO/releases/latest"

# Color output functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   AiTer Auto-Installer for Windows        ║" -ForegroundColor Cyan
    Write-Host "║   GitHub: github.com/Within-7/AiTer        ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Get latest release information
# Uses releases page redirect instead of API to avoid rate limiting
function Get-LatestRelease {
    Write-Info "Fetching latest release information from GitHub..."

    $version = $null

    # First, try to get version from the releases/latest redirect (no API, no rate limit)
    try {
        $latestUrl = "https://github.com/$GITHUB_REPO/releases/latest"
        $request = [System.Net.WebRequest]::Create($latestUrl)
        $request.AllowAutoRedirect = $false
        $request.Method = "HEAD"
        $response = $request.GetResponse()
        $redirectUrl = $response.GetResponseHeader("Location")
        $response.Close()

        if ($redirectUrl) {
            # Extract version from redirect URL (e.g., .../releases/tag/v0.1.20 -> 0.1.20)
            if ($redirectUrl -match '/tag/v?(.+)$') {
                $version = $matches[1]
            }
        }
    }
    catch {
        Write-Info "Redirect method failed, trying API..."
    }

    # Fallback: try API (may fail if rate limited)
    if (-not $version) {
        try {
            $response = Invoke-RestMethod -Uri $GITHUB_API -Method Get -ErrorAction Stop
            $version = $response.tag_name -replace '^v', ''
        }
        catch {
            Write-Error "Failed to fetch release information: $($_.Exception.Message)"
            Write-Info "Tip: Try disabling proxy or use direct download links from:"
            Write-Info "  https://github.com/$GITHUB_REPO/releases/latest"
            exit 1
        }
    }

    if (-not $version) {
        Write-Error "Could not determine latest version."
        exit 1
    }

    # Construct download URL directly (no API needed)
    $fileName = "AiTer-$version-win-x64.exe"
    $downloadUrl = "https://github.com/$GITHUB_REPO/releases/download/v$version/$fileName"

    # Verify the URL exists
    try {
        $request = [System.Net.WebRequest]::Create($downloadUrl)
        $request.Method = "HEAD"
        $request.AllowAutoRedirect = $true
        $response = $request.GetResponse()
        $fileSize = [math]::Round($response.ContentLength / 1MB, 2)
        $response.Close()
    }
    catch {
        Write-Error "Download URL not accessible: $downloadUrl"
        Write-Info "Please check https://github.com/$GITHUB_REPO/releases/latest manually"
        exit 1
    }

    Write-Success "Latest version: v$version"
    Write-Info "File: $fileName ($fileSize MB)"
    Write-Info "Download URL: $downloadUrl"

    return @{
        Version = $version
        DownloadUrl = $downloadUrl
        FileName = $fileName
        FileSize = $fileSize
    }
}

# Download installer
function Get-Installer {
    param(
        [string]$Url,
        [string]$OutputPath
    )

    Write-Info "Downloading AiTer installer..."

    try {
        # Use BITS transfer for better progress and resume capability
        Import-Module BitsTransfer -ErrorAction SilentlyContinue

        if (Get-Module -Name BitsTransfer) {
            Start-BitsTransfer -Source $Url -Destination $OutputPath -Description "Downloading AiTer" -ErrorAction Stop
        }
        else {
            # Fallback to Invoke-WebRequest with progress
            $ProgressPreference = 'Continue'
            Invoke-WebRequest -Uri $Url -OutFile $OutputPath -ErrorAction Stop
        }

        Write-Success "Download completed: $OutputPath"
        return $true
    }
    catch {
        Write-Error "Download failed: $($_.Exception.Message)"
        return $false
    }
}

# Install application
function Install-AiTer {
    param(
        [string]$InstallerPath,
        [bool]$Silent,
        [bool]$NoDesktopShortcut,
        [bool]$NoStartMenu
    )

    Write-Info "Installing AiTer..."

    # Build installer arguments
    $arguments = @()

    if ($Silent) {
        $arguments += "/S"  # Silent install
    }

    if ($NoDesktopShortcut) {
        $arguments += "/NoDesktopShortcut"
    }

    if ($NoStartMenu) {
        $arguments += "/NoStartMenu"
    }

    try {
        if ($Silent) {
            Write-Info "Running silent installation..."
            $process = Start-Process -FilePath $InstallerPath -ArgumentList $arguments -Wait -PassThru -ErrorAction Stop
        }
        else {
            Write-Warning "Windows SmartScreen may show a security warning."
            Write-Info "If prompted, click 'More info' then 'Run anyway'"
            Write-Info "Running installer (GUI mode)..."
            $process = Start-Process -FilePath $InstallerPath -ArgumentList $arguments -Wait -PassThru -ErrorAction Stop
        }

        if ($process.ExitCode -eq 0) {
            Write-Success "Installation completed successfully!"
            return $true
        }
        else {
            Write-Error "Installation failed with exit code: $($process.ExitCode)"
            return $false
        }
    }
    catch {
        Write-Error "Installation failed: $($_.Exception.Message)"
        return $false
    }
}

# Cleanup temporary files
function Remove-TempFiles {
    param([string]$FilePath)

    if (Test-Path $FilePath) {
        Write-Info "Cleaning up temporary files..."
        Remove-Item $FilePath -Force -ErrorAction SilentlyContinue
        Write-Success "Cleanup complete"
    }
}

# Main installation flow
function Main {
    Write-Header

    # Check administrator privileges
    if (-not (Test-Administrator)) {
        Write-Warning "This script requires administrator privileges."
        Write-Info "Please run PowerShell as Administrator and try again."
        Write-Info ""
        Write-Info "Quick way: Right-click PowerShell and select 'Run as Administrator'"
        exit 1
    }

    # Get latest release
    $release = Get-LatestRelease

    # Create temp directory
    $tempDir = $env:TEMP
    $installerPath = Join-Path $tempDir $release.FileName

    # Download installer
    $downloadSuccess = Get-Installer -Url $release.DownloadUrl -OutputPath $installerPath

    if (-not $downloadSuccess) {
        exit 1
    }

    # Install
    $installSuccess = Install-AiTer -InstallerPath $installerPath -Silent $Silent -NoDesktopShortcut $NoDesktopShortcut -NoStartMenu $NoStartMenu

    # Cleanup
    Remove-TempFiles -FilePath $installerPath

    # Final message
    Write-Host ""
    if ($installSuccess) {
        Write-Success "🎉 AiTer has been installed successfully!"
        Write-Host ""
        Write-Info "You can now launch AiTer from:"
        Write-Host "  - Start Menu" -ForegroundColor White
        if (-not $NoDesktopShortcut) {
            Write-Host "  - Desktop shortcut" -ForegroundColor White
        }
        Write-Host "  - Or search for 'AiTer' in Windows Search" -ForegroundColor White
    }
    else {
        Write-Error "Installation failed. Please try again or download manually from:"
        Write-Host "  https://github.com/$GITHUB_REPO/releases" -ForegroundColor White
    }
    Write-Host ""
}

# Run main function
try {
    Main
}
catch {
    Write-Error "An unexpected error occurred: $($_.Exception.Message)"
    exit 1
}
