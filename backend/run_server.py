import os

import uvicorn

port = int(os.environ.get("BACKEND_PORT", "17890"))

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=port,
        log_level="info",
    )
