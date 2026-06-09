# Finance Tracker Frontend

React/Vite frontend для учета личных финансов по банковским скриншотам.

## Что реализовано

- OAuth-вход через backend-маршруты Google и Yandex.
- Callback `/auth/callback?token=...` с сохранением JWT в `localStorage`.
- Локальный ввод JWT для разработки без настроенного OAuth.
- Загрузка нескольких PNG/JPG через file picker или drag and drop.
- OCR в браузере через `tesseract.js`.
- Парсинг суммы, валюты, даты и получателя регулярными выражениями.
- Категоризация по словарю `Category.keywords` из backend.
- Экран проверки и редактирования распознанных транзакций.
- Сохранение выбранных транзакций в `POST /api/transactions`.
- Главный экран, последние операции и аналитика из backend API.

## Запуск

```bash
cd /Users/cmd/Desktop/finapp/front
npm install
npm run dev
```

Frontend откроется на `http://localhost:5173`.

Backend должен быть запущен на `http://localhost:3001`. Если адрес другой, создайте `.env`:

```env
VITE_API_URL=http://localhost:3001
```

## Backend

Перед входом через OAuth настройте `/Users/cmd/Desktop/finapp/bend/.env`:

```env
FRONTEND_URL=http://localhost:5173
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
YANDEX_CALLBACK_URL=http://localhost:3001/api/auth/yandex/callback
```

Для разработки без OAuth можно создать тестового пользователя и JWT по инструкции в `/Users/cmd/Desktop/finapp/bend/QUICKSTART.md`, затем вставить токен на экране входа.
