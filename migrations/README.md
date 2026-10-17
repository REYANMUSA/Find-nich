# Find Niche — Database & Persistence Documentation

This directory contains the production database migrations and schema definitions for Find Niche.

## Architecture

- **Active Runtime Engine**: Relational SQLite (`node:sqlite`) with Write-Ahead Logging (`WAL`), foreign key enforcement, sequence safety, and atomic transactions.
- **External PostgreSQL / Supabase Integration**: When `DATABASE_URL` is configured in production environment variables, the system executes against your PostgreSQL database with Row Level Security (RLS).
- **Zero JSON File Rewriting**: Data is persisted in a relational database with strict ACID guarantees, permanent product numbers, and indices.

## Migrations

1. `001_initial_schema.sql`: Defines tables (`categories`, `products`, `product_clicks`, `audit_logs`, `admin_sessions`), sequence `product_number_seq`, foreign keys, and indices.
2. `002_rls_policies.sql`: Configures Supabase / PostgreSQL Row Level Security (RLS) policies ensuring public visitors cannot read hidden, draft, or deleted items.

## Sequence Safety & Permanent Product Numbers

- Every product receives an immutable, sequential `product_number`.
- Product numbers are allocated via an atomic sequence mechanism (`product_number_seq`).
- When a product is deleted (soft-deleted), its permanent number is preserved and **never reused**.

## Backup & Recovery Procedures

### 1. Automated Local Database Backup
To create an instantaneous point-in-time snapshot:
```bash
cp data/findniche.sqlite data/findniche_backup_$(date +%Y%m%d_%H%M%S).sqlite
```

### 2. Catalog Export
In the Owner Admin Dashboard, click **Export Catalog JSON** to download the complete catalog and category mappings.

### 3. Restoring from Snapshot
To restore from a backup:
```bash
cp data/findniche_backup_YYYYMMDD_HHMMSS.sqlite data/findniche.sqlite
```
