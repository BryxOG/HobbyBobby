package org.javaguru.chat.kafka;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;

/**
 * Краткое представление автора сообщения в Kafka-событии.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserSummaryPayload(
        String id,
        String name,
        String avatarUrl,
        int level,
        BigDecimal rating
) {
}
