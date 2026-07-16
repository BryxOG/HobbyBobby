package org.javaguru.chat.kafka;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/**
 * Полезная нагрузка WebSocket-события {@code MESSAGE_NEW} для конкретного получателя.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WsPushPayload(
        String type,
        String messageId,
        String eventId,
        UserSummaryPayload author,
        String text,
        Instant sentAt,
        boolean isOwn
) {
    /**
     * Создаёт push-событие нового сообщения.
     *
     * @param source       исходное Kafka-событие
     * @param recipientId  идентификатор получателя
     * @return payload для WebSocket
     */
    public static WsPushPayload messageNew(ChatMessageCreatedEvent source, Long recipientId) {
        boolean isOwn = source.author() != null
                && String.valueOf(recipientId).equals(source.author().id());
        return new WsPushPayload(
                "MESSAGE_NEW",
                source.messageId(),
                source.eventId(),
                source.author(),
                source.text(),
                source.sentAt(),
                isOwn
        );
    }
}
