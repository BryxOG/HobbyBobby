package org.javaguru.eventservice.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.entity.EventEntity;
import org.javaguru.eventservice.exception.ForbiddenException;
import org.javaguru.eventservice.exception.ResourceNotFoundException;
import org.javaguru.eventservice.repository.EventParticipantRepository;
import org.javaguru.eventservice.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Проверка доступа к чату ивента.
 */
@Service
@RequiredArgsConstructor
public class ChatAccessService {

    private final EventRepository eventRepository;
    private final EventParticipantRepository participantRepository;

    /**
     * Возвращает ивент, если пользователь имеет доступ к чату.
     *
     * @param eventId идентификатор ивента
     * @param userId  идентификатор пользователя
     * @return сущность ивента
     */
    @Transactional(readOnly = true)
    public EventEntity requireAccessibleEvent(String eventId, Long userId) {
        EventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Ивент не найден: " + eventId));
        if (!hasAccess(event, userId)) {
            throw new ForbiddenException("Нет доступа к чату ивента");
        }
        return event;
    }

    /**
     * Возвращает идентификаторы получателей push-события.
     *
     * @param event ивент
     * @return уникальные user id организатора и участников
     */
    @Transactional(readOnly = true)
    public List<Long> recipientUserIds(EventEntity event) {
        Set<Long> recipients = new HashSet<>(participantRepository.findUserIdsByEventId(event.getId()));
        recipients.add(event.getOrganizerId());
        return recipients.stream().sorted().toList();
    }

    /**
     * Проверяет, может ли пользователь читать/писать в чат.
     *
     * @param event  ивент
     * @param userId идентификатор пользователя
     * @return true, если доступ разрешён
     */
    private boolean hasAccess(EventEntity event, Long userId) {
        if (event.getOrganizerId().equals(userId)) {
            return true;
        }
        return participantRepository.existsByIdEventIdAndIdUserId(event.getId(), userId);
    }
}
