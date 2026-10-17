# Acelden Studio Website

Static multipage marketing site for Acelden, an early-stage independent game studio.

Pages: Home (`index.html`), Games, NoeEngine, About, Contact, Privacy, Terms.

This site uses HTML, CSS and JavaScript, and can be served on any static host. There is no build step. Fonts are loaded from Google Fonts; the Noethric wordmark is a vector asset under `assets/`.

## Local preview

Run `python3 -m http.server 8080` in the repository, then open `http://localhost:8080`.

## Deployment

Wix Headless static site; upload the entire site directory as one archive, preserving file paths. The GitHub main branch is the source of truth.

## Before launch

- Replace or confirm draft legal pages with jurisdiction-appropriate policies.
- Set up a studio-owned email or official contact channel, then update `contact.html`.
- Confirm company name and trademarks before formal public launch.
- Replace studio art with real playable game screenshots when available.
- NoeEngine is based on a Godot fork; verify license obligations and keep required notices with engine distributions.
