# LLM Usage Calculator

<p align="center">
  <h3 align="center">Track and Optimize Your LLM API Costs</h3>
  <p align="center">An open-source service to calculate and monitor usage costs across multiple LLM providers</p>
</p>

<p align="center">
  <img src="https://github.com/kingchan818/llm-usage-calculator/actions/workflows/release.yml/badge.svg">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>



## Features

- 🌟 **Multi-Provider Support**: Calculate costs for OpenAI, Fireworks, and Perplexity APIs
- 💰 **Accurate Cost Tracking**: Per-token cost calculation with model-specific pricing
- 🚀 **Cache-Aware Pricing**: Optimized cost calculation considering cached tokens
- 🔌 **Easy Integration**: Simple REST API endpoints for all LLM providers

## Supported Providers and Models

### OpenAI
- GPT-4 and variants (with different pricing for input/output tokens)
- GPT-4 Mini models
- O3 Mini models
- Cache-hit optimized pricing

### Fireworks
- DeepSeek v3 and r1
- Llama v3 variants (8B, 405B, 70B)

### Perplexity
- Sonar models (Reasoning, Pro, Base)

## Quick Start

1. Install dependencies:
```bash
$ pnpm install
```

2. Configure your environment:
```bash
$ cp .env.example .env
# Edit .env with your API keys
```

3. Start the service:
```bash
# Development
$ pnpm run start:dev

# Production
$ pnpm run start:prod
```

## API Usage

### Calculate Chat Completion Costs

```bash
curl -X POST http://localhost:3031/openai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

The response includes token usage and cost calculations:
```json
{
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  },
  "cost": 0.000075
}
```

## Development

### Running Tests

```bash
# Unit tests
$ pnpm run test

# Test coverage
$ pnpm run test:cov
```

### Adding New Providers

1. Add provider endpoint to `apiMappings`
2. Define cost configuration in `costMappingWithoutCacheHit`
3. Implement cache-hit pricing if supported
4. Update tests

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is [MIT licensed](LICENSE).

## Support

- 📫 For bugs and feature requests, please [create an issue](https://github.com/your-username/llm-usage-cal/issues)
- ⭐ If you find this project helpful, please give it a star!
