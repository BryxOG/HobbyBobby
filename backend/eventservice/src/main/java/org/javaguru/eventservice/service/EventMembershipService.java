package org.javaguru.eventservice.service;

import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.entity.EventEntity;
import org.javaguru.eventservice.entity.EventParticipantEntity;
import org.javaguru.eventservice.entity.EventParticipantEntity.EventParticipantId;
import org.javaguru.eventservice.exception.ResourceNotFoundException;
import org.javaguru.eventservice.repository.EventParticipantRepository;
import org.javaguru.eventservice.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Управление участием в ивенте для доступа к чату.
 */
@Service
@RequiredArgsConstructor
public class EventMembershipService {

    private final EventRepository eventRepository;
    private final EventParticipantRepository participantRepository;

    /**
     * Добавляет пользователя в участники ивента.
     *
     * @param eventId идентификатор ивента
     * @param userId  идентификатор пользователя
     */
    @Transactional
    public void join(String eventId, Long userId) {
        EventEntity event = requireEvent(eventId);
        if (event.getOrganizerId().equals(userId)) {
            return;
        }
        if (participantRepository.existsByIdEventIdAndIdUserId(eventId, userId)) {
            return;
        }
        EventParticipantEntity participant = new EventParticipantEntity();
        participant.setId(new EventParticipantId(eventId, userId));
        participantRepository.save(participant);
    }

    /**
     * Удаляет пользователя из участников ивента.
     *
     * @param eventId идентификатор ивента
     * @param userId  идентификатор пользователя
     */
    @Transactional
    public void leave(String eventId, Long userId) {
        requireEvent(eventId);
        participantRepository.deleteById(new EventParticipantId(eventId, userId));
    }

    /**
     * Возвращает ивент или бросает 404.
     *
     * @param eventId идентификатор ивента
     * @return сущность ивента
     */
    private EventEntity requireEvent(String eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ивент не найден в EventService: " + eventId
                                + ". Чат доступен только для ивентов, синхронизированных с бэкендом."
                ));
    }
}
