package org.javaguru.eventservice.mapper;

import java.util.Map;
import org.javaguru.chat.kafka.UserSummaryPayload;
import org.javaguru.eventservice.dto.ChatMessageResponse;
import org.javaguru.eventservice.dto.LastMessagePreview;
import org.javaguru.eventservice.dto.UserSummaryResponse;
import org.javaguru.eventservice.entity.ChatMessageEntity;
import org.springframework.stereotype.Component;

/**
 * Маппинг сущностей чата в DTO.
 */
@Component
public class ChatMapper {

    /**
     * Преобразует сообщение в REST DTO.
     *
     * @param entity      сущность сообщения
     * @param authors     кэш авторов
     * @param currentUser текущий пользователь
     * @return DTO сообщения
     */
    public ChatMessageResponse toMessageResponse(
            ChatMessageEntity entity,
            Map<Long, UserSummaryResponse> authors,
            Long currentUser
    ) {
        UserSummaryResponse author = authors.getOrDefault(
                entity.getAuthorId(),
                fallbackAuthor(entity.getAuthorId())
        );
        return new ChatMessageResponse(
                entity.getId().toString(),
                entity.getEventId(),
                author,
                entity.getText(),
                entity.getCreatedAt(),
                entity.getAuthorId().equals(currentUser)
        );
    }

    /**
     * Преобразует сообщение в превью для списка чатов.
     *
     * @param entity      сущность сообщения
     * @param currentUser текущий пользователь
     * @return превью последнего сообщения
     */
    public LastMessagePreview toLastMessagePreview(ChatMessageEntity entity, Long currentUser) {
        return new LastMessagePreview(
                entity.getText(),
                entity.getCreatedAt(),
                entity.getAuthorId().equals(currentUser)
        );
    }

    /**
     * Преобразует summary в Kafka payload.
     *
     * @param author данные автора
     * @return payload для Kafka
     */
    public UserSummaryPayload toKafkaAuthor(UserSummaryResponse author) {
        return new UserSummaryPayload(
                author.id(),
                author.name(),
                author.avatarUrl(),
                author.level(),
                author.rating()
        );
    }

    /**
     * Возвращает заглушку, если UserService недоступен.
     *
     * @param userId идентификатор пользователя
     * @return минимальный summary
     */
    private UserSummaryResponse fallbackAuthor(Long userId) {
        return new UserSummaryResponse(String.valueOf(userId), "User " + userId, null, 0, null);
    }
}
