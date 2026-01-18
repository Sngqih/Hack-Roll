# Testing Both LLM Options

This guide will help you test both the browser-based LLM (Transformers.js) and the local Ollama server.

## Current Configuration

In `app.js` (around line 40), you can see:
```javascript
this.llmMode = 'browser'; // 'browser' (Transformers.js) or 'ollama' (local server)
this.ollamaUrl = 'http://localhost:11434'; // Local Ollama server URL
this.ollamaModel = 'phi3'; // Model to use with Ollama
```

## Test Option 1: Browser Model (Currently Active)

The browser model is **already enabled** by default. Here's how to test it:

1. **Open the web app** in your browser (via GitHub Pages or local server)
2. **Open browser console** (F12 → Console tab)
3. **Check the console logs** for:
   - `🤖 Loading local LLM model (DistilGPT-2)...`
   - `✅ Local LLM model loaded successfully!`
4. **Start the video** and interact with objects
5. **Look for LLM status** in the Settings panel:
   - Should show: `✅ LLM Active` or `❌ LLM Inactive`
   - Details: `Local LLM ready - Using DistilGPT-2`

### What to expect:
- First load may take 30-60 seconds to download the model (~250MB)
- Model downloads are cached by the browser
- Responses may be slower than Ollama but work entirely in-browser
- No external dependencies needed

## Test Option 2: Ollama Server

### Step 1: Install Ollama (if not installed)

1. **Download Ollama**: https://ollama.ai/download
   - Choose your OS (Windows/macOS/Linux)
   - Run the installer

2. **Verify installation**:
   ```bash
   ollama --version
   ```
   Should show: `ollama version 1.x.x` (or similar)

### Step 2: Download a Lightweight Model

**Recommended for testing:**
```bash
ollama pull phi3
```
This will download Phi-3 (~2.3GB), a good lightweight dialogue model.

**Alternative options:**
```bash
ollama pull llama3.2:3b    # Llama 3.2 3B (~2GB)
ollama pull tinyllama      # Smallest (~650MB), fastest but lower quality
ollama pull qwen3:4b       # Qwen 3 4B (~2.5GB), excellent for dialogue
```

### Step 3: Start Ollama Server

Ollama should start automatically after installation. To verify:

1. **Check if running**: Open browser and go to `http://localhost:11434`
   - If you see a response (even an error), Ollama is running ✅
   - If connection refused, Ollama isn't running

2. **Start manually** (if needed):
   - **Windows**: Search for "Ollama" in Start Menu
   - **macOS/Linux**: Run `ollama serve` in terminal

3. **Test with a simple command**:
   ```bash
   ollama run phi3 "Hello, how are you?"
   ```
   Should generate a response.

### Step 4: Configure Web App for Ollama

1. **Edit `app.js`** (around line 40):
   ```javascript
   this.llmMode = 'ollama'; // Change from 'browser' to 'ollama'
   this.ollamaUrl = 'http://localhost:11434'; // Should already be set
   this.ollamaModel = 'phi3'; // Match the model you downloaded
   ```

2. **Save and refresh** your web app

3. **Check the console** for:
   - `🤖 LLM: Checking Ollama connection (phi3)...`
   - `✅ Ollama connection successful!`
   - OR fallback message if Ollama isn't available

### What to expect:
- Faster responses than browser model
- Better dialogue quality
- Requires Ollama running locally
- First generation may be slower (model loading)

## Testing Both - Automatic Fallback

The app is configured to automatically fall back to the browser model if Ollama isn't available:

1. **Set `llmMode = 'ollama'`** in `app.js`
2. **If Ollama is running**: Uses Ollama ✅
3. **If Ollama is not running**: Falls back to browser model ✅
4. **Check Settings panel** to see which one is active

## Quick Comparison Test

1. **Test Browser Model**:
   - Set `llmMode = 'browser'` in `app.js`
   - Refresh page
   - Interact with objects, note response quality/speed

2. **Test Ollama Model**:
   - Install Ollama and download a model
   - Set `llmMode = 'ollama'` in `app.js`
   - Refresh page
   - Interact with objects, compare response quality/speed

3. **Test Fallback**:
   - Set `llmMode = 'ollama'` in `app.js`
   - Stop Ollama (or set wrong URL)
   - Refresh page
   - Should automatically fall back to browser model

## Troubleshooting

### Browser Model Issues:
- **Model not loading?** Check browser console for errors
- **Slow responses?** First load downloads model (~250MB), be patient
- **CORS errors?** Make sure you're running via web server (not `file://`)

### Ollama Issues:
- **Connection refused?** Make sure Ollama is running (`ollama serve`)
- **Model not found?** Run `ollama pull phi3` (or your chosen model)
- **Slow responses?** Try a smaller model (`tinyllama`) or check your CPU/RAM

## Performance Tips

**For Browser Model:**
- Close other browser tabs to free memory
- First load is slow (downloading model), subsequent loads are cached

**For Ollama:**
- Use smaller models for faster responses (`tinyllama`, `phi3`)
- Close other applications to free RAM
- GPU acceleration happens automatically (if available)

## Next Steps

Once you've tested both:
1. Choose which mode works best for you
2. Set `llmMode` accordingly in `app.js`
3. Fine-tune prompts and settings for your chosen model
