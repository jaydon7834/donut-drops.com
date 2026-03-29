param(
  [Parameter(Mandatory = $true)]
  [string]$JarPath
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression.FileSystem

$backup = $JarPath -replace '\.jar$', '.webhook-cleanup-backup.jar'
Copy-Item $JarPath $backup -Force

$temp = Join-Path $env:TEMP ("jar_edit_" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null

try {
  $extract = Join-Path $temp 'extract'
  [System.IO.Compression.ZipFile]::ExtractToDirectory($JarPath, $extract)

  $targets = @(
    (Join-Path $extract 'overlay.py'),
    (Join-Path $extract '__pycache__\overlay.cpython-314.pyc')
  )

  foreach ($target in $targets) {
    if (Test-Path $target) {
      Remove-Item $target -Force
      Write-Output "REMOVED: $target"
    }
  }

  $pycacheDir = Join-Path $extract '__pycache__'
  if (Test-Path $pycacheDir) {
    $remaining = Get-ChildItem $pycacheDir -Force | Select-Object -First 1
    if ($null -eq $remaining) {
      Remove-Item $pycacheDir -Force
      Write-Output "REMOVED: $pycacheDir"
    }
  }

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
