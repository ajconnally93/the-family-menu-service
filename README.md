# The Family Menu - Service Layer

## Purpose of the Application
The Family Menu is a meal planning web application designed for busy households. It allows users to browse meals, add selected meals to a meal plan, view recipe instructions, and access a consolidated grocery list generated from their selected meals. The application is intended to simplify weekly meal planning while also helping users estimate grocery costs by displaying the estimated cost per meal and cost per generated grocery list.

## Purpose of This Repository
This repository contains the backend service layer for The Family Menu. Its role in the overall application is to manage the application’s business logic, API endpoints, authentication, and persistence of user, meal, meal plan, and grocery list data.

The service layer is responsible for:
- authentication and user account support
- meal retrieval and meal management
- meal plan creation and updates
- adding and removing meals from a plan
- grocery list generation
- estimated cost calculation
- support for tag-based filtering as a stretch feature

## Major Backend Responsibilities
- Expose REST API endpoints for frontend use
- Persist and retrieve data from MongoDB
- Store meals, meal plans, grocery lists, and users
- Aggregate ingredients across selected meals
- Calculate estimated grocery list cost totals
- Calculate estimated individual meal cost totals
- Return JSON responses to the frontend
- Support user-specific meal plans and grocery lists

## Design Documents Included
See the `design` folder for the service layer design and database design documents.

## Planned Technologies
- Node.js
- Express
- MongoDB

## Relationship to the Full Application
This repository provides the service and data layer for the application. It serves the frontend by exposing API endpoints and implementing the core business logic behind meal planning, grocery list generation, and user account creation/management.
