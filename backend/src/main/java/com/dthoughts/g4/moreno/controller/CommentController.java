package com.dthoughts.g4.moreno.controller;

import com.dthoughts.g4.moreno.dto.CommentDto;
import com.dthoughts.g4.moreno.dto.CreateCommentRequest;
import com.dthoughts.g4.moreno.service.PostInteractionService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

	@Autowired
	private PostInteractionService postInteractionService;

	@PutMapping("/{commentId}")
	public ResponseEntity<?> updateComment(
			@PathVariable Long commentId,
			@RequestBody CreateCommentRequest request
	) {
		try {
			CommentDto dto = postInteractionService.updateCommentOnly(
					commentId,
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

	@DeleteMapping("/{commentId}")
	public ResponseEntity<?> deleteComment(
			@PathVariable Long commentId,
			@RequestParam Long userId
	) {
		try {
			postInteractionService.deleteComment(commentId, userId);
			return ResponseEntity.ok().build();
		} catch (RuntimeException e) {
			Map<String, String> error = new HashMap<>();
			error.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}
}
