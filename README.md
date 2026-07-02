# Summa Frontend

React/Vite frontend для Summa: персонального трекера доходов и расходов без подключения к банковскому кабинету.

## Что реализовано

- OAuth-вход через backend-маршруты Google и Yandex.
- Callback `/auth/callback?token=...` с сохранением JWT в `localStorage`.
- Загрузка нескольких PNG/JPG через file picker или drag and drop.
- Локальное распознавание в браузере через `tesseract.js`.
- Парсинг суммы, валюты, даты и получателя регулярными выражениями.
- Категоризация по словарю `Category.keywords` из backend.
- Экран проверки и редактирования распознанных операций.
- Сохранение выбранных операций в `POST /api/transactions`.
- Главный экран, последние операции и сводка из backend API.

## Запуск

```bash
cd /Users/cmd/Desktop/finapp/front
npm install
npm run dev
```

Frontend откроется на `http://localhost:3002`.

Backend должен быть запущен на `http://localhost:3001`. В dev-режиме frontend ходит в свой origin по `/api`, а Vite проксирует запросы в backend. Если backend запущен на другом адресе, создайте `.env`:

```env
VITE_API_PROXY_TARGET=http://localhost:3001
```

`VITE_DIRECT_API_URL` нужен только если вы сознательно хотите отключить same-origin proxy и ходить из браузера напрямую в другой API-origin.

## Backend

Перед входом через OAuth настройте `/Users/cmd/Desktop/finapp/bend/.env`:

```env
FRONTEND_URL=http://localhost:3002
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
YANDEX_CALLBACK_URL=http://localhost:3001/api/auth/yandex/callback
```
