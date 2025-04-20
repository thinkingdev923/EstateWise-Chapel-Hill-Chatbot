# EstateWise – Your Intelligent Estate Assistant 🏡

**EstateWise** is a full-stack chatbot application that helps users find their dream property in **Chapel Hill, NC** and surrounding areas. The app harnesses state‑of‑the‑art **AI technology and Retrieval-Augmented Generation (RAG)** techniques to deliver personalized property recommendations based on user preferences. Whether you sign in to save your conversation history or continue as a guest, EstateWise offers a sleek, responsive interface with smooth animations and a modern design.

## Table of Contents

- [Live App](#live-app)
  - [Key Technologies](#key-technologies-used)
  - [AI Techniques](#ai-techniques)
- [Features](#features)
- [Architecture](#architecture)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [High-Level Architecture Flow Diagram](#high-level-architecture-flow-diagram)
- [Setup & Installation](#setup--installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Deployment](#deployment)
- [Usage](#usage)
- [User Interface](#user-interface)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Conversations](#conversations)
  - [Chat](#chat)
  - [Swagger API Documentation](#swagger-api-documentation)
- [Project Structure](#project-structure)
- [Dockerization](#dockerization)
- [OpenAPI Specification](#openapi-specification)
- [Contributing](#contributing)
- [License](#license)

## Live App

Visit the live app on **Vercel** at [https://estatewise.vercel.app/](https://estatewise.vercel.app/) and explore the intelligent estate assistant!

The API is available at: [https://estatewise-backend.vercel.app/](https://estatewise-backend.vercel.app/).

Feel free to test the app as a guest or sign up for an account to save your conversations!

### Key Technologies Used

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-000000?style=for-the-badge&logo=framer&logoColor=white)
![Shadcn UI](https://img.shields.io/badge/Shadcn%20UI-000000?style=for-the-badge&logo=shadcn/ui&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Pinecone](https://img.shields.io/badge/Pinecone-FF6F61?style=for-the-badge&logo=googledataflow&logoColor=white)
![Google AI](https://img.shields.io/badge/Google%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=json-web-tokens)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

### AI Techniques

EstateWise utilizes **Retrieval-Augmented Generation (RAG)** techniques to enhance the AI's ability to provide accurate and relevant property recommendations. By integrating with **Pinecone** for vector storage and advanced AI processing, the app can intelligently retrieve and generate responses based on user queries.

Additionally, it also implements **Mixture of Experts (MoE)** techniques to optimize the AI's performance, ensuring that users receive the most relevant and personalized property suggestions.

- Mixture of Experts (MoE) is a technique that allows the model to dynamically select which experts (sub-models) to use for a given input, improving efficiency and performance.
- It allows the model to leverage multiple specialized sub-models for different tasks, enhancing the overall performance and accuracy of the AI assistant.
- There is a master model that decides which experts to use based on the input, allowing for a more efficient and effective response generation process.

Also, users can rate the AI's responses, which helps improve the model's performance over time. The feedback loop allows the AI to learn from user interactions and refine its recommendations.

- The feedback loop allows the AI to learn from user interactions and refine its recommendations.
- If the user is not satisfied with the AI's response, they can give a thumbs down rating, and the backend API will tweak the experts selection process (i.e. the weights of the experts) to improve the model's performance.

In short, **EstateWise** uses the following AI techniques:

- **Retrieval-Augmented Generation (RAG)**: Combines retrieval and generation for accurate responses.
- **Mixture of Experts (MoE)**: Dynamically selects specialized sub-models for improved performance.
- **Feedback Loop and Reinforcement Learning**: Users can rate responses, allowing the AI to learn and adapt over time.

## Features

- **Intelligent Property Recommendations:** Receive personalized property suggestions powered by AI and RAG.
- **User Authentication:** Sign up, log in, and log out using secure JWT authentication.
- **Conversation History:** Authenticated users can view, rename, and delete past conversations.
  - Even if you are not logged in, the app will still save your conversation history locally in the browser.
- **Search Functionality:** Quickly search through your conversation history to find specific topics or properties.
- **Rating System:** Rate the AI's responses to help improve its performance over time.
- **Expert Selection:** The AI uses a mixture of experts to provide the best possible response based on user input.
  - Users can also select a specific expert's response to view.
- **Visualizations:** Interactive charts and graphs to visualize property data and trends.
  - In the chatbot's responses, the AI will directly generate the charts and graphs using the data from the Pinecone index so that users can see the trends and patterns in the data.
  - The app also has a dedicated page for visualizations, where users can see the generalized data and trends in the properties in the Chapel Hill area.
- **Animations:** Smooth animations and transitions using Framer Motion for an engaging user experience.
- **Interactive Chat Interface:** Enjoy a smooth, animated chat experience with markdown-formatted responses.
- **Responsive Design:** Fully responsive UI optimized for desktop and mobile devices.
- **Dark/Light Mode:** Toggle between dark and light themes with user preferences saved locally.
- **Search and Management:** Easily search through your conversation history and manage your saved conversations.
- **Guest Mode:** Use the app as a guest (conversations are not saved).

## Architecture

**EstateWise** is built with a modern, full-stack architecture consisting of two major parts:

### Backend

- **Express.js & TypeScript:** A robust backend API that handles authentication, conversation management, and AI chat processing.
- **MongoDB:** Database for storing user data, conversation histories, and more.
- **JWT Authentication:** Secure user sessions using JSON Web Tokens.
- **Integration with AI & RAG:** Communicates with AI APIs and uses **Google Gemini API & Pinecone** for advanced property recommendation logic.
- **Swagger API Documentation:** Automatically generated API documentation for easy reference and testing.
- **Docker:** Containerization for easy deployment and scalability.
- **OpenAPI Specification:** An OpenAPI specification file (`openapi.yaml`) is included in the root directory. You can use Swagger UI or Postman to explore and test the API endpoints.
- and more...

### Frontend

- **Next.js & React:** A responsive, animation-rich web application.
- **Shadcn UI Components:** For a consistent design system across the app.
- **Framer Motion:** Provides smooth animations and transitions throughout the user experience.
- **Dark Mode/Light Mode:** Users can toggle themes with seamless background color transitions.
- and more...

### High-Level Architecture Flow Diagram

```plaintext
         ┌────────────────────────────────┐
         │      User Interaction          │
         │   (Chat, Signup, Login, etc.)  │
         └─────────────┬──────────────────┘
                       │
                       ▼
         ┌───────────────────────────────┐
         │    Frontend (Next.js, React)  │
         │ - Responsive UI, Animations   │
         │ - API calls to backend        │
         │ - User ratings for AI         │
         │   responses                   │
         └─────────────┬─────────────────┘
                       │
                       │ (REST API Calls)
                       │
                       ▼
         ┌─────────────────────────────┐
         │   Backend (Express + TS)    │
         │ - Auth (JWT, Signup/Login)  │
         │ - Conversation & Chat APIs  │
         │ - AI processing & RAG       │
         │ - MongoDB & Pinecone        │
         │ - Swagger API Docs          │
         │ - Dockerized for deployment │
         └─────────────┬───────────────┘
                       │
                       │
                       │
           ┌───────────┴────────────┐
           │                        │
           ▼                        ▼
┌─────────────────┐       ┌─────────────────┐
│   MongoDB       │       │ Pinecone Vector │
│ (User Data,     │◄─────►│   Database      │
│  Convo History) │       │ (Knowledge Base)│
└─────────────────┘       └─────────────────┘
           ▲
           │
           │  (Utilizes stored data & docs)
           │
           ▼
         ┌─────────────────────────────┐
         │   Response Processing       │
         │ - Uses Google Gemini API    │
         │ - Mixture of Experts (MoE)  │
         │ - Generates AI responses    │
         │ - Combine responses from    │
         │   experts                   │
         │ - Feedback loop for rating  │
         └─────────────┬───────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │    Frontend Display         │
         │ - Show chat response        │
         │ - Update UI (conversation)  │
         │ - User authentication flows │
         │ - Save conversation history │
         │ - Search and manage         │
         │   conversations             │
         │ - User ratings for AI       │
         │   responses                 │
         └─────────────────────────────┘
```

## Setup & Installation

### Backend Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot.git
   cd EstateWise-Chapel-Hill-Chatbot/backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Variables:**  
   Create a `.env` file in the `server` directory with the following variables (adjust as needed):

   ```env
   PORT=<your_port>
   MONGO_URI=<your_mongo_uri>
   JWT_SECRET=<your_jwt_secret>
   GOOGLE_AI_API_KEY=<your_google_ai_api_key>
   PINECONE_API_KEY=<your_pinecone_api_key>
   PINECONE_INDEX=estatewise-index
   ```

   Important: Be sure that you created the Pinecone index with the name `estatewise-index` in your Pinecone account before proceeding. Then,
   add data to the index using the `pinecone` CLI or API. For security purposes, our properties data is not publicly available in the repository. Please use your own data.

4. **Run the Backend in Development Mode:**

   ```bash
   npm run dev
   ```

   This command starts the backend server with live reloading.

### Frontend Setup

1. **Navigate to the client folder:**

   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the Frontend Development Server:**

   ```bash
   npm run dev
   ```

   The frontend should be running at [http://localhost:3000](http://localhost:3000).

## Deployment

- **Backend:** Deploy your backend on your chosen platform (Heroku, Vercel, AWS, etc.) and ensure environment variables are properly set.
  - Currently, the backend is deployed on Vercel at [https://estatewise-backend.vercel.app/](https://estatewise-backend.vercel.app/).
- **Frontend:** Deploy the React/Next.js frontend using services like Vercel or Netlify. Update any API endpoints if necessary.
  - Currently, the frontend is deployed on Vercel at [https://estatewise.vercel.app/](https://estatewise.vercel.app/).
- **Database:** Ensure your MongoDB instance is accessible from your deployed backend. You can use services like MongoDB Atlas for cloud hosting.
  - Currently, we are using MongoDB Atlas for the database. It is a cloud-hosted MongoDB service that provides a fully managed database solution.
- **Pinecone:** Ensure your Pinecone instance is accessible from your deployed backend. You can use the Pinecone CLI or API to manage your index and data.
  - Currently, we are using Pinecone for vector storage and retrieval. It is a cloud-hosted vector database that provides a fully managed solution for storing and retrieving vectors.

![Vercel](https://img.shields.io/badge/Deployed%20on%20Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/Using%20MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Pinecone](https://img.shields.io/badge/Using%20Pinecone-FF6F61?style=for-the-badge&logo=googledataflow&logoColor=white)

## Usage

- **Landing Page:**  
  Learn about the app’s features and get started by signing in or continuing as a guest.
- **Authentication:**  
  Create an account, log in, and manage your user profile securely using JWT authentication.
- **Chat Interface:**  
  Interact with the AI assistant in real time. Authenticated users can save, rename, and delete conversations.
- **Theme Toggle:**  
  Switch between dark and light modes with smooth background transitions.
- **Search & Management:**  
  Easily search through your conversation history and manage your saved conversations from the sidebar.
- **Guest Mode:**  
  Use the app as a guest without creating an account. Conversations will still be saved locally in the browser.
- **Rating System:**  
  Rate the AI's responses to help improve its performance over time. If you are not satisfied with the AI's response, you can give a thumbs down rating, and the backend API will tweak the experts selection process (i.e. the weights of the experts) to improve the model's performance.
- **Expert Selection:**  
  The AI uses a mixture of experts to provide the best possible response based on user input. Users can also select a specific expert's response to view.

> Note: The expert view feature is ONLY available for new messages. If you load a conversation from either the local storage or the database, the expert view feature will not be available, and only the combined response will be shown.

## User Interface

EstateWise features a modern, animated, and fully responsive user interface built with Next.js and Shadcn UI, with the help of Tailwind CSS for styling. The UI is designed to be intuitive and user-friendly, ensuring a seamless experience across devices.

### Landing Page

<p align="center">
  <img src="img/landing.png" alt="EstateWise UI" width="100%" />
</p>

### Chat Interface - Guest

<p align="center">
  <img src="img/home-guest.png" alt="EstateWise UI" width="100%" />
</p>

### Chat Interface - Authenticated

<p align="center">
  <img src="img/home-authed.png" alt="EstateWise UI" width="100%" />
</p>

### Dark Mode: Chat Interface - Guest

<p align="center">
  <img src="img/home-guest-dark.png" alt="EstateWise UI" width="100%" />
</p>

### Dark Mode: Chat Interface - Authenticated

<p align="center">
  <img src="img/home-authed-dark.png" alt="EstateWise UI" width="100%" />
</p>

### Login Page

<p align="center">
  <img src="img/login.png" alt="EstateWise UI" width="100%" />
</p>

### Register Page

<p align="center">
  <img src="img/register.png" alt="EstateWise UI" width="100%" />
</p>

### Reset Password Page

<p align="center">
  <img src="img/reset-password.png" alt="EstateWise UI" width="100%" />
</p>

### 400 Not Found Page

<p align="center">
  <img src="img/404.png" alt="EstateWise UI" width="100%" />
</p>

## API Endpoints

### Authentication

- **POST** `/api/auth/signup` – Create a new user.
- **POST** `/api/auth/login` – Log in a user and return a JWT.
- **GET** `/api/auth/verify-email` – Verify if an email exists.
- **POST** `/api/auth/reset-password` – Reset a user's password.

### Conversations

- **POST** `/api/conversations` – Create a new conversation.
- **GET** `/api/conversations` – Retrieve all conversations for a user.
- **GET** `/api/conversations/:id` – Retrieve a conversation by its ID.
- **PUT** `/api/conversations/:id` – Rename a conversation.
- **DELETE** `/api/conversations/:id` – Delete a conversation.
- **GET** `/api/conversations/search/:query` – Search conversations by title or content.

### Chat

- **POST** `/api/chat` – Send a chat message and receive an AI-generated response.
- **POST** `/api/chat/rate` – Rate the AI's response (thumbs up or down).

More endpoints can be found in the Swagger API documentation. Endpoints may be added or modified as the project evolves, so this may not be an exhaustive list of all available endpoints.

### Swagger API Documentation

Access detailed API docs at the `/api-docs` endpoint on your deployed backend.

<p align="center">
  <img src="img/swagger.png" alt="Swagger API Documentation" width="100%" />
</p>

Live API documentation is available at: [https://estatewise-backend.vercel.app/api-docs](https://estatewise-backend.vercel.app/api-docs)

## Project Structure

```plaintext
EstateWise/
├── frontend/                 # Frontend Next.js application
│   ├── public/               # Static assets (images, icons, etc.)
│   ├── components/           # Reusable UI components
│   ├── pages/                # Next.js pages (Chat, Login, Signup, etc.)
│   ├── styles/               # CSS/SCSS files
│   ├── package.json
│   ├── tsconfig.json
│   └── ... (other config files, etc.)
├── server/                   # Backend Express application
│   ├── src/
│   │   ├── controllers/      # API controllers and endpoints
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # Express routes
│   │   ├── services/         # Business logic and integrations
│   │   └── middleware/       # Authentication, error handling, etc.
│   ├── package.json
│   ├── tsconfig.json
│   └── ... (other config files, etc.)
├── .env                      # Environment variables for development
├── README.md                 # This file
├── docker-compose.yml        # Docker configuration for backend and frontend
└── ... (other config files, etc.)
```

## Dockerization

To run the application **(OPTIONAL)** using Docker:

1. Ensure you have [Docker](https://www.docker.com/) installed.
2. In the project root directory, run:

   ```bash
   docker-compose up --build
   ```

This command builds and starts both the backend and frontend services as defined in the `docker-compose.yml` file.

However, you don't need to run the app using Docker. You can run the backend and frontend separately as described in the **Setup & Installation** section.

## OpenAPI Specification

An OpenAPI specification file (`openapi.yaml`) is included in the root directory. You can use Swagger UI or Postman to explore and test the API endpoints.

## Contributing

Contributions are welcome! Follow these steps:

1. **Fork the repository.**
2. **Create a feature branch:**  
   `git checkout -b feature/your-feature-name`
3. **Commit your changes:**  
   `git commit -m 'Add new feature'`
4. **Push to the branch:**  
   `git push origin feature/your-feature-name`
5. **Open a Pull Request** with a clear description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).

---

[⬆️ Back to Top](#table-of-contents)
