-- Migration: 003_social_and_owner_settings.sql
-- Description: Add owner_name and social media link fields to site_settings table.
-- Safe and idempotent: Uses 'if not exists' so existing data and live databases are never broken.

alter table if exists public.site_settings
  add column if not exists owner_name text not null default 'Rayan Musa',
  add column if not exists social_instagram text not null default '',
  add column if not exists social_tiktok text not null default '',
  add column if not exists social_youtube text not null default '',
  add column if not exists social_x text not null default '',
  add column if not exists social_snapchat text not null default '',
  add column if not exists social_facebook text not null default '';
