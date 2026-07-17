package org.javaguru.eventservice.dto;

/**
 * Человекочитаемая расшифровка разобранного запроса (для чипов в UI).
 *
 * @param when  когда (сегодня, завтра…)
 * @param what  что (Футбол…)
 * @param where где (Москва, рядом…)
 */
public record SearchInterpretedAsDto(String when, String what, String where) {
}
