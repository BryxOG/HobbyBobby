package org.javaguru.realtimeservice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.javaguru.realtimeservice.websocket.ChatWebSocketHandler;

/**
 * Конфигурация WebSocket endpoint.
 */
@Configuration
@EnableWebSocket
@EnableConfigurationProperties(ChatProperties.class)
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;

    /**
     * Создаёт конфигурацию WebSocket.
     *
     * @param chatWebSocketHandler обработчик соединений
     */
    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler) {
        this.chatWebSocketHandler = chatWebSocketHandler;
    }

    /**
     * Регистрирует WebSocket handler.
     *
     * @param registry реестр handler'ов
     */
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, "/ws")
                .setAllowedOrigins("http://localhost:3000");
    }
}
