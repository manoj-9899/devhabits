# DevHabits Git Workflow

To maintain a clean, readable, and scalable repository history, we follow a standardized Git workflow. All contributors are expected to adhere to these guidelines.

## 1. Branching Strategy

We use a simplified Git Flow approach focusing on short-lived feature branches branching off from `main`.

### Branch Naming Convention
Branches should be named using the following format:
`[type]/[issue-number]-[short-description]`

**Types:**
- `feat/`: For new features or significant enhancements.
- `fix/`: For bug fixes.
- `docs/`: For documentation changes.
- `refactor/`: For code refactoring without adding features or fixing bugs.
- `chore/`: For routine tasks, dependency updates, or configuration changes.

**Examples:**
- `feat/12-add-dark-mode`
- `fix/34-resolve-cli-crash`
- `docs/45-update-setup-guide`

## 2. Conventional Commits

We use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This leads to more readable messages that are easy to follow when looking through the project history, and allows automated changelog generation.

### Commit Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Allowed Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

### Examples
- `feat(cli): add habit stats command`
- `fix(ui): resolve overflow issue on mobile dashboard`
- `docs: update README with usage examples`
- `chore: update prettier configuration`

## 3. Pull Request Process

1. **Keep it focused**: A PR should ideally address a single issue or feature. Large PRs are difficult to review.
2. **Rebase, don't merge**: Before opening a PR, rebase your branch on top of the latest `main` branch to resolve any conflicts locally.
   ```bash
   git fetch origin
   git rebase origin/main
   ```
3. **Draft PRs**: If you want feedback on a work-in-progress, open the PR as a Draft.
4. **Review**: Wait for at least one maintainer to review and approve your code. All CI checks must pass before merging.
5. **Squash and Merge**: When a PR is approved, it will typically be squashed into a single commit on the `main` branch to keep the history linear and clean.
