package org.javaguru.eventservice.controller;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.dto.CreateEventRequest;
import org.javaguru.eventservice.dto.EventPageResponse;
import org.javaguru.eventservice.dto.EventResponse;
import org.javaguru.eventservice.dto.ParseSearchRequest;
import org.javaguru.eventservice.dto.PublishQuoteResponse;
import org.javaguru.eventservice.dto.SearchIntentResponse;
import org.javaguru.eventservice.search.RuleBasedSearchIntentParser;
import org.javaguru.eventservice.service.EventService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API ивентов.
 */
@RestController
@RequestMapping("eventservice/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final RuleBasedSearchIntentParser searchIntentParser;

    /**
     * Разбирает NL-запрос в структурированные фильтры (правила, без LLM).
     *
     * @param request текст и опциональный GPS
     * @return SearchIntent
     */
    @PostMapping("/search/parse")
    public SearchIntentResponse parseSearch(@Valid @RequestBody ParseSearchRequest request) {
        return searchIntentParser.parse(request.query(), request.userLat(), request.userLng());
    }

    /**
     * Возвращает страницу ивентов.
     *
     * @param currentUserId текущий пользователь
     * @param cursor        смещение
     * @param limit         размер страницы
     * @param query         текстовый поиск
     * @param activityIds   фильтр по типам
     * @param tagIds        фильтр по тегам
     * @param from          дата от
     * @param to            дата до
     * @param nearLat       широта
     * @param nearLng       долгота
     * @param radiusKm      радиус
     * @return страница ивентов
     */
    @GetMapping
    public EventPageResponse list(
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<String> activityIds,
            @RequestParam(required = false) List<String> tagIds,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) Double nearLat,
            @RequestParam(required = false) Double nearLng,
            @RequestParam(required = false) Double radiusKm
    ) {
        return eventService.list(
                currentUserId,
                cursor,
                limit,
                query,
                activityIds,
                tagIds,
                from,
                to,
                nearLat,
                nearLng,
                radiusKm
        );
    }

    /**
     * Возвращает ивенты текущего пользователя.
     *
     * @param currentUserId текущий пользователь
     * @param scope         organizing или participating
     * @param cursor        смещение
     * @param limit         размер страницы
     * @param query         текстовый поиск
     * @param activityIds   фильтр по типам
     * @param tagIds        фильтр по тегам
     * @param from          дата от
     * @param to            дата до
     * @param nearLat       широта
     * @param nearLng       долгота
     * @param radiusKm      радиус
     * @return страница ивентов
     */
    @GetMapping("/mine")
    public EventPageResponse mine(
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestParam String scope,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<String> activityIds,
            @RequestParam(required = false) List<String> tagIds,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) Double nearLat,
            @RequestParam(required = false) Double nearLng,
            @RequestParam(required = false) Double radiusKm
    ) {
        return eventService.mine(
                currentUserId,
                scope,
                cursor,
                limit,
                query,
                activityIds,
                tagIds,
                from,
                to,
                nearLat,
                nearLng,
                radiusKm
        );
    }

    /**
     * Возвращает котировку публикации.
     *
     * @return сумма публикации
     */
    @GetMapping("/publish-quote")
    public PublishQuoteResponse publishQuote() {
        return eventService.publishQuote();
    }

    /**
     * Возвращает карточку ивента.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId текущий пользователь
     * @return DTO ивента
     */
    @GetMapping("/{eventId}")
    public EventResponse getById(
            @PathVariable String eventId,
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        return eventService.getById(eventId, currentUserId);
    }

    /**
     * Отменяет ивент (только организатор).
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId текущий пользователь
     * @return обновлённый ивент
     */
    @PostMapping("/{eventId}/cancel")
    public EventResponse cancel(
            @PathVariable String eventId,
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        return eventService.cancel(eventId, currentUserId);
    }

    /**
     * Обновляет ивент (только организатор, не отменённый).
     *
     * @param eventId       идентификатор ивента
     * @param request       новые поля
     * @param currentUserId организатор
     * @return обновлённый ивент
     */
    @PutMapping("/{eventId}")
    public EventResponse update(
            @PathVariable String eventId,
            @Valid @RequestBody CreateEventRequest request,
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        return eventService.update(eventId, request, currentUserId);
    }

    /**
     * Создаёт новый ивент.
     *
     * @param request       данные ивента
     * @param currentUserId организатор
     * @return созданный ивент
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(
            @Valid @RequestBody CreateEventRequest request,
            @RequestHeader("X-User-Id") Long currentUserId
    ) {
        return eventService.create(request, currentUserId);
    }
}
