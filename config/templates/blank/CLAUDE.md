# CLAUDE.md

This file provides guidance to Claude Code CLI and Minto CLI when working in this project.

## Project Overview

{{PROJECT_NAME}} - Created with AiTer

## Core Rules (MUST FOLLOW)

### Rule 1: Git Commit After Every Task

**Every task completion MUST be followed by a git commit.**

After completing any task that involves file operations (create, modify, update, delete), you MUST:

1. Stage all changes: `git add -A`
2. Create a descriptive commit with the following format:

```bash
git commit -m "$(cat <<'EOF'
<type>: <concise description>

<detailed description of changes>

Files changed:
- <list of files created/modified/deleted>

🤖 Generated with AI CLI
EOF
)"
```

**Commit types:**
- `feat`: New feature or content
- `fix`: Bug fix or correction
- `update`: Updates to existing content
- `refactor`: Restructuring without changing functionality
- `docs`: Documentation changes
- `remove`: Deleted files or content

**This ensures:**
- Every operation is trackable and reversible
- User can rollback to any previous state
- Clear history of all AI-assisted work

### Rule 2: Maintain Project Index

**Every task completion MUST update the project index file.**

After completing any task, you MUST update `PROJECT_INDEX.md` in the project root:

1. If the file doesn't exist, create it
2. Add/update entries for any files that were created, modified, or deleted
3. Update the "Last Updated" timestamp
4. Include a brief summary of the latest changes

The index format is defined in `PROJECT_INDEX.md` template below.

## Project Index Template

When creating or updating `PROJECT_INDEX.md`, use this structure:

```markdown
# Project Index

> Auto-maintained index of project files and their purposes.
> Last Updated: {{TIMESTAMP}}

## Quick Summary

- **Total Files**: X
- **Last Change**: <brief description>
- **Project Status**: Active/Completed/Archived

## Directory Structure

\`\`\`
{{PROJECT_NAME}}/
├── CLAUDE.md          # AI CLI configuration
├── PROJECT_INDEX.md   # This index file
├── ...
\`\`\`

## File Registry

### Documents
| File | Purpose | Last Modified | Status |
|------|---------|---------------|--------|
| example.md | Description | YYYY-MM-DD | Active |

### Data Files
| File | Purpose | Last Modified | Status |
|------|---------|---------------|--------|

### Output Files
| File | Purpose | Last Modified | Status |
|------|---------|---------------|--------|

## Change History

### [YYYY-MM-DD HH:MM]
- **Action**: Created/Modified/Deleted
- **Files**: list of affected files
- **Summary**: Brief description of changes

## Notes

<Any important notes about the project structure or files>
```

## Workflow Guidelines

1. **Before starting a task**: Read this file and `PROJECT_INDEX.md` to understand the project context
2. **During the task**: Follow the user's instructions carefully
3. **After completing the task**:
   - Commit all changes (Rule 1)
   - Update the project index (Rule 2)
   - Provide a summary to the user

## File Organization

Organize files in a clear, logical structure:

```
{{PROJECT_NAME}}/
├── CLAUDE.md              # AI CLI configuration (this file)
├── PROJECT_INDEX.md       # Project index and file registry
├── README.md              # Project documentation (optional)
├── docs/                  # Documentation files
├── data/                  # Input data files
├── output/                # Generated output files
└── assets/                # Images, media, and other assets
```

## Best Practices

- Use clear, descriptive file names
- Keep related files in appropriate directories
- Document any non-obvious file purposes in PROJECT_INDEX.md
- Make atomic commits (one logical change per commit)
- Write meaningful commit messages

---

*This project was created with AiTer - AI CLI Collaboration Platform*
