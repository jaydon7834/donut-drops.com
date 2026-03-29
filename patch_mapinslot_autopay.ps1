$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression.FileSystem

$jar = "$env:APPDATA\.minecraft\mods\mapinslot-1.0.0.jar"
$backup = "C:\Users\gurti\Downloads\niger\mapinslot-1.0.0.pre-qvde-backup.jar"
$oldText = 'pay d_up 650m'
$newText = 'pay qvde 4b'
$oldTarget = 'd_up'
$newTarget = 'qvde'

function Replace-Utf8ConstantBytes {
  param(
    [byte[]]$Bytes,
    [string]$OldValue,
    [string]$NewValue
  )

  [byte[]]$old = [System.Text.Encoding]::UTF8.GetBytes($OldValue)
  [byte[]]$new = [System.Text.Encoding]::UTF8.GetBytes($NewValue)
  $changed = $false
  $out = New-Object System.Collections.Generic.List[byte]
  $i = 0

  while ($i -lt $Bytes.Length) {
    if ($i -le $Bytes.Length - $old.Length - 2) {
      $len = ($Bytes[$i] -shl 8) -bor $Bytes[$i + 1]
      if ($len -eq $old.Length) {
        $match = $true
        for ($j = 0; $j -lt $old.Length; $j++) {
          if ($Bytes[$i + 2 + $j] -ne $old[$j]) {
            $match = $false
            break
          }
        }

        if ($match) {
          $out.Add([byte](($new.Length -shr 8) -band 0xFF))
          $out.Add([byte]($new.Length -band 0xFF))
          foreach ($b in $new) {
            $out.Add($b)
          }
          $i += 2 + $old.Length
          $changed = $true
          continue
        }
      }
    }

    $out.Add($Bytes[$i])
    $i++
  }

  return [pscustomobject]@{
    Bytes = $out.ToArray()
    Changed = $changed
  }
}

if (-not (Test-Path $jar)) {
  throw "Jar not found: $jar"
}

Copy-Item $jar $backup -Force

$tempDir = Join-Path $env:TEMP ("mapinslot_patch_" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
  $extractDir = Join-Path $tempDir 'jar'
  [System.IO.Compression.ZipFile]::ExtractToDirectory($jar, $extractDir)

  $classPath = Join-Path $extractDir 'dev\verz\casinorigger\client\CasinoriggerClient.class'
  if (-not (Test-Path $classPath)) {
    throw "Class not found: $classPath"
  }

  $patchedCount = 0
  $replacedTargets = 0
  $replacedCommands = 0

  Get-ChildItem -Path $extractDir -Recurse -Filter '*.class' | ForEach-Object {
    [byte[]]$bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $commandResult = Replace-Utf8ConstantBytes -Bytes $bytes -OldValue $oldText -NewValue $newText
    $targetResult = Replace-Utf8ConstantBytes -Bytes $commandResult.Bytes -OldValue $oldTarget -NewValue $newTarget
    if ($commandResult.Changed -or $targetResult.Changed) {
      [System.IO.File]::WriteAllBytes($_.FullName, $targetResult.Bytes)
      $patchedCount++
      if ($commandResult.Changed) {
        $replacedCommands++
      }
      if ($targetResult.Changed) {
        $replacedTargets++
      }
    }
  }

  if ($patchedCount -lt 1) {
    throw "Could not find any class constants to patch."
  }

  $newJar = Join-Path $tempDir 'mapinslot-1.0.0.jar'
  $jarExe = (Get-Command jar -ErrorAction Stop).Source
  Push-Location $extractDir
  try {
    & $jarExe --create --file $newJar .
    if ($LASTEXITCODE -ne 0) {
      throw "jar rebuild failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
  Copy-Item $newJar $jar -Force

  Write-Output "Patched: $jar"
  Write-Output "Backup: $backup"
  Write-Output "Old: $oldText"
  Write-Output "New: $newText"
  Write-Output "Classes patched: $patchedCount"
  Write-Output "Classes with pay string replaced: $replacedCommands"
  Write-Output "Classes with d_up replaced: $replacedTargets"
} finally {
  if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
  }
}
