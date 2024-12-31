# Smart Study Plan System (SSPS) - Backend

## Overview

This repository contains the backend implementation of a Smart Study Plan System (SSPS), developed as a final year project. The system provides personalized academic guidance to students by leveraging artificial intelligence, specifically OpenAI's GPT-4o model.

## Features

- **PDF Processing Module**: Extracts and processes content from educational materials
- **Question Generation**: Automatically generates relevant questions using Azure OpenAI's GPT-4o
- **Student Assessment**: Evaluates student comprehension through adaptive questioning
- **Study Plan Generation**: Creates personalized study plans based on student performance
- **Authentication & Authorization**: Secure user management and access control
- **Email Notifications**: Automated communication system for user engagement
- **Real-time Caching**: Redis-based caching for improved performance

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **AI Integration**: Azure OpenAI API
- **Authentication**: JWT
- **Email**: NestJS Mailer
- **API Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js (>= 18.x)
- PostgreSQL
- Redis
- Azure OpenAI API access

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
REDIS_URL=[your-redis-url]
EMAIL_HOST=[smtp-host]
EMAIL_USER=[email-username]
EMAIL_PASSWORD=[email-password]
JWT_SECRET=[your-jwt-secret]
AZURE_OPENAI_KEY=[your-azure-openai-key]
AZURE_OPENAI_ENDPOINT=[your-azure-openai-endpoint]
AZURE_OPENAI_DEPLOYMENT_NAME=[your-deployment-name]
```

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## API Documentation

Once the application is running, access the Swagger documentation at:
`http://localhost:8080/api/v1/api-docs`

## System Architecture

The backend is structured into several key modules:

- **Auth Module**: Handles user authentication and authorization
- **Question Module**: Manages question generation and assessment
- **Planner Module**: Generates and manages study plans
- **File Upload Module**: Handles PDF processing and storage
- **Email Module**: Manages communication with users
- **AI Module**: Integrates with Azure OpenAI for intelligent features
