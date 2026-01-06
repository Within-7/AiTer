# CLAUDE.md

This file provides guidance to Claude Code CLI and Minto CLI when working in this project.

## Project Overview

{{PROJECT_NAME}} - Content Creation Project

This project is designed for copywriting, marketing content, SEO optimization, and content strategy tasks.

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
- `content`: New content piece created
- `draft`: Draft version of content
- `revision`: Content revision or editing
- `publish`: Content ready for publishing
- `feat`: New feature or section
- `fix`: Corrections or fixes
- `update`: Updates to existing content
- `remove`: Deleted content

**This ensures:**
- Every version of content is preserved
- User can compare or rollback to any version
- Clear history of content evolution

### Rule 2: Maintain Project Index

**Every task completion MUST update the project index file.**

After completing any task, you MUST update `PROJECT_INDEX.md` in the project root:

1. If the file doesn't exist, create it
2. Add/update entries for any files that were created, modified, or deleted
3. Update the "Last Updated" timestamp
4. Include a brief summary of the latest changes

## Content Project Structure

```
{{PROJECT_NAME}}/
├── CLAUDE.md              # AI CLI configuration (this file)
├── PROJECT_INDEX.md       # Project index and file registry
├── README.md              # Project overview
├── briefs/                # Content briefs and requirements
│   └── templates/         # Brief templates
├── drafts/                # Work in progress
│   ├── v1/                # First drafts
│   ├── v2/                # Revisions
│   └── final/             # Final versions
├── published/             # Published content archive
├── assets/                # Images, media files
│   ├── images/
│   └── media/
├── research/              # Background research
│   ├── competitors/
│   └── audience/
└── seo/                   # SEO materials
    ├── keywords/
    └── meta/
```

## Content Workflow

### Phase 1: Planning
1. Review content brief
2. Research topic and audience
3. Identify keywords (if SEO content)
4. Create outline

### Phase 2: Creation
1. Write first draft
2. Save to `drafts/v1/`
3. Commit with type `draft`

### Phase 3: Revision
1. Review and edit
2. Save revisions to `drafts/v2/`
3. Commit with type `revision`
4. Repeat until final

### Phase 4: Finalization
1. Final review
2. Move to `drafts/final/`
3. Commit with type `publish`

## Content Templates

### Blog Post Template
```markdown
# [Title]

> [Subtitle or hook]

## Introduction
[Engaging opening paragraph]

## [Main Section 1]
[Content]

## [Main Section 2]
[Content]

## [Main Section 3]
[Content]

## Conclusion
[Summary and call to action]

---
**Meta Information:**
- Target Keywords: [keywords]
- Word Count: [count]
- Target Audience: [audience]
- Status: Draft/Review/Final
```

### Social Media Template
```markdown
# Social Media Content

## Platform: [Platform Name]

### Post 1
**Content:**
[Post content]

**Hashtags:** #tag1 #tag2 #tag3
**Media:** [Image/Video description]
**CTA:** [Call to action]

### Post 2
...
```

### Email Template
```markdown
# Email: [Campaign Name]

**Subject Line:** [Subject]
**Preview Text:** [Preview]

---

[Salutation],

[Body paragraph 1]

[Body paragraph 2]

[Call to action]

[Closing],
[Signature]

---
**A/B Test Variants:**
- Subject A: [variant]
- Subject B: [variant]
```

## SEO Guidelines

When creating SEO content:

1. **Keyword Research**
   - Document target keywords in `seo/keywords/`
   - Include search volume and competition data

2. **On-Page SEO**
   - Title tag: Include primary keyword, under 60 characters
   - Meta description: Include keyword, under 160 characters
   - Headers: Use H1 for title, H2/H3 for sections
   - Keyword density: Natural usage, 1-2%

3. **Content Quality**
   - Minimum 800 words for blog posts
   - Include internal/external links
   - Add alt text for images

## Best Practices

1. **Version Control**: Save each significant revision
2. **Naming Convention**: `[date]-[topic]-[version].md`
3. **Metadata**: Include target keywords, audience, and status
4. **Review Process**: Mark content status clearly
5. **Asset Management**: Keep images organized in `assets/`

## Tools Integration

This template works well with:
- **Grammar/Style**: For content refinement
- **SEO Analysis**: For keyword optimization
- **Web Research**: For topic research

---

*This project was created with AiTer - AI CLI Collaboration Platform*
