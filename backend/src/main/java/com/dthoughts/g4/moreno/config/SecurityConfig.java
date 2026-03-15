package com.dthoughts.g4.moreno.config;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(
			HttpSecurity http,
			OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
			ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider,
			ObjectProvider<OAuth2AuthorizationRequestResolver> authorizationRequestResolverProvider
	) throws Exception {
		http.csrf(AbstractHttpConfigurer::disable)
				.cors(Customizer.withDefaults())
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.requestMatchers("/api/auth/**").permitAll()
						.anyRequest().permitAll()
				)
				.logout(logout -> logout
						.logoutUrl("/api/auth/logout")
						.invalidateHttpSession(true)
						.deleteCookies("JSESSIONID")
						.logoutSuccessHandler((request, response, authentication) -> response.setStatus(HttpServletResponse.SC_NO_CONTENT))
				)
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable);

		if (clientRegistrationRepositoryProvider.getIfAvailable() != null) {
			http.oauth2Login(oauth -> {
				OAuth2AuthorizationRequestResolver resolver = authorizationRequestResolverProvider.getIfAvailable();
				if (resolver != null) {
					oauth.authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(resolver));
				}
				oauth.successHandler(oAuth2LoginSuccessHandler)
						.failureHandler((request, response, exception) -> handleOauthFailure(response, exception));
			});
		}

		return http.build();
	}

	@Bean
	@ConditionalOnBean(ClientRegistrationRepository.class)
	public OAuth2AuthorizationRequestResolver authorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
		DefaultOAuth2AuthorizationRequestResolver delegate =
				new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, "/oauth2/authorization");

		return new OAuth2AuthorizationRequestResolver() {
			@Override
			public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
				return customizeAuthorizationRequest(delegate.resolve(request));
			}

			@Override
			public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
				return customizeAuthorizationRequest(delegate.resolve(request, clientRegistrationId));
			}
		};
	}

	private OAuth2AuthorizationRequest customizeAuthorizationRequest(OAuth2AuthorizationRequest original) {
		if (original == null) return null;
		Map<String, Object> params = new HashMap<>(original.getAdditionalParameters());
		params.putIfAbsent("prompt", "select_account");
		return OAuth2AuthorizationRequest.from(original)
				.additionalParameters(params)
				.build();
	}

	private void handleOauthFailure(HttpServletResponse response, Exception exception) {
		try {
			String msg = exception == null ? "OAuth login failed" : exception.getMessage();
			response.sendRedirect(frontendUrl() + "/auth/callback?error=" + urlEncode(msg));
		} catch (IOException e) {
			throw new RuntimeException(e);
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

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}
}
