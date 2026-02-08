# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: security@tick-md.dev

Include:
- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We'll respond within 48 hours and work with you to understand and resolve the issue.

## Security Considerations

### TICK.md Files
- TICK.md files are plain text and committed to Git
- Avoid storing sensitive data (API keys, passwords, etc.) in task descriptions
- Use `.gitignore` patterns if you need private notes

### MCP Server
- Runs locally on your machine
- Has access to filesystem (for TICK.md)
- Does not send data to external servers
- Trusts AI agents to follow task coordination protocol

### Lock Files
- `.tick/lock` files are advisory only
- Not suitable for security/access control
- Use Git and filesystem permissions for security

## Best Practices

1. **Run with least privilege**: Don't run as root/administrator
2. **Review AI agent actions**: Monitor what agents are doing
3. **Keep dependencies updated**: Use `npm audit`
4. **Validate inputs**: The CLI validates TICK.md structure
5. **Use Git**: Version control protects against data loss

## Known Limitations

- **No authentication**: Anyone with filesystem access can modify TICK.md
- **No encryption**: Files are plain text
- **Advisory locking**: `.tick/lock` can be bypassed

For secure multi-user coordination, use Git permissions and branch protection rules.
