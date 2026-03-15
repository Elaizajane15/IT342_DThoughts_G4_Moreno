package com.dthoughts.g4.moreno.repository;

import com.dthoughts.g4.moreno.entity.PostComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
	List<PostComment> findAllByPostIdOrderByCreatedAtDesc(Long postId);
	long countByPostId(Long postId);
}
