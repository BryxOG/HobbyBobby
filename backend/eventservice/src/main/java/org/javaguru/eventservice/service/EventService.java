package org.javaguru.eventservice.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.javaguru.eventservice.client.UserServiceClient;
import org.javaguru.eventservice.dto.CreateEventRequest;
import org.javaguru.eventservice.dto.EventPageResponse;
import org.javaguru.eventservice.dto.EventPinResponse;
import org.javaguru.eventservice.dto.EventResponse;
import org.javaguru.eventservice.dto.PublishQuoteResponse;
import org.javaguru.eventservice.dto.TagResponse;
import org.javaguru.eventservice.dto.UserSummaryResponse;
import org.javaguru.eventservice.entity.EventEntity;
import org.javaguru.eventservice.entity.EventStatus;
import org.javaguru.eventservice.entity.EventParticipantEntity;
import org.javaguru.eventservice.entity.EventParticipantEntity.EventParticipantId;
import org.javaguru.eventservice.entity.EventTagEntity;
import org.javaguru.eventservice.entity.TagEntity;
import org.javaguru.eventservice.exception.ConflictException;
import org.javaguru.eventservice.exception.ForbiddenException;
import org.javaguru.eventservice.exception.ResourceNotFoundException;
import org.javaguru.eventservice.kafka.EventNotificationProducer;
import org.javaguru.notification.kafka.EventCancelledEvent;
import org.javaguru.eventservice.mapper.EventMapper;
import org.javaguru.eventservice.repository.EventParticipantRepository;
import org.javaguru.eventservice.repository.EventRepository;
import org.javaguru.eventservice.repository.EventTagRepository;
import org.javaguru.eventservice.repository.TagRepository;
import org.javaguru.eventservice.search.FullTextQueryBuilder;
import org.javaguru.eventservice.search.RuleBasedSearchIntentParser;
import org.javaguru.eventservice.dto.SearchIntentResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Бизнес-логика CRUD ивентов.
 */
@Service
@RequiredArgsConstructor
public class EventService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final double EARTH_RADIUS_KM = 6371.0;

    private final EventRepository eventRepository;
    private final EventParticipantRepository participantRepository;
    private final EventTagRepository eventTagRepository;
    private final TagRepository tagRepository;
    private final UserServiceClient userServiceClient;
    private final EventMapper eventMapper;
    private final EventNotificationProducer notificationProducer;
    private final RuleBasedSearchIntentParser searchIntentParser;

    /**
     * Возвращает страницу ивентов с фильтрами.
     *
     * @param currentUserId текущий пользователь
     * @param cursor        смещение (строка-число)
     * @param limit         размер страницы
     * @param query         текстовый поиск
     * @param activityIds   фильтр по типам активности
     * @param tagIds        фильтр по тегам
     * @param from          нижняя граница даты начала
     * @param to            верхняя граница даты начала
     * @param nearLat       широта для геофильтра
     * @param nearLng       долгота для геофильтра
     * @param radiusKm      радиус геофильтра
     * @return страница ивентов
     */
    @Transactional(readOnly = true)
    public EventPageResponse list(
            Long currentUserId,
            String cursor,
            Integer limit,
            String query,
            List<String> activityIds,
            List<String> tagIds,
            Instant from,
            Instant to,
            Double nearLat,
            Double nearLng,
            Double radiusKm
    ) {
        ResolvedFilters resolved = resolveFilters(
                query,
                activityIds,
                tagIds,
                from,
                to,
                nearLat,
                nearLng,
                radiusKm
        );
        List<EventEntity> filtered = filterEvents(
                eventRepository.findAllByOrderByStartsAtAsc().stream()
                        .filter(event -> event.getStatus() == EventStatus.ACTIVE)
                        .toList(),
                resolved.query(),
                resolved.activityIds(),
                resolved.tagIds(),
                resolved.from(),
                resolved.to(),
                resolved.nearLat(),
                resolved.nearLng(),
                resolved.radiusKm()
        );
        return paginate(filtered, currentUserId, cursor, limit);
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
     * @param from          нижняя граница даты
     * @param to            верхняя граница даты
     * @param nearLat       широта
     * @param nearLng       долгота
     * @param radiusKm      радиус
     * @return страница ивентов
     */
    @Transactional(readOnly = true)
    public EventPageResponse mine(
            Long currentUserId,
            String scope,
            String cursor,
            Integer limit,
            String query,
            List<String> activityIds,
            List<String> tagIds,
            Instant from,
            Instant to,
            Double nearLat,
            Double nearLng,
            Double radiusKm
    ) {
        List<EventEntity> source = eventRepository.findAccessibleByUserId(currentUserId);
        List<EventEntity> scoped = source.stream()
                .filter(event -> matchesScope(event, currentUserId, scope))
                .sorted(Comparator.comparing(EventEntity::getStartsAt))
                .toList();
        ResolvedFilters resolved = resolveFilters(
                query,
                activityIds,
                tagIds,
                from,
                to,
                nearLat,
                nearLng,
                radiusKm
        );
        List<EventEntity> filtered = filterEvents(
                scoped,
                resolved.query(),
                resolved.activityIds(),
                resolved.tagIds(),
                resolved.from(),
                resolved.to(),
                resolved.nearLat(),
                resolved.nearLng(),
                resolved.radiusKm()
        );
        return paginate(filtered, currentUserId, cursor, limit);
    }

    /**
     * Возвращает карточку ивента.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId текущий пользователь
     * @return DTO ивента
     */
    @Transactional(readOnly = true)
    public EventResponse getById(String eventId, Long currentUserId) {
        EventEntity entity = requireEvent(eventId);
        return toResponses(List.of(entity), currentUserId).getFirst();
    }

    /**
     * Отменяет ивент организатором и уведомляет участников через Kafka.
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId текущий пользователь
     * @return обновлённая карточка ивента
     */
    @Transactional
    public EventResponse cancel(String eventId, Long currentUserId) {
        EventEntity entity = requireEvent(eventId);
        if (!entity.getOrganizerId().equals(currentUserId)) {
            throw new ForbiddenException("Только организатор может отменить ивент");
        }
        if (entity.getStatus() == EventStatus.CANCELLED) {
            throw new ConflictException("Ивент уже отменён");
        }
        Instant cancelledAt = Instant.now();
        entity.setStatus(EventStatus.CANCELLED);
        entity.setCancelledAt(cancelledAt);
        List<Long> recipients = participantRepository.findUserIdsByEventId(eventId);
        notificationProducer.publishCancelled(new EventCancelledEvent(
                entity.getId(),
                entity.getTitle(),
                entity.getStartsAt(),
                cancelledAt,
                recipients
        ));
        return toResponses(List.of(entity), currentUserId).getFirst();
    }

    /**
     * Создаёт новый ивент от имени текущего пользователя.
     *
     * @param request       данные ивента
     * @param currentUserId организатор
     * @return созданный ивент
     */
    @Transactional
    public EventResponse create(CreateEventRequest request, Long currentUserId) {
        EventEntity entity = new EventEntity();
        entity.setId("e-new-" + System.currentTimeMillis());
        entity.setTitle(request.title().trim());
        entity.setActivityId(request.activityId());
        entity.setDescription(request.description().trim());
        entity.setStartsAt(request.startsAt());
        entity.setEndsAt(request.endsAt());
        entity.setLat(request.location().lat());
        entity.setLng(request.location().lng());
        entity.setAddress(request.location().address().trim());
        entity.setCapacity(request.capacity());
        entity.setOrganizerId(currentUserId);
        entity.setStatus(EventStatus.ACTIVE);

        Map<Long, UserSummaryResponse> users = userServiceClient.findSummariesByIds(List.of(currentUserId));
        UserSummaryResponse organizer = eventMapper.resolveUser(currentUserId, users);
        entity.setRating(organizer.rating());

        eventRepository.save(entity);
        saveTags(entity.getId(), request.tagIds());

        EventParticipantEntity participant = new EventParticipantEntity();
        participant.setId(new EventParticipantId(entity.getId(), currentUserId));
        participantRepository.save(participant);

        return getById(entity.getId(), currentUserId);
    }

    /**
     * Возвращает пины ивентов для карты.
     *
     * @param query         текстовый поиск
     * @param activityIds   фильтр по типам
     * @param tagIds        фильтр по тегам
     * @param from          нижняя граница даты
     * @param to            верхняя граница даты
     * @param nearLat       широта
     * @param nearLng       долгота
     * @param radiusKm      радиус
     * @return список пинов
     */
    @Transactional(readOnly = true)
    public List<EventPinResponse> pins(
            String query,
            List<String> activityIds,
            List<String> tagIds,
            Instant from,
            Instant to,
            Double nearLat,
            Double nearLng,
            Double radiusKm
    ) {
        ResolvedFilters resolved = resolveFilters(
                query,
                activityIds,
                tagIds,
                from,
                to,
                nearLat,
                nearLng,
                radiusKm
        );
        List<EventEntity> filtered = filterEvents(
                eventRepository.findAllByOrderByStartsAtAsc().stream()
                        .filter(event -> event.getStatus() == EventStatus.ACTIVE)
                        .toList(),
                resolved.query(),
                resolved.activityIds(),
                resolved.tagIds(),
                resolved.from(),
                resolved.to(),
                resolved.nearLat(),
                resolved.nearLng(),
                resolved.radiusKm()
        );
        Map<String, Integer> counts = participantCounts(filtered);
        return filtered.stream()
                .map(event -> eventMapper.toPin(event, counts.getOrDefault(event.getId(), 0)))
                .toList();
    }

    /**
     * Возвращает котировку публикации ивента.
     *
     * @return сумма и валюта
     */
    @Transactional(readOnly = true)
    public PublishQuoteResponse publishQuote() {
        return new PublishQuoteResponse(50, "RUB", "Разовая публикация ивента");
    }

    /**
     * Возвращает ивент после операции membership (join/leave).
     *
     * @param eventId       идентификатор ивента
     * @param currentUserId текущий пользователь
     * @return актуальная карточка
     */
    @Transactional(readOnly = true)
    public EventResponse afterMembershipChange(String eventId, Long currentUserId) {
        return getById(eventId, currentUserId);
    }

    /**
     * Проверяет, что в ивенте есть свободные места.
     *
     * @param eventId идентификатор ивента
     */
    @Transactional(readOnly = true)
    public void requireCapacityAvailable(String eventId) {
        EventEntity event = requireEvent(eventId);
        int count = participantRepository.findUserIdsByEventId(eventId).size();
        if (count >= event.getCapacity()) {
            throw new ConflictException("EVENT_FULL");
        }
    }

    /**
     * Возвращает сущность ивента или 404.
     *
     * @param eventId идентификатор ивента
     * @return сущность
     */
    public EventEntity requireEvent(String eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Ивент не найден: " + eventId));
    }

    /**
     * Формирует страницу из отфильтрованного списка.
     *
     * @param events        ивенты
     * @param currentUserId текущий пользователь
     * @param cursor        смещение
     * @param limit         размер страницы
     * @return страница
     */
    private EventPageResponse paginate(
            List<EventEntity> events,
            Long currentUserId,
            String cursor,
            Integer limit
    ) {
        int pageSize = limit != null && limit > 0 ? limit : DEFAULT_PAGE_SIZE;
        int start = cursor != null && !cursor.isBlank() ? Integer.parseInt(cursor) : 0;
        int end = Math.min(start + pageSize, events.size());
        List<EventEntity> slice = start < events.size() ? events.subList(start, end) : List.of();
        List<EventResponse> items = toResponses(slice, currentUserId);
        String nextCursor = end < events.size() ? String.valueOf(end) : null;
        return new EventPageResponse(items, nextCursor, events.size());
    }

    /**
     * Преобразует список сущностей в DTO с обогащением пользователей и тегов.
     *
     * @param entities      ивенты
     * @param currentUserId текущий пользователь
     * @return список DTO
     */
    private List<EventResponse> toResponses(List<EventEntity> entities, Long currentUserId) {
        if (entities.isEmpty()) {
            return List.of();
        }

        List<String> eventIds = entities.stream().map(EventEntity::getId).toList();
        Map<String, List<Long>> participantsByEvent = loadParticipants(eventIds);
        Map<String, List<TagResponse>> tagsByEvent = loadTags(eventIds);

        Set<Long> userIds = new HashSet<>();
        for (EventEntity entity : entities) {
            userIds.add(entity.getOrganizerId());
            userIds.addAll(participantsByEvent.getOrDefault(entity.getId(), List.of()));
        }
        Map<Long, UserSummaryResponse> users = userServiceClient.findSummariesByIds(userIds);

        List<EventResponse> responses = new ArrayList<>();
        for (EventEntity entity : entities) {
            UserSummaryResponse organizer = eventMapper.resolveUser(entity.getOrganizerId(), users);
            List<UserSummaryResponse> participants = participantsByEvent
                    .getOrDefault(entity.getId(), List.of())
                    .stream()
                    .map(userId -> eventMapper.resolveUser(userId, users))
                    .toList();
            List<TagResponse> tags = tagsByEvent.getOrDefault(entity.getId(), List.of());
            responses.add(eventMapper.toResponse(entity, organizer, participants, tags, currentUserId));
        }
        return responses;
    }

    /**
     * Загружает участников для списка ивентов.
     *
     * @param eventIds идентификаторы ивентов
     * @return map eventId → userIds
     */
    private Map<String, List<Long>> loadParticipants(List<String> eventIds) {
        Map<String, List<Long>> result = new HashMap<>();
        for (String eventId : eventIds) {
            result.put(eventId, participantRepository.findUserIdsByEventId(eventId));
        }
        return result;
    }

    /**
     * Загружает теги для списка ивентов.
     *
     * @param eventIds идентификаторы ивентов
     * @return map eventId → теги
     */
    private Map<String, List<TagResponse>> loadTags(List<String> eventIds) {
        List<EventTagEntity> links = eventTagRepository.findByEventIds(eventIds);
        if (links.isEmpty()) {
            return Map.of();
        }

        Set<String> tagIds = links.stream().map(link -> link.getId().getTagId()).collect(Collectors.toSet());
        Map<String, TagEntity> tags = tagRepository.findAllById(tagIds).stream()
                .collect(Collectors.toMap(TagEntity::getId, tag -> tag));

        Map<String, List<TagResponse>> result = new HashMap<>();
        for (EventTagEntity link : links) {
            TagEntity tag = tags.get(link.getId().getTagId());
            if (tag == null) {
                continue;
            }
            result.computeIfAbsent(link.getId().getEventId(), key -> new ArrayList<>())
                    .add(eventMapper.toTag(tag.getId(), tag.getLabel()));
        }
        return result;
    }

    /**
     * Сохраняет теги ивента.
     *
     * @param eventId идентификатор ивента
     * @param tagIds  идентификаторы тегов
     */
    private void saveTags(String eventId, List<String> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return;
        }
        for (String tagId : tagIds) {
            if (!tagRepository.existsById(tagId)) {
                continue;
            }
            EventTagEntity link = new EventTagEntity();
            EventTagEntity.EventTagId id = new EventTagEntity.EventTagId();
            id.setEventId(eventId);
            id.setTagId(tagId);
            link.setId(id);
            eventTagRepository.save(link);
        }
    }

    /**
     * Если в query пришла NL-строка («найди завтра футбик»), разбирает её правилами
     * и подставляет activity/from/to/geo; для FTS остаётся только freeText.
     */
    private ResolvedFilters resolveFilters(
            String query,
            List<String> activityIds,
            List<String> tagIds,
            Instant from,
            Instant to,
            Double nearLat,
            Double nearLng,
            Double radiusKm
    ) {
        if (query == null || query.isBlank()) {
            return new ResolvedFilters(null, activityIds, tagIds, from, to, nearLat, nearLng, radiusKm);
        }

        SearchIntentResponse intent = searchIntentParser.parse(query, nearLat, nearLng);

        List<String> resolvedActivities = (activityIds == null || activityIds.isEmpty())
                ? intent.activityIds()
                : activityIds;
        Instant resolvedFrom = from != null ? from : intent.from();
        Instant resolvedTo = to != null ? to : intent.to();
        Double resolvedLat = nearLat;
        Double resolvedLng = nearLng;
        Double resolvedRadius = radiusKm;
        if (resolvedLat == null && intent.near() != null) {
            resolvedLat = intent.near().lat();
            resolvedLng = intent.near().lng();
        }
        if (resolvedRadius == null) {
            resolvedRadius = intent.radiusKm();
        }

        return new ResolvedFilters(
                intent.freeText(),
                resolvedActivities,
                tagIds,
                resolvedFrom,
                resolvedTo,
                resolvedLat,
                resolvedLng,
                resolvedRadius
        );
    }

    private record ResolvedFilters(
            String query,
            List<String> activityIds,
            List<String> tagIds,
            Instant from,
            Instant to,
            Double nearLat,
            Double nearLng,
            Double radiusKm
    ) {
    }

    private List<EventEntity> filterEvents(
            List<EventEntity> source,
            String query,
            List<String> activityIds,
            List<String> tagIds,
            Instant from,
            Instant to,
            Double nearLat,
            Double nearLng,
            Double radiusKm
    ) {
        List<EventEntity> ftsOrdered = applyFullTextSearch(source, query);
        Map<String, List<TagResponse>> tagsByEvent = tagIds != null && !tagIds.isEmpty()
                ? loadTags(ftsOrdered.stream().map(EventEntity::getId).toList())
                : Map.of();

        return ftsOrdered.stream()
                .filter(event -> activityIds == null || activityIds.isEmpty()
                        || activityIds.contains(event.getActivityId()))
                .filter(event -> tagIds == null || tagIds.isEmpty()
                        || tagsByEvent.getOrDefault(event.getId(), List.of()).stream()
                        .anyMatch(tag -> tagIds.contains(tag.id())))
                .filter(event -> from == null || !event.getStartsAt().isBefore(from))
                .filter(event -> to == null || !event.getStartsAt().isAfter(to))
                .filter(event -> matchesGeo(event, nearLat, nearLng, radiusKm))
                .toList();
    }

    /**
     * Фильтрует и сортирует ивенты через Postgres FTS ({@code search_vector}).
     * Без запроса возвращает исходный список без изменений.
     *
     * @param source исходный список
     * @param query  строка поиска
     * @return отфильтрованный список в порядке релевантности FTS
     */
    private List<EventEntity> applyFullTextSearch(List<EventEntity> source, String query) {
        String tsQuery = FullTextQueryBuilder.toTsQuery(query);
        if (tsQuery == null) {
            return source;
        }
        if (source.isEmpty()) {
            return List.of();
        }

        List<String> rankedIds = eventRepository.findIdsByFullText(tsQuery);
        if (rankedIds.isEmpty()) {
            return List.of();
        }

        Map<String, EventEntity> byId = source.stream()
                .collect(Collectors.toMap(EventEntity::getId, event -> event, (a, b) -> a, LinkedHashMap::new));

        List<EventEntity> matched = new ArrayList<>();
        for (String id : rankedIds) {
            EventEntity event = byId.get(id);
            if (event != null) {
                matched.add(event);
            }
        }
        return matched;
    }

    /**
     * Проверяет геофильтр.
     *
     * @param event    сущность
     * @param nearLat  широта
     * @param nearLng  долгота
     * @param radiusKm радиус
     * @return true, если подходит
     */
    private boolean matchesGeo(EventEntity event, Double nearLat, Double nearLng, Double radiusKm) {
        if (nearLat == null || nearLng == null || radiusKm == null) {
            return true;
        }
        double distance = haversineKm(nearLat, nearLng, event.getLat(), event.getLng());
        return distance <= radiusKm;
    }

    /**
     * Считает расстояние между точками в километрах.
     *
     * @param lat1 широта A
     * @param lng1 долгота A
     * @param lat2 широта B
     * @param lng2 долгота B
     * @return расстояние
     */
    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }

    /**
     * Проверяет scope «мои ивенты».
     *
     * @param event         ивент
     * @param currentUserId пользователь
     * @param scope         organizing/participating
     * @return true, если подходит
     */
    private boolean matchesScope(EventEntity event, Long currentUserId, String scope) {
        if ("organizing".equals(scope)) {
            return event.getOrganizerId().equals(currentUserId);
        }
        if ("participating".equals(scope)) {
            boolean isOrganizer = event.getOrganizerId().equals(currentUserId);
            boolean isParticipant = participantRepository.existsByIdEventIdAndIdUserId(event.getId(), currentUserId);
            return !isOrganizer && isParticipant;
        }
        return false;
    }

    /**
     * Считает участников для списка ивентов.
     *
     * @param events ивенты
     * @return map eventId → count
     */
    private Map<String, Integer> participantCounts(List<EventEntity> events) {
        Map<String, Integer> counts = new HashMap<>();
        for (EventEntity event : events) {
            counts.put(event.getId(), participantRepository.findUserIdsByEventId(event.getId()).size());
        }
        return counts;
    }
}
