package org.javaguru.realtimeservice.websocket;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.javaguru.realtimeservice.registry.SessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * WebSocket handler: регистрация соединений и PING/PONG.
 */
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    private final SessionRegistry sessionRegistry;
    private final ObjectMapper objectMapper;

    /**
     * Регистрирует сессию после успешного handshake.
     *
     * @param session WebSocket-сессия
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = resolveUserId(session);
        if (userId == null) {
            closeUnauthorized(session);
            return;
        }
        session.getAttributes().put("userId", userId);
        sessionRegistry.register(userId, session);
        log.info("WS connected userId={} sessionId={}", userId, session.getId());
    }

    /**
     * Обрабатывает входящие клиентские сообщения.
     *
     * @param session WebSocket-сессия
     * @param message текстовое сообщение
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode root = objectMapper.readTree(message.getPayload());
        String type = root.path("type").asText();
        if ("PING".equals(type)) {
            session.sendMessage(new TextMessage("{\"type\":\"PONG\"}"));
        }
    }

    /**
     * Удаляет сессию из реестра при закрытии.
     *
     * @param session WebSocket-сессия
     * @param status  статус закрытия
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessionRegistry.unregister(session);
        log.info("WS disconnected sessionId={} status={}", session.getId(), status);
    }

    /**
     * Удаляет сессию при ошибке транспорта.
     *
     * @param session   WebSocket-сессия
     * @param exception ошибка
     */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WS transport error sessionId={}", session.getId(), exception);
        sessionRegistry.unregister(session);
    }

    /**
     * Извлекает userId из query-параметра (временно до JWT на handshake).
     *
     * @param session WebSocket-сессия
     * @return идентификатор пользователя или null
     */
    private Long resolveUserId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) {
            return null;
        }
        String userIdValue = UriComponentsBuilder.fromUri(uri)
                .build()
                .getQueryParams()
                .getFirst("userId");
        if (userIdValue == null || userIdValue.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(userIdValue);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    /**
     * Закрывает соединение без авторизации.
     *
     * @param session WebSocket-сессия
     */
    private void closeUnauthorized(WebSocketSession session) {
        try {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("userId query param required"));
        } catch (Exception exception) {
            log.warn("Не удалось закрыть неавторизованную WS сессию {}", session.getId(), exception);
        }
    }
}
