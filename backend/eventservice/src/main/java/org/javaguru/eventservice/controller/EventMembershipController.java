package org.javaguru.eventservice.controller;

import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.service.EventMembershipService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API участия в ивенте (доступ к чату).
 */
@RestController
@RequestMapping("eventservice/api/events")
@RequiredArgsConstructor
public class EventMembershipController {

    private final EventMembershipService membershipService;

    /**
     * Добавляет текущего пользователя в участники ивента.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId идентификатор пользователя
     */
    @PostMapping("/{eventId}/join")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void join(
            @PathVariable String eventId,
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        membershipService.join(eventId, currentUserId);
    }

    /**
     * Удаляет текущего пользователя из участников ивента.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId идентификатор пользователя
     */
    @PostMapping("/{eventId}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(
            @PathVariable String eventId,
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        membershipService.leave(eventId, currentUserId);
    }
}
