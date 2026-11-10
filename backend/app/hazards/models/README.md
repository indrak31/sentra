# SENTRA Colab Model Checkpoints Directory

Drop your exported Google Colab model artifacts here:

- `flood_model.pkl` (or `.joblib` / `.pt` / `.onnx`)
- `earthquake_model.pkl` (or `.joblib` / `.pt` / `.onnx`)
- `drought_model.pkl` (or `.joblib` / `.pt` / `.onnx`)
- `tsunami_model.pkl` (or `.joblib` / `.pt` / `.onnx`)

### Connecting a Live Colab ngrok URL
If you are running your model live inside Google Colab (with ngrok/localtunnel), set in your backend `.env`:

```env
COLAB_API_URL=https://your-ngrok-subdomain.ngrok-free.app
```

The `ColabBridge` (`app.hazards.models.colab_bridge`) will automatically route inference requests to your Colab session.

