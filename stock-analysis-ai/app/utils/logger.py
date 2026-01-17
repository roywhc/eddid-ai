import logging
import logging.config
from pythonjsonlogger import jsonlogger
from app.config import settings, Environment
import sys
import os

def setup_logging():
    """Initialize logging system"""
    
    log_level = getattr(logging, settings.log_level.upper())
    
    # Create log directory if it doesn't exist
    log_dir = '/var/log/app'
    if settings.env == Environment.DEV:
        log_dir = './logs'
    os.makedirs(log_dir, exist_ok=True)
    
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            },
            'json': {
                '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
                'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': log_level,
                'formatter': 'json' if settings.env != 'development' else 'standard',
                'stream': sys.stdout
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': log_level,
                'formatter': 'json',
                'filename': os.path.join(log_dir, 'app.log'),
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5
            }
        },
        'root': {
            'level': log_level,
            'handlers': ['console', 'file'] if settings.env != 'development' else ['console']
        }
    }
    
    logging.config.dictConfig(config)
    return logging.getLogger(__name__)

logger = setup_logging()

