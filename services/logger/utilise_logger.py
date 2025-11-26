import asyncio
from logger import logger_manager
import os

SERVICE_PORT = os.environ.get("PORT", "unknown")

def log_error(message: str, service_port: str = None):
    service_port = service_port or SERVICE_PORT
    asyncio.create_task(logger_manager.log_error(message, service_port))

def log_data(message: str, service_port: str = None):
    service_port = service_port or SERVICE_PORT
    asyncio.create_task(logger_manager.log_data(message, service_port))
