# PocketBase Configuration

## Uploads Collection

### Schema

- word (text, required)
- file (file, required)

### API Rules

- Create: Public access
- Read: Public access
- Delete: Public access

### Validation Rules

- word: required, non-empty string
- file: required, max size 20MB
