# RecipeHub

A recipe sharing and management platform with social features.

## Docker Setup

### Prerequisites

- Docker
- Docker Compose

### Running the Application

1. Clone the repository:

   ```
   git clone <repository-url>
   cd RecipeHub
   ```

2. Start the services:

   ```
   docker-compose up -d
   ```

   Or use the management script:

   ```
   ./docker-manage.sh start
   ```

3. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:8000

### Services

- **Frontend**: Nginx server serving static HTML/CSS/JS files
- **Backend**: Django REST API
- **Database**: MariaDB 10.11
- **Cache**: Redis

### Data Persistence

The following data is persisted using Docker volumes:

- **Database**: `mariadb_data` - MariaDB data files
- **Backend Uploads**: `backend_uploads` - User uploaded files (images, etc.)
- **Frontend Assets**: `frontend_assets` - Frontend asset files

These volumes persist even when containers are removed or recreated.

### Development

To make changes to the code while the containers are running:

1. Edit files in the `recipeHub_backend` or `RecipeHub` directories
2. Changes will be reflected immediately due to volume mounting

### Management Commands

Use the management script for common operations:

```bash
# Start services
./docker-manage.sh start

# Stop services
./docker-manage.sh stop

# Restart services
./docker-manage.sh restart

# View logs
./docker-manage.sh logs

# Clean up containers (preserves data)
./docker-manage.sh clean

# Create backup of uploads and assets
./docker-manage.sh backup

# Restore from backup
./docker-manage.sh restore <backup_file>
```

### Stopping the Application

```
docker-compose down
```

To remove all data (including database):

```
docker-compose down -v
```

### Backup and Restore

To backup your data:

```bash
./docker-manage.sh backup
```

To restore from a backup:

```bash
./docker-manage.sh restore <backup_file>
```

Backups are stored in the `./backups/` directory.
