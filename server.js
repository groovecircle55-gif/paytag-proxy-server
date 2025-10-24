const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow requests from your frontend
app.use(cors({
  origin: [
    'https://c1ztszfll2cb.trickle.host',
    'http://localhost:3000',
    'http://paytag.co.za',
    'https://paytag.co.za'
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server is running' });
});

// M-Pesa API proxy endpoint
app.post('/mpesa-proxy', async (req, res) => {
  try {
    const { url, method = 'POST', headers = {}, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Proxying ${method} request to: ${url}`);

    // Make request to M-Pesa API with correct Origin header
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': '102.212.246.90',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return response with proper status code
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
});

// M-Pesa GET requests proxy (for balance, status queries)
app.get('/mpesa-proxy', async (req, res) => {
  try {
    const { url, ...headers } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Proxying GET request to: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': '102.212.246.90',
        ...headers
      }
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`M-Pesa proxy server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});