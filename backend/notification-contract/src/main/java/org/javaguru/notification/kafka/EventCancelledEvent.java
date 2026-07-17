package org.javaguru.notification.kafka;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

/**
 * Событие Kafka: ивент отменён организатором.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EventCancelledEvent(
        String eventId,
        String title,
        Instant startsAt,
        Instant cancelledAt,
        List<Long> recipientUserIds
) {
}
