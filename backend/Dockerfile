FROM golang:1.24-alpine AS build

WORKDIR /src

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o /out/lycoris_server ./cmd/api


FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=build /out/lycoris_server /app/lycoris_server
COPY migrations /app/migrations

ENV PORT=8080

EXPOSE 8080

CMD ["/app/lycoris_server"]
