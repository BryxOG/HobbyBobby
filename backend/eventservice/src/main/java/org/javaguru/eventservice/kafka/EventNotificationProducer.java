package org.javaguru.eventservice.kafka;

import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.config.EventNotificationProperties;
import org.javaguru.notification.kafka.EventCancelledEvent;
import org.javaguru.notification.kafka.EventReminderDueEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Публикация событий уведомлений об ивентах в Kafka.
 */
@Component
@RequiredArgsConstructor
public class EventNotificationProducer {

    private static final Logger log = LoggerFactory.getLogger(EventNotificationProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final EventNotificationProperties properties;

    /**
     * Публикует напоминание за час до начала ивента.
     *
     * @param event событие напоминания
     */
    public void publishReminderDue(EventReminderDueEvent event) {
        send(properties.reminderTopic(), event.eventId(), event);
    }

    /**
     * Публикует отмену ивента.
     *
     * @param event событие отмены
     */
    public void publishCancelled(EventCancelledEvent event) {
        send(properties.cancelledTopic(), event.eventId(), event);
    }

    /**
     * Отправляет сообщение в Kafka и логирует ошибку при сбое.
     *
     * @param topic   имя топика
     * @param key     ключ партиции
     * @param payload тело сообщения
     */
    private void send(String topic, String key, Object payload) {
        kafkaTemplate.send(topic, key, payload)
                .whenComplete((result, error) -> {
                    if (error != null) {
                        log.error("Не удалось опубликовать {} для eventId={}", topic, key, error);
                        return;
                    }
                    log.debug(
                            "Опубликовано {} eventId={} partition={}",
                            topic,
                            key,
                            result.getRecordMetadata().partition()
                    );
                });
    }
}
