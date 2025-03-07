# Wordy3

A word-building game with strategic elements, time pressure, and competitive features.

## Overview

Wordy3 is a game where players create words from letters that appear over time. The game features:
- Strategic elements through multipliers
- Time pressure through dropping letters
- Competitive elements via leaderboards
- Replay functionality

## Development

This project is being developed in phases. See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for detailed information about:
- Work packages
- Git landmarks
- Testing strategy
- Documentation requirements

### Getting Started

1. Clone the repository
```bash
git clone [repository-url]
cd wordy3
```

2. Check development plan
```bash
# Review the current phase
cat DEVELOPMENT_PLAN.md
```

3. Use Git landmarks
```bash
# List all version tags
git tag -l

# View specific version
git checkout v0.X.0
```

### Git Workflow

1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat(scope): Description"

# Push changes
git push origin feature/your-feature
```

2. Recovery
```bash
# Soft reset (keep changes)
git reset --soft v0.X.0

# Hard reset (complete revert)
git reset --hard v0.X.0

# Create recovery branch
git checkout -b recovery/feature-attempt2 v0.X.0
```

## Game Rules

### Letter System
- Configurable sequence length (30-100 letters)
- Default length: 55 letters
- Letter tray holds 0-7 letters
- Letter point values:
  - 1 point: A, E, I, L, N, O, R, S, T, U
  - 2 points: D, G
  - 3 points: B, C, M, P
  - 4 points: F, H, V, W, Y
  - 5 points: K
  - 8 points: J, X
  - 10 points: Q, Z

### Gameplay
- Letters appear every 3 seconds (6 seconds when tray is full)
- Minimum 4 letters maintained when possible
- Words must be 3+ letters
- Invalid words and dropped letters reset multipliers
- Multiple scoring multipliers can stack

### Scoring System
- Base points are calculated from letter values
- Valid words:
  - Earn base points × current multiplier
  - Increase multiplier by 1 for next word
- Invalid words:
  - Subtract base points (no multiplier)
  - Reset multiplier to 1
- Consecutive valid words build multiplier chain

## Deployment

For detailed instructions on how to deploy Wordy3 online, see [DEPLOYMENT.md](DEPLOYMENT.md).

## License

[License details to be added]
