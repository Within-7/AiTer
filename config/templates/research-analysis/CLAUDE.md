# CLAUDE.md

This file provides guidance to Claude Code CLI and Minto CLI when working in this project.

## Project Overview

{{PROJECT_NAME}} - Research & Analysis Project

This project is designed for market research, competitive analysis, data research, and strategic analysis tasks.

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
- `research`: New research findings or data
- `analysis`: Analysis results or insights
- `feat`: New feature or content
- `fix`: Corrections or updates
- `update`: Updates to existing content
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

## Research Project Structure

```
{{PROJECT_NAME}}/
├── CLAUDE.md              # AI CLI configuration (this file)
├── PROJECT_INDEX.md       # Project index and file registry
├── README.md              # Project summary and findings
├── research/              # Research materials
│   ├── sources/           # Source documents and references
│   ├── notes/             # Research notes
│   └── data/              # Raw data files
├── analysis/              # Analysis outputs
│   ├── reports/           # Analysis reports
│   ├── summaries/         # Executive summaries
│   └── visualizations/    # Charts, graphs, diagrams
├── deliverables/          # Final deliverables
│   ├── presentations/     # Presentation files
│   └── documents/         # Final documents
└── assets/                # Supporting assets
```

## Research Workflow

### Phase 1: Research Collection
1. Define research objectives
2. Identify information sources
3. Collect and organize source materials
4. Document sources in `research/sources/`

### Phase 2: Analysis
1. Review collected materials
2. Extract key insights
3. Perform comparative analysis
4. Document findings in `analysis/reports/`

### Phase 3: Synthesis
1. Consolidate findings
2. Draw conclusions
3. Create recommendations
4. Prepare deliverables

## Output Formats

### Research Report Template
```markdown
# [Topic] Research Report

## Executive Summary
Brief overview of findings

## Methodology
How research was conducted

## Key Findings
1. Finding 1
2. Finding 2
3. Finding 3

## Analysis
Detailed analysis of findings

## Recommendations
Actionable recommendations

## Sources
List of references

## Appendix
Supporting materials
```

### Competitive Analysis Template
```markdown
# Competitive Analysis: [Subject]

## Overview
| Competitor | Strengths | Weaknesses | Market Position |
|------------|-----------|------------|-----------------|
| A          |           |            |                 |
| B          |           |            |                 |

## Detailed Analysis

### Competitor A
- **Overview**:
- **Products/Services**:
- **Pricing**:
- **Market Strategy**:

### Key Differentiators

### Strategic Recommendations
```

## Best Practices

1. **Source Documentation**: Always cite sources and maintain reference integrity
2. **Data Organization**: Keep raw data separate from analysis
3. **Version Control**: Commit after each significant finding or analysis
4. **Structured Output**: Use consistent templates for deliverables
5. **Progressive Refinement**: Build analysis iteratively

## Tools Integration

This template is optimized for use with:
- **Web Search**: For market and competitive intelligence
- **Data Analysis**: For processing and analyzing data
- **Document Processing**: For reading and extracting from PDFs, reports

---

*This project was created with AiTer - AI CLI Collaboration Platform*
