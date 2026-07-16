package org.javaguru.eventservice.kafka;

import lombok.RequiredArgsConstructor;
import org.javaguru.chat.kafka.ChatMessageCreatedEvent;
import org.javaguru.eventservice.config.ChatProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Публикация событий чата в Kafka.
 */
@Component
@RequiredArgsConstructor
public class ChatMessageProducer {

    private static final Logger log = LoggerFactory.getLogger(ChatMessageProducer.class);

    private final KafkaTemplate<String, ChatMessageCreatedEvent> kafkaTemplate;
    private final ChatProperties chatProperties;

    /**
     * Публикует событие о новом сообщении.
     *
     * @param event событие для Socket-сервиса
     */
    public void publishMessageCreated(ChatMessageCreatedEvent event) {
        kafkaTemplate.send(chatProperties.kafkaTopic(), event.eventId(), event)
                .whenComplete((result, error) -> {
                    if (error != null) {
                        log.error(
                                "Не удалось опубликовать chat.message.created для eventId={}",
                                event.eventId(),
                                error
                        );
                        return;
                    }
                    log.debug(
                            "Опубликовано chat.message.created messageId={} partition={}",
                            event.messageId(),
                            result.getRecordMetadata().partition()
                    );
                });
    }
}
