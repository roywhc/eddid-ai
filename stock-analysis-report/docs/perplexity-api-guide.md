## Perplexity API Developer Integration Guide

### Overview

The Perplexity API provides powerful web search and AI chat capabilities, enabling developers to integrate real-time web information and citation-based answers into their applications. The Sonar API family is designed for fast search and deep reasoning, and is fully compatible with OpenAI client libraries. [1][2]

### Quick Start

#### 1. Obtain an API Key

First, visit the Perplexity API console to obtain your API key: [3][4]

- Log in to **perplexity.ai** and create an account
- Go to **Settings > API** or directly visit **perplexity.ai/settings/api**
- Click the **“Generate API Key”** button
- Securely store the generated key (format: `pplx-xxxxxxxx`)

**Important Security Tips**: [1][3]
- Never expose API keys in client-side code or public repositories
- Store keys using environment variables or secure key management services
- Rotate keys regularly and monitor for abnormal usage

#### 2. Install the SDK

**Python**: [4]
```bash
pip install perplexityai
```

**Node.js / TypeScript**: [5]
```bash
npm install @perplexity-ai/perplexity_ai
```

#### 3. Your First API Call

**Using the Perplexity SDK (Python)**: [4]

```python
from perplexity import Perplexity

# Initialize the client (uses PERPLEXITY_API_KEY environment variable)
client = Perplexity()

# Make a request
completion = client.chat.completions.create(
    model="sonar-pro",
    messages=[
        {"role": "user", "content": "What are the latest developments in quantum computing?"}
    ]
)

# Print the response
print(completion.choices[0].message.content)
```

**Using the OpenAI SDK (Compatibility Mode)**: [6]

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://api.perplexity.ai"
)

response = client.chat.completions.create(
    model="sonar-pro",
    messages=[
        {"role": "system", "content": "Be concise."},
        {"role": "user", "content": "Explain the basic concepts of machine learning"}
    ]
)

print(response.choices[0].message.content)
```

**cURL Example**: [7][3]

```bash
curl -X POST https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar-pro",
    "messages": [
      {"role": "system", "content": "Be concise."},
      {"role": "user", "content": "How many stars are there in the Milky Way?"}
    ],
    "max_tokens": 500,
    "temperature": 0.7
  }'
```

### Available Models

Perplexity offers several Sonar model variants: [8][9][10][11]

| Model Name | Purpose | Rate Limit (RPM) | Use Cases |
|-----------|---------|------------------|-----------|
| `sonar` | Lightweight, fast search | 50 | Basic Q&A, quick retrieval |
| `sonar-pro` | Deep search and reasoning | 50 | Complex queries, multi-step reasoning, more citations |
| `sonar-reasoning` | Real-time reasoning search | 50 | Tasks requiring logical reasoning |
| `sonar-reasoning-pro` | Advanced reasoning (DeepSeek-R1) | 50 | Deep analysis, complex problem-solving |
| `sonar-deep-research` | In-depth research reports | 5 | Comprehensive research, long-form reports |

**Model Selection Tips**: [12][11]
- **Sonar**: Speed-first, cost-sensitive lightweight tasks
- **Sonar Pro**: Complex queries requiring larger context windows and more citations
- **Sonar Reasoning Pro**: Advanced analytical tasks requiring transparent reasoning

### Core Parameter Configuration

#### Required Parameters [6][1]

```python
{
    "model": "sonar-pro",           # Required: select a model
    "messages": [                   # Required: conversation history
        {"role": "user", "content": "Your question"}
    ]
}
```

#### Common Optional Parameters [13][1][6]

```python
{
    "temperature": 0.7,              # Controls randomness (0.0–2.0), default 0.2
    "max_tokens": 1000,              # Limits response length
    "top_p": 0.9,                    # Nucleus sampling parameter
    "stream": False,                 # Enable streaming responses
    "frequency_penalty": 0.0,        # Frequency penalty (-2.0 to 2.0)
    "presence_penalty": 0.0          # Presence penalty (-2.0 to 2.0)
}
```

#### Perplexity-Specific Parameters [14][13][6]

```python
{
    "search_domain_filter": ["nature.com", "science.org"],  # Restrict or exclude domains (max 20)
    "search_recency_filter": "month",                       # Filter by recency (week/day/month)
    "return_images": True,                                  # Include image URLs in the response
    "return_related_questions": True,                       # Include related questions
    "search_mode": "academic"                               # Search mode (web/academic)
}
```

### Advanced Features

#### 1. Streaming Responses

Streaming allows you to receive partial generated content in real time, ideal for long responses and interactive user experiences. [15][16]

**Python Example**: [15]

```python
from perplexity import Perplexity

client = Perplexity()

stream = client.chat.completions.create(
    model="sonar",
    messages=[{"role": "user", "content": "What are the latest AI research developments?"}],
    stream=True
)

# Process streaming output
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

**Streaming with Metadata**: [15]

```python
def stream_with_metadata():
    client = Perplexity()
    stream = client.chat.completions.create(
        model="sonar",
        messages=[{"role": "user", "content": "Explain quantum computing"}],
        stream=True
    )
    
    content = ""
    search_results = []
    usage_info = None
    
    for chunk in stream:
        if chunk.choices[0].delta.content:
            content += chunk.choices[0].delta.content
            print(chunk.choices[0].delta.content, end="", flush=True)
        
        if hasattr(chunk, 'search_results') and chunk.search_results:
            search_results = chunk.search_results
        
        if hasattr(chunk, 'usage') and chunk.usage:
            usage_info = chunk.usage
        
        if chunk.choices[0].finish_reason:
            print(f"\n\nSearch results: {len(search_results)} items")
            print(f"Usage info: {usage_info}")
    
    return content, search_results, usage_info
```

#### 2. Domain Filtering

The `search_domain_filter` parameter allows precise control over search sources. [17][14]

**Allowlist Mode** (search only specified domains): [14]

```python
response = client.chat.completions.create(
    model="sonar-pro",
    messages=[{"role": "user", "content": "Climate change research"}],
    extra_body={
        "search_domain_filter": ["nature.com", "science.org", "cell.com"]
    }
)
```

**Denylist Mode** (exclude specific domains using `-` prefix): [14]

```python
response = client.chat.completions.create(
    model="sonar-pro",
    messages=[{"role": "user", "content": "Latest renewable energy developments"}],
    extra_body={
        "search_domain_filter": ["-pinterest.com", "-reddit.com", "-quora.com"]
    }
)
```

**Flexible Matching**: [14]
- **Root domain filtering**: `"wikipedia.org"` matches all subdomains
- **Top-level domain filtering**: `".gov"` matches all government websites
- **Partial domain matching**: any domain component can be used as a filter

#### 3. Image Return Control

Control image sources and formats included in responses. [18]

**Basic Usage**: [18]

```python
completion = client.chat.completions.create(
    model="sonar",
    return_images=True,
    messages=[{"role": "user", "content": "Show images of Mount Everest"}]
)
```

**Filter Image Domains**: [18]

```python
completion = client.chat.completions.create(
    model="sonar",
    return_images=True,
    image_domain_filter=["-gettyimages.com"],
    messages=[{"role": "user", "content": "What is today’s weather in London?"}]
)
```

**Filter Image Formats**: [18]

```python
# Return only GIFs
completion = client.chat.completions.create(
    model="sonar",
    return_images=True,
    image_format_filter=["gif"],
    messages=[{"role": "user", "content": "Show a funny cat gif"}]
)

# Multiple formats
completion = client.chat.completions.create(
    model="sonar",
    return_images=True,
    image_format_filter=["jpg", "png", "webp"],
    messages=[{"role": "user", "content": "Show high-quality landscape images"}]
)
```

#### 4. Structured Output

Enforce specific response formats using JSON Schema. [19][20]

**Using Pydantic (Recommended)**: [20]

```python
from pydantic import BaseModel
from perplexity import Perplexity

class FinancialMetrics(BaseModel):
    revenue: float
    net_income: float
    earnings_per_share: float
    quarter: str

client = Perplexity()
completion = client.chat.completions.create(
    model="sonar-pro",
    messages=[{
        "role": "user",
        "content": "Analyze Apple’s latest quarterly earnings and extract key financial metrics."
    }],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "schema": FinancialMetrics.model_json_schema()
        }
    }
)

metrics = FinancialMetrics.model_validate_json(
    completion.choices[0].message.content
)
print(f"Revenue: ${metrics.revenue}B")
```

**Manual JSON Schema**: [20]

```python
response_format = {
    "type": "json_schema",
    "json_schema": {
        "schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "summary": {"type": "string"},
                "key_points": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["title", "summary"]
        }
    }
}
```

**Notes**: [20]
- First-time use of a new JSON Schema may require 10–30 seconds of setup
- Recursive schemas are not supported
- Unconstrained objects (e.g., `dict[str, Any]`) are not supported

#### 5. Asynchronous Chat Completions

For long-running queries, use the async API to avoid timeouts. [21][22]

**Create an Async Job**: [21]

```bash
curl -X POST https://api.perplexity.ai/async/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "model": "sonar-deep-research",
      "messages": [
        {"role": "user", "content": "Conduct in-depth market research analysis"}
      ]
    }
  }'
```

**Response Includes a Job ID**: [21]
```json
{
  "id": "async_job_12345",
  "status": "CREATED",
  "created_at": 1234567890
}
```

**Check Job Status**: [22]

```bash
curl -X GET https://api.perplexity.ai/async/chat/completions/{job_id} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Status Flow**: `CREATED` → `IN_PROGRESS` → `COMPLETED` / `FAILED` [21]

### Error Handling & Best Practices

#### 1. Exception Handling

**Python SDK Error Types**: [23][24]

```python
import perplexity
from perplexity import Perplexity

client = Perplexity()

try:
    response = client.chat.completions.create(
        model="sonar-pro",
        messages=[{"role": "user", "content": "Your query"}]
    )
except perplexity.APIConnectionError:
    print("Network connection failed")
except perplexity.RateLimitError as e:
    print("Rate limit exceeded")
    print(f"Retry after: {e.response.headers.get('Retry-After')}")
except perplexity.AuthenticationError:
    print("Invalid API key or authentication failed")
except perplexity.APIStatusError as e:
    print(f"API error: {e.status_code}")
    print(f"Request ID: {e.response.headers.get('X-Request-ID')}")
    print(f"Error details: {e.message}")
except perplexity.ValidationError as e:
    print(f"Validation error: {e}")
except Exception as e:
    print(f"Unexpected error: {type(e).__name__}: {e}")
```

#### 2. Retry Logic & Exponential Backoff

**Automatic Retry Implementation**: [25][23]

```python
import time
import random
import perplexity

def query_with_retry(client, query, max_retries=3):
    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(
                model="sonar-pro",
                messages=[{"role": "user", "content": query}],
                stream=True
            )
        except (perplexity.APIConnectionError, perplexity.APITimeoutError):
            if attempt == max_retries - 1:
                raise
            wait_time = (2 ** attempt) + (random.random() * 0.1)
            print(f"Retry {attempt + 1}/{max_retries}, waiting {wait_time:.2f}s...")
            time.sleep(wait_time)
        except perplexity.RateLimitError as e:
            retry_after = int(e.response.headers.get('Retry-After', 60))
            print(f"Rate limited, waiting {retry_after} seconds...")
            time.sleep(retry_after)
```

#### 3. Rate Limit Management

**Current Rate Limits**: [26][8]

| Endpoint | Rate Limit | Burst |
|---------|------------|-------|
| Chat Completions (all Sonar models) | 50 RPM | – |
| `sonar-deep-research` | 5 RPM | – |
| POST `/search` | 50 req/s | 50 req |
| Async jobs (create) | 5 RPM | – |
| Async jobs (status) | 3000 RPM | – |
| Async jobs (results) | 6000 RPM | – |

**Best Practices**: [8][25]
- Implement request queues and rate limiters
- Use exponential backoff for `429` errors
- Cache infrequently changing responses
- Choose the smallest suitable model to optimize quota usage

#### 4. Response Validation

**Validate API Key**: [27]

```python
import requests

def validate_api_key(api_key):
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "sonar",
        "messages": [{"role": "user", "content": "Test"}]
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False
```

### Pricing & Cost Optimization

#### Pricing Structure [28][29][30]

**Subscription Plans**:
- **Free**: No API access
- **Pro** ($20/month or $200/year): $5 monthly API credit
- **Enterprise Pro** ($40/user/month): Custom quotas

**Usage-Based Pricing**: [30][28]
- **Sonar**: ~$0.2–0.5 / million tokens (most economical)
- **Sonar Pro**: ~$1–2 / million tokens
- **Sonar Reasoning Pro**: ~$3–5 / million tokens

**Cost Optimization Tips**: [30][25]
- Use `max_tokens` to limit response length
- Use `sonar` instead of `sonar-pro` for simple queries
- Cache frequent queries
- Narrow search scope with `search_domain_filter`
- Monitor usage dashboards regularly

### Security & Compliance

#### 1. API Key Management [24][3][1]

**Environment Variable Setup**: [4]

```bash
# macOS/Linux
export PERPLEXITY_API_KEY="your_api_key_here"

# Windows
setx PERPLEXITY_API_KEY "your_api_key_here"
```

**Using Environment Variables in Code**:

```python
import os
from perplexity import Perplexity

api_key = os.getenv("PERPLEXITY_API_KEY")
client = Perplexity(api_key=api_key)
```

#### 2. Data Privacy [28]

- **Enterprise**: Uploaded files retained for no more than 7 days
- **No Training Use**: Enterprise data is not used to train AI models
- **Access Control**: Strict access control and anonymized data collection

### Complete Example Project

#### Intelligent Search Assistant

```python
from perplexity import Perplexity
import perplexity
import os
from datetime import datetime

class PerplexitySearchAssistant:
    def __init__(self):
        self.client = Perplexity(api_key=os.getenv("PERPLEXITY_API_KEY"))
        self.conversation_history = []
    
    def search(self, query, use_pro=False, filters=None):
        model = "sonar-pro" if use_pro else "sonar"
        messages = [{"role": "user", "content": query}]
        extra_params = {}
        
        if filters:
            if 'domains' in filters:
                extra_params['search_domain_filter'] = filters['domains']
            if 'recency' in filters:
                extra_params['search_recency_filter'] = filters['recency']
            if 'return_images' in filters:
                extra_params['return_images'] = filters['return_images']
        
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                extra_body=extra_params
            )
            
            result = {
                'content': response.choices[0].message.content,
                'search_results': getattr(response, 'search_results', []),
                'usage': response.usage,
                'timestamp': datetime.now().isoformat()
            }
            
            self.conversation_history.append({
                'query': query,
                'result': result
            })
            
            return result
        except perplexity.RateLimitError:
            return {'error': 'Rate limit exceeded'}
        except perplexity.AuthenticationError:
            return {'error': 'Invalid API key'}
        except Exception as e:
            return {'error': f'Unexpected error: {str(e)}'}
    
    def stream_search(self, query):
        stream = self.client.chat.completions.create(
            model="sonar",
            messages=[{"role": "user", "content": query}],
            stream=True
        )
        
        full_content = ""
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_content += content
                yield content
        
        return full_content
```

### Troubleshooting FAQ

#### 1. Authentication Errors [31][25]

**Problem**: `401 Unauthorized` or `403 Forbidden`

**Solutions**:
- Verify API key format (should start with `pplx-`)
- Ensure correct Bearer token format
- Check if the key is expired or revoked

#### 2. 400 Bad Request [25]

**Common Causes**:
- Invalid model name
- Missing required parameters (`model`, `messages`)
- Invalid JSON format
- Parameter limits exceeded

#### 3. 429 Rate Limit Errors [32][8]

**Handling Strategies**:
- Implement exponential backoff
- Check the `Retry-After` header
- Reduce request frequency or upgrade your plan

### Additional Resources

**Official Documentation**: [33][34][4]
- Quickstart: https://docs.perplexity.ai/getting-started/quickstart
- API Reference: https://docs.perplexity.ai/api-reference
- Cookbook: https://docs.perplexity.ai/cookbook

**Community Support**:
- Discord community
- Email: api@perplexity.ai
- GitHub examples: https://github.com/ppl-ai/api-cookbook [2]

By following this guide, you should be able to successfully integrate the Perplexity API into your application. Always follow best practices, implement proper error handling, and choose the right model and parameters for your use case.