# Quiz App

Отдельный React-приложение для анимированных квизов на `localhost:9999/{title}`.

## Что реализовано

- Vite + React + TypeScript
- Роутинг по slug: `/:title`
- Загрузка **сценария** из Supabase (`quiz_template.content`): вопросы, вставки с анимацией, загрузка, да/нет, отзывы
- Шкала Ликерта 1–5 (`single_scale`), счётчик «Мы уже помогли…», экран «Создаем профиль», бинарные вопросы, карточки отзывов
- Сохранение ответов и результата в `quiz_results`
- Отдельный Docker Compose (изолирован от основного проекта)

## Настройка

1. Скопируй `.env.example` в `.env`.
2. Заполни:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Убедись, что в `quiz_template` есть:
   - `slug`
   - `published = true`
   - `content` (массив шагов сценария)
   - `results` (массив диапазонов по сумме баллов)

## Локальный запуск

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 9999
```

Открыть: `http://localhost:9999/mindflow-v1`

## Docker запуск

```bash
docker compose up --build
```

Открыть: `http://localhost:9999/mindflow-v1`

## Готовый сценарий MindFlow

- JSON: [`seed/mindflow-v1-scenario.json`](seed/mindflow-v1-scenario.json)
- Готовый **INSERT** в Supabase: [`seed/insert_mindflow_v1.sql`](seed/insert_mindflow_v1.sql) (поля `slug`, `title`, `description`, `content`, `results`, `photos`, `published`). При другом наборе колонок поправь запрос.
- Пересобрать SQL из JSON: `node scripts/build-insert-sql.mjs`

Сумма баллов по шкале **13–65** (13 вопросов × 1–5) — подстрой `results` под свою методику.

## Типы шагов `content`

| `step_type` | Назначение |
|-------------|------------|
| `single_scale` | Вопрос + шкала 1–5 (`step_name`, опционально `payload.min_label` / `max_label`) |
| `counter_info` | Экран со счётчиком (`payload.line_before`, `count_target`, `line_after`, `duration_ms`) |
| `loading_profile` | Анимация прогресса (`payload.title`, `payload.stages[]` с `label` и `fill_to`) |
| `binary` | Да/нет (`payload.subtitle`, `payload.question`) |
| `review_card` | Отзыв (`payload.name`, `time_ago`, `text`, `rating`) |
| `single` (legacy) | Старый формат с `step_items[]` |

## Подсчёт результата

В сумму `score_total` входят только ответы с `step_type`: `single_scale` и legacy `single`. Ответы `binary` сохраняются в `answers_json` / `answers_map`, но **не** влияют на выбор диапазона из `results`.

## Пример `results`

```json
[
  { "from": 13, "title": "Низкий уровень", "description": "…" },
  { "from": 26, "title": "Умеренный", "description": "…" },
  { "from": 39, "title": "Повышенный", "description": "…" },
  { "from": 52, "title": "Высокий", "description": "…" }
]
```
