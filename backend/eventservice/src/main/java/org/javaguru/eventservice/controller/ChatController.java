package org.javaguru.eventservice.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.dto.ChatMessageResponse;
import org.javaguru.eventservice.dto.ChatSummaryResponse;
import org.javaguru.eventservice.dto.SendMessageRequest;
import org.javaguru.eventservice.service.ChatService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API чатов ивента.
 */
@RestController
@RequestMapping("eventservice/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * Возвращает список чатов текущего пользователя.
     *
     * @param currentUserId идентификатор пользователя (временно через заголовок)
     * @return summaries чатов
     */
    @GetMapping
    public List<ChatSummaryResponse> listChats(
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        return chatService.listChats(currentUserId);
    }

    /**
     * Возвращает историю сообщений чата.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId идентификатор пользователя
     * @return сообщения
     */
    @GetMapping("/{eventId}/messages")
    public List<ChatMessageResponse> listMessages(
            @PathVariable String eventId,
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        return chatService.listMessages(eventId, currentUserId);
    }

    /**
     * Отправляет сообщение в чат и публикует Kafka-событие.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId идентификатор пользователя
     * @param request       текст сообщения
     * @return созданное сообщение
     */
    @PostMapping("/{eventId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse sendMessage(
            @PathVariable String eventId,
            @RequestHeader("X-User-Id") Long currentUserId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        return chatService.sendMessage(eventId, currentUserId, request.text());
    }
}
