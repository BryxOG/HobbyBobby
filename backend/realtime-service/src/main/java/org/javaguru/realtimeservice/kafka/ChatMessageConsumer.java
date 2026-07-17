package org.javaguru.realtimeservice.kafka;

import lombok.RequiredArgsConstructor;
import org.javaguru.chat.kafka.ChatMessageCreatedEvent;
import org.javaguru.realtimeservice.config.ChatProperties;
import org.javaguru.realtimeservice.service.PushService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumer Kafka-событий чата.
 */
@Component
@RequiredArgsConstructor
public class ChatMessageConsumer {

    private static final Logger log = LoggerFactory.getLogger(ChatMessageConsumer.class);

    private final PushService pushService;

    /**
     * Обрабатывает событие нового сообщения и пушит в WebSocket.
     *
     * @param event событие из топика chat.message.created
     */
    @KafkaListener(topics = "${app.chat.kafka-topic}")
    public void onMessageCreated(ChatMessageCreatedEvent event) {
        log.debug(
                "Получено chat.message.created messageId={} eventId={} recipients={}",
                event.messageId(),
                event.eventId(),
                event.recipientUserIds()
        );
        pushService.pushMessageCreated(event);
    }
}
