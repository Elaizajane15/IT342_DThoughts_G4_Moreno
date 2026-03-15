package com.dthoughts.g4.moreno.controller;

import com.dthoughts.g4.moreno.dto.CreatePostRequest;
import com.dthoughts.g4.moreno.dto.CreateCommentRequest;
import com.dthoughts.g4.moreno.dto.CommentDto;
import com.dthoughts.g4.moreno.dto.LikeStatusDto;
import com.dthoughts.g4.moreno.dto.PostDto;
import com.dthoughts.g4.moreno.dto.SaveStatusDto;
import com.dthoughts.g4.moreno.dto.ToggleLikeRequest;
import com.dthoughts.g4.moreno.dto.ToggleSaveRequest;
import com.dthoughts.g4.moreno.dto.UpdatePostRequest;
import com.dthoughts.g4.moreno.repository.PostRepository;
import com.dthoughts.g4.moreno.service.PostInteractionService;
import com.dthoughts.g4.moreno.service.PostService;
import java.sql.Connection;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
public class PostController {
	@Autowired
	private PostService postService;

	@Autowired
	private PostInteractionService postInteractionService;

	@Autowired
	private PostRepository postRepository;

	@Autowired
	private Environment environment;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@PostMapping
	public ResponseEntity<?> create(@RequestBody CreatePostRequest request) {
		try {
			PostDto created = postService.create(request);
			return ResponseEntity.ok(created);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	@GetMapping
	public ResponseEntity<?> list(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size
	) {
		Page<PostDto> res = postService.list(PageRequest.of(Math.max(0, page), Math.max(1, size)));
		Map<String, Object> body = new HashMap<>();
		body.put("content", res.getContent());
		body.put("totalPages", res.getTotalPages());
		body.put("totalElements", res.getTotalElements());
		body.put("page", res.getNumber());
		body.put("size", res.getSize());
		return ResponseEntity.ok(body);
	}

	@GetMapping("/following")
	public ResponseEntity<?> following(
			@RequestParam Long userId,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size
	) {
		try {
			Page<PostDto> res = postService.listFollowing(userId, PageRequest.of(Math.max(0, page), Math.max(1, size)));
			Map<String, Object> body = new HashMap<>();
			body.put("content", res.getContent());
			body.put("totalPages", res.getTotalPages());
			body.put("totalElements", res.getTotalElements());
			body.put("page", res.getNumber());
			body.put("size", res.getSize());
			return ResponseEntity.ok(body);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	@GetMapping("/_debug")
	public ResponseEntity<?> debug() {
		Map<String, Object> body = new HashMap<>();
		body.put("activeProfiles", environment.getActiveProfiles());
		body.put("postsCount", postRepository.count());
		try (Connection c = jdbcTemplate.getDataSource().getConnection()) {
			String url = c.getMetaData().getURL();
			if (url != null) {
				url = url.replaceAll("(?i)(user=)[^&;]+", "$1***");
				url = url.replaceAll("(?i)(password=)[^&;]+", "$1***");
			}
			body.put("databaseProduct", c.getMetaData().getDatabaseProductName());
			body.put("databaseUrl", url);
		} catch (Exception e) {
			body.put("dbError", e.getMessage());
		}
		return ResponseEntity.ok(body);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> delete(@PathVariable Long id) {
		try {
			postService.delete(id);
			return ResponseEntity.noContent().build();
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.status(404).body(error);
		}
	}

	@PutMapping("/{id}")
	public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdatePostRequest request) {
		try {
			PostDto updated = postService.update(id, request == null ? null : request.getContent());
			return ResponseEntity.ok(updated);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	@GetMapping("/{id}/likes")
	public ResponseEntity<?> getLikes(@PathVariable Long id, @RequestParam(required = false) Long userId) {
		try {
			LikeStatusDto dto = postInteractionService.getLikeStatus(id, userId);
			return ResponseEntity.ok(dto);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	@PostMapping("/{id}/likes/toggle")
	public ResponseEntity<?> toggleLike(@PathVariable Long id, @RequestBody ToggleLikeRequest request) {
		try {
			LikeStatusDto dto = postInteractionService.toggleLike(id, request == null ? null : request.getUserId());
			return ResponseEntity.ok(dto);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	@GetMapping("/{id}/saves")
	public ResponseEntity<?> getSaves(@PathVariable Long id, @RequestParam(required = false) Long userId) {
		try {
			SaveStatusDto dto = postInteractionService.getSaveStatus(id, userId);
			return ResponseEntity.ok(dto);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	@PostMapping("/{id}/saves/toggle")
	public ResponseEntity<?> toggleSave(@PathVariable Long id, @RequestBody ToggleSaveRequest request) {
		try {
			SaveStatusDto dto = postInteractionService.toggleSave(id, request == null ? null : request.getUserId());
			return ResponseEntity.ok(dto);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	@GetMapping("/{id}/comments")
	public ResponseEntity<?> listComments(@PathVariable Long id) {
		try {
			List<CommentDto> dto = postInteractionService.listComments(id);
			return ResponseEntity.ok(dto);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	@PostMapping("/{id}/comments")
	public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody CreateCommentRequest request) {
		try {
			CommentDto dto = postInteractionService.addComment(
					id,
					request == null ? null : request.getUserId(),
					request == null ? null : request.getContent()
			);
			return ResponseEntity.ok(dto);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	@PostMapping("/{postId}/upload")
	public ResponseEntity<?> uploadImage(@PathVariable Long postId, @RequestParam("file") MultipartFile file) {
		try {
			PostDto updated = postService.uploadImage(postId, file);
			return ResponseEntity.ok(updated);
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}
}

