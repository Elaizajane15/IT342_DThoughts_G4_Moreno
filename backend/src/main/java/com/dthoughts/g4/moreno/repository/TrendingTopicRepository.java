package com.dthoughts.g4.moreno.repository;

import com.dthoughts.g4.moreno.entity.TrendingTopic;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrendingTopicRepository extends JpaRepository<TrendingTopic, Long> {
	boolean existsByNameIgnoreCase(String name);
	List<TrendingTopic> findAllByOrderByRankAsc();
}

