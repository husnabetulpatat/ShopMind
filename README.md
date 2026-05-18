# ShopMind - Akıllı Alışveriş Asistanı 🛒🤖

ShopMind, kullanıcıların bütçe ve ihtiyaçlarına en uygun ürünleri bulmasını sağlayan, çoklu yapay zeka ajanları (Multi-Agent) ile desteklenen gerçek zamanlı bir alışveriş asistanıdır. Google Gemini 2.0 Flash modeli ve LangGraph kullanılarak geliştirilmiştir.

## 🚀 Canlı Demo
- Live Demo Video: [Ürünün Videosu](https://youtu.be/4Nmsi_Og6es)
- **Frontend (Web):** [https://shop-mind-psi.vercel.app](https://shop-mind-psi.vercel.app)
- **Backend API:** [https://shopmind-production-7967.up.railway.app](https://shopmind-production-7967.up.railway.app)

## 🎯 Özellikler
- **Çoklu Ajan Mimarisi (LangGraph):**
  - `Niyet Ajanı`: Kullanıcının ne istediğini ve bütçesini anlar.
  - `Finans Ajanı`: Güncel döviz kurlarını çeker ve bütçeyi optimize eder.
  - `Arama Ajanı`: İnternet üzerinden canlı ürün araması yapar (Serper API).
  - `Duygu Ajanı`: Ürün yorumlarını analiz ederek kullanıcı hissiyatını ölçer.
  - `Karar Ajanı`: Elde edilen tüm verileri sentezleyerek en mantıklı ürünü seçer.
- **Gerçek Zamanlı İletişim:** WebSocket üzerinden ajanların düşünme süreçlerini UI'da anlık olarak görme.
- **Kimlik Doğrulama:** JWT (JSON Web Token) tabanlı güvenli üyelik ve giriş sistemi.
- **Arama Geçmişi:** Kullanıcıların önceki analizlerini ve tavsiyelerini saklama.

## 💻 Teknoloji Yığını
**Frontend:**
- Next.js (React 19)
- Vanilla CSS (Modern ve akıcı arayüz tasarımı)
- WebSocket Client
- Vercel (Deployment)

**Backend:**
- Python 3.11, FastAPI
- LangGraph & LangChain
- Google GenAI SDK (Gemini-2.0-Flash)
- PostgreSQL & SQLAlchemy (Asyncpg)
- Redis (Önbellekleme - Opsiyonel)
- Docker & Railway (Deployment)

## 🛠️ Kurulum (Lokal Ortam)

Projeyi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/husnabetulpatat/ShopMind.git
cd ShopMind
```

### 2. Backend Kurulumu
```bash
# Backend dizinine geçin ve sanal ortam oluşturun
python -m venv venv
source venv/bin/activate  # Windows için: venv\Scripts\activate

# Bağımlılıkları yükleyin
pip install -r backend/requirements.txt

# Çevre değişkenlerini ayarlayın (Ana dizinde .env dosyası oluşturun)
# GEMINI_API_KEY=sizin_api_anahtariniz
# SERPER_API_KEY=sizin_serper_anahtariniz
# DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/shopmind

# Backend'i başlatın
uvicorn backend.api.main:app --reload --port 8000
```

### 3. Frontend Kurulumu
```bash
# Frontend dizinine geçin
cd frontend

# Bağımlılıkları yükleyin
npm install

# .env.local dosyası oluşturup backend URL'sini verin
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Geliştirme sunucusunu başlatın
npm run dev
```

Uygulama artık `http://localhost:3000` adresinde çalışıyor olacaktır!
