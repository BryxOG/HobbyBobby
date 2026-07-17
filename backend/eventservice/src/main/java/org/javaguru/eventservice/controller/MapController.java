package org.javaguru.eventservice.controller;

import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.dto.EventPinResponse;
import org.javaguru.eventservice.service.EventService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API пинов ивентов на карте.
 */
@RestController
@RequestMapping("eventservice/api/map")
@RequiredArgsConstructor
public class MapController {

    private final EventService eventService;

    /**
     * Возвращает пины ивентов для карты.
     *
     * @param query       текстовый поиск
     * @param activityIds фильтр по типам
     * @param tagIds      фильтр по тегам
     * @param from        дата от
     * @param to          дата до
     * @param nearLat     широта
     * @param nearLng     долгота
     * @param radiusKm    радиус
     * @return список пинов
     */
    @GetMapping("/pins")
    public List<EventPinResponse> pins(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<String> activityIds,
            @RequestParam(required = false) List<String> tagIds,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) Double nearLat,
            @RequestParam(required = false) Double nearLng,
            @RequestParam(required = false) Double radiusKm
    ) {
        return eventService.pins(query, activityIds, tagIds, from, to, nearLat, nearLng, radiusKm);
    }
}
