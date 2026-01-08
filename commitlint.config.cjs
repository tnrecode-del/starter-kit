module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["root", "api", "web", "shared", "db", "deps", "config"],
    ],
    "type-enum": [
      2,
      "always",
      [
        "feat", // Новый функционал
        "fix", // Исправление багов
        "docs", // Документация
        "style", // Форматирование, отсутствующие точки с запятой
        "refactor", // Правка кода без изменения логики
        "perf", // Улучшение производительности
        "test", // Тесты
        "build", // Сборка (turbo, docker)
        "ci", // Настройка CI (github actions)
        "chore", // Прочее (обновление зависимостей)
        "revert", // Откат изменений
      ],
    ],
  },
};
