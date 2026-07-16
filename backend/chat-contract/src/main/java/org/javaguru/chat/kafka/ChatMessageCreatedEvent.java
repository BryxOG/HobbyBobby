package org.javaguru.chat.kafka;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

/**
 * Событие Kafka: сообщение чата ивента сохранено в EventService.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChatMessageCreatedEvent(
        String messageId,
        String eventId,
        String text,
        Instant sentAt,
        UserSummaryPayload author,
        List<Long> recipientUserIds
) {
}
