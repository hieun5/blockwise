# BlockWise

An AI-powered civic infrastructure reporting platform that enables residents to identify, document, and track public infrastructure issues through image analysis and interactive mapping.

Built with React, TypeScript, FastAPI, NVIDIA Nemotron, and Supabase to streamline community issue reporting using artificial intelligence and geospatial technology.

## Features

📸 **Photo-Based Issue Reporting**: Upload images of potholes, damaged sidewalks, broken streetlights, and other public infrastructure problems.

🤖 **AI-Powered Image Analysis**: Uses an image-capable AI pipeline integrated with NVIDIA Nemotron to assist with identifying and classifying infrastructure issues.

📝 **AI-Generated Report Descriptions**: Automatically generates editable descriptions based on uploaded images and user-provided details.

📍 **Interactive Map**: Displays reported infrastructure issues geographically using Leaflet and OpenStreetMap.

🏙️ **Community Reporting**: Enables residents to submit infrastructure reports with images, descriptions, categories, and locations.

📊 **Issue Tracking Dashboard**: Organizes submitted reports and allows users to review their reported issues and current statuses.

🔐 **User Authentication**: Provides secure account registration and login for managing personal reports.

☁️ **Cloud Data Storage**: Uses Supabase PostgreSQL and Storage to manage report information and uploaded images.

## Installation

### 1. Clone the repository

```bash
git clone <YOUR-BLOCKWISE-REPOSITORY-URL>
cd BlockWise
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

Open a second terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 4. Configure environment variables

Create the required environment files using the project's example configuration.

Configure:

- Supabase project URL
- Supabase authentication and database settings
- Supabase Storage configuration
- NVIDIA AI inference provider credentials
- Any additional application-specific settings

Keep all secret credentials in environment variables and exclude them from Git.

### 5. Start the backend

```powershell
python -m uvicorn main:app --reload
```

### 6. Start the frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

Open the local development URL displayed in the terminal.

## Architecture

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Python, FastAPI
- **AI Integration**: NVIDIA Nemotron with an image-capable analysis pipeline
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Image Storage**: Supabase Storage
- **Mapping**: Leaflet, OpenStreetMap
- **Development Tools**: Git, GitHub, VS Code

## How It Works

1. **Create an Account** — Residents register or sign in to manage their infrastructure reports.
2. **Upload an Image** — Users submit a photo of a damaged road, sidewalk, streetlight, or other infrastructure issue.
3. **AI Image Analysis** — The image-analysis pipeline identifies the potential issue and suggests a category.
4. **Generate a Description** — AI generates an editable report description based on the image and available context.
5. **Select a Location** — Users identify the issue's geographic location using an interactive map.
6. **Submit the Report** — Report details and images are securely stored in Supabase.
7. **Track Reports** — Users view submitted reports and their statuses through the dashboard.
8. **Explore the Map** — Reported issues are displayed geographically for community awareness.

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3
- Git
- Supabase project
- NVIDIA AI inference access
- Internet connection for cloud services and map data

## Project Purpose

BlockWise explores how artificial intelligence, computer vision, and geospatial technology can improve the way communities identify and report infrastructure problems.

By combining automated image analysis with accessible reporting tools and interactive mapping, the platform aims to make infrastructure reporting more efficient, organized, and accessible.

## Author

GitHub: [hieun5](https://github.com/hieun5)
