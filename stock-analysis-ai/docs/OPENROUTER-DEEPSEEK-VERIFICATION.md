# OpenRouter & DeepSeek Configuration Verification

**Date**: 2026-01-25  
**Purpose**: Ensure OpenRouter is correctly configured and using DeepSeek V3.2

## Changes Made

### 1. Enhanced Logging in LLM Service

Added comprehensive logging to verify:
- ✅ Provider configuration (should be `openrouter`)
- ✅ Model name (should be `deepseek/deepseek-v3.2`)
- ✅ Base URL (should be `https://openrouter.ai/api/v1`)
- ✅ Actual client base URL (to verify OpenRouter is being used)

### 2. Startup Configuration Logging

Added logging in `app/main.py` to display LLM configuration at startup:
- LLM Provider
- LLM Model
- OpenRouter Base URL
- OpenRouter API Key status

### 3. Request-Level Verification

Before each API call, the service now:
- Verifies the base URL contains `openrouter.ai`
- Validates model name format
- Logs all configuration details

## Verification Steps

### Step 1: Check Startup Logs

When you start the server, you should see:
```
=== Starting Agentic KB System ===
LLM Provider: openrouter
LLM Model: deepseek/deepseek-v3.2
OpenRouter Base URL: https://openrouter.ai/api/v1
OpenRouter API Key: SET
```

### Step 2: Check LLM Service Initialization

Look for:
```
Initializing OpenRouter client:
  - Base URL: https://openrouter.ai/api/v1
  - Model: deepseek/deepseek-v3.2
  - API Key: **********
✅ OpenRouter client initialized successfully with model: deepseek/deepseek-v3.2
```

### Step 3: Check API Call Logs

When making a chat request, you should see:
```
🔍 Verifying OpenRouter configuration:
  - Configured base URL: https://openrouter.ai/api/v1
  - Actual client base URL: https://openrouter.ai/api/v1
  - Model: deepseek/deepseek-v3.2
  - Provider setting: openrouter
✅ Verified OpenRouter base URL: https://openrouter.ai/api/v1
✅ Model name format correct: deepseek/deepseek-v3.2

Making LLM API call:
  - Provider: openrouter
  - Model: deepseek/deepseek-v3.2
  - Base URL: https://openrouter.ai/api/v1
  - Messages count: X
```

## Troubleshooting

### Issue: "This model is not available in your region" (403)

**Possible Causes**:
1. **Region Restriction**: DeepSeek V3.2 might have region restrictions on OpenRouter
2. **API Key Access**: Your OpenRouter API key might not have access to this model
3. **Model Availability**: The model might be temporarily unavailable

**Solutions**:

1. **Verify Model Availability**:
   - Check OpenRouter models page: https://openrouter.ai/models
   - Search for "deepseek-v3.2"
   - Verify it's available in your region

2. **Try Alternative Model**:
   If DeepSeek V3.2 is not available, try:
   ```bash
   # In .env file
   LLM_MODEL=deepseek/deepseek-chat
   # Or
   LLM_MODEL=deepseek/deepseek-r1
   ```

3. **Check API Key Permissions**:
   - Verify your OpenRouter API key has credits
   - Check if the key has access to DeepSeek models
   - Some models require paid plans

4. **Verify Configuration**:
   - Check logs to ensure base URL is `https://openrouter.ai/api/v1`
   - Verify model name is exactly `deepseek/deepseek-v3.2`
   - Ensure API key is set correctly

### Issue: Base URL doesn't contain 'openrouter.ai'

**Solution**:
- Check `.env` file has `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
- Verify `LLM_PROVIDER=openrouter` is set
- Restart the server

### Issue: Model name format incorrect

**Solution**:
- Ensure model is in format: `provider/model-name`
- For DeepSeek: `deepseek/deepseek-v3.2`
- Do NOT use: `deepseek-v3.2` or `deepseek/v3.2`

## Configuration Checklist

- [ ] `.env` file has `LLM_PROVIDER=openrouter`
- [ ] `.env` file has `LLM_MODEL=deepseek/deepseek-v3.2`
- [ ] `.env` file has `OPENROUTER_API_KEY=sk-or-v1-...`
- [ ] `.env` file has `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
- [ ] Server logs show OpenRouter initialization
- [ ] Server logs show correct base URL
- [ ] Server logs show correct model name

## Alternative Models

If DeepSeek V3.2 is not available, you can use:

1. **DeepSeek Chat**:
   ```bash
   LLM_MODEL=deepseek/deepseek-chat
   ```

2. **DeepSeek R1**:
   ```bash
   LLM_MODEL=deepseek/deepseek-r1
   ```

3. **Other Cost-Effective Models**:
   ```bash
   LLM_MODEL=openai/gpt-3.5-turbo  # Cheaper option
   LLM_MODEL=meta-llama/llama-3-70b-instruct  # Open source
   ```

## Next Steps

1. **Restart the server** to see the new logging
2. **Check startup logs** for configuration verification
3. **Make a test request** and check the detailed logs
4. **If 403 error persists**, try an alternative DeepSeek model or check OpenRouter model availability

---

**Status**: Enhanced logging added for OpenRouter/DeepSeek verification  
**Action Required**: Restart server and check logs
