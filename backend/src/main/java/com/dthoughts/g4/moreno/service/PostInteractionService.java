package com.dthoughts.g4.moreno.service;

import com.dthoughts.g4.moreno.dto.CommentDto;
import com.dthoughts.g4.moreno.dto.LikeStatusDto;
import com.dthoughts.g4.moreno.dto.PostDto;
import com.dthoughts.g4.moreno.dto.SaveStatusDto;
import com.dthoughts.g4.moreno.entity.Post;
import com.dthoughts.g4.moreno.entity.PostComment;
import com.dthoughts.g4.moreno.entity.PostLike;
import com.dthoughts.g4.moreno.entity.PostSave;
import com.dthoughts.g4.moreno.entity.User;
import com.dthoughts.g4.moreno.repository.PostCommentRepository;
import com.dthoughts.g4.moreno.repository.PostLikeRepository;
import com.dthoughts.g4.moreno.repository.PostRepository;
import com.dthoughts.g4.moreno.repository.PostSaveRepository;
import com.dthoughts.g4.moreno.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostInteractionService {
	@Autowired
	private PostRepository postRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PostLikeRepository postLikeRepository;

	@Autowired
	private PostCommentRepository postCommentRepository;

	@Autowired
	private PostSaveRepository postSaveRepository;

	@Autowired
	private NotificationService notificationService;

	@Transactional
	public LikeStatusDto toggleLike(Long postId, Long userId) {
		if (postId == null) throw new RuntimeException("postId is required.");
		if (userId == null) throw new RuntimeException("userId is required.");

		Optional<Post> postOpt = postRepository.findById(postId);
		if (postOpt.isEmpty()) throw new RuntimeException("Post not found.");

		Optional<User> userOpt = userRepository.findById(userId);
		if (userOpt.isEmpty()) throw new RuntimeException("User not found.");

		Optional<PostLike> existing = postLikeRepository.findByPostIdAndUserId(postId, userId);
		boolean created = existing.isEmpty();
		if (existing.isPresent()) {
			postLikeRepository.delete(existing.get());
		} else {
			postLikeRepository.save(new PostLike(postOpt.get(), userOpt.get()));
		}

		boolean liked = postLikeRepository.existsByPostIdAndUserId(postId, userId);
		long count = postLikeRepository.countByPostId(postId);
		if (created && liked) {
			notificationService.notifyLike(userId, postId);
		}
		return new LikeStatusDto(liked, count);
	}

	@Transactional(readOnly = true)
	public LikeStatusDto getLikeStatus(Long postId, Long userId) {
		if (postId == null) throw new RuntimeException("postId is required.");
		long count = postLikeRepository.countByPostId(postId);
		boolean liked = userId != null && postLikeRepository.existsByPostIdAndUserId(postId, userId);
		return new LikeStatusDto(liked, count);
	}

	@Transactional
	public SaveStatusDto toggleSave(Long postId, Long userId) {
		if (postId == null) throw new RuntimeException("postId is required.");
		if (userId == null) throw new RuntimeException("userId is required.");

		Optional<Post> postOpt = postRepository.findById(postId);
		if (postOpt.isEmpty()) throw new RuntimeException("Post not found.");

		Optional<User> userOpt = userRepository.findById(userId);
		if (userOpt.isEmpty()) throw new RuntimeException("User not found.");

		Optional<PostSave> existing = postSaveRepository.findByPostIdAndUserId(postId, userId);
		if (existing.isPresent()) {
			postSaveRepository.delete(existing.get());
		} else {
			postSaveRepository.save(new PostSave(postOpt.get(), userOpt.get()));
		}

		boolean saved = postSaveRepository.existsByPostIdAndUserId(postId, userId);
		long count = postSaveRepository.countByPostId(postId);
		return new SaveStatusDto(saved, count);
	}

	@Transactional(readOnly = true)
	public SaveStatusDto getSaveStatus(Long postId, Long userId) {
		if (postId == null) throw new RuntimeException("postId is required.");
		long count = postSaveRepository.countByPostId(postId);
		boolean saved = userId != null && postSaveRepository.existsByPostIdAndUserId(postId, userId);
		return new SaveStatusDto(saved, count);
	}

	@Transactional(readOnly = true)
	public List<PostDto> listLikedPosts(Long userId) {
		if (userId == null) throw new RuntimeException("userId is required.");
		if (!userRepository.existsById(userId)) throw new RuntimeException("User not found.");
		return postLikeRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(PostLike::getPost).map(this::toDto).toList();
	}

	@Transactional(readOnly = true)
	public List<PostDto> listSavedPosts(Long userId) {
		if (userId == null) throw new RuntimeException("userId is required.");
		if (!userRepository.existsById(userId)) throw new RuntimeException("User not found.");
		return postSaveRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(PostSave::getPost).map(this::toDto).toList();
	}

	@Transactional
	public CommentDto addComment(Long postId, Long userId, String content) {
		if (postId == null) throw new RuntimeException("postId is required.");
		if (userId == null) throw new RuntimeException("userId is required.");
		String text = content == null ? "" : content.trim();
		if (text.isEmpty()) throw new RuntimeException("content is required.");
		if (text.length() > 500) throw new RuntimeException("content must be 500 characters or less.");

		Optional<Post> postOpt = postRepository.findById(postId);
		if (postOpt.isEmpty()) throw new RuntimeException("Post not found.");

		Optional<User> userOpt = userRepository.findById(userId);
		if (userOpt.isEmpty()) throw new RuntimeException("User not found.");

		PostComment saved = postCommentRepository.save(new PostComment(postOpt.get(), userOpt.get(), text));
		notificationService.notifyComment(userId, postId);
		return toDto(saved);
	}

	@Transactional(readOnly = true)
	public List<CommentDto> listComments(Long postId) {
		if (postId == null) throw new RuntimeException("postId is required.");
		return postCommentRepository.findAllByPostIdOrderByCreatedAtDesc(postId).stream().map(this::toDto).toList();
	}

	private CommentDto toDto(PostComment c) {
		Long userId = c.getUser() == null ? null : c.getUser().getId();
		String userName = null;
		String userAvatarUrl = null;
		if (c.getUser() != null) {
			String first = c.getUser().getFirstName() == null ? "" : c.getUser().getFirstName().trim();
			String last = c.getUser().getLastName() == null ? "" : c.getUser().getLastName().trim();
			String joined = (first + " " + last).trim();
			userName = joined.isEmpty() ? c.getUser().getEmail() : joined;
			userAvatarUrl = c.getUser().getAvatarUrl();
		}
		return new CommentDto(c.getId(), userId, userName, userAvatarUrl, c.getContent(), c.getCreatedAt());
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
