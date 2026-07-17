package org.javaguru.realtimeservice.service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.javaguru.chat.kafka.ChatMessageCreatedEvent;
import org.javaguru.chat.kafka.WsPushPayload;
import org.javaguru.realtimeservice.registry.SessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

/**
 * Доставка Kafka-событий в активные WebSocket-соединения.
 */
@Service
@RequiredArgsConstructor
public class PushService {

    private static final Logger log = LoggerFactory.getLogger(PushService.class);

    private final SessionRegistry sessionRegistry;
    private final ObjectMapper objectMapper;

    /**
     * Рассылает новое сообщение всем получателям из Kafka-события.
     *
     * @param event событие из EventService
     */
    public void pushMessageCreated(ChatMessageCreatedEvent event) {
        if (event.recipientUserIds() == null || event.recipientUserIds().isEmpty()) {
            log.warn("Получатели пусты для messageId={}", event.messageId());
            return;
        }
        for (Long recipientId : event.recipientUserIds()) {
            WsPushPayload payload = WsPushPayload.messageNew(event, recipientId);
            pushToUser(recipientId, payload);
        }
    }

    /**
     * Отправляет JSON payload всем сессиям пользователя.
     *
     * @param userId  идентификатор пользователя
     * @param payload полезная нагрузка
     */
    private void pushToUser(Long userId, WsPushPayload payload) {
        Set<WebSocketSession> sessions = sessionRegistry.sessionsOf(userId);
        if (sessions.isEmpty()) {
            return;
        }
        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (JacksonException exception) {
            log.error("Не удалось сериализовать WS payload для userId={}", userId, exception);
            return;
        }
        TextMessage message = new TextMessage(json);
        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) {
                continue;
            }
            try {
                session.sendMessage(message);
            } catch (IOException exception) {
                log.warn("Не удалось отправить WS сообщение sessionId={}", session.getId(), exception);
            }
        }
    }
}
