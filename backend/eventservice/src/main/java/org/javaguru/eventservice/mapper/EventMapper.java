package org.javaguru.eventservice.mapper;

import java.util.List;
import java.util.Map;
import org.javaguru.eventservice.dto.EventLocationDto;
import org.javaguru.eventservice.dto.EventPinResponse;
import org.javaguru.eventservice.dto.EventResponse;
import org.javaguru.eventservice.dto.TagResponse;
import org.javaguru.eventservice.dto.UserSummaryResponse;
import org.javaguru.eventservice.entity.EventEntity;
import org.springframework.stereotype.Component;

/**
 * Маппинг сущностей ивента в REST DTO.
 */
@Component
public class EventMapper {

    /**
     * Преобразует ивент в полную карточку.
     *
     * @param entity           сущность ивента
     * @param organizer        организатор
     * @param participants     участники
     * @param tags             теги ивента
     * @param currentUserId    текущий пользователь
     * @return DTO ивента
     */
    public EventResponse toResponse(
            EventEntity entity,
            UserSummaryResponse organizer,
            List<UserSummaryResponse> participants,
            List<TagResponse> tags,
            Long currentUserId
    ) {
        boolean isJoined = participants.stream().anyMatch(user -> user.id().equals(String.valueOf(currentUserId)))
                || entity.getOrganizerId().equals(currentUserId);
        return new EventResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getActivityId(),
                entity.getDescription(),
                entity.getStartsAt(),
                entity.getEndsAt(),
                toLocation(entity),
                organizer,
                participants,
                entity.getCapacity(),
                tags,
                isJoined,
                entity.getRating()
        );
    }

    /**
     * Преобразует ивент в пин для карты.
     *
     * @param entity           сущность ивента
     * @param participantCount количество участников
     * @return DTO пина
     */
    public EventPinResponse toPin(EventEntity entity, int participantCount) {
        return new EventPinResponse(
                entity.getId(),
                entity.getActivityId(),
                toLocation(entity),
                entity.getTitle(),
                entity.getStartsAt(),
                participantCount,
                entity.getCapacity()
        );
    }

    /**
     * Преобразует тег в DTO.
     *
     * @param id    идентификатор тега
     * @param label подпись
     * @return DTO тега
     */
    public TagResponse toTag(String id, String label) {
        return new TagResponse(id, label);
    }

    /**
     * Возвращает заглушку пользователя, если UserService недоступен.
     *
     * @param userId идентификатор пользователя
     * @return минимальный summary
     */
    public UserSummaryResponse fallbackUser(Long userId) {
        return new UserSummaryResponse(String.valueOf(userId), "User " + userId, null, 0, null);
    }

    /**
     * Возвращает summary из кэша или заглушку.
     *
     * @param userId идентификатор пользователя
     * @param cache  кэш пользователей
     * @return summary
     */
    public UserSummaryResponse resolveUser(Long userId, Map<Long, UserSummaryResponse> cache) {
        return cache.getOrDefault(userId, fallbackUser(userId));
    }

    /**
     * Преобразует координаты сущности в DTO локации.
     *
     * @param entity сущность ивента
     * @return DTO локации
     */
    private EventLocationDto toLocation(EventEntity entity) {
        return new EventLocationDto(entity.getLat(), entity.getLng(), entity.getAddress());
    }
}
