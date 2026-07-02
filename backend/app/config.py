from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./arquivos.db"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    alert_email: str = "lucas.dobis@calpar.com.br"
    monitor_interval_seconds: int = 300
    quantity_threshold: int = 3

    class Config:
        env_file = ".env"


settings = Settings()
