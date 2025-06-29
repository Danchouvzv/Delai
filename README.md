# JumysAL 🚀

**Школьники встречают бизнес** — современная платформа, где подростки находят проекты, подают мини‑резюме, общаются в real‑time чате, а работодатели получают умный AI‑подбор кандидатов.

> "Помогаем первым карьерным шагам быть безопасными, технологичными и захватывающими."

---

## ⚡️ TL;DR

```bash
pnpm i          # установка зависимостей
pnpm dev        # локальный dev‑сервер + Firebase emulators
pnpm deploy     # CI/CD скрипт из GitHub Actions (или локально через Firebase CLI)
```

👉 **Играемся в браузере и офлайн, пушим — всё выкатывается на production.**

---

## 🎥 Демонстрация функциональности

[![JumysAL Demo](https://img.youtube.com/vi/uNM7-jJp8Kk/0.jpg)](https://youtu.be/uNM7-jJp8Kk)

В этом видео демонстрируются все ключевые возможности платформы:

- 🎯 **Умный поиск работы**: AI-powered система подбора вакансий под навыки школьника
- 💼 **Профили и резюме**: Создание и управление профессиональными профилями
- 💬 **Real-time чат**: Мгновенное общение между работодателями и кандидатами
- 🤖 **AI Ментор**: Персонализированные советы по карьерному развитию
- 📊 **Аналитика**: Отслеживание прогресса и статистики
- 🌙 **Темная тема**: Удобный интерфейс для работы в любое время суток
- 📱 **Адаптивный дизайн**: Полноценная работа на всех устройствах

👆 Нажмите на изображение выше, чтобы посмотреть полную демонстрацию.

---

## 📚 Содержание

1. [Фичи ✨](#-фичи-✨)
2. [Технологии 🛠️](#-технологии️)
3. [Архитектура 🏗️](#-архитектура)
4. [Запуск проекта ⚙️](#-запуск-проекта️)
5. [Структура каталогов 🗂️](#-структура-каталогов)
6. [Скрипты 📜](#-скрипты)
7. [Тестирование ✅](#-тестирование)
8. [CI / CD 🚀](#️-ci--cd)
9. [Вклад в проект 🤝](#-вклад-в-проект)
10. [Лицензия 📄](#-лицензия)
11. [Контакты 📬](#-контакты)

---

## ✨ Фичи

| Категория                     | Описание                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Real‑time Chat 💬**         | Статусы `pending / accepted / declined` зависят от откликаTyping indicator, read receipts, offline‑queueВложения (изображения / PDF / документы)AI‑модерация токсичности + Push‑уведомления |
| **AI Smart‑Match 🤖**         | Gemini API ранжирует кандидатов по совпадению с навыками вакансии, выводит % релевантности                                                                                                  |
| **Role‑Based Access 🔐**      | Две роли: `school`, `business` — защищаем компоненты и Firestore данные                                                                                                                     |
| **Вакансии + Мини‑резюме 📄** | Школьник заполняет карточку навыков → Работодатель видит компактный профиль вместо обычного чата                                                                                            |
| **Режим Dark/Light 🌗**       | Один клик, хранится в `localStorage` и синхронизируется между вкладками                                                                                                                     |
| **Аналитика 📊**              | Firebase Analytics + custom events (процент ответов, время до 1‑го ответа)                                                                                                                  |
| **Интернационализация 🌍**    | `react-i18next`, по умолчанию `ru` / `kz` / `en`                                                                                                                                            |
| **PWA + Offline ⛑️**          | Workbox SW — кэш роутинга, мгновенный старт, офлайн‑чат в IndexedDB                                                                                                                         |

---

## 🛠️ Технологии

| Слой                     | Стек                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Frontend**             | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, React Router v6, Zustand (глобальный стейт) |
| **Backend‑as‑a‑Service** | Firebase (v10): Auth, Firestore, Storage, Cloud Functions, Cloud Messaging, Hosting, Emulator Suite  |
| **AI Services**          | Google Gemini Pro (Vertex AI) для подбора и модерации                                                |
| **Dev Tools**            | ESLint + Prettier, Husky + lint‑staged, Commitlint (Conventional Commits)                            |
| **CI / CD**              | GitHub Actions → Firebase Hosting (deploy & preview)                                                 |

---

## 🏗️ Архитектура

```mermaid
graph TD
  subgraph Client
    A[React SPA]
    A -->|REST / SDK| B(Auth)
  end
  B --> C(Firestore — коллекции users / vacancies / chatRooms / messages)
  A --> D(Storage — uploads)
  C --> E[Cloud Functions\n(AI Moderation, Smart‑Match, FCM)]
  E --> F(FCM Push)
```

### Поток сообщений

1. **Школьник** отправляет отклик → создаётся `application` (pending) + `chatRoom` (pending).
2. **Работодатель** принимает → статус `accepted` → чат становится активным.
3. Сообщения пишутся в подколлекцию `messages` внутри `chatRoom`, слушатель `onSnapshot` отдаёт real‑time‑поток обоим.
4. Cloud Function «moderateMessage» проверяет токсичность → при необходимости заменяет текст.
5. Вторая функция «notifyNewMessage» шлёт FCM‑push получателю.

---

## ⚙️ Запуск проекта

### 1. Предварительные условия

* **Node >= 18 LTS** & **PNPM >= 9**
* Аккаунт Firebase + созданный проект
* Google Cloud Billing (для Gemini API)

### 2. Клонирование

```bash
git clone https://github.com/your‑org/jumysal.git
cd jumysal
pnpm i
```

### 3. Переменные среды (`.env`)

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
VITE_GOOGLE_MAPS_API_KEY=
```

> **NB:** префикс `VITE_` нужен Vite для экспорта переменных в том числе в браузер.

### 4. Firebase Emulators

```bash
pnpm firebase:emulators   # alias на "firebase emulators:start --only auth,firestore,functions"
```

Получаем локальный Auth UI, Firestore UI и лог функций.

### 5. Запуск дев‑сервера

```bash
pnpm dev
```

Откроется `http://localhost:5176` (порт можно заменить).

### 6. Деплой в прод

```bash
pnpm deploy
```

Скрипт обернёт `firebase deploy --only hosting,functions` + выложит preview‑URL в комментарий к PR.

---

## 🗂️ Структура каталогов

```
jumysal/
├─ public/            # статические ресурсы, favicon, manifest.json
├─ src/
│  ├─ components/     # атомы, молекулы, организмы UI
│  ├─ hooks/          # кастомные React hooks (useChat, useAuth…)
│  ├─ pages/          # маршруты React Router
│  ├─ services/       # обёртки Firebase / Gemini
│  ├─ store/          # Zustand slices
│  └─ styles/         # Tailwind config + global css
├─ functions/         # Cloud Functions (TypeScript)
├─ firestore.rules    # Security Rules v2
├─ .github/
│  └─ workflows/      # GitHub Actions (lint + deploy)
└─ docs/              # диаграммы, скриншоты, презентации
```

---

## 📜 Скрипты `package.json`

| Скрипт         | Что делает                                         |
| -------------- | -------------------------------------------------- |
| `pnpm dev`     | Vite + React Refresh + Firebase emulators          |
| `pnpm build`   | Production сборка (`dist/`)                        |
| `pnpm preview` | Локальный просмотр production‑сборки               |
| `pnpm lint`    | ESLint + Prettier — проверка кода                  |
| `pnpm test`    | Vitest (unit‑тесты)                                |
| `pnpm deploy`  | CI‑friendly деплой на Firebase Hosting + Functions |

---

## ✅ Тестирование

* **Unit / Integration** → Vitest + @testing‑library/react
* **E2E** → Playwright (create school, create business, отклик → чат, assert push)
* **CI**: тесты гоняются в GitHub Actions на `pull_request`.

---

## 🚀 CI / CD

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm i --frozen-lockfile
      - run: pnpm lint && pnpm test && pnpm build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: "${{ secrets.GITHUB_TOKEN }}"
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}"
          projectId: jumysal-27b5e
```

> **Preview‑URL** комментируется прямо в PR.

---

## 🤝 Вклад в проект

1. Сделайте форк и отдельную ветку от `develop`.
2. Используйте **Conventional Commits** (`feat:`, `fix:`, `chore:`…).
3. Запустите `pnpm lint` — без ошибок CI не примет PR.
4. Отправьте Pull Request, опишите **что** и **почему**.

📜 **Code of Conduct** — см. [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

---

## 📄 Лицензия

[MIT](LICENSE) — можно форкать, улучшать, даже продавать, только оставьте копирайт.

---

## 🙏 Благодарности

* NIS  — за вдохновение и нетворк
* Firebase, Google Cloud & Gemini Team — за generous tier для стартапов
* Все контрибьюторы и тестировщики 💙

---

## 📬 Контакты

|               |                                                               |
| ------------- | ------------------------------------------------------------- |
| 🇰🇿 Telegram | @Doni\_Talgatov                                               |
| ✉️ Email      | [talgatovdaniyal@gmail.com](mailto:talgatovdaniyal@gmail.com) |
| 🌐 Web        | [https://jumysal.kz](https://jumysal.kz)                      |

> *Build for the future, hire the future.*

## Code Quality

This project uses ESLint and Prettier for code quality and formatting. A pre-commit hook is set up to run formatting checks before each commit.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Automatically fix some linting errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without making changes

### Linting Guide

For detailed information on fixing linting errors in the project, see [LINTING.md](docs/LINTING.md).

## Git Workflow

The project uses Husky to enforce code quality checks before commits:

1. Before each commit, the pre-commit hook will:
   - Check code formatting with Prettier (`npm run format:check`)
   - (Linting is temporarily disabled due to existing errors)

2. If any formatting issues are found, the commit will be rejected with appropriate error messages.

3. Fix the issues and try committing again.

### Setting up the pre-commit hook

The pre-commit hook is automatically installed when you run `npm install` due to the `prepare` script in package.json. However, if you need to set it up manually:

```bash
# Initialize husky
npx husky init

# Make the pre-commit hook executable
chmod +x .husky/pre-commit
```

### Current Limitations

Currently, ESLint checks are disabled in the pre-commit hook due to a large number of existing errors in the codebase. Only formatting checks with Prettier are enforced. Once the codebase is properly fixed, linting checks should be re-enabled in the pre-commit hook.


