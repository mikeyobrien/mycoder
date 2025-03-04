# GitHub Mode Markdown File Approach Test

This is a test to verify that using temporary markdown files for GitHub issues, PRs, and comments works correctly.

## Key Benefits
- Preserves formatting
- Handles newlines properly
- Supports special characters
- More robust than inline text

## Example Usage
```bash
# Create a temporary markdown file
cat > temp.md << 'EOF'
# Issue Title

## Description
This is a description with proper
newlines and formatting.

- Bullet point 1
- Bullet point 2

```code block
example code
```
EOF

# Use the file with GitHub CLI
gh issue create --title "Test Issue" --body-file temp.md

# Clean up
rm temp.md
```

This approach should fix issue #83.