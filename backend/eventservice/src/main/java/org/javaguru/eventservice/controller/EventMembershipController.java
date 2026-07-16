package org.javaguru.eventservice.controller;

import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.dto.EventResponse;
import org.javaguru.eventservice.service.EventMembershipService;
import org.javaguru.eventservice.service.EventService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API участия в ивенте (доступ к чату).
 */
@RestController
@RequestMapping("eventservice/api/events")
@RequiredArgsConstructor
public class EventMembershipController {

    private final EventMembershipService membershipService;
    private final EventService eventService;

    /**
     * Добавляет текущего пользователя в участники ивента.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId идентификатор пользователя
     * @return актуальная карточка ивента
     */
    @PostMapping("/{eventId}/join")
    public EventResponse join(
            @PathVariable String eventId,
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        membershipService.join(eventId, currentUserId);
        return eventService.afterMembershipChange(eventId, currentUserId);
    }

    /**
     * Удаляет текущего пользователя из участников ивента.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId идентификатор пользователя
     * @return актуальная карточка ивента
     */
    @PostMapping("/{eventId}/leave")
    public EventResponse leave(
            @PathVariable String eventId,
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        membershipService.leave(eventId, currentUserId);
        return eventService.afterMembershipChange(eventId, currentUserId);
    }
}
