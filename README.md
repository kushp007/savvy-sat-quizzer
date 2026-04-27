# 🧠 Savvy SAT Quizzer

An **AI-powered adaptive SAT Math practice platform** that simulates real exam conditions while providing **personalized feedback, intelligent question generation, and performance insights**.

---

## 🌐 Live Demo

*(Add your deployed link here once live)*
👉 https://your-app-link.vercel.app

---

## ✨ Features

### 🎯 Smart Quiz Engine

* 25-question SAT-style timed quiz (25 minutes)
* Multiple-choice questions with **instant feedback**
* Detailed **explanations** for every question
* **No repetition** within a full cycle of questions

---

### 🤖 AI-Powered Question Generation

* Dynamically generates SAT-style questions using OpenAI
* Runs securely on backend (**API key never exposed**)
* Merges with local question bank
* Deduplicates and validates generated questions

---

### 🧠 Adaptive Difficulty System

* Adjusts question difficulty based on performance
* Strong performance → harder questions
* Weak performance → easier questions
* Ensures balanced topic distribution

---

### 📊 Performance Analytics

* Real-time score tracking
* Accuracy percentage
* Question-by-question review
* Visual feedback for correct/incorrect answers

---

### 🧠 AI Performance Feedback (🔥 Key Feature)

* Identifies **weak topics** and **strong areas**
* Provides **personalized improvement suggestions**
* Helps users focus on what matters most

---

### 🔄 Hybrid Question System

* Works offline with local question bank
* Expands dynamically with AI when available
* Graceful fallback if API is unavailable

---

## 🛠 Tech Stack

| Layer              | Technology                                    |
| ------------------ | --------------------------------------------- |
| Frontend           | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Build Tool         | Vite                                          |
| State Management   | Custom React Hooks                            |
| Backend            | Node.js, Express                              |
| AI Integration     | OpenAI API (server-side only)                 |
| Database (planned) | MongoDB (scaffold included)                   |

---

## ⚙️ How It Works

### 1. Question Sources

* Local questions from:

  ```
  src/data/questions.ts
  ```
* AI-generated questions via:

  ```
  POST /api/generate-questions
  ```

---

### 2. Hybrid Pool Creation

* Local + AI questions are merged
* Deduplicated using:

  * normalized text
  * topic
  * difficulty

---

### 3. Adaptive Selection

* Questions served **without repetition**
* Difficulty adjusts based on recent performance
* Maintains topic diversity

---

### 4. AI Feedback Engine

After quiz completion:

* Analyzes user performance
* Detects weak areas
* Generates personalized study suggestions

---

## 🔐 Security

* OpenAI API key is stored in `.env`
* Never exposed to frontend
* All AI requests handled via backend

---

## 🚀 Getting Started

### Requirements

* Node.js 18+
* npm

---

### Installation

```bash
npm install
```

---

### Run (Frontend only)

```bash
npm run dev
```

👉 Uses only local questions

---

### Run (Full App with AI)

1. Create a `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=3001
```

2. Start both frontend and backend:

```bash
npm run dev:full
```

---

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
  ├── components/        # UI components
  ├── data/              # Local question bank
  ├── hooks/             # Custom hooks (quiz logic)
  ├── services/          # API + hybrid system
  ├── types/             # TypeScript types
  ├── utils/             # Helper functions
  ├── pages/             # App pages

server/
  ├── index.js           # Express API
  ├── db/                # MongoDB scaffold

public/
  ├── favicon.jpg
  ├── assets

.env                     # Environment variables
```

---

## 🔮 Future Improvements

* 📊 Persistent user data with MongoDB
* 🎯 Topic-based practice mode
* 📈 Advanced analytics dashboard
* 🌙 Dark mode
* 📱 Mobile optimization
* 🧠 Smarter AI validation pipeline

---

## 📸 Screenshots

*(Add screenshots here later for better presentation)*

---

## 👨‍💻 Author

**Kush Prajapati**
Computer Science @ UCR

---

## 🏆 Highlights

* AI-integrated full-stack application
* Adaptive learning algorithm
* Secure backend architecture
* Modern UI with Tailwind + React

---

## 📄 License

For portfolio and educational use.
