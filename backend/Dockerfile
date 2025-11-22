FROM golang:1.24-alpine AS builder
RUN apk add --no-cache git gcc musl-dev sqlite-dev linux-headers

WORKDIR /app

COPY go.mod ./
ENV GOSUMDB=off
RUN go mod tidy && go mod download

COPY cmd ./cmd
COPY internal ./internal

RUN CGO_ENABLED=1 GOOS=linux CGO_CFLAGS="-g -O2" go build -mod=mod -a -installsuffix cgo -o main ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates sqlite-libs libstdc++

WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
