param(
  [Parameter(Mandatory = $true)]
  [string]$JarPath
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression.FileSystem

$backup = $JarPath -replace '\.jar$', '.webhooks-removed-backup.jar'
Copy-Item $JarPath $backup -Force

$temp = Join-Path $env:TEMP ("jar_webhook_" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null

try {
  $extract = Join-Path $temp 'extract'
  [System.IO.Compression.ZipFile]::ExtractToDirectory($JarPath, $extract)

  $fabric = Join-Path $extract 'fabric.mod.json'
  if (-not (Test-Path $fabric)) {
    throw "fabric.mod.json not found in $JarPath"
  }

  $text = Get-Content $fabric -Raw
  $text = $text -replace 'https://discord\.com/api/webhooks/[^\s"\\]+', ''
  $text = $text -replace '(?m)^.*Using a preset Discord webhook.*\r?\n?', ''
  $text = $text -replace '(?m)^.*Connects to a discord webhook.*\r?\n?', ''
  $text = $text -replace '(?m)^.*discord\.com/api/webhooks/.*\r?\n?', ''
  Set-Content $fabric $text

  $rebuilt = Join-Path $temp 'rebuilt.jar'
  Push-Location $extract
  try {
    & jar --create --file $rebuilt .
    if ($LASTEXITCODE -ne 0) {
      throw "jar rebuild failed with code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }

  Copy-Item $rebuilt $JarPath -Force
  Write-Output "CLEANED: $JarPath"
  Write-Output "BACKUP: $backup"
} finally {
  if (Test-Path $temp) {
    Remove-Item $temp -Recurse -Force
  }
}
