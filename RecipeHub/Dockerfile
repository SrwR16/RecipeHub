FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy all frontend files to the nginx html directory
COPY . .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]