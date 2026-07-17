package org.javaguru.eventservice.dto;

/**
 * Точка на карте для geo-фильтра поиска.
 *
 * @param lat широта
 * @param lng долгота
 */
public record GeoPointDto(double lat, double lng) {
}
