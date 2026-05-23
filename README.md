# camunda-modeler-plugins-bpmn-doc-generator
camunda-modeler-plugins-bpmn-doc-generator

# BPMN Doc Generator — Плагин для Camunda Modeler

Генератор Markdown-документации из BPMN-моделей с использованием локальной LLM через LM Studio. Работает полностью локально — данные не покидают устройство.

## Возможности

- **Анализ BPMN-модели** — извлечение всех элементов (задачи, события, шлюзы, flows, lanes) через bpmn-js ElementRegistry
- **7 навыков генерации** — цель процесса, входы/выходы, логика выполнения, бизнес-правила, исключения, глоссарий, трассировка
- **Потоковая генерация** — preview обновляется в реальном времени через SSE
- **Профили детализации** — Brief / Standard / Detailed / Technical
- **Quality Checker** — покрытие модели, предупреждения о безымянных элементах и отсутствующих условиях
- **Экспорт** — single-file `.md` или multi-file (4 файла по секциям)
- **Настройки LLM** — endpoint, модель, temperature, max tokens, язык вывода

## Установка

1. Скопируйте папку `bpmn-doc-generator/` в директорию плагинов Camunda Modeler:

```
camunda-modeler/resources/plugins/bpmn-doc-generator/
```

2. Убедитесь, что в папке `dist/` присутствуют собранные файлы:
   - `client.js` (~90 KB) — JS-бандл плагина
   - `style.css` (~7 KB) — стили UI

3. Пересоберите при необходимости:
```bash
npm install
npm run build
```

4. Перезапустите Camunda Modeler

## Требования

| Компонент | Версия |
|-----------|--------|
| Camunda Modeler | 5.x+ |
| LM Studio | любой (с запущенным локальным сервером) |
| Рекомендуемая LLM | 7B+ параметров, поддержка русского языка |

## Использование

### Быстрый старт

1. Откройте `.bpmn` файл в Camunda Modeler
2. В нижней панели найдите вкладку **"Doc Generator"**
3. Нажмите **"Analyze BPMN"** — плагин прочитает элементы диаграммы
4. Убедитесь, что LM Studio запущен (кнопка **"Check Connection"**)
5. Нажмите **"Generate Markdown"** — начнётся генерация

### Вкладка Settings

| Элемент | Описание | Значение по умолчанию |
|---------|----------|-----------------------|
| **Analyze BPMN** | Читает ElementRegistry, показывает метаданные и coverage | — |
| **Requirements** | Текстовое поле для требований (до 4000 символов) | пусто |
| **Endpoint** | URL LM Studio сервера | `http://localhost:1234/v1` |
| **Model** | Выбор модели из загруженных в LM Studio | первая доступная |
| **Temperature** | Креативность генерации (0.0–1.0) | 0.3 |
| **Max Tokens** | Лимит токенов на один навык | 4096 |
| **Template** | Brief / Standard / Detailed / Technical | Standard |
| **Language** | Russian / English | Russian |
| **Check Connection** | Проверяет доступность LM Studio и загружает список моделей | — |

### Вкладка Preview

После генерации отображается Markdown-документ с кнопками:

- **Preview** / **Edit** — переключение между просмотром и редактированием
- **Copy** — копирование в буфер обмена
- **Save .md** — сохранение одного файла `{processName}_documentation.md`
- **Save Multi** — сохранение 4 файлов:
  - `{processName}_overview.md` — цель, входы, выходы
  - `{processName}_flow.md` — логика выполнения
  - `{processName}_constraints.md` — ограничения
  - `{processName}_glossary.md` — глоссарий

### Горячие клавиши

`Ctrl+Shift+D` — открыть панель Doc Generator

## Архитектура

```
bpmn-doc-generator/
├── index.js                          # Манифест плагина
├── package.json                      # Зависимости
├── build.js                          # Сборка через esbuild
├── menu/menu.js                      # Пункт меню Electron
├── vendor/
│   ├── react.js                      # Shim: window.react
│   └── react-dom.js                  # Shim: window.reactDOM
├── dist/
│   ├── client.js                     # Собранный JS-бандл
│   └── style.css                     # Извлечённые CSS
├── client/
│   ├── client.js                     # Точка входа: регистрация в Modeler
│   ├── BpmnDocPanel.jsx              # React-компонент панели
│   ├── style.css                     # Стили UI (400+ строк)
│   ├── modules/
│   │   ├── ModelerBridgeModule.js    # bpmn-js DI-bridge → window.__bpmnDocGenBridge
│   │   ├── BpmnAnalyzer.js          # ElementRegistry → ProcessGraph JSON
│   │   ├── QualityChecker.js        # Coverage score + warnings
│   │   ├── ContextBuilder.js        # Сборка PromptContext для навыков
│   │   ├── LmStudioClient.js        # SSE-стриминг + LM Studio API
│   │   ├── SkillOrchestrator.js     # Последовательное выполнение навыков
│   │   ├── MarkdownComposer.js      # Сборка итогового Markdown
│   │   └── ExportManager.js         # Буфер обмена + сохранение файлов
│   └── skills/
│       ├── ProcessSummarySkill.js   # Секция 1: Цель процесса
│       ├── InputOutputSkill.js      # Секции 2+4: Входы/Выходы
│       ├── FlowExplanationSkill.js  # Секция 3: Логика выполнения
│       ├── BusinessRulesSkill.js    # Секция 5: Ограничения
│       ├── ExceptionSkill.js        # Секция 3.3: Исключения
│       ├── GlossarySkill.js         # Секция 6: Глоссарий
│       └── TraceabilitySkill.js     # Пост-процессор: BPMN ID-ссылки
```

### Поток данных

```
Camunda Modeler (bpmn-js)
       │
       ▼
[ModelerBridge] → window.__bpmnDocGenBridge
       │
       ▼
[BpmnAnalyzer] → ElementRegistry → ProcessGraph
       │
       ▼
[QualityChecker] → coverage + warnings
       │
       ▼
[ContextBuilder] → PromptContext (elementsList, orderedElements, gatewayConditions, ...)
       │
       ▼
[SkillOrchestrator] → 6 навыков последовательно
  ├── ProcessSummarySkill   → summary
  ├── InputOutputSkill      → inputs + outputs
  ├── FlowExplanationSkill  → flowMain + flowBranches
  ├── BusinessRulesSkill    → constraints
  ├── ExceptionSkill        → exceptions
  └── GlossarySkill         → glossary
       │         ↓ каждый навык вызывает LM Studio API
       ▼
[TraceabilitySkill] → добавляет BPMN ID-ссылки
       │
       ▼
[MarkdownComposer] → итоговый .md документ
       │
       ▼
[Preview Pane] → просмотр и редактирование
       │
       ▼
[ExportManager] → Copy / Save .md / Save Multi
```

## Шаблон генерируемого документа

```markdown
# {processName} — Documentation

> **Файл модели:** {fileName}
> **ID процесса:** {processId}
> **Дата генерации:** {timestamp}
> **Модель LLM:** {modelName}

---

## 1. Цель и задача процесса
{summary}

## 2. Входные данные
{inputs}

## 3. Логика выполнения
### 3.1 Основной сценарий
{flowMain}

### 3.2 Альтернативные ветки
{flowBranches}

### 3.3 Исключения и граничные случаи
{exceptions}

## 4. Выходные данные
{outputs}

## 5. Ограничения и замечания
{constraints}

## 6. Ключевые термины
{glossary}

---
*Документ сгенерирован автоматически плагином BPMN Doc Generator v1.0.*
```

## Решение проблем

| Проблема | Решение |
|----------|---------|
| Вкладка "Doc Generator" не появляется | Убедитесь, что `dist/client.js` и `dist/style.css` существуют. Перезапустите Modeler. |
| "No active BPMN modeler" | Откройте BPMN-диаграмму (.bpmn) перед использованием плагина |
| "Disconnected" при проверке соединения | Запустите LM Studio → вкладка Developer → включите сервер (Status: Running) |
| "Model not loaded" | Загрузите модель в LM Studio перед генерацией |
| Генерация занимает слишком долго | Уменьшите max_tokens или выберите более быструю модель |
| LLM генерирует общие фразы | Увеличьте temperature до 0.5, добавьте текст требований, проверьте что модель поддерживает русский |
| 0 элементов при анализе | Откройте вкладку с BPMN-диаграммой (не DMN и не Form) |

## Сборка из исходников

Для внесения изменений в плагин:

```bash
cd bpmn-doc-generator
npm install
npm run build
```

Сборка использует [esbuild](https://esbuild.github.io/) вместо webpack (из-за ограничений webpack на символ `!` в путях). React подключается через shim-файлы из `vendor/`, читающие `window.react` от Camunda Modeler.

## Технический стек

| Компонент | Технология |
|-----------|-----------|
| Платформа | Camunda Modeler (Electron + bpmn-js) |
| UI | React (из Camunda Modeler) через Fill slots |
| Сборка | esbuild (IIFE, JSX transform) |
| LLM API | LM Studio OpenAI-compatible (SSE streaming) |
| XML-парсинг | bpmn-moddle через ElementRegistry |
| Экспорт | Blob download + clipboard API |

## Лицензия

MIT
