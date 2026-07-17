package org.javaguru.realtimeservice.registry;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

/**
 * In-memory реестр активных WebSocket-соединений.
 */
@Component
public class SessionRegistry {

    private final ConcurrentHashMap<Long, Set<WebSocketSession>> sessionsByUser = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> userIdBySessionId = new ConcurrentHashMap<>();

    /**
     * Регистрирует новое соединение пользователя.
     *
     * @param userId  идентификатор пользователя
     * @param session WebSocket-сессия
     */
    public void register(Long userId, WebSocketSession session) {
        sessionsByUser
                .computeIfAbsent(userId, ignored -> new CopyOnWriteArraySet<>())
                .add(session);
        userIdBySessionId.put(session.getId(), userId);
    }

    /**
     * Удаляет соединение из реестра.
     *
     * @param session WebSocket-сессия
     */
    public void unregister(WebSocketSession session) {
        Long userId = userIdBySessionId.remove(session.getId());
        if (userId == null) {
            return;
        }
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions == null) {
            return;
        }
        sessions.remove(session);
        if (sessions.isEmpty()) {
            sessionsByUser.remove(userId, sessions);
        }
    }

    /**
     * Возвращает все активные сессии пользователя.
     *
     * @param userId идентификатор пользователя
     * @return неизменяемый набор сессий
     */
    public Set<WebSocketSession> sessionsOf(Long userId) {
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return Set.of();
        }
        return Collections.unmodifiableSet(sessions);
    }
}
