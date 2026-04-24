# Contributing to DevHabits

First off, thank you for considering contributing to DevHabits! It's people like you that make DevHabits such a great tool for developers.

We welcome all types of contributions, from bug fixes and new features to documentation improvements and UI enhancements.

## 1. Where do I go from here?
If you've noticed a bug or have a feature request, please open an issue first! It's generally best if you get confirmation of your bug or approval for your feature request before starting to code.

## 2. Setting Up Your Environment
Follow the [Quick Start](README.md#quick-start) guide in the README to get your local environment running.

Before submitting code, ensure you have formatting tools installed. We use Prettier to maintain a consistent code style. Run the following command to format your code:

```bash
npm run format
```

## 3. Git Workflow & Branching
We adhere to a strict branching strategy and commit convention to keep the repository history clean.

Please read our full [Git Workflow Guide](docs/GIT_WORKFLOW.md) before creating your branch and making commits. 

**Quick Summary:**
- Branch names should follow `<type>/<issue-number>-<brief-description>` (e.g., `feat/123-add-dark-mode` or `fix/456-button-alignment`).
- We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Format your commit messages like `feat: added new awesome feature` or `fix: resolved button alignment`.

## 4. Make a Pull Request
When you're ready to submit your code:

1. Switch back to your local `main` branch and ensure it's up to date with the remote upstream repository.
2. Rebase your feature branch onto `main`.
3. Push your feature branch to your fork.
4. Open a Pull Request against the `main` branch of the main DevHabits repository.

Make sure your Pull Request description clearly explains the problem you are solving, the approach you took, and includes any relevant screenshots if you made UI changes.

Thank you for contributing!
