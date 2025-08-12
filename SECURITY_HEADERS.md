# Security Headers Configuration

ToolJet allows you to configure security headers through your `.env` file to meet your organization's security requirements.

## Configuration via .env File

Add these variables to your `.env` file to customize security headers:

### `PERMISSIONS_POLICY`
Controls browser permissions for features like camera, microphone, and autoplay.

**Default:** `microphone=(self), camera=(self), autoplay=(self)`

**Add to .env file:**
```env
# Enable camera and microphone for current origin (recommended for screen recording tools like Loom)
PERMISSIONS_POLICY=microphone=(self), camera=(self), autoplay=(self)

# Block all camera and microphone access
PERMISSIONS_POLICY=microphone=(), camera=(), autoplay=(self)

# Allow camera/microphone for specific domains
PERMISSIONS_POLICY=microphone=(self https://trusted-domain.com), camera=(self https://trusted-domain.com), autoplay=(self)
```

### `REFERRER_POLICY`
Controls how much referrer information is sent with requests.

**Default:** `strict-origin-when-cross-origin`

**Add to .env file:**
```env
# Recommended setting (default)
REFERRER_POLICY=strict-origin-when-cross-origin

# Most restrictive - no referrer information sent
REFERRER_POLICY=no-referrer

# Send full URL for same-origin requests only
REFERRER_POLICY=same-origin
```

### `X_CONTENT_TYPE_OPTIONS`
Prevents MIME type sniffing attacks.

**Default:** `nosniff`

**Add to .env file:**
```env
# Recommended setting (default)
X_CONTENT_TYPE_OPTIONS=nosniff
```

### `X_XSS_PROTECTION`
Enables XSS filtering in older browsers.

**Default:** `1; mode=block`

**Add to .env file:**
```env
# Recommended setting (default)
X_XSS_PROTECTION=1; mode=block

# Disable XSS protection (not recommended)
X_XSS_PROTECTION=0
```

### `CROSS_ORIGIN_OPENER_POLICY`
Controls how windows opened via `window.open()` can interact with the opener.

**Default:** `same-origin`

**Add to .env file:**
```env
# Recommended setting (default)
CROSS_ORIGIN_OPENER_POLICY=same-origin

# Most restrictive
CROSS_ORIGIN_OPENER_POLICY=same-origin-allow-popups

# Allow all interactions
CROSS_ORIGIN_OPENER_POLICY=unsafe-none
```

### `CUSTOM_HEADERS`
Add any additional HTTP headers you need.

**Format:** `"Header-Name: value, Another-Header: value"`

**Add to .env file:**
```env
# Add custom security headers
CUSTOM_HEADERS=X-Robots-Tag: noindex, X-DNS-Prefetch-Control: off

# Add HSTS and other headers
CUSTOM_HEADERS=Strict-Transport-Security: max-age=31536000; includeSubDomains, X-Permitted-Cross-Domain-Policies: none

# Add compliance headers
CUSTOM_HEADERS=X-My-Organization: internal, X-Environment: production
```

## Common Use Cases

### Enable Screen Recording (Loom, etc.)
Add to your `.env` file:
```env
PERMISSIONS_POLICY=microphone=(self), camera=(self), autoplay=(self)
```

### High Security Environment
Add to your `.env` file:
```env
PERMISSIONS_POLICY=microphone=(), camera=(), autoplay=()
REFERRER_POLICY=no-referrer
X_CONTENT_TYPE_OPTIONS=nosniff
X_XSS_PROTECTION=1; mode=block
CROSS_ORIGIN_OPENER_POLICY=same-origin
```

### Allow Specific Trusted Domains
Add to your `.env` file:
```env
PERMISSIONS_POLICY=microphone=(self https://trusted-recording-tool.com), camera=(self https://trusted-recording-tool.com), autoplay=(self)
```

## Testing Your Configuration

After setting environment variables and restarting ToolJet, you can verify the headers are applied by:

1. **Browser Developer Tools:**
   - Open Network tab
   - Refresh the page
   - Check Response Headers

2. **Command Line:**
   ```bash
   curl -I https://your-tooljet-instance.com
   ```

3. **Check ToolJet Logs:**
   The server will log the configured Permissions Policy on startup.

## Security Best Practices

1. **Start Restrictive:** Begin with the most restrictive policies and gradually allow what your organization needs.

2. **Test Thoroughly:** Test all ToolJet features after changing security headers to ensure nothing breaks.

3. **Monitor Usage:** Use browser developer tools to identify any blocked features.

4. **Document Changes:** Keep track of your security header configuration for compliance and troubleshooting.

## Troubleshooting

### Camera/Microphone Access Issues
- Check `PERMISSIONS_POLICY` includes `camera=(self), microphone=(self)`
- Ensure your browser supports the features you're trying to use
- Some features may require HTTPS to work properly

### Content Not Loading
- Check if `X_CONTENT_TYPE_OPTIONS` is too restrictive
- Verify CSP settings in the main application configuration

### Popup/Window Issues
- Adjust `CROSS_ORIGIN_OPENER_POLICY` if legitimate popups are being blocked