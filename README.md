# ShopMind — Agentic E-Ticaret Alışveriş Asistanı

BTK Akademi AI Hackathon 2026 projesi. Kullanıcının bütçesini, fiyat trendlerini ve Türkçe kullanıcı yorumlarını analiz eden 5 ajanlı bir e-ticaret karar asistanı.

## Başlangıç

### 1. API Anahtarları

```bash
cp .env.example .env
# .env dosyasına GEMINI_API_KEY ve SERPER_API_KEY ekle
```

**Gemini API Key:** https://aistudio.google.com/app/apikey (ücretsiz)  
**Serper API Key:** https://serper.dev (100 ücretsiz sorgu/ay)

### 2. Veritabanı & Cache

```bash
docker-compose up -d
```

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Uygulama: http://localhost:3000  
API Docs: http://localhost:8000/docs

## Mimari

5 ajanlı LangGraph zinciri:

```
Intent → Finance → Search → Sentiment → Decision
```

- **Intent Agent** — Kullanıcı sorgusundan ürün, bütçe, kullanım amacı çıkarır
- **Finance Agent** — TCMB'den döviz kuru çeker, taksit hesabı yapar  
- **Search Agent** — Serper ile Google Shopping'den ürün bulur, fiyat trendi analiz eder
- **Sentiment Agent** — Gemini ile Türkçe duygu analizi yapar (paralel)
- **Decision Agent** — Al / Bekle / Alternatif kararını gerekçesiyle verir

## Stack

- **Backend:** Python, FastAPI, LangGraph, Google Gemini 2.0 Flash
- **Frontend:** Next.js 15, React 19, TypeScript
- **Cache:** Redis
- **DB:** PostgreSQL
- **Ürün Arama:** Serper Google Shopping API
