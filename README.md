# CodeCollab

## Real-Time AI-Powered Collaborative Coding Platform

CodeCollab is a full-stack collaborative coding platform that allows
developers and students to work together in real time inside shared
coding rooms. The platform combines collaborative programming, room
management, file management, real-time chat, video/audio communication,
and AI-powered development assistance in one application.

------------------------------------------------------------------------

## 🚀 Features

### 👥 Room Management

-   Create coding rooms with unique room codes
-   View created rooms from the dashboard
-   Join rooms using room codes
-   Delete rooms owned by the current user
-   Room-based project organization

### 💻 Collaborative Coding

-   Shared coding environment
-   Create and manage project files
-   Support programming-language information for files
-   Real-time room communication
-   Persistent project data

### 🎥 Video & Audio Meetings

-   Browser-based video/audio communication using WebRTC
-   Real-time participant connections
-   Remote video streams
-   WebRTC signaling through WebSockets
-   Camera and microphone support

### 💬 Real-Time Communication

WebSockets are used for real-time events including: - User joined/left
events - Online-user updates - Chat messages - Video offers - Video
answers - ICE candidates - Room events

### 🤖 AI Assistant

CodeCollab includes an AI assistant for development support: - Explain
selected code - AI autocomplete - AI code generation - Bug
identification - Code suggestions - Code analysis

### 📝 AI Meeting MOM

The AI assistant can organize meeting information into: - Meeting
Summary - Decisions - Action Items - Questions - Bugs Found - AI
Suggestions

------------------------------------------------------------------------

## 🏗️ System Architecture

``` text
                    ┌──────────────────────┐
                    │      CodeCollab      │
                    │       Frontend       │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
          REST API          WebSocket         WebRTC
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌──────────────┐   ┌─────────────┐
       │  FastAPI   │   │ Real-Time    │   │ Video/Audio │
       │  Backend   │   │ Communication│   │   Streams   │
       └─────┬──────┘   └──────────────┘   └─────────────┘
             │
       ┌─────┴──────────┐
       │                │
       ▼                ▼
   ┌─────────┐      ┌─────────┐
   │  MySQL  │      │   AI    │
   │ Database│      │ Services│
   └─────────┘      └─────────┘
```

------------------------------------------------------------------------

## 🛠️ Technology Stack

### Frontend

-   HTML5
-   CSS3
-   JavaScript
-   Tailwind CSS
-   WebRTC

### Backend

-   Python
-   FastAPI
-   WebSockets
-   SQLAlchemy

### Database

-   MySQL
-   SQLAlchemy ORM
-   Alembic

### Authentication

-   JWT Authentication
-   Google OAuth

### AI

-   AI-powered code assistance
-   Code analysis
-   Meeting summarization

------------------------------------------------------------------------

## 📁 Project Structure

A typical CodeCollab structure is:

``` text
CodeCollab/
│
├── backend/
│   ├── app/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── websocket/
│   │
│   ├── alembic/
│   ├── .env
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   │
│   ├── templates/
│   └── ...
│
├── database/
│   └── ...
│
├── README.md
└── .gitignore
```

> The exact directory structure may vary depending on the current
> implementation and future modules.

------------------------------------------------------------------------

## ⚙️ Getting Started

### 1. Clone the repository

``` bash
git clone https://github.com/gouj_05/CodeCollab.git
cd CodeCollab
```

### 2. Create a Python virtual environment

From the backend directory:

``` bash
cd backend
python -m venv venv
```

### 3. Activate the virtual environment

#### Windows PowerShell

``` powershell
venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution, you can use:

``` powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then activate the environment again.

#### Windows Git Bash

``` bash
source venv/Scripts/activate
```

------------------------------------------------------------------------

## 📦 Install Dependencies

``` bash
pip install -r requirements.txt
```

------------------------------------------------------------------------

## 🔐 Environment Variables

Create a `.env` file in the backend directory.

Example:

``` env
DATABASE_URL=mysql+pymysql://username:password@localhost/codecollab

SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
```

Do not commit `.env` or other credentials to Git.

------------------------------------------------------------------------

## 🗄️ Database Setup

Make sure MySQL is running and create the CodeCollab database.

Then configure `DATABASE_URL` in `.env`.

If the project is configured with Alembic migrations, run:

``` bash
alembic upgrade head
```

------------------------------------------------------------------------

## ▶️ Running the Backend

From the `backend` directory:

``` bash
uvicorn app.main:app --reload
```

The development server will normally be available at:

``` text
http://localhost:8000
```

FastAPI's interactive API documentation is available at:

``` text
http://localhost:8000/docs
```

------------------------------------------------------------------------

## 🔑 Authentication

CodeCollab supports JWT-based authentication and Google OAuth.

After successful authentication, protected API requests use a bearer
token:

``` http
Authorization: Bearer <token>
```

Keep authentication secrets private and never commit them to source
control.

------------------------------------------------------------------------

## 🌐 WebRTC

The meeting functionality uses WebRTC for peer-to-peer media
communication.

WebSockets are used for signaling:

``` text
User A
  │
  │ WebSocket signaling
  ▼
CodeCollab Backend
  │
  │ WebSocket signaling
  ▼
User B

User A ◄──────── WebRTC Media ────────► User B
```

The backend handles signaling messages such as:

-   `video_offer`
-   `video_answer`
-   `ice_candidate`

Actual audio/video media is exchanged through WebRTC rather than being
streamed through the FastAPI server.

------------------------------------------------------------------------

## 🤖 AI Module

The AI module is designed to assist users during coding sessions.

The current concept includes:

``` text
                    AI Assistant
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    Code Assistance   Meeting MOM    Suggestions
          │              │              │
    ┌─────┴─────┐    ┌───┴────┐    ┌────┴────┐
    │ Explain   │    │Summary │    │ Bugs    │
    │ Generate  │    │Decisions│   │ Actions │
    │ Autocomplete│  │Questions│   │ Ideas   │
    └───────────┘    └────────┘    └─────────┘
```

------------------------------------------------------------------------

## 🔒 Security Considerations

-   Use strong JWT secrets.
-   Keep database credentials in environment variables.
-   Do not commit `.env`.
-   Protect room-management endpoints.
-   Validate authenticated users before sensitive operations.
-   Restrict room deletion to authorized room owners.
-   Use HTTPS/WSS in production.
-   Configure a proper TURN server for reliable WebRTC connections
    across restrictive networks.

------------------------------------------------------------------------

## 🧪 Development

Useful development commands:

``` bash
# Start backend
uvicorn app.main:app --reload

# Check migration status
alembic current

# View migration history
alembic history

# Apply migrations
alembic upgrade head
```

------------------------------------------------------------------------

## 🚧 Known/Future Improvements

Planned or possible improvements include:

-   Advanced AI coding agent
-   Speech-to-text meeting transcription
-   Screen sharing
-   Meeting recording
-   GitHub/GitLab integration
-   AI-generated Git commit messages
-   AI-generated pull requests
-   Secure code execution using isolated containers
-   Redis-based WebSocket scaling
-   TURN server deployment
-   Advanced team/project permissions
-   Automatic project documentation

------------------------------------------------------------------------

## 🎯 Use Cases

CodeCollab can be used for:

-   Pair programming
-   Online coding classes
-   Student project collaboration
-   Technical interviews
-   Remote development teams
-   Coding workshops
-   Mentoring sessions
-   Hackathons

------------------------------------------------------------------------

## 📚 Learning Outcomes

This project demonstrates practical experience with:

-   Full-stack web development
-   REST API development
-   FastAPI
-   WebSockets
-   WebRTC
-   SQLAlchemy ORM
-   MySQL
-   Database migrations
-   JWT authentication
-   OAuth
-   Real-time application architecture
-   AI integration
-   Frontend UI development

------------------------------------------------------------------------

## 📄 Project Report

A brief project description report is included separately with the
project documentation.

------------------------------------------------------------------------

## 👨‍💻 Author

**Gourang Joshi**

B.Tech -- Computer Science and Engineering

------------------------------------------------------------------------

## ⭐ Project

**CodeCollab -- Real-Time AI-Powered Collaborative Coding Platform**

Built as a full-stack collaborative development project combining
real-time communication, coding, video conferencing, and AI assistance.
