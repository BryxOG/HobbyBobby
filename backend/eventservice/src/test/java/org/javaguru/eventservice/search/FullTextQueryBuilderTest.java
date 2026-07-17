package org.javaguru.eventservice.search;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

/**
 * Юнит-тесты сборщика tsquery.
 */
class FullTextQueryBuilderTest {

    @Test
    void toTsQueryBuildsPrefixAndTerms() {
        assertEquals("футбол:* & парк:*", FullTextQueryBuilder.toTsQuery("  Футбол   парк "));
    }

    @Test
    void toTsQueryReturnsNullForBlank() {
        assertNull(FullTextQueryBuilder.toTsQuery("   "));
        assertNull(FullTextQueryBuilder.toTsQuery(null));
    }

    @Test
    void toTsQueryStripsPunctuation() {
        assertEquals("вднх:*", FullTextQueryBuilder.toTsQuery("ВДНХ!"));
    }
}
