# services/uiGenerator/service.py
from fastapi import FastAPI
import os
from logger.utilise_logger import log_error, log_data

app = FastAPI(title="uiGenerator")

PORT = os.environ.get("PORT", "2000")  # Make sure PORT is set per service

@app.get("/test-logging")
def test_logging():
    # Log normal data
    log_data("This is a test data message from uiGenerator.", PORT)
    
    # Log an error
    log_error("This is a test error message from uiGenerator.", PORT)
    
    return {"status": "ok", "message": "Logs sent to logger service."}
