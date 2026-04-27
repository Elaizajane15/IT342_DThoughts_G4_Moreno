@echo off
for /f "tokens=1,* delims==" %%A in ('type .env.local ^| findstr /v /b /c:"#" ^| findstr "="') do (
    set "%%A=%%B"
)
.\mvnw.cmd spring-boot:run
