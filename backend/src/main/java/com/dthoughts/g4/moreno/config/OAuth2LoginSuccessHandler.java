package com.dthoughts.g4.moreno.config;

import com.dthoughts.g4.moreno.dto.AuthResponse;
import com.dthoughts.g4.moreno.dto.UserDto;
import com.dthoughts.g4.moreno.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {
	private final AuthService authService;

	public OAuth2LoginSuccessHandler(AuthService authService) {
		this.authService = authService;
	}

	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof OAuth2User oauth2User)) {
			response.sendRedirect(frontendUrl() + "/auth/callback?error=" + urlEncode("Invalid OAuth2 principal"));
			return;
		}

		try {
			AuthResponse authResponse = authService.authenticateWithGoogleOAuth2User(oauth2User);
			UserDto user = authResponse.getUser();

			String redirect = frontendUrl()
					+ "/auth/callback"
					+ "?token=" + urlEncode(authResponse.getToken())
					+ "&id=" + urlEncode(String.valueOf(user.getId()))
					+ "&email=" + urlEncode(user.getEmail())
					+ "&firstName=" + urlEncode(user.getFirstName())
					+ "&lastName=" + urlEncode(user.getLastName());

			response.sendRedirect(redirect);
		} catch (RuntimeException e) {
			response.sendRedirect(frontendUrl() + "/auth/callback?error=" + urlEncode(e.getMessage()));
		}
	}

	private String frontendUrl() {
		String fromProp = System.getProperty("APP_FRONTEND_URL");
		if (fromProp != null && !fromProp.isBlank()) return fromProp;
		String fromEnv = System.getenv("APP_FRONTEND_URL");
		if (fromEnv != null && !fromEnv.isBlank()) return fromEnv;
		return "http://localhost:5173";
	}

	private String urlEncode(String value) {
		return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
	}
}
