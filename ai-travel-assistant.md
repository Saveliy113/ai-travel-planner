# Travel Planner Assistant — Capstone Project

## 1. Overview

AI-помощник для планирования путешествий, который:

* учитывает сезонность
* бюджет
* предпочтения пользователя
* использует live API + RAG

## 2. MVP Scope

Поддержка:

* 1 направление: Phuket
* 1–7 дней
* категории: beaches, cafes, culture, nightlife

---

## 2.1 Supported User Query Types

Система поддерживает ограниченный набор сценариев запросов:

### 1. Базовый сценарий

```
Plan 5 days in Phuket in May, mid-budget, beaches and cafes
```

### 2. С указанием района

```
Plan 3 days in Phuket, stay near Bang Tao, cafes and chill places
```

### 3. С типом отдыха

```
Plan 4 days in Phuket, nightlife and restaurants, medium budget
```

### 4. С ограничением бюджета

```
Plan 5 days in Phuket, low budget, cheap food and free activities
```

### 5. С учетом погоды / сезонности

```
Plan 5 days in Phuket in July, cafes, indoor places and beaches if weather is good
```

---

## 2.2 Extracted Intent Parameters

LLM извлекает строго ограниченный набор параметров:

```json
{
  "destination": "Phuket",
  "area": "Bang Tao",
  "days": 5,
  "month": "May",
  "budget": "low | mid | high",
  "preferences": ["beaches", "cafes"],
  "style": ["chill", "nightlife", "family"],
  "constraints": ["indoor_if_rain", "cheap_only"]
}
```

---

## 2.3 Supported POI Categories

Система работает только с ограниченным набором POI (через Geoapify / Google Places):

### Core Categories

| Internal Category | Geoapify Mapping                      | Description           |
| ----------------- | ------------------------------------- | --------------------- |
| beaches           | beach                                 | Пляжи                 |
| cafes             | catering.cafe                         | Кофейни и кафе        |
| restaurants       | catering.restaurant                   | Рестораны             |
| attractions       | tourism.attraction                    | Достопримечательности |
| nightlife         | catering.bar, entertainment.nightclub | Бары и клубы          |
| shopping          | commercial.shopping_mall              | ТЦ и шопинг           |
| supermarkets      | commercial.supermarket                | Магазины              |

### Extended (optional)

| Category   | Mapping                   |
| ---------- | ------------------------- |
| viewpoints | natural.viewpoint         |
| parks      | leisure.park              |
| temples    | religion.place_of_worship |

---

## 2.4 POI Requirements for Itinerary

Каждое место должно содержать минимум:

```ts
{
  name: string
  lat: number
  lon: number
  category: string
  address?: string
  openingHours?: string
  website?: string
  rating?: number
  priceLevel?: number
}
```

### Использование

* lat/lon → группировка по районам
* category → логика дня (утро/день/вечер)
* openingHours → проверка доступности
* rating → выбор лучших мест (если есть)

---

## 2.5 Constraints (Important)

Система НЕ поддерживает:

* multi-city маршруты
* бронирование отелей
* перелеты
* визы
* транспорт
* сложную персонализацию

---

## 3. Architecture

```
React UI
  ↓
Express API
  ↓
Travel Orchestrator
  ├── Location Service (Geoapify)
  ├── Weather Service (OpenWeather / Open-Meteo)
  ├── RAG Service (Qdrant)
  └── LLM Service
```

---

## 4. Tech Stack

### Backend

* Node.js (TypeScript)
* Express
* PostgreSQL
* Qdrant

### Frontend

* React + Vite

---

## 5. External APIs

### Weather

* OpenWeather или Open-Meteo

Использовать:

* current weather
* forecast
* temperature
* rain probability

### POI

* Geoapify Places API
* OpenTripMap (опционально)

---

## 6. Database Design (PostgreSQL)

### trip_requests

```sql
id uuid pk
user_id uuid
destination text
days int
month text
budget text
preferences jsonb
created_at timestamp
```

### itineraries

```sql
id uuid pk
request_id uuid
content jsonb
created_at timestamp
```

### agent_runs

```sql
id uuid
request_id uuid
agent_name text
input jsonb
output jsonb
latency_ms int
tokens_input int
tokens_output int
status text
error text
created_at timestamp
```

### user_feedback

```sql
id uuid
itinerary_id uuid
rating int
comment text
created_at timestamp
```

---

## 7. RAG Layer

### travel_patterns table

```sql
id uuid
title text
destination text
season text
budget_level text
traveler_type text
pattern_text text
confidence numeric
created_at timestamp
```

### Example pattern

```
Arrival day should be light
In rainy season plan indoor alternatives
Group attractions by location
```

### Qdrant embedding_text

```
Destination: Phuket
Season: May rainy season
Budget: mid
Traveler: couple
Pattern: In rainy season keep outdoor plans flexible
```

---

## 8. Main Flow

```
1. Validate input
2. Fetch weather
3. Fetch POI
4. Retrieve patterns from Qdrant
5. Build prompt
6. Generate itinerary
7. Save result
8. Return response
```

---

## 9. LLM Prompt Structure

### System

* travel expert
* no hallucinations
* use provided data only

### Input

* weather
* POI
* patterns
* user preferences

### Output format

* structured JSON

---

## 10. Observability

Track:

* latency
* token usage
* errors
* success rate

Log everything in agent_runs

---

## 11. Security

* input validation
* rate limiting
* PII masking
* auth (JWT)

---

## 12. Cost Optimization

* caching (weather, POI)
* limit LLM calls
* batch embeddings

---

## 13. Roadmap

### Phase 1

* basic planner

### Phase 2

* RAG

### Phase 3

* feedback loop

### Phase 4

* multi-destination

---

## 14. Demo Scenario

User enters trip request
→ system calls APIs
→ retrieves patterns
→ generates itinerary
→ logs everything
→ user leaves feedback

---

## 15. Key Value

* personalized itineraries
* real-time data
* explainable recommendations
* scalable architecture
