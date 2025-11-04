# Push current folder to GitHub repo (updates remote with your local code)
$Repo = "https://github.com/Mdrapkin18/NestMate-GAI.git"

# 0) Require git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "Git is not installed or not in PATH."; exit 1
}

# 1) Init repo if needed
if (-not (Test-Path ".git")) { git init | Out-Null }

# 2) Set 'origin' to your GitHub repo
if (-not (git remote | Select-String -Quiet '^origin$')) {
  git remote add origin $Repo
} else {
  git remote set-url origin $Repo
}

# 3) Detect remote default branch if it exists; fallback to 'main'
$defaultBranch = "main"
try {
  $sym = git ls-remote --symref origin HEAD 2>$null
  if ($sym) {
    $m = [regex]::Match($sym, 'refs/heads/([^\s]+)')
    if ($m.Success) { $defaultBranch = $m.Groups[1].Value }
  }
} catch {}

# 4) Ensure we’re on a real branch; create if needed
$current = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
if (-not $current -or $current -eq "HEAD") {
  git checkout -B $defaultBranch
} else {
  $defaultBranch = $current
}

# 5) (Optional) link upstream if remote branch exists
git fetch origin 2>$null
git branch --set-upstream-to=origin/$defaultBranch $defaultBranch 2>$null

# 6) Stage & commit everything (allow empty to avoid errors)
git add -A
$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Sync from local folder ($ts)" --allow-empty

# 7) Push to GitHub
git push -u origin $defaultBranch
