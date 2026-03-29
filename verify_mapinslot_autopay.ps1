$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression.FileSystem

$jar = "$env:APPDATA\.minecraft\mods\mapinslot-1.0.0.jar"
$zip = [System.IO.Compression.ZipFile]::OpenRead($jar)

try {
  $entry = $zip.GetEntry('dev/verz/casinorigger/client/CasinoriggerClient.class')
  if ($null -eq $entry) {
    throw 'Class entry missing'
  }

  $reader = New-Object System.IO.BinaryReader($entry.Open())
  try {
    $bytes = $reader.ReadBytes([int]$entry.Length)
  } finally {
    $reader.Close()
  }

  $text = [System.Text.Encoding]::ASCII.GetString($bytes)
  if ($text.Contains('pay qvde 4b')) {
    Write-Output 'FOUND: pay qvde 4b'
  } else {
    Write-Output 'MISSING: pay qvde 4b'
  }

  if ($text.Contains('pay d_up 650m')) {
    Write-Output 'STILL FOUND: pay d_up 650m'
  } else {
    Write-Output 'OLD STRING GONE'
  }
} finally {
  $zip.Dispose()
}
