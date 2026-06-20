# Travlr Getaways Capstone Project

## Overview
Travlr Getaways is a full-stack travel web application built with Angular, Express.js, Node.js, MongoDB, and Mongoose. This repository contains my Computer Science Capstone enhancement work across software engineering and design, algorithms and data structures, and database architecture.

## Code Review Link
https://youtu.be/wBTeVnK5rkQ

## Technology Stack
- Angular
- Node.js
- Express.js
- MongoDB
- Mongoose
- Passport/JWT Authentication
- Handlebars
- Bootstrap

## Capstone Enhancements

### Software Engineering and Design
Enhanced `app.js` to improve Express application architecture, environment-based configuration, CORS handling, security headers, request size limits, static asset handling, and centralized API/page error responses.

### Algorithms and Data Structures
Enhanced `trips.js` with keyword search, numeric filtering, weighted recommendation scoring, comparison-based sorting, and pagination.

### Databases
Enhanced `travlr.js` database model planning with stronger validation, numeric duration planning, indexing strategy, and future relationships for bookings, saved trips, views, reviews, and analytics.

## Key Features
- Customer-facing travel website
- Angular admin interface
- Trip CRUD management
- JWT-based authentication
- Enhanced trip search and recommendation logic
- MongoDB/Mongoose data modeling
- Capstone documentation and enhancement narratives

## Screenshots
<img width="1343" height="810" alt="image" src="https://github.com/user-attachments/assets/e25105fd-44ab-4d9f-a124-cdc86b3adebd" />
<img width="678" height="766" alt="image" src="https://github.com/user-attachments/assets/10c97ca2-88b6-4ddc-8504-7bac26edf139" />

## Outcome 1: Collaborative Environments and Decision Support

Outcome: Employ strategies for building collaborative environments that enable diverse audiences to support organizational decision-making in the field of computer science.

This project supports decision-making for multiple audiences, including customers, administrators, business users, and future developers. The enhanced trip search and filtering features help customers compare travel options more effectively. The Angular administrative interface supports staff members who need to manage trip data. The database enhancement prepares the application for future analytics, booking history, saved trips, trip views, reviews, and reporting. These features create a foundation for decision-support tools that could help administrators and business stakeholders evaluate trip popularity, customer interest, booking activity, and seasonal trends.

The project also supports developer collaboration through clearer code organization, improved comments, service-layer separation, and professional documentation. By organizing the repository with a clear README, artifact descriptions, code review materials, and enhancement narratives, the project becomes easier for instructors, hiring managers, and future technical collaborators to understand and evaluate.

## Outcome 2: Professional Communication

Outcome: Design, develop, and deliver professional-quality oral, written, and visual communications that are coherent, technically sound, and appropriately adapted to specific audiences and contexts.

This project demonstrates professional communication through code comments, artifact narratives, GitHub documentation, a code review presentation, and the professional self-assessment. The comments in the enhanced files explain not only what the code does, but why specific design decisions were made. This is important because professional software development requires clear communication with both technical and nontechnical audiences.

The README, screenshots, code review script, and supporting documentation explain the project’s purpose, technologies, enhancements, and course outcome alignment. These materials help reviewers understand the project quickly and show the ability to communicate technical work in a polished, organized, and audience-appropriate way.

## Outcome 3: Design and Evaluation of Computing Solutions

Outcome: Design and evaluate computing solutions that solve a given problem using algorithmic principles and computer science practices and standards appropriate to its solution while managing the trade-offs involved in design choices.

This project strongly demonstrates Outcome 3 through the evaluation and enhancement of the Travlr application’s architecture, trip search logic, and database model. The trips.js controller was improved to delegate algorithmic search behavior to a dedicated TripSearchService, which separates HTTP concerns from domain logic. This design improves maintainability and allows the search algorithm to evolve independently from the API controller.

The algorithmic enhancement includes keyword search, filtering, weighted recommendation scoring, sorting, and pagination. These features allow the system to return more relevant trip results instead of simply returning all records in database order. The project also demonstrates Big O awareness by using MongoDB filtering to narrow the result set before application-level scoring and sorting are applied. Filtering and scoring are generally linear, while sorting is typically O(n log n), making sorting the dominant operation in the enhanced search process.

The project also demonstrates trade-off management. For example, the API preserves the original plain-array response when no search criteria are submitted so the existing Angular admin interface remains compatible. When search criteria are provided, the API returns a richer response object containing result metadata, pagination information, and ranked trip results. This balances backward compatibility with enhanced functionality.

## Outcome 4: Use of Modern Tools and Computing Practices

Outcome: Demonstrate an ability to use well-founded and innovative techniques, skills, and tools in computing practices for the purpose of implementing computer solutions that deliver value and accomplish industry-specific goals.

The Travlr Getaways project demonstrates the use of modern full-stack development tools and practices, including Angular, Node.js, Express.js, MongoDB, Mongoose, RESTful API design, Passport, JWT authentication, Handlebars, and GitHub. These technologies are used together to create a travel application with a public-facing website, an administrative interface, backend API routes, authentication support, and a database-driven trip catalog.

The enhanced app.js file improves application structure through environment-based configuration, middleware organization, CORS handling, security headers, request size limits, static asset optimization, and centralized error handling. The enhanced trips.js controller and TripSearchService provide a more useful trip search experience through filtering, scoring, sorting, and pagination. The enhanced travlr.js database model improves schema validation, indexing, data integrity, and future readiness for analytics and customer-focused features.

Together, these enhancements deliver practical value by making the application more maintainable, searchable, secure, and scalable.

## Outcome 5: Security Mindset

Outcome: Develop a security mindset that anticipates adversarial exploits in software architecture and designs to expose potential vulnerabilities, mitigate design flaws, and ensure privacy and enhanced security of data and resources.

This project demonstrates a developing security mindset through improvements to application configuration, request handling, validation, and data protection. The enhanced app.js file includes security-conscious changes such as disabling framework fingerprinting, applying security headers, limiting request body size, separating API and page error handling, and using environment-based CORS configuration.

The backend controller also improves data integrity by using request-body whitelisting before creating or updating trip records. This helps prevent clients from submitting unexpected fields into the database. The database schema supports data integrity through required fields, uniqueness, trimming, length limits, and indexes. The search service also contributes to safer behavior by validating query parameters, restricting sort options to an allowlist, limiting pagination size, and escaping user input before creating regular expressions.

The project also identifies future security improvements, including customer/admin role-based authorization, removal of sensitive token or credential logging, stronger password hashing, and more complete protection of customer booking data. These planned improvements show the ability to evaluate existing risks and design future mitigations.


## Security Notes
This repository uses `.env.example` for configuration examples. Real secrets, database credentials, and JWT keys are not committed.

## Installation and Setup

## Prerequisites

- Node.js
- Angular CLI
- MongoDB or MongoDB Atlas
- npm

## Backend Setup


npm install
npm start

## Angualar Admin Setup

cd app_admin
npm install
ng serve

## Author
Patrick Sencenich
