# SOSGEN - Maritime Emergency Message Generator

## Overview

SOSGEN is a specialized web application designed for maritime coast radio operators to generate standardized MAYDAY RELAY messages from natural language descriptions of maritime emergencies. The application leverages Google's Gemini AI to analyze incident descriptions and produce properly formatted emergency communications in both Spanish and English, following maritime radio protocol standards.

The application serves as a professional tool for coast radio stations and Maritime Rescue Coordination Centers (MRCC) to quickly convert informal emergency reports into standardized, protocol-compliant messages suitable for maritime emergency communications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript for type safety and modern development practices
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessible, customizable interface components
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript throughout the stack for consistent type safety
- **Development**: Hot module replacement via Vite integration for seamless development experience
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple
- **Error Handling**: Centralized error handling middleware with structured error responses

### Data Storage Solutions
- **Primary Database**: PostgreSQL for relational data storage
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Migrations**: Drizzle Kit for database schema versioning and migration management
- **Connection**: Neon Database serverless PostgreSQL for cloud-native database hosting
- **Session Storage**: PostgreSQL-backed session storage for user session persistence

### Authentication and Authorization
- **Session-based Authentication**: Express sessions with secure cookie configuration
- **User Management**: Basic user schema with username/password authentication
- **Storage**: User credentials and session data stored in PostgreSQL
- **Security**: Password hashing and session security best practices implemented

### AI Integration Architecture
- **AI Provider**: Google Gemini AI for natural language processing and message generation
- **Service Layer**: Dedicated GeminiService class for AI interaction abstraction
- **Schema Validation**: Structured output schema for consistent AI response formatting
- **Error Handling**: Robust error handling for AI API failures and rate limiting
- **Configuration**: Environment-based API key management for security

### Application Structure
- **Monorepo Layout**: Unified TypeScript configuration across client, server, and shared modules
- **Shared Types**: Common TypeScript interfaces and schemas in shared directory
- **Component Library**: Comprehensive UI component library with consistent design system
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Responsive Design**: Mobile-first responsive design with adaptive layouts

### Development and Deployment
- **Development Server**: Concurrent client and server development with hot reloading
- **Build Process**: Separate client (Vite) and server (esbuild) build pipelines
- **Production**: Single production build with static asset serving via Express
- **Environment Management**: Environment-specific configuration for API keys and database connections