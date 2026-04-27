package com.dthoughts.g4.moreno.post;

import com.dthoughts.g4.moreno.post.Post;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
	Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
	Page<Post> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds, Pageable pageable);
	Page<Post> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
	long countByUserId(Long userId);
}

	
