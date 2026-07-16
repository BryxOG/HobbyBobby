package org.javaguru.chat.kafka;

/**
 * Имена Kafka-топиков для чата ивента.
 */
public final class ChatKafkaTopics {

    /** Топик публикации нового сообщения после сохранения в EventService. */
    public static final String MESSAGE_CREATED = "chat.message.created";

    private ChatKafkaTopics() {
    }
}
