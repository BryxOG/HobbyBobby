package org.javaguru.eventservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;

/**
 * Краткое представление пользователя для фронтенда.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserSummaryResponse(
        String id,
        String name,
        String avatarUrl,
        int level,
        BigDecimal rating
) {
}
