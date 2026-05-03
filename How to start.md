# 🚀 How to Start: Karate Interactive Learning Lab

This document explains how to launch and use the **Karate Interactive Learning Lab**, a professional-grade training environment for API automation.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your system:
- **Node.js**: Required for the local server engine. [Download here](https://nodejs.org/).
- **PowerShell**: Standard on Windows; used to run the startup automation.

---

## ⚡ Quick Start

### Option 1: Right-Click (Easiest)
1. Open the project folder in File Explorer.
2. Right-click on **`Start-Lab.ps1`**.
3. Select **"Run with PowerShell"**.

### Option 2: Terminal
1. Open PowerShell or a terminal in the project root.
2. Run the following command:
   ```powershell
   .\Start-Lab.ps1
   ```

---

## ⚙️ Advanced Configuration

### Changing the Port
By default, the lab runs on port **8081**. If this port is occupied or if you want to run multiple instances, you can specify a custom port:

```powershell
# Example: Running on port 8085
.\Start-Lab.ps1 -Port 8085
```

---

## 🛠️ Troubleshooting

### 1. UI Looks Broken (No Styles)
If the page loads but looks like plain text without colors or layout:
- **Solution**: Ensure your browser URL has a trailing slash. 
- ✅ `http://localhost:8081/app/`
- ❌ `http://localhost:8081/app`

### 2. "npx not found"
If you see an error about `npx`:
- **Solution**: Install Node.js from the official website. This will include `npm` and `npx` automatically.

### 3. Port Already in Use
If the server fails to start because the port is busy:
- **Solution**: Use the `-Port` parameter to choose a different number (e.g., `-Port 9000`).

---

## 🎓 Next Steps
Once the lab is open, navigate to the **Interactive Learning** tab to begin your journey through:
- **Flashcards**: Master core Karate DSL concepts.
- **Quizzes**: Test your knowledge of API testing patterns.
- **Coding Exercises**: Write and validate real Karate scripts in the built-in editor.
