# Contributing to DevHabits

First off, thank you for considering contributing to DevHabits! It's people like you that make DevHabits such a great tool for developers.

## 1. Where do I go from here?
If you've noticed a bug or have a feature request, make one! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

## 2. Fork & create a branch
If this is something you think you can fix, then fork DevHabits and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):
```bash
git checkout -b fix/issue-325-button-alignment
```

## 3. Local Development Setup
Follow the [Quick Start](README.md#quick-start) guide in the README to get your local environment running.

## 4. Conventional Commits
We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Please format your commit messages accordingly:
- `feat: added new awesome feature`
- `fix: resolved button alignment issue on mobile`
- `docs: updated readme with new setup step`

## 5. Implement your fix or feature
At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first.

## 6. Make a Pull Request
At this point, you should switch back to your master branch and make sure it's up to date with DevHabits's main branch:

```bash
git remote add upstream https://github.com/yourusername/devhabits.git
git checkout main
git pull upstream main
```

Then update your feature branch from your local copy of main, and push it!

```bash
git checkout fix/issue-325-button-alignment
git rebase main
git push --set-upstream origin fix/issue-325-button-alignment
```

Finally, go to GitHub and make a Pull Request!
