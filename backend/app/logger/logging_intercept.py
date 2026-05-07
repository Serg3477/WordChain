import logging
from loguru import logger

class InterceptHandler(logging.Handler):
    def emit(self, record):
        logger_opt = logger.opt(depth=6, exception=record.exc_info)
        logger_opt.log(record.levelname, record.getMessage())

def setup_sqlalchemy_logging():
    logging.getLogger("sqlalchemy.engine").handlers = [InterceptHandler()]
    logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
