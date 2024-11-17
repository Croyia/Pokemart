# PokéMart Inventory System

I built this inventory management system as part of my portfolio. It's inspired by the PokéMart shops from the Pokémon games! You can manage items, track stock, and handle supplier information.

## Getting Started

You'll need these installed on your computer:

- Python (I used 3.8)
- Node.js
- npm (comes with Node.js)

### Setting up the Backend

1. Open your terminal and go to the backend folder:

```bash
cd FastAPI
```

2. Set up Python virtual environment:

```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate
```

3. Install the required packages:

```bash
pip install fastapi uvicorn sqlalchemy python-dotenv
```

4. Start the server:

```bash
uvicorn main:app --reload --port 8000
```

### Setting up the Frontend

1. Open a new terminal window and go to the frontend folder:

```bash
cd \React\pokemart-app\
```

2. Install the packages:

```bash
npm install
```

3. Start the app:

```bash
npm start
```

4. The app should open in your browser at `http://localhost:3000`

### Login Details

I've set up a test account you can use:

- Username: Cynthia
- Password: garchomp123!

## What You Can Do

- Add and manage inventory items
- Track stock levels
- Manage supplier information
- Filter and sort items
- View stock statistics

## Built With

- Backend: Python with FastAPI
- Frontend: React with Material-UI
- Database: SQLite (keeps things simple!)

## Need Help?

If something's not working:

1. Make sure both the backend and frontend servers are running
2. Check if you're using the right Python and Node versions
3. Try deleting the node_modules folder and running npm install again
4. Make sure you're in the right folders when running commands

Feel free to reach out if you have questions
