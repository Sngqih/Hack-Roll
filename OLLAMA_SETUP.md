# Ollama Local LLM Setup Guide

This guide will help you set up Ollama to run a lightweight local LLM on your computer, which your web app can connect to for better dialogue generation.

## What is Ollama?

Ollama is a tool that lets you run large language models (LLMs) locally on your computer. It provides a simple API that your web app can connect to.

## Step 1: Download and Install Ollama

1. **Visit the Ollama website**: https://ollama.ai
2. **Download Ollama** for your operating system (Windows, macOS, or Linux)
3. **Install Ollama** by running the installer
4. **Verify installation**: Open a terminal/command prompt and type:
   ```bash
   ollama --version
   ```

## Step 2: Download a Lightweight Model

Ollama will download models on first use. Here are recommended lightweight models for dialogue:

### Option 1: Phi-3 (Recommended - ~3.8B parameters, ~2.3GB)
```bash
ollama pull phi3
```
**Pros**: Good dialogue quality, fast, works well on CPU
**Cons**: Slightly larger download

### Option 2: Qwen 3 (4B) (~4B parameters, ~2.5GB)
```bash
ollama pull qwen3:4b
```
**Pros**: Excellent for conversation, supports multiple languages
**Cons**: Larger than Phi-3

### Option 3: Llama 3.2 (3B) (~3B parameters, ~2GB)
```bash
ollama pull llama3.2:3b
```
**Pros**: Very good balance of size and quality
**Cons**: Newer model, may have quirks

### Option 4: TinyLlama (~1.1B parameters, ~650MB)
```bash
ollama pull tinyllama
```
**Pros**: Smallest, fastest, lowest memory usage
**Cons**: Lower quality dialogue

**Recommendation**: Start with **Phi-3** or **Llama 3.2 (3B)** for the best balance.

## Step 3: Start the Ollama Server

Ollama runs as a background service. After installation, it should start automatically. To verify:

1. **Check if Ollama is running**: Open a browser and go to `http://localhost:11434`
   - If you see an Ollama page or JSON response, it's running ✅
   - If you get an error, Ollama may not be running

2. **Start Ollama manually** (if needed):
   - **Windows**: Search for "Ollama" in Start Menu and run it
   - **macOS/Linux**: Run `ollama serve` in terminal

## Step 4: Test Your Setup

Test if Ollama is working:

```bash
ollama run phi3 "Hello, how are you?"
```

Or test via API:
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "phi3",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

## Step 5: Configure Your Web App

In `app.js`, the Ollama configuration is already set up. To enable it:

1. **Edit `app.js`** (around line 38-41)
2. **Set `llmMode`** to `'ollama'`:
   ```javascript
   this.llmMode = 'ollama'; // Change from 'browser' to 'ollama'
   this.ollamaUrl = 'http://localhost:11434'; // Default Ollama URL
   this.ollamaModel = 'phi3'; // Change to match the model you downloaded
   ```

3. **Restart your web app** (refresh the browser)

## Troubleshooting

### Ollama not connecting?
- **Check if Ollama is running**: `http://localhost:11434` should respond
- **Check firewall**: Make sure port 11434 isn't blocked
- **Check URL**: Ensure `ollamaUrl` in `app.js` matches your Ollama server URL

### Model not found?
- **List installed models**: `ollama list`
- **Download the model**: `ollama pull phi3` (or your chosen model)
- **Check model name**: Ensure `ollamaModel` in `app.js` matches the installed model name

### Slow responses?
- **Use a smaller model**: Try `tinyllama` or `phi3`
- **Check your CPU/RAM**: Smaller models work better on less powerful machines
- **Enable GPU** (if available): Ollama will automatically use GPU if available

### CORS errors?
If you're accessing the web app from a different origin (e.g., `file://` or a different port), you may need to:
1. **Run a local web server** instead of opening `index.html` directly
2. **Configure Ollama CORS** (advanced - requires modifying Ollama settings)

## Performance Tips

- **Use quantized models**: Ollama automatically uses optimized models
- **Close other applications**: Free up RAM for the model
- **Use smaller models first**: Test with `tinyllama` before moving to larger models
- **GPU acceleration**: Ollama will use GPU automatically if available (no setup needed)

## Model Comparison

| Model | Size | Speed | Quality | Memory |
|-------|------|-------|---------|--------|
| TinyLlama | ~650MB | ⚡⚡⚡ | ⭐⭐ | ~2GB |
| Phi-3 | ~2.3GB | ⚡⚡ | ⭐⭐⭐⭐ | ~4GB |
| Llama 3.2 (3B) | ~2GB | ⚡⚡ | ⭐⭐⭐⭐ | ~4GB |
| Qwen 3 (4B) | ~2.5GB | ⚡ | ⭐⭐⭐⭐⭐ | ~5GB |

## Next Steps

Once Ollama is set up:
1. The web app will automatically use Ollama if `llmMode` is set to `'ollama'`
2. Check the browser console for connection status
3. Test dialogue generation with objects
4. Fine-tune the `ollamaModel` setting to try different models

## Need Help?

- **Ollama Documentation**: https://github.com/ollama/ollama
- **Ollama Community**: Check Ollama GitHub issues or Discord
- **Model List**: `ollama list` shows all installed models
