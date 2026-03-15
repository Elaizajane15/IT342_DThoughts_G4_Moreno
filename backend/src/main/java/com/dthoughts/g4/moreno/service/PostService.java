package com.dthoughts.g4.moreno.service;

import com.dthoughts.g4.moreno.dto.CreatePostRequest;
import com.dthoughts.g4.moreno.dto.PostDto;
import com.dthoughts.g4.moreno.entity.Post;
import com.dthoughts.g4.moreno.entity.Follow;
import com.dthoughts.g4.moreno.entity.User;
import com.dthoughts.g4.moreno.repository.FollowRepository;
import com.dthoughts.g4.moreno.repository.PostCommentRepository;
import com.dthoughts.g4.moreno.repository.PostLikeRepository;
import com.dthoughts.g4.moreno.repository.PostRepository;
import com.dthoughts.g4.moreno.repository.UserRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PostService {
	@Autowired
	private PostRepository postRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PostLikeRepository postLikeRepository;

	@Autowired
	private PostCommentRepository postCommentRepository;

	@Autowired
	private FollowRepository followRepository;

	@Autowired
	private NotificationService notificationService;

	@Autowired(required = false)
	private JdbcTemplate jdbcTemplate;

	@PostConstruct
	public void initSchema() {
		ensureImageColumn();
	}

	@Transactional
	public PostDto create(CreatePostRequest request) {
		if (request == null) throw new RuntimeException("Request is required.");
		if (request.getUserId() == null) throw new RuntimeException("userId is required.");
		String content = request.getContent() == null ? "" : request.getContent().trim();
		if (content.isEmpty()) throw new RuntimeException("content is required.");
		if (content.length() > 500) throw new RuntimeException("content must be 500 characters or less.");

		Optional<User> userOpt = userRepository.findById(request.getUserId());
		if (userOpt.isEmpty()) throw new RuntimeException("User not found.");

		ensureImageColumn();

		Post saved = postRepository.save(new Post(userOpt.get(), content));
		Long postId = saved.getId();
		if (postId != null) {
			for (Follow f : followRepository.findByFollowingId(request.getUserId())) {
				Long followerId = f.getFollower() == null ? null : f.getFollower().getId();
				if (followerId == null) continue;
				notificationService.notifyNewPostToUser(followerId, request.getUserId(), postId);
			}
		}
		return toDto(saved);
	}

	@Transactional(readOnly = true)
	public Page<PostDto> list(Pageable pageable) {
		return postRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toDto);
	}

	@Transactional(readOnly = true)
	public Page<PostDto> listFollowing(Long userId, Pageable pageable) {
		if (userId == null) throw new RuntimeException("userId is required.");
		if (!userRepository.existsById(userId)) throw new RuntimeException("User not found.");

		List<Long> ids = followRepository.findByFollowerId(userId).stream()
				.map((f) -> f.getFollowing() == null ? null : f.getFollowing().getId())
				.filter((id) -> id != null)
				.distinct()
				.toList();

		if (ids.isEmpty()) return Page.empty(pageable);
		return postRepository.findByUserIdInOrderByCreatedAtDesc(ids, pageable).map(this::toDto);
	}

	@Transactional
	public void delete(Long id) {
		if (id == null) throw new RuntimeException("id is required.");
		if (!postRepository.existsById(id)) throw new RuntimeException("Post not found.");
		postRepository.deleteById(id);
	}

	@Transactional
	public PostDto update(Long id, String content) {
		if (id == null) throw new RuntimeException("id is required.");
		String next = content == null ? "" : content.trim();
		if (next.isEmpty()) throw new RuntimeException("content is required.");
		if (next.length() > 500) throw new RuntimeException("content must be 500 characters or less.");

		Optional<Post> postOpt = postRepository.findById(id);
		if (postOpt.isEmpty()) throw new RuntimeException("Post not found.");

		Post p = postOpt.get();
		p.setContent(next);
		Post saved = postRepository.save(p);
		return toDto(saved);
	}

	@Transactional
	public PostDto uploadImage(Long postId, MultipartFile file) {
		if (postId == null) throw new RuntimeException("postId is required.");
		if (file == null || file.isEmpty()) throw new RuntimeException("file is required.");

		ensureImageColumn();

		Optional<Post> postOpt = postRepository.findById(postId);
		if (postOpt.isEmpty()) throw new RuntimeException("Post not found.");

		String original = file.getOriginalFilename();
		String ext = "";
		if (original != null) {
			int idx = original.lastIndexOf('.');
			if (idx >= 0 && idx < original.length() - 1) ext = original.substring(idx);
		}
		String filename = postId + "_" + System.currentTimeMillis() + ext;

		Path uploadPath = Paths.get("uploads");
		try {
			Files.createDirectories(uploadPath);
			Path filePath = uploadPath.resolve(filename);
			Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
		} catch (IOException e) {
			throw new RuntimeException("Failed to upload file.");
		}

		Post p = postOpt.get();
		p.setImagePath("/uploads/" + filename);
		Post saved = postRepository.save(p);
		return toDto(saved);
	}

	private void ensureImageColumn() {
		if (jdbcTemplate == null) return;
		try {
			Integer exists =
					jdbcTemplate.queryForObject(
							"SELECT COUNT(*) FROM information_schema.columns WHERE LOWER(table_name) = 'posts' AND LOWER(column_name) = 'image_path'",
							Integer.class
					);
			if (exists != null && exists > 0) return;
		} catch (Exception ignored) {
		}

		try {
			jdbcTemplate.execute("ALTER TABLE posts ADD COLUMN image_path VARCHAR(500)");
		} catch (Exception e) {
			throw new RuntimeException(
					"Database schema error: missing posts.image_path and cannot create it. Run: ALTER TABLE posts ADD COLUMN image_path VARCHAR(500);",
					e
			);
		}
	}

	private PostDto toDto(Post p) {
		Long userId = p.getUser() == null ? null : p.getUser().getId();
		String userName = null;
		String userAvatarUrl = null;
		long likeCount = postLikeRepository.countByPostId(p.getId());
		long commentCount = postCommentRepository.countByPostId(p.getId());
		if (p.getUser() != null) {
			String first = p.getUser().getFirstName() == null ? "" : p.getUser().getFirstName().trim();
			String last = p.getUser().getLastName() == null ? "" : p.getUser().getLastName().trim();
			String joined = (first + " " + last).trim();
			userName = joined.isEmpty() ? p.getUser().getEmail() : joined;
			userAvatarUrl = p.getUser().getAvatarUrl();
		}
		return new PostDto(p.getId(), userId, userName, userAvatarUrl, p.getContent(), p.getImagePath(), likeCount, commentCount, p.getCreatedAt(), p.getUpdatedAt());
	}
}
