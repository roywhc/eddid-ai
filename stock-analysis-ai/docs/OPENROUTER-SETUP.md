# OpenRouter Integration Guide

## Overview

The system now supports OpenRouter as the default LLM provider. OpenRouter provides access to 300+ language models through a unified API, including models from OpenAI, Anthropic, Google, Meta, and more.

## Benefits of OpenRouter

1. **Multiple Model Access**: Access to 300+ models from various providers
2. **Unified API**: Single API interface for all models
3. **Cost Optimization**: Compare pricing across providers
4. **Fallback Support**: Automatic fallback if a model is unavailable
5. **OpenAI-Compatible**: Uses OpenAI SDK, so it's easy to switch

## Configuration

### 1. Get OpenRouter API Key

1. Sign up at [OpenRouter.ai](https://openrouter.ai)
2. Go to [Keys](https://openrouter.ai/keys) to create an API key
3. Copy your API key

### 2. Update .env File

```bash
# Set provider to openrouter
LLM_PROVIDER=openrouter

# Set your OpenRouter API key
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Choose a model (OpenRouter format: provider/model)
LLM_MODEL=openai/gpt-4-turbo
# Or use other models:
# LLM_MODEL=anthropic/claude-3-opus
# LLM_MODEL=google/gemini-pro
# LLM_MODEL=meta-llama/llama-3-70b-instruct
```

### 3. Model Format

OpenRouter uses the format: `provider/model-name`

Examples:
- `openai/gpt-4-turbo` - OpenAI GPT-4 Turbo
- `openai/gpt-3.5-turbo` - OpenAI GPT-3.5 Turbo
- `anthropic/claude-3-opus` - Anthropic Claude 3 Opus
- `anthropic/claude-3-sonnet` - Anthropic Claude 3 Sonnet
- `google/gemini-pro` - Google Gemini Pro
- `meta-llama/llama-3-70b-instruct` - Meta Llama 3 70B

See [OpenRouter Models](https://openrouter.ai/models) for the full list.

## Usage

The LLM service automatically uses OpenRouter when configured:

```python
from app.services.llm_service import LLMService

llm = LLMService()

# Generate text
response = await llm.generate("What is the capital of France?")

# Chat completion
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
]
response = await llm.chat(messages)
```

## Switching Providers

### Use OpenRouter (Default)
```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-key
LLM_MODEL=openai/gpt-4-turbo
```

### Use OpenAI Direct
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your-key
LLM_MODEL=gpt-4-turbo-preview
```

### Use Azure OpenAI
```bash
LLM_PROVIDER=azure_openai
AZURE_OPENAI_API_KEY=your-key
# Additional Azure config needed
```

## Model Selection Tips

1. **Cost vs Performance**: 
   - `openai/gpt-3.5-turbo` - Fast and cheap
   - `openai/gpt-4-turbo` - Better quality, higher cost
   - `anthropic/claude-3-opus` - Best quality, highest cost

2. **Speed**:
   - GPT-3.5 Turbo is fastest
   - GPT-4 Turbo is balanced
   - Claude Opus is slower but highest quality

3. **Context Length**:
   - Check model limits on OpenRouter
   - Some models support 200K+ tokens

## Pricing

OpenRouter charges per token. Check [OpenRouter Pricing](https://openrouter.ai/models) for current rates.

Example costs (approximate):
- GPT-3.5 Turbo: $0.50 / 1M input tokens
- GPT-4 Turbo: $10 / 1M input tokens
- Claude 3 Opus: $15 / 1M input tokens

## Troubleshooting

### Error: "OpenRouter API key is required"
- Make sure `OPENROUTER_API_KEY` is set in `.env`
- Verify the key is correct (starts with `sk-or-v1-`)

### Error: "Model not found"
- Check the model name format: `provider/model-name`
- Verify the model exists on OpenRouter
- Some models may require credits or special access

### Rate Limits
- OpenRouter has rate limits based on your plan
- Free tier: 10 requests/minute
- Paid plans: Higher limits

## Advanced Configuration

### Custom Headers
The service automatically includes:
- `HTTP-Referer`: For analytics
- `X-Title`: Application name

You can modify these in `app/services/llm_service.py`.

### Model-Specific Parameters
Some models support additional parameters. Check OpenRouter docs for:
- `top_p`
- `top_k`
- `frequency_penalty`
- `presence_penalty`

## Migration from OpenAI

If you're migrating from OpenAI:

1. Update `.env`:
   ```bash
   LLM_PROVIDER=openrouter
   OPENROUTER_API_KEY=your-key
   LLM_MODEL=openai/gpt-4-turbo  # Same model, via OpenRouter
   ```

2. No code changes needed - the service handles it automatically!

## Support

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/models)

