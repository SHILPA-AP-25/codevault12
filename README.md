# CodeVaultX

CodeVaultX is a cloud-based code snippet management system designed to allow developers to store, retrieve, and manage code snippets efficiently. It provides a persistent and accessible way to keep track of useful code blocks, solving the problem of losing snippets or not having access to them across different devices.

## Project Overview

This application was built to address the need for a reliable, cloud-hosted clipboard. Originally using local storage, it has been upgraded to use a PostgreSQL database to ensure data persistence even in ephemeral cloud hosting environments like Render.

### Key Features

- **Persistent Storage:** Utilizes a PostgreSQL database to ensure that code snippets are safely stored and retained indefinitely.
- **Universal Access:** Hosted on the cloud, allowing users to view and edit their code snippets from any device with a web browser.
- **CRUD Functionality:** Complete support for Creating, Reading, Updating, and Deleting notes.
- **Clipboard Integration:** Features a dedicated button to instantly copy code snippets to the system clipboard.
- **Syntax Display:** Displays code in a formatted block for better readability.

## Project Structure

```
CodeVaultX/
├── public/              # Frontend static files
│   ├── index.html       # Main user interface
│   ├── script.js        # Frontend logic and API calls
│   └── style.css        # Application styling
├── .env                 # Environment variables (not committed)
├── .gitignore           # Git ignore rules
├── package.json         # Project metadata and dependencies
├── server.js            # Node.js Express server and API routes
└── README.md            # Project documentation
```

## Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Hosting:** Render (Web Service)

## Installation and Local Setup

Follow these steps to run the application locally on your machine.

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd CodeVaultX
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a file named `.env` in the root directory and add your PostgreSQL connection string:
    ```
    DATABASE_URL=postgresql://user:password@hostname/database
    PORT=3000
    ```

4.  **Run the Server**
    ```bash
    node server.js
    ```

5.  **Access the Application**
    Open your browser and navigate to `http://localhost:3000`.

## API Endpoints

The backend exposes the following RESTful API endpoints:

- `POST /save`: Saves a new code note. Requires `name` and `code` in the request body.
- `GET /notes`: Retrieves all saved notes, ordered by creation date.
- `GET /note/:id`: Retrieves a specific note by its ID.
- `PUT /update`: Updates an existing note. Requires `id`, `name`, and `code`.
- `DELETE /delete`: Deletes a note. Requires `id`.

## Deployment

This project is configured for deployment on Render.

1.  Create a new **Web Service** on Render connected to your GitHub repository.
2.  Set the **Build Command** to `npm install`.
3.  Set the **Start Command** to `node server.js`.
4.  **Crucial Step:** In the Render Dashboard, navigate to the **Environment** tab and add a new environment variable:
    - **Key:** `DATABASE_URL`
    - **Value:** [Your PostgreSQL External Database URL]

Once deployed, the application will automatically connect to the remote database and serve your persistent notes.
