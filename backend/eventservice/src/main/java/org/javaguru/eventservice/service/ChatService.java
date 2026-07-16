package org.javaguru.eventservice.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.javaguru.chat.kafka.ChatMessageCreatedEvent;
import org.javaguru.eventservice.client.UserServiceClient;
import org.javaguru.eventservice.dto.ChatMessageResponse;
import org.javaguru.eventservice.dto.ChatSummaryResponse;
import org.javaguru.eventservice.dto.UserSummaryResponse;
import org.javaguru.eventservice.entity.ChatMessageEntity;
import org.javaguru.eventservice.entity.ChatReadStateEntity;
import org.javaguru.eventservice.entity.ChatReadStateEntity.ChatReadStateId;
import org.javaguru.eventservice.entity.EventEntity;
import org.javaguru.eventservice.kafka.ChatMessageProducer;
import org.javaguru.eventservice.mapper.ChatMapper;
import org.javaguru.eventservice.repository.ChatMessageRepository;
import org.javaguru.eventservice.repository.ChatReadStateRepository;
import org.javaguru.eventservice.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Бизнес-логика чатов ивента.
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private static final Instant EPOCH = Instant.EPOCH;

    private final EventRepository eventRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatReadStateRepository readStateRepository;
    private final ChatAccessService accessService;
    private final UserServiceClient userServiceClient;
    private final ChatMapper chatMapper;
    private final ChatMessageProducer chatMessageProducer;

    /**
     * Возвращает список чатов текущего пользователя.
     *
     * @param currentUserId идентификатор текущего пользователя
     * @return summaries, отсортированные по времени последнего сообщения
     */
    @Transactional(readOnly = true)
    public List<ChatSummaryResponse> listChats(Long currentUserId) {
        List<EventEntity> events = eventRepository.findAccessibleByUserId(currentUserId);
        if (events.isEmpty()) {
            return List.of();
        }

        List<Long> organizerIds = events.stream().map(EventEntity::getOrganizerId).toList();
        Map<Long, UserSummaryResponse> organizers = userServiceClient.findSummariesByIds(organizerIds);

        List<ChatSummaryResponse> summaries = new ArrayList<>();
        for (EventEntity event : events) {
            ChatMessageEntity lastMessage = messageRepository
                    .findTopByEventIdOrderByCreatedAtDesc(event.getId())
                    .orElse(null);
            Instant lastReadAt = readStateRepository.findById(new ChatReadStateId(event.getId(), currentUserId))
                    .map(ChatReadStateEntity::getLastReadAt)
                    .orElse(EPOCH);
            long unread = messageRepository.countUnread(event.getId(), currentUserId, lastReadAt);

            UserSummaryResponse organizer = organizers.getOrDefault(
                    event.getOrganizerId(),
                    new UserSummaryResponse(String.valueOf(event.getOrganizerId()), "User " + event.getOrganizerId(), null, 0, null)
            );

            summaries.add(new ChatSummaryResponse(
                    event.getId(),
                    event.getTitle(),
                    event.getActivityId(),
                    organizer,
                    lastMessage != null ? chatMapper.toLastMessagePreview(lastMessage, currentUserId) : null,
                    unread
            ));
        }

        summaries.sort(Comparator.comparing(
                summary -> summary.lastMessage() != null ? summary.lastMessage().sentAt() : EPOCH,
                Comparator.reverseOrder()
        ));
        return summaries;
    }

    /**
     * Возвращает историю сообщений и помечает чат прочитанным.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId идентификатор текущего пользователя
     * @return сообщения в хронологическом порядке
     */
    @Transactional
    public List<ChatMessageResponse> listMessages(String eventId, Long currentUserId) {
        accessService.requireAccessibleEvent(eventId, currentUserId);
        List<ChatMessageEntity> messages = messageRepository.findByEventIdOrderByCreatedAtAsc(eventId);
        markAsRead(eventId, currentUserId);

        List<Long> authorIds = messages.stream().map(ChatMessageEntity::getAuthorId).toList();
        Map<Long, UserSummaryResponse> authors = userServiceClient.findSummariesByIds(authorIds);

        return messages.stream()
                .map(message -> chatMapper.toMessageResponse(message, authors, currentUserId))
                .toList();
    }

    /**
     * Сохраняет сообщение и публикует Kafka-событие для Socket-сервиса.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId идентификатор текущего пользователя
     * @param text          текст сообщения
     * @return созданное сообщение
     */
    @Transactional
    public ChatMessageResponse sendMessage(String eventId, Long currentUserId, String text) {
        EventEntity event = accessService.requireAccessibleEvent(eventId, currentUserId);

        ChatMessageEntity entity = new ChatMessageEntity();
        entity.setId(UUID.randomUUID());
        entity.setEventId(eventId);
        entity.setAuthorId(currentUserId);
        entity.setText(text.trim());
        entity.setCreatedAt(Instant.now());
        ChatMessageEntity saved = messageRepository.save(entity);

        Map<Long, UserSummaryResponse> authors = userServiceClient.findSummariesByIds(List.of(currentUserId));
        UserSummaryResponse author = authors.getOrDefault(
                currentUserId,
                new UserSummaryResponse(String.valueOf(currentUserId), "User " + currentUserId, null, 0, null)
        );

        List<Long> recipients = accessService.recipientUserIds(event);
        ChatMessageCreatedEvent kafkaEvent = new ChatMessageCreatedEvent(
                saved.getId().toString(),
                eventId,
                saved.getText(),
                saved.getCreatedAt(),
                chatMapper.toKafkaAuthor(author),
                recipients
        );
        chatMessageProducer.publishMessageCreated(kafkaEvent);

        return chatMapper.toMessageResponse(saved, Map.of(currentUserId, author), currentUserId);
    }

    /**
     * Обновляет метку прочтения чата пользователем.
     *
     * @param eventId идентификатор ивента
     * @param userId  идентификатор пользователя
     */
    private void markAsRead(String eventId, Long userId) {
        ChatReadStateId id = new ChatReadStateId(eventId, userId);
        ChatReadStateEntity state = readStateRepository.findById(id).orElseGet(() -> {
            ChatReadStateEntity created = new ChatReadStateEntity();
            created.setId(id);
            return created;
        });
        state.setLastReadAt(Instant.now());
        readStateRepository.save(state);
    }
}
