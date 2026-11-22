# Sweety – Blood Glucose Tracker

Sweety is a full-stack blood glucose tracking application built with React, Node.js, Express, and PostgreSQL. It allows users to securely record glucose readings, monitor daily values, and review historical reports.

## Features

### Authentication and security
- User registration and login
- Password hashing with bcrypt
- JWT-based authentication
- Protected application routes and API endpoints
- Profile update and password change
- Helmet security headers and API rate limiting

### Glucose tracking
- Add, view, edit, and delete readings
- Four daily slots: morning fasting, after breakfast, after lunch, and after dinner
- One reading per slot per day
- Maximum of four readings per day
- Whole-number glucose values from 40 to 600 mg/dL
- Future reading dates are not allowed
- Users can access only their own readings

### Dashboard and reports
- Daily glucose overview
- Average, highest, and lowest readings
- Glucose trend chart
- Daily reading progress and empty states
- Daily report
- Month-to-date report
- Previous complete month report
- CSV report export

## Technology stack

**Frontend:** React, Vite, React Router, Axios, Recharts, Lucide React

**Backend:** Node.js, Express, PostgreSQL, bcryptjs, JSON Web Tokens, Helmet, CORS, express-rate-limit

## Project structure

```text
sweety-glucose-tracker/
├── api/
│   ├── scripts/
│   │   └── seed.js
│   ├── sql/
│   │   └── schema.sql
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validators/
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── screenshots/
├── web/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

- Node.js and npm
- PostgreSQL
- Git

## Installation and setup

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd sweety-glucose-tracker
```

Alternatively, open a terminal in the downloaded project directory.

### 2. Create the PostgreSQL database

Create a database named `sweety_db` using PostgreSQL:

```sql
CREATE DATABASE sweety_db;
```

Create a database user or use an existing PostgreSQL user with permission to access this database.

Run the schema from the project root:

```bash
psql -U YOUR_DB_USER -d sweety_db -f api/sql/schema.sql
```

Replace `YOUR_DB_USER` with your PostgreSQL username.

The schema creates the users and readings tables, constraints, and indexes. It is intended for initial setup of a new database.

### 3. Configure and install the backend

Open a terminal:

```bash
cd api
npm install
```

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Configure `api/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=sweety_db
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD

JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=1d

CLIENT_URL=http://localhost:5173
```

Use your own PostgreSQL credentials and a strong, private JWT secret. Do not commit `.env` files.

### 4. Start the backend

From the `api` directory:

```bash
npm run dev
```

The API runs at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 5. Configure and start the frontend

Open a second terminal from the project root:

```bash
cd web
npm install
```

Copy the frontend environment example:

```powershell
Copy-Item .env.example .env
```

The frontend environment variable is:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Demo account

The project includes a seed script that creates a demonstration account and sample readings.

Run it from the `api` directory after configuring the backend environment and creating the database schema:

```bash
npm run seed
```

Demo login:

| Field | Value |
|---|---|
| Email | `demo@sweety.app` |
| Password | `SweetyDemo@2026` |

The seed script creates four readings for the current date and two readings in the previous month.

**Note:** Running the seed script again resets the demo account password and replaces that demo user's readings. It does not delete other users' data. These credentials are for demonstration only.

## API overview

Base URL: `http://localhost:5000/api`

### Health

| Method | Endpoint | Authentication |
|---|---|---|
| GET | `/health` | No |

### Authentication

| Method | Endpoint | Authentication |
|---|---|---|
| POST | `/auth/register` | No |
| POST | `/auth/login` | No |
| PUT | `/auth/change-password` | Yes |

Registration example:

```json
{
  "name": "Test User",
  "email": "user@example.com",
  "password": "YourPassword123"
}
```

Login example:

```json
{
  "email": "user@example.com",
  "password": "YourPassword123"
}
```

### Profile

| Method | Endpoint | Authentication |
|---|---|---|
| GET | `/profile` | Yes |
| PUT | `/profile` | Yes |

### Glucose readings

| Method | Endpoint | Authentication |
|---|---|---|
| GET | `/readings` | Yes |
| POST | `/readings` | Yes |
| PUT | `/readings/:id` | Yes |
| DELETE | `/readings/:id` | Yes |

Example reading request:

```json
{
  "reading_date": "2026-11-23",
  "time_slot": "morning_fasting",
  "glucose_value": 110
}
```

Supported time slots:

- `morning_fasting`
- `after_breakfast`
- `after_lunch`
- `after_dinner`

### Reports and CSV export

| Method | Endpoint | Authentication |
|---|---|---|
| GET | `/reports/daily?date=YYYY-MM-DD` | Yes |
| GET | `/reports/month-to-date?date=YYYY-MM-DD` | Yes |
| GET | `/reports/previous-month?date=YYYY-MM-DD` | Yes |
| GET | `/reports/export?type=TYPE&date=YYYY-MM-DD` | Yes |

Supported export types: `daily`, `month_to_date`, and `previous_month`.

Protected endpoints require a JWT access token in the request header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Running tests and checks

Backend tests:

```bash
cd api
npm test
```

Frontend lint:

```bash
cd web
npm run lint
```

Frontend production build:

```bash
cd web
npm run build
```

The production frontend files are generated in `web/dist/`.

## Screenshots

Application screenshots are provided in the `screenshots/` directory.

## Security notes

- Passwords are stored as bcrypt hashes, not plain text.
- JWT authentication protects private endpoints.
- User-specific database queries prevent access to another user's readings.
- Database constraints enforce reading limits and valid values.
- API requests are rate-limited.
- CSV export includes protection against spreadsheet formula injection.
- Environment files containing credentials must remain private.

## Medical disclaimer

Sweety is a personal glucose tracking and reporting tool. It is not a medical device and does not replace professional medical advice, diagnosis, or treatment. Consult a qualified healthcare professional when interpreting glucose readings or making treatment decisions.

## Notes: assumptions and future improvements

### Assumptions
- Glucose values are recorded as whole numbers in mg/dL.
- Each user can record at most one reading for each supported time slot per calendar day.
- A maximum of four readings is therefore possible per day.
- Reading dates cannot be in the future.
- Daily and monthly reports are scoped to the authenticated user.
- The demonstration account and its readings are sample data, not real medical records.

### Future improvements
- Add pagination for larger reading histories.
- Expand automated frontend component and integration tests.
- Add Docker-based development and deployment.
- Add optional reminders and data visualisation enhancements.
- Explore role-based access for healthcare professionals with appropriate privacy controls.

## License

This project is provided for educational and demonstration purposes. No separate open-source license has been assigned.