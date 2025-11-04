# Sync local -> GitHub while keeping remote-only files
$Repo = "https://github.com/Mdrapkin18/NestMate-GAI.git"

# Ensure git exists
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "Git is not installed or not in PATH."; exit 1
}

# Init + set remote
if (-not (Test-Path ".git")) { git init | Out-Null }
if (-not (git remote | Select-String -Quiet '^origin$')) {
  git remote add origin $Repo
} else {
  git remote set-url origin $Repo
}

# Fetch and detect remote default branch
git fetch origin
$remoteDefault = (git ls-remote --symref origin HEAD 2>$null) -replace '.*refs/heads/','' -replace '\s+HEAD',''
if (-not $remoteDefault) { $remoteDefault = "main" }

# Be on a real branch (use remote default name)
$current = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
if (-not $current -or $current -eq "HEAD") { git checkout -B $remoteDefault }

# Commit local work (so it’s included in the merge)
git add -A
$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Local update before merge ($ts)" --allow-empty

# Merge remote INTO local, preferring LOCAL on conflicts, but KEEPING remote-only files
git merge --allow-unrelated-histories -s recursive -X ours origin/$remoteDefault -m "Merge origin/$remoteDefault (prefer local on conflicts)"

# Push result to GitHub
git push -u origin $remoteDefault
