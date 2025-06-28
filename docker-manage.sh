#!/bin/sh

# Docker management script for RecipeHub

case "$1" in
    "start")
        echo "Starting RecipeHub with Docker Compose..."
        docker-compose up -d
        echo "Services started!"
        echo "Frontend: http://localhost"
        echo "Backend API: http://localhost:8000"
        ;;
    "stop")
        echo "Stopping RecipeHub services..."
        docker-compose down
        echo "Services stopped!"
        ;;
    "restart")
        echo "Restarting RecipeHub services..."
        docker-compose down
        docker-compose up -d
        echo "Services restarted!"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "clean")
        echo "WARNING: This will remove all containers and volumes!"
        echo "Your data will be preserved in named volumes."
        printf "Are you sure? (y/N): "
        read REPLY
        if [ "$REPLY" = "y" ] || [ "$REPLY" = "Y" ]; then
            docker-compose down -v
            docker system prune -f
            echo "Cleanup completed!"
        else
            echo "Cleanup cancelled."
        fi
        ;;
    "backup")
        echo "Creating backup of data..."
        mkdir -p backups
        docker run --rm -v recipehub_backend_uploads:/data -v $(pwd)/backups:/backup alpine tar czf /backup/backend_uploads_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
        docker run --rm -v recipehub_frontend_assets:/data -v $(pwd)/backups:/backup alpine tar czf /backup/frontend_assets_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
        echo "Backup completed in ./backups/"
        ;;
    "restore")
        if [ -z "$2" ]; then
            echo "Usage: $0 restore <backup_file>"
            exit 1
        fi
        echo "Restoring from backup: $2"
        docker run --rm -v recipehub_backend_uploads:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/$2 -C /data
        echo "Restore completed!"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|clean|backup|restore}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - Show logs from all services"
        echo "  clean    - Remove containers and clean up (preserves data)"
        echo "  backup   - Create backup of uploads and assets"
        echo "  restore  - Restore from backup file"
        exit 1
        ;;
esac