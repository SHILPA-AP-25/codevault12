require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public')); // Serve frontend files

// Database setup
if (!process.env.DATABASE_URL) {
    console.error("FATAL ERROR: DATABASE_URL environment variable is missing.");
    console.error("If running locally, ensure .env exists. If on Render, add it in the Environment tab.");
    process.exit(1); // Exit if DB is invalid to prevent weird errors
}

// SSL is required for connecting to Render's external Postgres URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test connection and initialize table
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to the PostgreSQL database.');
    client.query(`CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        name TEXT,
        code TEXT,
        image_data TEXT,
        file_type TEXT,
        file_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err, result) => {
        if (err) {
            release();
            return console.error('Error executing query', err.stack);
        }
        // Ensure new columns exist for existing tables
        const alterQueries = [
            'ALTER TABLE notes ADD COLUMN IF NOT EXISTS image_data TEXT',
            'ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_type TEXT',
            'ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_name TEXT'
        ];

        const executeAlter = (index) => {
            if (index >= alterQueries.length) {
                console.log('Table "notes" is ready with all columns.');
                return;
            }
            client.query(alterQueries[index], (alterErr, alterResult) => {
                if (alterErr) {
                    console.error(`Error executing ${alterQueries[index]}`, alterErr.stack);
                }
                executeAlter(index + 1);
            });
        };

        executeAlter(0);
        release();
    });
});

// API Endpoints

// 1. Save new code
app.post('/save', async (req, res) => {
    const { name, code, image, fileType, fileName } = req.body;
    if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required' });
    }
    const sql = `INSERT INTO notes (name, code, image_data, file_type, file_name) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
    try {
        const result = await pool.query(sql, [name, code, image, fileType, fileName]);
        res.json({ message: 'Note saved successfully', id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get all notes
app.get('/notes', async (req, res) => {
    const sql = `SELECT * FROM notes ORDER BY created_at DESC`;
    try {
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get single note
app.get('/note/:id', async (req, res) => {
    const id = req.params.id;
    const sql = `SELECT * FROM notes WHERE id = $1`;
    try {
        const result = await pool.query(sql, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Edit note
app.put('/update', async (req, res) => {
    const { id, name, code, image, fileType, fileName } = req.body;
    if (!id || !name || !code) {
        return res.status(400).json({ error: 'ID, Name, and Code are required' });
    }
    const sql = `UPDATE notes SET name = $1, code = $2, image_data = $3, file_type = $4, file_name = $5 WHERE id = $6`;
    try {
        await pool.query(sql, [name, code, image, fileType, fileName, id]);
        res.json({ message: 'Note updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Delete note
app.delete('/delete', async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'ID is required' });
    }
    const sql = `DELETE FROM notes WHERE id = $1`;
    try {
        await pool.query(sql, [id]);
        res.json({ message: 'Note deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
