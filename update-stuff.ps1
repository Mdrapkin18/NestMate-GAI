# --- Sync local -> GitHub (overwrite overlaps, keep remote-only files) ---
# 1) Make sure we have the latest refs and figure out the default branch safely
git fetch origin

# Try to read "origin/HEAD" (usually origin/main). Fallback to main/master if needed.
$remoteDefault = (git rev-parse --abbrev-ref origin/HEAD 2>$null) -replace '^origin/',''
if ([string]::IsNullOrWhiteSpace($remoteDefault)) {
  $remoteDefault = (git branch -r |
    ForEach-Object { $_.ToString().Trim() } |
    Where-Object { $_ -match 'origin/(main|master)$' } |
    Select-Object -First 1) -replace '^origin/',''
  if ([string]::IsNullOrWhiteSpace($remoteDefault)) { $remoteDefault = 'main' }
}
# Sanitize in case any stray tokens slipped in
$remoteDefault = $remoteDefault.Trim().Split()[0]

Write-Host "Using remote default branch:" $remoteDefault

# 2) Ensure we’re on a real local branch with the same name
git checkout -B $remoteDefault

# 3) Commit local changes (so they participate in the merge)
git add -A
$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Local update before merge ($ts)" --allow-empty

# 4) Merge REMOTE into LOCAL, preferring LOCAL on conflicts.
#    This overwrites overlapping files with your versions, while preserving files that exist only on GitHub.
git merge --allow-unrelated-histories -s recursive -X ours origin/$remoteDefault -m "Merge origin/$remoteDefault (prefer local on conflicts)"

# 5) Push result to GitHub
git push -u origin $remoteDefault
