# 🎮 RAGE:MP Development Settings Guide

**Last Updated:** December 26, 2024  
**Project:** GangGPT  
**Status:** ✅ Connection Issues Resolved - Development Configuration Optimized

---

## 📋 Overview

This document covers RAGE:MP development settings that can improve debugging, development workflow, and troubleshooting for the GangGPT project. These settings have been researched and tested as part of resolving the persistent connection issues.

## 🔧 Current Configuration Status

### ✅ Active Development Settings

The current `ragemp-server/conf.json` includes these development-optimized settings:

```json
{
    "maxplayers": 1000,
    "name": "GangGPT - AI-Powered Roleplay Server",
    "gamemode": "Gang AI Roleplay",
    "port": 22005,
    "bind": "0.0.0.0",
    "allow-cef-debugging": true,
    "timeout": 30000,
    "connection-timeout": 120000,
    "download-timeout": 600000,
    "enable-http-security": false,
    "voice-chat": false,
    "fastdl": true,
    "resource-scan-thread-limit": 50
}
```

## 🛠️ Available Development Settings

### 1. CEF Debugging Configuration

#### `allow-cef-debugging` (Boolean)
- **Current Value:** `true`
- **Purpose:** Enables Chromium Embedded Framework debugging
- **Benefits:** 
  - Allows debugging of client-side web interfaces
  - Enables Chrome DevTools for RAGE:MP browser instances
  - Useful for debugging custom UIs and web elements
- **Recommended:** `true` for development, `false` for production

#### CEF Debug Port
- **Default:** RAGE:MP automatically assigns CEF debugging ports
- **Access:** Open Chrome and navigate to `chrome://inspect` to see RAGE:MP CEF instances
- **Usage:** Debug clientside JavaScript, CSS, and HTML in game interfaces

### 2. Security & HTTP Settings

#### `enable-http-security` (Boolean)
- **Current Value:** `false`
- **Purpose:** Disables HTTP security restrictions for development
- **Benefits:**
  - Allows connections from localhost and development environments
  - Reduces CORS and security-related connection issues
  - Enables easier integration with development backend services
- **Recommended:** `false` for development, `true` for production

### 3. Connection & Timeout Settings

#### `connection-timeout` (Integer - milliseconds)
- **Current Value:** `120000` (2 minutes)
- **Purpose:** Maximum time to wait for client connections
- **Benefits:** 
  - Prevents premature disconnections during debugging
  - Allows time for breakpoint debugging
  - Reduces "connection lost" errors during development

#### `download-timeout` (Integer - milliseconds)
- **Current Value:** `600000` (10 minutes)
- **Purpose:** Maximum time for clients to download resources
- **Benefits:**
  - Prevents timeouts when downloading large development resources
  - Allows for slower connections during testing

### 4. Advanced Debug Configuration

#### Debug Mode Configuration (Used in debug scripts)
When using `scripts/start-debug-mode.ps1`, additional settings are applied:

```json
{
    "debug": true,
    "console-logging": true,
    "log-level": "debug",
    "log-file": "./logs/debug-timestamp/ragemp.log",
    "sync-rate": 60,
    "max-ping": 150,
    "min-fps": 30
}
```

### 5. Command Line Development Flags

#### Available Debug Arguments
The RAGE:MP server supports these command line arguments for enhanced debugging:

```bash
ragemp-server.exe --debug --console --log-level debug
```

- `--debug`: Enables debug mode
- `--console`: Shows console output
- `--log-level debug`: Sets verbose logging
- `--config conf-debug.json`: Use alternative config file

## 🔍 Experimental Options (Advanced)

### Resource Scanning
- `resource-scan-thread-limit`: Controls concurrent resource loading
- **Current Value:** `50`
- **Purpose:** Optimizes server startup time and resource loading

### Network Optimization
- `sync-rate`: Server tick rate for synchronization
- **Recommended:** `60` for development, higher for production
- `max-ping`: Maximum allowed client ping
- `min-fps`: Minimum client FPS requirement

## 🚀 Development Workflow Integration

### VS Code Tasks Integration
Development settings are automatically applied when using VS Code tasks:

- **"GangGPT: Start RAGE:MP Server"** - Uses standard configuration
- **Debug Mode Scripts** - Applies enhanced debug configuration

### PowerShell Debug Scripts
The project includes several debug-enabled startup scripts:

1. **`scripts/start-debug-mode.ps1`**
   - Applies all development settings
   - Enables verbose logging
   - Creates debug configuration files

2. **`scripts/start-dev-complete.ps1`**
   - Integrated development environment
   - Network diagnostics
   - Health monitoring

## 📊 Performance Impact

### Development vs Production Settings

| Setting | Development | Production | Impact |
|---------|-------------|------------|---------|
| `allow-cef-debugging` | `true` | `false` | Minimal performance impact |
| `enable-http-security` | `false` | `true` | Security vs accessibility |
| `debug` mode | `true` | `false` | Increased logging overhead |
| `console-logging` | `true` | `false` | Disk I/O for logs |
| Extended timeouts | High values | Lower values | Memory usage |

## 🔒 Security Considerations

### Development Environment
- ✅ `enable-http-security: false` - Safe for localhost development
- ✅ `allow-cef-debugging: true` - Local access only
- ✅ Extended timeouts - No security risk in development

### Production Environment
- ❌ Disable CEF debugging in production
- ❌ Enable HTTP security restrictions
- ❌ Reduce timeout values to prevent resource exhaustion
- ❌ Disable verbose logging to reduce disk usage

## 🛠️ Troubleshooting with Development Settings

### Connection Issues
1. **Enable debug logging** - `"log-level": "debug"`
2. **Increase timeouts** - Prevent premature disconnections
3. **Disable HTTP security** - Reduce connection restrictions

### Performance Issues  
1. **Adjust sync-rate** - Balance responsiveness vs performance
2. **Monitor resource scanning** - Optimize thread limits
3. **Review ping/FPS limits** - Ensure clients can connect

### UI/Interface Issues
1. **Enable CEF debugging** - Debug web interfaces
2. **Use Chrome DevTools** - Inspect clientside code
3. **Disable security restrictions** - Allow local connections

## 📝 Configuration Templates

### Development Configuration (conf-dev.json)
```json
{
    "port": 22005,
    "name": "GangGPT Development Server",
    "maxplayers": 100,
    "announce": false,
    "allow-cef-debugging": true,
    "enable-http-security": false,
    "debug": true,
    "console-logging": true,
    "log-level": "debug",
    "connection-timeout": 120000,
    "download-timeout": 600000,
    "sync-rate": 60,
    "max-ping": 200,
    "min-fps": 20
}
```

### Production Configuration (conf-prod.json)
```json
{
    "port": 22005,
    "name": "GangGPT - AI-Powered Roleplay Server",
    "maxplayers": 1000,
    "announce": true,
    "allow-cef-debugging": false,
    "enable-http-security": true,
    "debug": false,
    "console-logging": false,
    "log-level": "info",
    "connection-timeout": 30000,
    "download-timeout": 300000,
    "sync-rate": 120,
    "max-ping": 150,
    "min-fps": 30
}
```

## 🎯 Recommendations

### For GangGPT Development

1. **Keep current settings** - The existing configuration is optimized for development
2. **Use debug scripts** - Leverage `start-debug-mode.ps1` for troubleshooting
3. **Monitor logs** - Enable verbose logging when investigating issues
4. **Test with production settings** - Periodically test with production-like configuration

### Future Improvements

1. **CEF Port Configuration** - RAGE:MP handles this automatically, but monitor for conflicts
2. **Custom Debug UI** - Leverage CEF debugging for enhanced development tools
3. **Performance Profiling** - Use debug settings to identify bottlenecks
4. **Automated Configuration Switching** - Scripts to toggle between dev/prod settings

---

## 📚 Additional Resources

- [RAGE:MP Documentation](https://wiki.rage.mp/)
- [CEF Debugging Guide](https://bitbucket.org/chromiumembedded/cef/wiki/Tutorial)
- [GangGPT Configuration Files](../ragemp-server/conf.json)
- [Debug Scripts](../scripts/)

---

**✅ Status:** Connection issues resolved, development settings optimized for GangGPT workflow.
**🔄 Next Steps:** Continue development with current optimized configuration.
