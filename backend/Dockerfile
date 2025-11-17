# Multi-stage build for optimized image size
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev sqlite-dev linux-headers

# Set working directory
WORKDIR /app

# Copy go mod file
COPY go.mod ./

# Set environment to skip checksum verification
ENV GOSUMDB=off

# Tidy and download (sin requerir go.sum)
RUN go mod tidy && go mod download

# Copy all source code
COPY . .

# Build the application - también desactivar go.sum verification
RUN CGO_ENABLED=1 GOOS=linux CGO_CFLAGS="-g -O2" go build -mod=mod -a -installsuffix cgo -o main ./cmd/server

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates sqlite-libs libstdc++

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"]
