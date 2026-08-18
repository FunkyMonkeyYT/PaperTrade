# Project: Standalone Stock Trading Simulator & Quantitative Platform

## 1. Role & Objective
You are an expert full-stack developer. Your goal is to build a high-performance, standalone stock trading simulator and market analytics dashboard. 
CRITICAL RULE: DO NOT integrate any external LLM APIs (no OpenAI, no Anthropic, no OpenRouter). All analytics must be purely algorithmic and mathematical.

## 2. Tech Stack & Architecture
- **Backend:** Python 3.11 with FastAPI.
- **Market Data & Quant Engine:** `yfinance`, `pandas`, `numpy` (calculating 20/50 SMA, 14-day RSI, MACD, Bollinger Bands, and annualized volatility).
- **Trading Engine:** SQLite / SQLAlchemy database tracking:
  - User portfolios (cash balance, open positions, average entry price).
  - Transaction history (buy/sell orders, limit orders, realized P&L).
- **Frontend:** React.js (Vite) + Tailwind CSS + TradingView Lightweight Charts / Chart.js for real-time interactive charting and responsive dark-mode UI.
- **Export Pipeline:** Endpoints to export historical price/indicator data as clean CSV/JSON for separate external machine learning analysis.

## 3. Engineering Guidelines
- Keep the codebase completely self-contained.
- No LLM SDKs in `requirements.txt`.
- Optimize data caching to avoid redundant API queries.