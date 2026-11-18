package com.dthoughts.g4.moreno.auth;

public class LoginRequest {
    /** Username (preferred). An email address is also accepted for older accounts. */
    private String username;
    /** Legacy field: older clients send the email here. */
    private String email;
    private String password;

    public LoginRequest() {}
    public LoginRequest(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
