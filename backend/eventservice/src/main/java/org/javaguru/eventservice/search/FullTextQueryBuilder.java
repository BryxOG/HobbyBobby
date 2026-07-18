package org.javaguru.eventservice.search;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Собирает выражение Postgres {@code to_tsquery('simple', ...)} из пользовательской строки.
 * Каждое слово становится префиксным термом ({@code слово:*}), слова связываются через {@code &} (AND).
 */
public final class FullTextQueryBuilder {

    private FullTextQueryBuilder() {
    }

    /**
     * Преобразует свободный текст в tsquery.
     *
     * @param rawQuery строка поиска пользователя
     * @return tsquery или {@code null}, если после очистки не осталось токенов
     */
    public static String toTsQuery(String rawQuery) {
        if (rawQuery == null || rawQuery.isBlank()) {
            return null;
        }
        String normalized = rawQuery.toLowerCase(Locale.ROOT).trim();
        String[] parts = normalized.split("\\s+");
        List<String> terms = new ArrayList<>();
        for (String part : parts) {
            String token = sanitizeToken(part);
            if (token.length() >= 2) {
                terms.add(token + ":*");
            }
        }
        if (terms.isEmpty()) {
            return null;
        }
        return String.join(" & ", terms);
    }

    /**
     * Оставляет буквы и цифры (включая кириллицу).
     *
     * @param raw сырой токен
     * @return очищенный токен
     */
    private static String sanitizeToken(String raw) {
        StringBuilder builder = new StringBuilder(raw.length());
        for (int i = 0; i < raw.length(); i++) {
            char ch = raw.charAt(i);
            if (Character.isLetterOrDigit(ch)) {
                builder.append(ch);
            }
        }
        return builder.toString();
    }
}
