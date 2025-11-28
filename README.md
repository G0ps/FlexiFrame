---

# Project Setup Guide

Follow the steps below to set up and run the project locally.

---

## 1. Ensure You Have a Stable Internet Connection

A good internet connection is required for installing dependencies and pulling the repository.

---

## 2. Clone the Repository

```bash
git clone https://github.com/G0ps/FlexiFrame
```

---

## 3. Navigate to the `Product` Directory

```bash
cd Product
```

---

## 4. Create a Virtual Environment

In Windows CMD:

```bash
python -m venv myenv
```

Activate it:

```bash
myenv\Scripts\activate
```

(If you're using PowerShell, use `myenv\Scripts\Activate.ps1` instead.)

---

## 5. Install Required Dependencies

```bash
pip install -r requirements.txt
```

---

## 6. Add Your Google Gemini API Key

Open `main_server.py`, find the placeholder for the API key, and replace it with your Google Gemini API Key:

```python
API_KEY = "YOUR_GOOGLE_GEMINI_API_KEY_HERE"
```

---

## 7. Run the Server

```bash
python main_server.py
```

---

## 8. Open the Application

Visit the following URL in your browser:

[http://localhost:8000](http://localhost:8000)

---

