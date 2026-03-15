package com.dthoughts.g4.moreno.repository;

import com.dthoughts.g4.moreno.entity.Post;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
	Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
	Page<Post> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds, Pageable pageable);
	long countByUserId(Long userId);
}

	
